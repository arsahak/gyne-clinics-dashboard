"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UploadImageResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadImageResponse> {
  try {
    const session = await auth();
    const token = session?.accessToken;

    const response = await fetch(`${API_URL}/api/v1/uploads/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message || "Failed to upload image" };
    return { success: true, url: data.data?.url };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "An error occurred while uploading the image" };
  }
}
