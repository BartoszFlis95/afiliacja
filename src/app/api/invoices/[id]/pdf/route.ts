import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoicePDF } from "@/components/admin/InvoicePDF";
import type { InvoiceItem } from "@/types";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Nie znaleziono faktury" }, { status: 404 });
  }

  const invoiceData = {
    ...invoice,
    netAmount: Number(invoice.netAmount),
    vatRate: Number(invoice.vatRate),
    vatAmount: Number(invoice.vatAmount),
    grossAmount: Number(invoice.grossAmount),
    items: invoice.items as unknown as InvoiceItem[],
  };

  // Cast required: renderToBuffer expects DocumentProps element but InvoicePDF wraps Document
  const element = React.createElement(InvoicePDF, { invoice: invoiceData }) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  const filename = invoice.invoiceNumber.replace(/\//g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
