import { prisma } from "@/lib/prisma";

const OLD_URL =
  "https://dc754bb5c57fb79740589d7072f23172.r2.cloudflarestorage.com/deneeuimages";
const NEW_URL = "https://pub-0047fe05b86f46949b2dab328b219e47.r2.dev";

async function fixImageUrls() {
  // Products
  const products = await prisma.product.findMany({
    where: { imageUrl: { contains: "r2.cloudflarestorage.com" } },
  });
  console.log(`Znaleziono ${products.length} produktów do naprawy`);

  for (const product of products) {
    if (!product.imageUrl) continue;
    const newUrl = product.imageUrl.replace(OLD_URL, NEW_URL);
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: newUrl },
    });
    console.log(`✅ Produkt: ${product.name}`);
  }

  // Influencer avatars
  const influencers = await prisma.influencerProfile.findMany({
    where: { avatarUrl: { contains: "r2.cloudflarestorage.com" } },
  });
  console.log(`Znaleziono ${influencers.length} avatarów influencerów do naprawy`);

  for (const influencer of influencers) {
    if (!influencer.avatarUrl) continue;
    const newUrl = influencer.avatarUrl.replace(OLD_URL, NEW_URL);
    await prisma.influencerProfile.update({
      where: { id: influencer.id },
      data: { avatarUrl: newUrl },
    });
    console.log(`✅ Influencer avatar: ${influencer.displayName}`);
  }

  // Brand logos
  const brands = await prisma.brandProfile.findMany({
    where: { logoUrl: { contains: "r2.cloudflarestorage.com" } },
  });
  console.log(`Znaleziono ${brands.length} logo marek do naprawy`);

  for (const brand of brands) {
    if (!brand.logoUrl) continue;
    const newUrl = brand.logoUrl.replace(OLD_URL, NEW_URL);
    await prisma.brandProfile.update({
      where: { id: brand.id },
      data: { logoUrl: newUrl },
    });
    console.log(`✅ Brand logo: ${brand.companyName}`);
  }

  console.log("✅ Gotowe");
  await prisma.$disconnect();
}

fixImageUrls().catch((err) => {
  console.error(err);
  process.exit(1);
});
