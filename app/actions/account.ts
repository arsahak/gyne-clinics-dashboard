"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** The signed-in staff member, as GET /api/v1/users/me returns it. */
export interface MyAccount {
  fullName: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

/** Read only: the profile page shows these and changes nothing. */
export async function getMyAccount(): Promise<{ success: boolean; data?: MyAccount; error?: string }> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { success: false, error: "Not signed in" };
  try {
    const response = await fetch(`${API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data) {
      return { success: false, error: response.status === 401 ? "Your session has expired. Please sign in again." : body?.message || "Couldn't load your account" };
    }
    const u = body.data;
    return {
      success: true,
      data: {
        fullName: u.fullName,
        email: u.email || undefined,
        phone: u.phone || undefined,
        emailVerified: Boolean(u.emailVerified),
        phoneVerified: Boolean(u.phoneVerified),
        role: u.role,
        avatar: u.avatar || undefined,
        lastLoginAt: u.lastLoginAt || undefined,
        createdAt: u.createdAt || undefined,
      },
    };
  } catch {
    return { success: false, error: "Can't reach the server" };
  }
}
