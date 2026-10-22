"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type PregnancyStatus =
  | "not_pregnant"
  | "pregnant"
  | "postpartum"
  | "trying_to_conceive";

export interface PatientProfile {
  _id: string;
  age?: number;
  /** yyyy-MM-dd */
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  menstrualHistory?: {
    lastPeriodDate?: string;
    cycleLengthDays?: number;
    periodLengthDays?: number;
  };
  pregnancyStatus?: PregnancyStatus;
  dueDate?: string;
  profileCompleted: boolean;
  remindersEnabled: boolean;
}

export interface PatientRecord {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: "patient";
  avatar?: string;
  isVerified: boolean;
  suspended: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  profile: PatientProfile | null;
}

export type PatientStatusFilter = "all" | "active" | "suspended";
export type PatientSort = "newest" | "oldest" | "name_asc" | "name_desc";

export interface PatientPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PatientStats {
  total: number;
  active: number;
  blocked: number;
  pregnant: number;
}

export interface PatientListResponse {
  success: boolean;
  data?: PatientRecord[];
  pagination?: PatientPagination;
  stats?: PatientStats;
  error?: string;
}

/** Values from the add/edit patient form. Dates are yyyy-MM-dd. */
export interface PatientFormData {
  fullName: string;
  phone: string;
  email?: string;
  /** Leave out to create/keep the patient without a health profile. */
  profile?: {
    dateOfBirth: string;
    heightCm: number;
    weightKg: number;
    typicalCycleLength: number;
    typicalPeriodLength: number;
    lastPeriodStart?: string;
    pregnancyStatus: PregnancyStatus;
    dueDate?: string;
  };
}

export interface PatientResponse {
  success: boolean;
  message?: string;
  data?: PatientRecord;
  error?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      throw new Error(
        `Invalid JSON response from server (Status ${response.status})`,
      );
    }
  }
  const text = await response.text();
  console.error(
    `Non-JSON response from ${response.url}:`,
    text.substring(0, 200),
  );
  throw new Error(
    `Server returned non-JSON response (Status ${response.status})`,
  );
}

/** Error text for a failed backend response. */
function errorFor(response: Response, data: any, fallback: string): string {
  // The backend token lasts JWT_EXPIRES_IN (backend .env); after that every call is 401.
  if (response.status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (response.status === 403) return data?.message || "You don't have permission to manage patients.";
  return data?.message || fallback;
}

// The backend uses "trying"; the dashboard UI uses "trying_to_conceive".
function toPregnancyStatus(value?: string): PregnancyStatus | undefined {
  if (!value) return undefined;
  return value === "trying" ? "trying_to_conceive" : (value as PregnancyStatus);
}

function ageFrom(dateOfBirth?: string): number | undefined {
  if (!dateOfBirth) return undefined;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()))
    age -= 1;
  return age;
}

/** Backend patient (user + profile) → the shape the dashboard UI uses. */
function toPatientRecord(item: any): PatientRecord {
  const profile = item.profile;
  return {
    _id: item._id,
    name: item.fullName,
    email: item.email || undefined,
    phone: item.phone || undefined,
    role: "patient",
    avatar: item.avatar || undefined,
    isVerified: Boolean(item.phoneVerified || item.emailVerified),
    suspended: item.isActive === false,
    suspensionReason: item.suspensionReason || undefined,
    suspendedAt: item.suspendedAt || undefined,
    lastLoginAt: item.lastLoginAt || undefined,
    createdAt: item.createdAt,
    profile: profile
      ? {
          _id: profile._id,
          age: ageFrom(profile.dateOfBirth),
          dateOfBirth: profile.dateOfBirth?.slice(0, 10),
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          menstrualHistory: {
            lastPeriodDate: profile.lastPeriodStart,
            cycleLengthDays: profile.typicalCycleLength,
            periodLengthDays: profile.typicalPeriodLength,
          },
          pregnancyStatus: toPregnancyStatus(profile.pregnancyStatus),
          dueDate: profile.dueDate,
          profileCompleted: Boolean(profile.onboardedAt),
          remindersEnabled: Boolean(
            profile.reminders?.periodReminder ||
            profile.reminders?.fertileReminder ||
            profile.reminders?.dailyLogReminder,
          ),
        }
      : null,
  };
}

export async function getPatients(
  status: PatientStatusFilter = "all",
  search?: string,
  page: number = 1,
  limit: number = 10,
  sort: PatientSort = "newest",
): Promise<PatientListResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      status,
    });
    if (search) params.set("search", search);

    const response = await fetch(`${API_URL}/api/v1/patients?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok)
      return {
        success: false,
        error: errorFor(response, data, "Failed to fetch patients"),
      };
    return {
      success: true,
      data: (data.data?.patients ?? []).map(toPatientRecord),
      pagination: data.data?.pagination,
      stats: data.data?.stats,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching patients",
    };
  }
}

export async function getPatientById(id: string): Promise<PatientResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/patients/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok)
      return {
        success: false,
        error: errorFor(response, data, "Failed to fetch patient"),
      };
    return { success: true, data: toPatientRecord(data.data) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred while fetching the patient",
    };
  }
}

export async function suspendPatient(
  id: string,
  reason?: string,
): Promise<PatientResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/patients/${id}/suspend`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reason }),
    });
    const data = await parseResponse(response);
    if (!response.ok)
      return {
        success: false,
        error: errorFor(response, data, "Failed to block patient"),
      };
    revalidatePath("/patient", "layout");
    return {
      success: true,
      message: data.message,
      data: toPatientRecord(data.data),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred while blocking the patient",
    };
  }
}

export async function unsuspendPatient(id: string): Promise<PatientResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/patients/${id}/unsuspend`, {
      method: "PATCH",
      headers,
    });
    const data = await parseResponse(response);
    if (!response.ok)
      return {
        success: false,
        error: errorFor(response, data, "Failed to unblock patient"),
      };
    revalidatePath("/patient", "layout");
    return {
      success: true,
      message: data.message,
      data: toPatientRecord(data.data),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred while unblocking the patient",
    };
  }
}

/** Form data → backend body. The backend calls "trying to conceive" "trying". */
function toPatientBody(data: PatientFormData) {
  const profile = data.profile;
  return {
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() ?? "",
    ...(profile && {
      profile: {
        ...profile,
        lastPeriodStart: profile.lastPeriodStart || undefined,
        pregnancyStatus: profile.pregnancyStatus === "trying_to_conceive" ? "trying" : profile.pregnancyStatus,
        dueDate: profile.pregnancyStatus === "pregnant" ? profile.dueDate : undefined,
      },
    }),
  };
}

/** First validation message from the backend, if any. */
function firstError(response: Response, data: any, fallback: string): string {
  return data?.errors?.[0] || errorFor(response, data, fallback);
}

export async function createPatient(data: PatientFormData): Promise<PatientResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/patients`, {
      method: "POST",
      headers,
      body: JSON.stringify(toPatientBody(data)),
    });
    const body = await parseResponse(response);
    if (!response.ok) return { success: false, error: firstError(response, body, "Failed to create patient") };
    revalidatePath("/patient", "layout");
    return { success: true, message: body.message, data: toPatientRecord(body.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while creating the patient" };
  }
}

export async function updatePatient(id: string, data: PatientFormData): Promise<PatientResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/patients/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(toPatientBody(data)),
    });
    const body = await parseResponse(response);
    if (!response.ok) return { success: false, error: firstError(response, body, "Failed to update patient") };
    revalidatePath("/patient", "layout");
    return { success: true, message: body.message, data: toPatientRecord(body.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating the patient" };
  }
}
