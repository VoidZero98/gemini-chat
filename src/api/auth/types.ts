export type CaptchaResponse = {
  captchaId: string;
  image: string;
  expiresIn: number;
};

export type AuthCredentials = {
  account: string;
  password: string;
  captchaId: string;
  captchaCode: string;
};

export type AuthUser = {
  id: number;
  account: string;
  bio?: string;
  avatar?: string;
};

export type AuthTokenPayload = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type UpdateProfilePayload = {
  account?: string;
  password?: string;
  avatar?: string;
  bio?: string;
};
