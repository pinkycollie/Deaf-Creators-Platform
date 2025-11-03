import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkRateLimit } from "./lib/security"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const identifier = token?.sub || request.ip || "anonymous"
    const { success } = await checkRateLimit(identifier)

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 })
    }
  }

  // Tenant isolation for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    // Extract tenant from subdomain or path
    const host = request.headers.get("host")
    const subdomain = host?.split(".")[0]

    // Set tenant context in headers
    const response = NextResponse.next()
    response.headers.set("x-tenant-id", token.tenantId as string)

    return response
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
}
