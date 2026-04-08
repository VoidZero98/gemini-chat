/** API Base URL，部署时通过环境变量覆盖；开发默认对接文档示例端口 */
export const getApiBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL;

  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.replace(/\/+$/, "");
  }

  return "http://127.0.0.1:3008";
};
