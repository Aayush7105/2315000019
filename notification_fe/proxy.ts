import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { logFrontendInfo } from "@/lib/logging";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);

  event.waitUntil(
    logFrontendInfo({
      packageName: "proxy",
      message: "Frontend request accepted",
      metadata: {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
      },
    }),
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
