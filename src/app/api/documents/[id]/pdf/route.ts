import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentPDF } from "@/components/influencer/DocumentPDF";

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
  const seq = await prisma.payout.count({
    where: {
      influencerId: payout.influencerId,
      requestedAt: {
        gte: new Date(year, 0, 1),
        lte: payout.requestedAt,
      },
    },
  });

  const documentData = {
    number: `RC/${year}/${String(seq).padStart(4, "0")}`,
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
