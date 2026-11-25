import { LANGUAGE } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";

const en = {
  newLecture: "New lecture",
  newNote: "New note",
  group: "Course / block",
  ungrouped: "Lectures without a block",
  content: "Lecture content",
  text: "Text",
  image: "Images",
  caption: "Caption",
  addText: "Add text",
  addImage: "Add images",
  earlier: "Move block up",
  later: "Move block down",
  removeBlock: "Remove block",
  archived: "Archived",
  missingLecture: "Lecture not found.",
  missingNote: "Note not found.",
};

const uk: typeof en = {
  newLecture: "Нова лекція",
  newNote: "Нова нотатка",
  group: "Блок",
  ungrouped: "Лекції без блоку",
  content: "Зміст лекції",
  text: "Текст",
  image: "Зображення",
  caption: "Підпис",
  addText: "Додати текст",
  addImage: "Додати зображення",
  earlier: "Перемістити блок угору",
  later: "Перемістити блок униз",
  removeBlock: "Прибрати блок",
  archived: "В архіві",
  missingLecture: "Лекцію не знайдено.",
  missingNote: "Нотатку не знайдено.",
};

export function useLearningMessages() {
  return useLocale().language === LANGUAGE.UKRAINIAN ? uk : en;
}
