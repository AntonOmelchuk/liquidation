import { z } from "zod";
import { planNoteSchema } from "../plans/plan-evidence.ts";
import { screenshotIdsSchema } from "../evidence/screenshots.ts";
import {
  MAX_PLAYBOOK_RULES,
  MAX_PLAYBOOK_SETUPS,
  MAX_RULE_REASON,
  PLAYBOOK_ACTION,
  PLAYBOOK_STATUSES,
} from "./constants.ts";
import type { Playbook, PlaybookLink, PlaybookRules } from "./types.ts";
import { playbookStrategySchema, strategyScreenshotIds } from "./strategy.ts";

const shortText = z.string().trim().min(1).max(120);
const description = z.string().trim().max(4000);
const ruleSchema = z.object({
  id: z.uuid(),
  label: shortText,
  detail: z.string().trim().max(1000),
});
const ruleList = z.array(ruleSchema).max(MAX_PLAYBOOK_RULES);
const setupSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().max(120),
  description,
  rules: ruleList,
  screenshotIds: screenshotIdsSchema.optional(),
});

export const playbookRulesSchema = z
  .object({
    setups: z.array(setupSchema).min(1).max(MAX_PLAYBOOK_SETUPS),
    filters: ruleList,
    management: ruleList,
    strategy: playbookStrategySchema.optional(),
    screenshotIds: screenshotIdsSchema.optional(),
  })
  .superRefine(({ setups, filters, management }, context) => {
    const names = setups.map(({ name }) => name.toLowerCase());
    if (
      (setups.length > 1 && names.includes("")) ||
      new Set(names).size !== setups.length ||
      new Set(setups.map(({ id }) => id)).size !== setups.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["setups"],
        message: "Multiple setups must have distinct names and IDs.",
      });
    }
    const rules = [
      ...setups.flatMap(({ rules }) => rules),
      ...filters,
      ...management,
    ];
    if (new Set(rules.map(({ id }) => id)).size !== rules.length) {
      context.addIssue({
        code: "custom",
        message: "Rule IDs must be distinct within a playbook.",
      });
    }
  });

const limit = z.number().positive().max(1_000_000_000).optional();
const count = z.number().int().positive().max(10_000).optional();
const limitsSchema = z.object({
  maxInitialRisk: limit,
  maxTradesWeek: count,
  maxTradesMonth: count,
  maxWeekLossR: limit,
  maxOpen: count,
  maxHoldHours: limit,
  minPlannedRR: limit,
});

export const playbookMetadataSchema = z.object({
  title: shortText,
  status: z.enum(PLAYBOOK_STATUSES),
  overview: description,
  notes: description,
  reviewEvery: count,
  limits: limitsSchema,
});

const versionSchema = playbookRulesSchema.safeExtend({
  number: z.number().int().positive(),
  at: z.iso.datetime(),
});
export const playbookReferenceSchema = z.object({ id: z.uuid() });
const reviewSchema = planNoteSchema.safeExtend({
  id: z.uuid(),
  at: z.iso.datetime(),
});
const identity = { id: z.uuid(), revision: z.number().int().positive() };
const playbookRecord = playbookMetadataSchema.extend({
  ...identity,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  reviews: z.array(reviewSchema),
});
const legacyVersions = z
  .array(versionSchema)
  .nonempty()
  .refine((versions) =>
    versions.every(({ number }, index) => number === index + 1),
  );
const editablePlaybook = playbookRecord.extend({
  rules: playbookRulesSchema,
  // Preserve old rule labels and attachments for trades recorded before migration.
  legacyVersions: legacyVersions.optional(),
});
export const playbookSchema = z.union([
  editablePlaybook,
  playbookRecord
    .extend({ versions: legacyVersions })
    .transform(({ versions, ...book }): z.output<typeof editablePlaybook> => {
      const { setups, filters, management, strategy, screenshotIds } =
        versions[versions.length - 1];
      return {
        ...book,
        rules: { setups, filters, management, strategy, screenshotIds },
        legacyVersions: versions,
      };
    }),
]);

const definition = {
  metadata: playbookMetadataSchema,
  rules: playbookRulesSchema,
};
export const playbookCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(PLAYBOOK_ACTION.CREATE),
    id: z.uuid(),
    ...definition,
  }),
  z.object({
    action: z.literal(PLAYBOOK_ACTION.EDIT),
    ...identity,
    ...definition,
  }),
  z.object({
    action: z.enum([PLAYBOOK_ACTION.ADD_REVIEW, PLAYBOOK_ACTION.EDIT_REVIEW]),
    ...identity,
    reviewId: z.uuid(),
    note: planNoteSchema,
  }),
]);

const ruleAnswerSchema = z
  .object({
    ruleId: z.uuid(),
    met: z.boolean(),
    reason: z.string().trim().min(1).max(MAX_RULE_REASON).optional(),
  })
  .refine(({ met, reason }) => !met || reason === undefined);

export const checklistSchema = z
  .array(ruleAnswerSchema)
  .min(1)
  .max(2 * MAX_PLAYBOOK_RULES);
export const recordedRulesSchema = z.object({
  setupName: z.string().max(120).optional(),
  entry: z.array(ruleSchema).max(2 * MAX_PLAYBOOK_RULES),
  management: ruleList,
});
export const playbookLinkSchema = playbookReferenceSchema.extend({
  setupId: z.uuid().optional(),
  entry: checklistSchema.optional(),
  management: checklistSchema.optional(),
  recordedRules: recordedRulesSchema.optional(),
  version: versionSchema.shape.number.optional(),
});

export function entryRules(rules: PlaybookRules, setupId: string | undefined) {
  const setup = rules.setups.find(({ id }) => id === setupId);
  return [...(setup?.rules ?? []), ...rules.filters];
}

export function rulesForSetup(rules: PlaybookRules, setupId?: string) {
  return {
    setupName: rules.setups.find(({ id }) => id === setupId)?.name,
    entry: setupId ? entryRules(rules, setupId) : [],
    management: rules.management,
  };
}

export function tradePlaybookRules(
  book: Playbook | undefined,
  link: PlaybookLink,
) {
  if (link.recordedRules) return link.recordedRules;
  if (!book) return undefined;
  const historical = book.legacyVersions?.find(
    ({ number }) => number === link.version,
  );
  return rulesForSetup(historical ?? book.rules, link.setupId);
}

export function playbookRulesScreenshotIds(rules: PlaybookRules) {
  return [
    ...(rules.screenshotIds ?? []),
    ...rules.setups.flatMap((setup) => setup.screenshotIds ?? []),
    ...strategyScreenshotIds(rules.strategy),
  ];
}

export function playbookScreenshotIds(book?: Playbook) {
  return new Set([
    ...(book?.reviews.flatMap((review) => review.screenshotIds) ?? []),
    ...(book ? playbookRulesScreenshotIds(book.rules) : []),
    ...(book?.legacyVersions?.flatMap(playbookRulesScreenshotIds) ?? []),
  ]);
}
