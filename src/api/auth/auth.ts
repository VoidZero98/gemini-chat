import { request, tokenStore } from "@/api/core";
import type {
  AuthCredentials,
  AuthTokenPayload,
  UpdateProfilePayload,
  AuthUser,
  CaptchaResponse,
} from "./types";
import { saveCachedProfile } from "./profileStore";
import { resolveAvatarUrl } from "@/utils/avatar";

const AUTH_BASE_PATH = "/auth";

const normalizeAuthUser = (user: AuthUser): AuthUser => {
  return {
    ...user,
    avatar: resolveAvatarUrl(user.avatar),
  };
};

const commitToken = (result: AuthTokenPayload): AuthTokenPayload => {
  tokenStore.set(result.accessToken);
  const normalizedResult = {
    ...result,
    user: normalizeAuthUser(result.user),
  };
  saveCachedProfile(normalizedResult.user);
  return normalizedResult;
};

export const getCaptcha = async (): Promise<CaptchaResponse> => {
  return request<CaptchaResponse>(`${AUTH_BASE_PATH}/captcha`, {
    method: "GET",
    skipAuth: true,
  });
};

const postAuth = async (
  path: "login" | "register",
  payload: AuthCredentials,
): Promise<AuthTokenPayload> => {
  const result = await request<AuthTokenPayload>(`${AUTH_BASE_PATH}/${path}`, {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  return commitToken(result);
};

export const login = async (payload: AuthCredentials): Promise<AuthTokenPayload> => {
  return postAuth("login", payload);
};

export const register = async (payload: AuthCredentials): Promise<AuthTokenPayload> => {
  return postAuth("register", payload);
};

export const getProfile = async (): Promise<AuthUser> => {
  const profile = await request<AuthUser>(`${AUTH_BASE_PATH}/profile`, {
    method: "GET",
  });
  const normalizedProfile = normalizeAuthUser(profile);
  saveCachedProfile(normalizedProfile);
  return normalizedProfile;
};

export const updateProfile = async (
  payload: UpdateProfilePayload,
): Promise<AuthUser> => {
  const profile = await request<AuthUser>(`${AUTH_BASE_PATH}/profile`, {
    method: "PATCH",
    body: payload,
  });
  const normalizedProfile = normalizeAuthUser(profile);
  saveCachedProfile(normalizedProfile);
  return normalizedProfile;
};

export const uploadAvatar = async (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append("file", file);
  const profile = await request<AuthUser>(`${AUTH_BASE_PATH}/profile/avatar`, {
    method: "POST",
    body: formData,
  });
  const normalizedProfile = normalizeAuthUser(profile);
  saveCachedProfile(normalizedProfile);
  return normalizedProfile;
};
