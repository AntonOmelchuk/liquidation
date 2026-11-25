import { isText } from "@liquidation/domain/shared/guards";

export function formText(data: FormData, name: string) {
  const value = data.get(name);
  return isText(value) ? value.trim() : "";
}
export function formTexts<K extends string>(
  data: FormData,
  keys: readonly K[],
) {
  return Object.fromEntries(
    keys.map((key) => [key, formText(data, key)]),
  ) as Record<K, string>;
}
