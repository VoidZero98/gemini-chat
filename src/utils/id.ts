/** 生成 UUID v4 风格字符串（无 crypto.randomUUID 时降级） */
const uuidV4FromGetRandomValues = (): string => {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** 最后兜底：时间戳 + 随机串（非标准 UUID） */
const fallbackId = (): string =>
  `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const nextId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return uuidV4FromGetRandomValues();
  }
  return fallbackId();
};
