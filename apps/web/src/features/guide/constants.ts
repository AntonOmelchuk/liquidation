import { PAGE } from "../../app/constants.ts";

export const GUIDE_SECTIONS = [
  { page: PAGE.JOURNAL, title: "journal", description: "journalText" },
  { page: PAGE.THOUGHTS, title: "preparation", description: "preparationText" },
  { page: PAGE.ACCOUNTS, title: "accounts", description: "accountsText" },
  { page: PAGE.PLANS, title: "plans", description: "plansText" },
  { page: PAGE.PLAYBOOKS, title: "strategies", description: "strategiesText" },
  { page: PAGE.BACKTESTS, title: "backtests", description: "backtestsText" },
  { page: PAGE.CARDS, title: "reviews", description: "reviewsText" },
  { page: PAGE.LECTURES, title: "learning", description: "learningText" },
  { page: PAGE.TRASH, title: "trash", description: "trashText" },
  { page: undefined, title: "settings", description: "settingsText" },
] as const;
