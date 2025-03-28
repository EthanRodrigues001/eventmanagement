"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/auth/firebase";
import { useRouter, usePathname } from "next/navigation";

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  organization: string | null;
  gender: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("currentUser", firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
          // Existing user
          setUser(userDoc.data() as User);

          // Check if onboarding is needed and not currently on the onboarding page
          if (
            !userDoc.data().onboardingCompleted &&
            pathname !== "/onboarding"
          ) {
            router.push("/onboarding");
          }
        } else {
          // New user - create basic record
          const newUser: Partial<User> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            onboardingCompleted: false,
            isAdmin: false,
          };

          await setDoc(doc(db, "users", firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });

          setUser(newUser as User);
          router.push("/onboarding");
        }
      } else {
        setUser(null);
        if (pathname !== "/login" && pathname !== "/") {
          router.push("/login");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const user = await signInWithPopup(auth, provider);
      console.log("user:auth", user);
    } catch (error) {
      console.error("Error signing in with Google", error);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
