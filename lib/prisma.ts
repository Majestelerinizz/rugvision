/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

const connectionString = process.env.DATABASE_URL;

const isPlaceholderDb =
  !connectionString ||
  connectionString.includes("HOST") ||
  connectionString.includes("KULLANICI");

function createMockPrisma() {
  const mockRug = {
    id: "cmqe1392j00044k8das08ajxr",
    merchantId: "cmqgswc5a000004lanqoxc666",
    sku: "mira-soft-160x230",
    slug: "mira-soft-yatak-odasi-halisi",
    name: "Mira Soft Yatak Odası Halısı",
    widthCm: 160,
    lengthCm: 230,
    thicknessMm: 8,
    price: 2499.90,
    colors: ["Cream", "Grey"],
    coverImage: "/images/mira-soft-ar-poster.webp",
    model3dUrl: "/models/RV-MIRA-005.glb",
    modelGlbUrl: "/models/RV-MIRA-005.glb",
    modelUsdzUrl: "/models/RV-MIRA-005.usdz",
    modelPosterUrl: "/images/mira-soft-ar-poster.webp",
    hasARModel: true,
    status: "ACTIVE",
    createdAt: new Date("2026-07-07T12:00:00Z"),
    updatedAt: new Date("2026-07-07T12:00:00Z"),
    merchant: {
      id: "cmqgswc5a000004lanqoxc666",
      name: "Savaş Doğan Tekstil",
      slug: "savas-dogan-tekstil",
      widgetSettings: {
        id: "mock-widget-settings-1",
        merchantId: "cmqgswc5a000004lanqoxc666",
        buttonColor: "#111827",
        buttonText: "HEMEN ODANDA GÖR",
        borderRadius: 9999,
        logoUrl: null,
        darkMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  };

  const mockSubscription = {
    id: "mock-sub-id",
    merchantId: "cmqgswc5a000004lanqoxc666",
    plan: "PRO",
    status: "ACTIVE",
    productLimit: 200,
    priceMonthly: 1999,
    currentStart: new Date(),
    currentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWidgetSettings = mockRug.merchant.widgetSettings;

  const mockClient = {
    $queryRaw: async () => [1],
    $transaction: async (cb: any) => cb(mockClient),
    rug: {
      findFirst: async () => mockRug,
      findUnique: async () => mockRug,
      findMany: async () => [mockRug],
      count: async () => 1,
      create: async ({ data }: any) => ({ ...mockRug, ...data }),
      update: async ({ data }: any) => ({ ...mockRug, ...data }),
      delete: async () => mockRug,
    },
    subscription: {
      findUnique: async () => mockSubscription,
    },
    widgetSettings: {
      findUnique: async () => mockWidgetSettings,
      update: async ({ data }: any) => ({ ...mockWidgetSettings, ...data }),
    },
    analyticsEvent: {
      create: async ({ data }: any) => ({ id: "mock-event-id", ...data }),
      findMany: async () => [],
      groupBy: async () => [],
      count: async () => 0,
    },
    aiScan: {
      create: async ({ data }: any) => ({ id: "mock-scan-id", ...data }),
      findMany: async () => [],
    },
    user: {
      findUnique: async () => null,
    },
    domain: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async ({ data }: any) => ({ id: "mock-domain-id", ...data }),
      update: async ({ data }: any) => ({ id: "mock-domain-id", ...data }),
    }
  };

  return mockClient as any;
}

export const prisma = (() => {
  if (isPlaceholderDb) {
    if (typeof window === "undefined") {
      console.warn("[RugVision] DATABASE_URL is placeholder, running in Mock Prisma mode.");
    }
    return createMockPrisma();
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL tanimli degil.");
  }

  const adapter = new PrismaPg({ connectionString });
  return (
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    })
  );
})() as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
