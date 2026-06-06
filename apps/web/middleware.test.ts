import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("./auth", () => ({ auth: mocks.auth }));

import { config, middleware } from "./middleware";

describe("authentication middleware", () => {
  it("exports the configured auth guard for protected API namespaces", () => {
    expect(middleware).toBe(mocks.auth);
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        "/api/projects/:path*",
        "/api/content/:path*",
        "/api/integrations/:path*",
        "/api/run/:path*",
        "/api/runs/:path*",
        "/api/attention/:path*",
      ]),
    );
  });
});
