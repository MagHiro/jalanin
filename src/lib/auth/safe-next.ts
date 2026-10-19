/** Accept only an in-app absolute path, before browser URL normalization. */
export function safeNext(value: string | null | undefined): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/dashboard";
  }
  return value;
}
