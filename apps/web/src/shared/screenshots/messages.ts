import { LANGUAGE } from "../constants.ts";
import { useLocale } from "../messages.ts";

const en = {
  title: "Screenshots",
  add: "Choose images",
  hint: "Paste or drop PNG, JPEG, WebP or GIF here. Up to 12 images per section and 8 MiB per image.",
  tooMany: "This section can hold up to 12 screenshots.",
  invalidFile:
    "Choose non-empty PNG, JPEG, WebP or GIF files up to 8 MiB each.",
  uploadLimit: "Save up to 32 MiB of new screenshots at a time.",
  remove: "Remove screenshot",
  moveEarlier: "Move screenshot earlier",
  moveLater: "Move screenshot later",
  preview: "Open screenshot in a new tab",
  unavailable: "Screenshot unavailable",
};

const uk: Record<keyof typeof en, string> = {
  title: "Скриншоти",
  add: "Вибрати зображення",
  hint: "Встав або перетягни сюди PNG, JPEG, WebP чи GIF. До 12 зображень на блок, до 8 МіБ кожне.",
  tooMany: "До одного блоку можна додати до 12 скриншотів.",
  invalidFile:
    "Вибери непорожні PNG, JPEG, WebP або GIF розміром до 8 МіБ кожен.",
  uploadLimit: "За один раз можна зберегти до 32 МіБ нових скриншотів.",
  remove: "Прибрати скриншот",
  moveEarlier: "Перемістити скриншот раніше",
  moveLater: "Перемістити скриншот пізніше",
  preview: "Відкрити скриншот у новій вкладці",
  unavailable: "Скриншот недоступний",
};

export function useScreenshotMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
