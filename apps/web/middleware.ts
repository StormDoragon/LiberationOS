export { auth as middleware } from "./auth";

export const config = {
  matcher: [
    "/api/projects/:path*",
    "/api/content/:path*",
    "/api/integrations/:path*",
    "/api/run/:path*",
    "/api/runs/:path*",
    "/api/attention/:path*",
  ],
};
