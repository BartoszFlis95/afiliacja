import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `FV/${year}/` } },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("/");
    const parsed = parseInt(parts[2], 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  return `FV/${year}/${String(nextNumber).padStart(3, "0")}`;
}
