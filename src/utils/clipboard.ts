/** 写入系统剪贴板（需 https 或 localhost，且用户手势触发更稳妥） */
export const copyTextToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};
