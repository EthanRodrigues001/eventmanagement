"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import React from "react";

const Page = () => {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  return (
    <p className="mt-32">
      {user ? `Welcome, ${user.displayName}` : "You are not logged in"}
      <div>{user ? JSON.stringify(user, null, 2) : null}</div>
      <button
        onClick={handleLogout}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Logout
      </button>
    </p>
  );
};

export default Page;
