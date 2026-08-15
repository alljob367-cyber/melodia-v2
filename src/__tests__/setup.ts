/**
 * MELODIA TEST SETUP
 * 
 * Global test configuration for Vitest.
 */

import "@testing-library/jest-dom/vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-user-id",
        email: "test@melodia.ai",
        name: "Test User",
        role: "user",
        plan: "artist_production",
      },
    },
    status: "authenticated",
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock NextResponse for API tests
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      return response;
    },
  },
  NextRequest: class NextRequest extends Request {
    constructor(input: string | URL, init?: RequestInit) {
      super(input, init);
    }
  },
}));

// Suppress console.error in tests (clean output)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[EventBus]")) return;
  if (typeof args[0] === "string" && args[0].includes("[API Error]")) return;
  originalConsoleError(...args);
};
