import { apiConfig } from "@/api/core";

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\\d+.-]*:/i;

export const resolveAvatarUrl = (avatar?: string): string | undefined => {
  const value = avatar?.trim();
  if (!value) return undefined;
  if (ABSOLUTE_URL_PATTERN.test(value)) return value;
  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }
  try {
    return new URL(value, apiConfig.baseURL).toString();
  } catch {
    return value;
  }
};
