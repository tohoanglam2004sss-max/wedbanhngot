import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("Cake Bakery API endpoints", () => {
  const mockDb = {
    prepare: (query: string) => ({
      bind: (...params: unknown[]) => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ success: true, meta: { changes: 1 } })
      }),
      all: async () => ({ results: [] }),
      first: async () => null,
      run: async () => ({ success: true, meta: { changes: 1 } })
    }),
    batch: async () => [{ success: true }]
  };

  const mockEnv = {
    DB: mockDb as any,
    PRODUCT_IMAGES: {} as any,
    ADMIN_TOKEN: "test-admin-token-123"
  };

  it("returns health status with bakery service name", async () => {
    const res = await app.request("/api/health", {}, mockEnv);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", service: "sweet-cake-bakery" });
  });

  it("returns config with store name and defaults", async () => {
    const res = await app.request("/api/config", {}, mockEnv);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.storeName).toBe("Sweet Cake Bakery");
    expect(body.ghnEnabled).toBe(false);
  });

  it("verifies admin token correctly", async () => {
    const unauthorizedRes = await app.request(
      "/api/admin/session",
      {
        method: "POST",
        headers: { Authorization: "Bearer wrong-token" }
      },
      mockEnv
    );
    expect(unauthorizedRes.status).toBe(401);

    const authorizedRes = await app.request(
      "/api/admin/session",
      {
        method: "POST",
        headers: { Authorization: "Bearer test-admin-token-123" }
      },
      mockEnv
    );
    expect(authorizedRes.status).toBe(200);
    const body = await authorizedRes.json();
    expect(body).toEqual({ authenticated: true });
  });
});

