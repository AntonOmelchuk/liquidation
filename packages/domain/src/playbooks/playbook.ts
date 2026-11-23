import { z } from "zod";
import { planNoteSchema } from "../plans/plan-evidence.ts";
import {
  MAX_PLAYBOOK_RULES,
  MAX_PLAYBOOK_SETUPS,
  MAX_RULE_REASON,
  PLAYBOOK_ACTION,
  PLAYBOOK_STATUSES,
} from "./constants.ts";
import type { Playbook, PlaybookLink, PlaybookRules } from "./types.ts";

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
});

export const playbookRulesSchema = z
  .object({
    setups: z.array(setupSchema).min(1).max(MAX_PLAYBOOK_SETUPS),
    filters: ruleList,
    management: ruleList,
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
        message: "Rule IDs must be distinct within a version.",
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
export const playbookReferenceSchema = z.object({
  id: z.uuid(),
  version: versionSchema.shape.number,
});
const reviewSchema = planNoteSchema.safeExtend({
  id: z.uuid(),
  at: z.iso.datetime(),
});
const identity = { id: z.uuid(), revision: z.number().int().positive() };
export const playbookSchema = playbookMetadataSchema.extend({
  ...identity,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  versions: z
    .array(versionSchema)
    .nonempty()
    .refine((versions) =>
      versions.every(({ number }, index) => number === index + 1),
    ),
  reviews: z.array(reviewSchema),
});

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
export const playbookLinkSchema = z
  .object({
    ...playbookReferenceSchema.partial({ version: true }).shape,
    setupId: z.uuid().optional(),
    entry: checklistSchema.optional(),
    management: checklistSchema.optional(),
  })
  .refine(
    ({ version, setupId, entry, management }) =>
      version !== undefined || !(setupId || entry || management),
  );

export function currentVersion(playbook: Playbook) {
  return playbook.versions[playbook.versions.length - 1];
}

export function linkedVersion(playbook: Playbook, link: PlaybookLink) {
  return playbook.versions.find(({ number }) => number === link.version);
}

export function entryRules(
  version: PlaybookRules,
  setupId: string | undefined,
) {
  const setup = version.setups.find(({ id }) => id === setupId);
  return [...(setup?.rules ?? []), ...version.filters];
}
