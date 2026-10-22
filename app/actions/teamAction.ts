"use server";

import { auth } from "@/auth";
import type { AccessLevel, AreaKey } from "@/lib/access";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Team & Roles: GET/POST /api/v1/users/staff, PATCH/DELETE /users/staff/:id,
// PATCH /users/staff/:id/password, GET/PUT /users/permissions.

export type StaffRole = "moderator" | "admin" | "superadmin";

export interface TeamMember {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: StaffRole;
  isActive: boolean;
  suspensionReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  isYou: boolean;
  /** Whether you may change or remove them. */
  canManage: boolean;
}

export interface Area {
  key: AreaKey;
  group: string;
  label: string;
  /** What "manage" lets someone do here. */
  manage: string;
  levels: AccessLevel[];
}

export interface Permissions {
  areas: Area[];
  roles: Record<StaffRole, Record<AreaKey, AccessLevel>>;
  defaults: Record<"admin" | "moderator", Record<AreaKey, AccessLevel>>;
  myRole: StaffRole;
  mine: Record<AreaKey, AccessLevel>;
  /** Only super admins change the matrix. */
  canEdit: boolean;
  manageableRoles: StaffRole[];
  canAdd: Record<StaffRole, StaffRole[]>;
  counts: Record<StaffRole, number>;
  history: { at: string; by: string | null; changes: string[] }[];
}

type Result<T = undefined> = { success: boolean; data?: T; message?: string; error?: string };

async function request<T>(path: string, init: RequestInit, fallback: string): Promise<Result<T>> {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/users${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = response.status === 401 ? "Your session has expired. Please sign out and sign in again." : body?.errors?.[0] || body?.message || fallback;
      return { success: false, error };
    }
    return { success: true, data: body?.data as T, message: body?.message };
  } catch {
    return { success: false, error: "Can't reach the server. Please try again." };
  }
}

export async function getTeam() {
  return request<{ members: TeamMember[]; manageableRoles: StaffRole[] }>("/staff", { method: "GET" }, "Failed to load the team");
}

export async function addMember(input: { fullName: string; email: string; phone?: string; role: StaffRole; password: string }) {
  return request<TeamMember>("/staff", { method: "POST", body: JSON.stringify(input) }, "Failed to add the member");
}

/** Name, email, phone, role, or suspend (isActive false) / reactivate. */
export async function updateMember(id: string, changes: Partial<{ fullName: string; email: string; phone: string; role: StaffRole; isActive: boolean; suspensionReason: string }>) {
  return request<TeamMember>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(changes) }, "Failed to save");
}

export async function setMemberPassword(id: string, password: string) {
  return request(`/staff/${id}/password`, { method: "PATCH", body: JSON.stringify({ password }) }, "Failed to set the password");
}

export async function removeMember(id: string) {
  return request(`/staff/${id}`, { method: "DELETE" }, "Failed to remove the member");
}

export async function getPermissions() {
  return request<Permissions>("/permissions", { method: "GET" }, "Failed to load permissions");
}

/** Super admin: what admins and moderators can open. Applies right away. */
export async function savePermissions(roles: Partial<Record<"admin" | "moderator", Partial<Record<AreaKey, AccessLevel>>>>) {
  return request<{ changes: string[] }>("/permissions", { method: "PUT", body: JSON.stringify({ roles }) }, "Failed to save permissions");
}
