import { TYPE_NAME } from "./constants.ts";

export function isText(value: unknown): value is string {
  return typeof value === TYPE_NAME.STRING;
}

export function isNumber(value: unknown): value is number {
  return typeof value === TYPE_NAME.NUMBER;
}
