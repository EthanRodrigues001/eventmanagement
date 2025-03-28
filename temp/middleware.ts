import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./lib/auth/firebase-admin";

// Ensure Firebase Admin is initialized once

initAdmin();

const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value || "";

  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/login"
  ) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(session, true);
    const userUid = decodedClaims.uid;
    const userDoc = await getFirestore().collection("users").doc(userUid).get();
    const userData = userDoc.data();

    // if (!userData) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }

    if (
      userData &&
      !userData.onboardingCompleted &&
      request.nextUrl.pathname !== "/onboarding"
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (
      adminRoutes.includes(request.nextUrl.pathname) &&
      userData &&
      !userData.isAdmin
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|public).*)",
};
