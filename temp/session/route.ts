import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { cookies } from "next/headers";
import { initAdmin } from "@/lib/auth/firebase-admin";

// Initialize Firebase Admin
initAdmin();

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // Create a session cookie that expires in 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return NextResponse.json({ success: true });
}
