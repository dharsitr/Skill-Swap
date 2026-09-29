import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { resolveClient, checkConfigured, ServiceResult } from "./utils";
import { profileService } from "./profileService";
import { DEFAULT_AVATARS } from "@/constants/config";
import { isValidUuid } from "@/lib/security/sanitize";

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface AvatarUploadResult {
  publicUrl: string;
  path: string;
}

export const storageService = {
  /**
   * Uploads an avatar image to Supabase Storage and updates the user profile's avatar_url.
   */
  async uploadAvatar(
    userId: string,
    file: File | Blob,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<AvatarUploadResult>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user identifier format." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { data: null, error: "Image file size exceeds the 5MB limit. Please choose a smaller image." };
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        data: null,
        error: "Invalid file format. Please upload a JPEG, PNG, WebP, or GIF image.",
      };
    }

    const sb = resolveClient(client);

    // Determine extension
    let extension = "png";
    if (file.type) {
      const parts = file.type.split("/");
      if (parts[1]) extension = parts[1].replace("+xml", "");
    }
    const fileName = `avatar_${Date.now()}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    try {
      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await sb.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "image/png",
        });

      if (uploadError) {
        return { data: null, error: `Avatar upload failed: ${uploadError.message}` };
      }

      // 2. Get Public URL
      const { data: urlData } = sb.storage.from(AVATAR_BUCKET).getPublicUrl(uploadData.path);
      const publicUrl = urlData.publicUrl;

      // 3. Update profile avatar_url in the database
      const updateResult = await profileService.updateProfile(userId, { avatar_url: publicUrl }, client);
      if (updateResult.error) {
        console.warn("[storageService] Failed to update profile record with new avatar URL:", updateResult.error);
      }

      return {
        data: {
          publicUrl,
          path: uploadData.path,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to upload avatar image.",
      };
    }
  },

  /**
   * Removes custom avatar, restores default avatar URL in profile, and removes object from storage.
   */
  async removeAvatar(
    userId: string,
    existingStoragePath?: string,
    client?: SupabaseClient<Database>
  ): Promise<ServiceResult<string>> {
    if (!checkConfigured()) {
      return { data: null, error: "Supabase is not configured." };
    }

    if (!isValidUuid(userId)) {
      return { data: null, error: "Invalid user identifier format." };
    }

    const sb = resolveClient(client);
    const defaultAvatarUrl = DEFAULT_AVATARS[0];

    try {
      // If a path is provided, ensure it resides in the caller's folder
      if (existingStoragePath) {
        if (!existingStoragePath.startsWith(`${userId}/`)) {
          return { data: null, error: "Unauthorized: Cannot remove files belonging to another user." };
        }
        await sb.storage.from(AVATAR_BUCKET).remove([existingStoragePath]);
      }

      // Update profile with default avatar
      const updateResult = await profileService.updateProfile(
        userId,
        { avatar_url: defaultAvatarUrl },
        client
      );

      if (updateResult.error) {
        return { data: null, error: updateResult.error };
      }

      return { data: defaultAvatarUrl, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to reset avatar.",
      };
    }
  },

  /**
   * Generates a local preview URL for a selected File (for instantaneous UX before upload).
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  /**
   * Releases a preview URL from memory.
   */
  revokePreviewUrl(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  },
};
