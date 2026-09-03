import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentPDF } from "@/components/influencer/DocumentPDF";
import { formatujNumerDokumentu } from "@/lib/numer-dokumentu";
import { nadajNumerDokumentu } from "@/lib/nadaj-numer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: {
      influencer: { include: { user: { select: { email: true } } } },
      commission: { include: { product: { select: { name: true } } } },
    },
  });

  if (!payout || payout.influencer.userId !== session.user.id) {
    return NextResponse.json({ error: "Nie znaleziono dokumentu" }, { status: 404 });
  }

  if (payout.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Dokument dostępny dopiero po zrealizowaniu wypłaty" },
      { status: 400 }
    );
  }

  const year = payout.requestedAt.getFullYear();

  // trwały numer z bazy; gdy go jeszcze nie ma (wiersz sprzed migracji),
  // nadajemy go teraz — pobranie dokumentu to moment jego wystawienia
  const numerTrwaly = payout.documentNumber ?? (await nadajNumerDokumentu(payout.id));
  // remis po requestedAt rozstrzygamy po id — inaczej dwie wypłaty z tym
  // samym znacznikiem czasu dostawały ten sam numer, a lista dokumentów
  // (orderBy) numerowała je inaczej niż ten PDF
  const seq = await prisma.payout.count({
    where: {
      influencerId: payout.influencerId,
      OR: [
        { requestedAt: { gte: new Date(year, 0, 1), lt: payout.requestedAt } },
        { requestedAt: payout.requestedAt, id: { lte: payout.id } },
      ],
    },
  });

  const documentData = {
    number: numerTrwaly ?? formatujNumerDokumentu(year, seq),
    issuedAt: payout.processedAt ?? payout.requestedAt,
    sellerName: payout.influencer.displayName,
    sellerCity: payout.influencer.city,
    sellerCountry: payout.influencer.country,
    sellerEmail: payout.influencer.user.email,
    productName: payout.commission.product?.name ?? null,
    netAmount: Number(payout.amount),
    bankAccountIban: payout.influencer.bankAccountIban,
  };

  const element = React.createElement(DocumentPDF, {
    document: documentData,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${documentData.number.replace(/\//g, "-")}.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
