import { PrismaClient, Role, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLAIN_PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@deneeu.com" },
    update: {},
    create: {
      email: "admin@deneeu.com",
      emailVerified: new Date(),
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // Brand user
  const brandUser = await prisma.user.upsert({
    where: { email: "brand@deneeu.com" },
    update: {},
    create: {
      email: "brand@deneeu.com",
      emailVerified: new Date(),
      passwordHash,
      role: Role.BRAND,
    },
  });

  const brandProfile = await prisma.brandProfile.upsert({
    where: { userId: brandUser.id },
    update: {},
    create: {
      userId: brandUser.id,
      companyName: "TechStore Poland",
      industry: "Electronics",
      website: "https://techstore.example.com",
      description: "Sklep z elektroniką i gadżetami.",
      isVerified: true,
    },
  });

  // Influencer user
  const influencerUser = await prisma.user.upsert({
    where: { email: "influencer@deneeu.com" },
    update: {},
    create: {
      email: "influencer@deneeu.com",
      emailVerified: new Date(),
      passwordHash,
      role: Role.INFLUENCER,
    },
  });

  await prisma.influencerProfile.upsert({
    where: { userId: influencerUser.id },
    update: {},
    create: {
      userId: influencerUser.id,
      displayName: "Anna Kowalska",
      bio: "Tech & lifestyle content creator.",
      followersCount: 125000,
      instagramUrl: "https://instagram.com/anna",
      youtubeUrl: "https://youtube.com/anna",
      isVerified: true,
    },
  });

  // Products
  await prisma.product.upsert({
    where: { slug: "laptop-dell-xps-15" },
    update: {},
    create: {
      brandProfileId: brandProfile.id,
      name: "Laptop Dell XPS 15",
      description: "Wydajny laptop do pracy i rozrywki.",
      category: "Laptopy",
      price: 6999.00,
      commissionRate: 5.0,
      slug: "laptop-dell-xps-15",
      status: ProductStatus.ACTIVE,
    },
  });

  await prisma.product.upsert({
    where: { slug: "sluchawki-sony-wh1000xm5" },
    update: {},
    create: {
      brandProfileId: brandProfile.id,
      name: "Słuchawki Sony WH-1000XM5",
      description: "Bezprzewodowe słuchawki z ANC.",
      category: "Audio",
      price: 1499.00,
      commissionRate: 8.0,
      slug: "sluchawki-sony-wh1000xm5",
      status: ProductStatus.ACTIVE,
    },
  });

  console.log("✅ Seed Deneeu zakończony!");
  console.log("   Admin:      admin@deneeu.com");
  console.log("   Brand:      brand@deneeu.com");
  console.log("   Influencer: influencer@deneeu.com");
  console.log(`   Hasło:      ${PLAIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed nie powiódł się:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });