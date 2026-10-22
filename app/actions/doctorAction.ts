"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Admin doctor management against the Gyneclinics backend (/api/v1/doctors).
// Records keep the field names the dashboard's doctor pages already use
// (approvalStatus, featured, suspended, user.name, …) so the UI can switch
// over without changes.

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface DoctorDocument {
  _id?: string;
  name: string;
  url: string;
  uploadedAt?: string;
}

export interface DoctorSchedule {
  /** 7 days, Monday first. Each day is a list of time ranges; empty means off. */
  weekly: { start: string; end: string }[][];
  slotMinutes: number;
  bookingWindowDays: number;
  minNoticeHours: number;
  instantChat: boolean;
  timeOff: string[];
  timezone: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface DoctorMessaging {
  /** Patients can message without paying. */
  free: boolean;
  /** Patients can book a paid chat consultation. */
  consultation: boolean;
}

/**
 * Profile changes an approved doctor made that wait for an admin. `fields`
 * uses backend names (fullName, title, feeGBP, clinic, …).
 */
export interface DoctorPendingUpdate {
  fields: Record<string, unknown>;
  /** New photo URL, or "" to remove the photo. Absent = photo unchanged. */
  avatar?: string;
  submittedAt: string;
}

export interface DoctorRecord {
  _id: string;
  user: {
    _id: string;
    name?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    phoneVerified?: boolean;
    lastLoginAt?: string;
    createdAt?: string;
  };
  title?: string;
  specialization?: string;
  focusAreas?: string[];
  qualifications?: string[];
  experienceYears?: number;
  registrationNumber?: string;
  registrationBody?: string;
  /** Uploaded verification documents. */
  documents: DoctorDocument[];
  /** Document URLs (kept for the existing doctor pages). */
  verificationDocuments?: string[];
  /** Base fee in GBP. */
  consultationFee?: number;
  /** Clinic name. */
  hospitalName?: string;
  /** City and country. */
  hospitalAddress?: string;
  city?: string;
  country?: string;
  languages?: string[];
  about?: string;
  schedule?: DoctorSchedule;
  /** How patients can reach the doctor. At least one is on. */
  messaging: DoctorMessaging;
  /** Weekly hours as day/time slots (Sunday = 0). */
  availability?: AvailabilitySlot[];
  consultationTypes?: ("online" | "in_person")[];
  isOnline?: boolean;
  avgRating: number;
  reviewCount: number;
  consultationCount: number;
  featured: boolean;
  suspended: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt?: string;
  /** Profile edits go live without review (registration details are always reviewed). */
  autoApproveUpdates: boolean;
  /** Changes waiting for review; patients see the current profile until then. */
  pendingUpdate: DoctorPendingUpdate | null;
  /** Why the last update was turned down. */
  updateRejection: { reason?: string; at: string } | null;
  /** Live values of every reviewable field, by backend name, to compare with `pendingUpdate.fields`. */
  liveFields: Record<string, unknown>;
}

export type DoctorStatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended" | "featured" | "updates";
export type DoctorSort = "newest" | "oldest" | "rating" | "experience" | "name_asc" | "name_desc";

export interface DoctorPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DoctorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  featured: number;
  /** Doctors with a profile update to review. */
  updates: number;
}

export interface DoctorPageResponse {
  success: boolean;
  data?: DoctorRecord[];
  pagination?: DoctorPagination;
  stats?: DoctorStats;
  error?: string;
}

export interface DoctorResponse {
  success: boolean;
  message?: string;
  data?: DoctorRecord;
  error?: string;
}

export interface DoctorListResponse {
  success: boolean;
  data?: DoctorRecord[];
  error?: string;
}

/** Values from an add/edit doctor form. */
export interface DoctorFormData {
  fullName: string;
  phone: string;
  email?: string;
  title: string;
  specialization: string;
  qualifications: string[];
  experienceYears: number;
  registrationNumber: string;
  registrationBody: string;
  clinic?: string;
  city: string;
  country?: string;
  languages: string[];
  focusAreas?: string[];
  about?: string;
  feeGBP: number;
  schedule?: Partial<DoctorSchedule>;
  messaging?: Partial<DoctorMessaging>;
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
      throw new Error(`Invalid JSON response from server (Status ${response.status})`);
    }
  }
  const text = await response.text();
  console.error(`Non-JSON response from ${response.url}:`, text.substring(0, 200));
  throw new Error(`Server returned non-JSON response (Status ${response.status})`);
}

/** Error text for a failed backend response. */
function errorFor(response: Response, data: any, fallback: string): string {
  // The backend token lasts JWT_EXPIRES_IN (backend .env); after that every call is 401.
  if (response.status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (response.status === 403) return data?.message || "You don't have permission to manage doctors.";
  return data?.errors?.[0] || data?.message || fallback;
}

/** Monday-first weekly ranges → Sunday-first day/time slots. */
function toAvailability(schedule?: DoctorSchedule): AvailabilitySlot[] {
  if (!schedule?.weekly) return [];
  return schedule.weekly.flatMap((ranges, mondayIndex) =>
    ranges.map((range) => ({
      dayOfWeek: (mondayIndex + 1) % 7,
      startTime: range.start,
      endTime: range.end,
    })),
  );
}

/** Backend doctor (profile + user) → the shape the dashboard uses. */
function toDoctorRecord(item: any): DoctorRecord {
  const user = item.user ?? {};
  const documents: DoctorDocument[] = item.documents ?? [];
  return {
    _id: item._id,
    user: {
      _id: user._id,
      name: user.fullName || undefined,
      phone: user.phone || undefined,
      email: user.email || undefined,
      avatar: user.avatar || undefined,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
    title: item.title,
    specialization: item.specialization,
    focusAreas: item.focusAreas ?? [],
    qualifications: item.qualifications ?? [],
    experienceYears: item.experienceYears,
    registrationNumber: item.registrationNumber,
    registrationBody: item.registrationBody,
    documents,
    verificationDocuments: documents.map((doc) => doc.url),
    consultationFee: item.feeGBP,
    hospitalName: item.clinic || undefined,
    hospitalAddress: [item.city, item.country].filter(Boolean).join(", ") || undefined,
    city: item.city,
    country: item.country || undefined,
    languages: item.languages ?? [],
    about: item.about || undefined,
    schedule: item.schedule,
    messaging: { free: Boolean(item.messaging?.free), consultation: item.messaging?.consultation ?? true },
    availability: toAvailability(item.schedule),
    consultationTypes: ["online"],
    isOnline: item.isOnline,
    avgRating: item.rating ?? 0,
    reviewCount: item.reviewCount ?? 0,
    consultationCount: item.consultationCount ?? 0,
    featured: Boolean(item.recommended),
    suspended: user.isActive === false,
    suspensionReason: user.suspensionReason || undefined,
    suspendedAt: user.suspendedAt || undefined,
    approvalStatus: item.verificationStatus,
    rejectionReason: item.rejectionReason || undefined,
    verifiedAt: item.verifiedAt || undefined,
    createdAt: item.createdAt,
    autoApproveUpdates: Boolean(item.autoApproveUpdates),
    pendingUpdate: item.pendingUpdate ?? null,
    updateRejection: item.updateRejection ?? null,
    liveFields: {
      fullName: user.fullName ?? "",
      ...Object.fromEntries(REVIEWED_PROFILE_FIELDS.map((field) => [field, item[field]])),
    },
  };
}

const REVIEWED_PROFILE_FIELDS = [
  "title",
  "specialization",
  "focusAreas",
  "qualifications",
  "experienceYears",
  "registrationNumber",
  "registrationBody",
  "clinic",
  "city",
  "country",
  "languages",
  "about",
  "feeGBP",
] as const;

/** Form data → backend body. */
function toDoctorBody(data: Partial<DoctorFormData>) {
  return {
    ...data,
    fullName: data.fullName?.trim(),
    phone: data.phone?.trim(),
    email: data.email === undefined ? undefined : data.email.trim(),
  };
}

/** Refreshes the cached doctor pages after a change. */
function refreshDoctorPages() {
  revalidatePath("/doctors", "layout");
}

async function request(path: string, init: RequestInit, fallback: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/v1/doctors${path}`, { ...init, headers, cache: "no-store" });
  const data = await parseResponse(response);
  return { ok: response.ok, data, error: response.ok ? undefined : errorFor(response, data, fallback) };
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getDoctorsPage(
  status: DoctorStatusFilter = "all",
  search?: string,
  page: number = 1,
  limit: number = 10,
  sort: DoctorSort = "newest",
): Promise<DoctorPageResponse> {
  try {
    const params = new URLSearchParams({ status, page: String(page), limit: String(limit), sort });
    if (search) params.set("search", search);
    const { ok, data, error } = await request(`?${params}`, { method: "GET" }, "Failed to fetch doctors");
    if (!ok) return { success: false, error };
    return {
      success: true,
      data: (data.data?.doctors ?? []).map(toDoctorRecord),
      pagination: data.data?.pagination,
      stats: data.data?.stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while fetching doctors",
    };
  }
}

/** Up to 100 doctors with one status, without paging (for selects and simple lists). */
export async function getDoctors(status: DoctorStatusFilter = "all"): Promise<DoctorListResponse> {
  const response = await getDoctorsPage(status, undefined, 1, 100);
  return { success: response.success, data: response.data, error: response.error };
}

export async function getDoctorById(id: string): Promise<DoctorResponse> {
  try {
    const { ok, data, error } = await request(`/${id}`, { method: "GET" }, "Failed to fetch doctor");
    if (!ok) return { success: false, error };
    return { success: true, data: toDoctorRecord(data.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching the doctor" };
  }
}

// ── Create / edit ───────────────────────────────────────────────────────────

/** Creates the account and profile. Admin-created doctors are approved straight away. */
export async function createDoctor(form: DoctorFormData): Promise<DoctorResponse> {
  try {
    const { ok, data, error } = await request(
      "",
      { method: "POST", body: JSON.stringify(toDoctorBody(form)) },
      "Failed to create doctor",
    );
    if (!ok) return { success: false, error };
    refreshDoctorPages();
    return { success: true, message: data.message, data: toDoctorRecord(data.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while creating the doctor" };
  }
}

/** Send only the fields that change. */
export async function updateDoctor(id: string, form: Partial<DoctorFormData>): Promise<DoctorResponse> {
  try {
    const { ok, data, error } = await request(
      `/${id}`,
      { method: "PATCH", body: JSON.stringify(toDoctorBody(form)) },
      "Failed to update doctor",
    );
    if (!ok) return { success: false, error };
    refreshDoctorPages();
    return { success: true, message: data.message, data: toDoctorRecord(data.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating the doctor" };
  }
}

// ── Status actions ──────────────────────────────────────────────────────────

async function patchDoctor(id: string, path: string, body: Record<string, unknown> | undefined, fallback: string): Promise<DoctorResponse> {
  try {
    const { ok, data, error } = await request(
      `/${id}${path}`,
      { method: "PATCH", body: JSON.stringify(body ?? {}) },
      fallback,
    );
    if (!ok) return { success: false, error };
    refreshDoctorPages();
    return { success: true, message: data.message, data: toDoctorRecord(data.data) };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}

/** Approves verification: the doctor appears to patients. */
export async function approveDoctor(id: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/approve", undefined, "Failed to approve doctor");
}

export async function rejectDoctor(id: string, rejectionReason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/reject", { reason: rejectionReason }, "Failed to reject doctor");
}

/** Sets verification to pending, approved or rejected (e.g. from a status dropdown). */
export async function setDoctorVerification(id: string, status: ApprovalStatus, reason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/verification", { status, reason }, "Failed to update verification status");
}

/** One status for the list's dropdown: a verification status, or "blocked". */
export type DoctorListStatus = ApprovalStatus | "blocked";

/**
 * Applies a dropdown choice. "blocked" blocks the account; any other choice
 * sets the verification status and unblocks the account if it was blocked.
 */
export async function setDoctorStatus(doctor: Pick<DoctorRecord, "_id" | "approvalStatus" | "suspended">, status: DoctorListStatus): Promise<DoctorResponse> {
  if (status === "blocked") return suspendDoctor(doctor._id);
  if (doctor.suspended) {
    const unblocked = await unsuspendDoctor(doctor._id);
    if (!unblocked.success || doctor.approvalStatus === status) return unblocked;
  }
  return setDoctorVerification(doctor._id, status);
}

/** Blocks the account: the doctor can't sign in until unblocked. */
export async function suspendDoctor(id: string, reason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/suspend", { reason }, "Failed to block doctor");
}

export async function unsuspendDoctor(id: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/unsuspend", undefined, "Failed to unblock doctor");
}

/** Featured doctors are pinned near the top of the patient's doctor list. */
export async function setFeaturedDoctor(id: string, featured: boolean): Promise<DoctorResponse> {
  return patchDoctor(id, "/feature", { featured }, "Failed to update featured status");
}

// ── Profile update review ───────────────────────────────────────────────────

/** Makes the doctor's pending profile changes (and photo) live for patients. */
export async function approveDoctorUpdate(id: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/update/approve", undefined, "Failed to approve the update");
}

/** Turns the pending changes down; patients keep seeing the current profile. */
export async function rejectDoctorUpdate(id: string, reason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/update/reject", { reason }, "Failed to reject the update");
}

/** Off (the default): every profile edit waits for an admin. */
export async function setDoctorAutoApprove(id: string, enabled: boolean): Promise<DoctorResponse> {
  return patchDoctor(id, "/auto-approve", { enabled }, "Failed to change the approval setting");
}

/** Permanently deletes the doctor's account and profile. */
export async function removeDoctorAccount(id: string): Promise<DoctorResponse> {
  try {
    const { ok, data, error } = await request(`/${id}`, { method: "DELETE" }, "Failed to remove doctor");
    if (!ok) return { success: false, error };
    refreshDoctorPages();
    return { success: true, message: data.message || "Doctor account removed" };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while removing the doctor" };
  }
}
