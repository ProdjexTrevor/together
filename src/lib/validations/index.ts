import { z } from "zod";

export const itemTypeSchema = z.enum(["task", "decision", "goal", "financial_target"]);
export const prioritySchema = z.enum(["low", "normal", "high"]);
export const ownerSchema = z.enum(["self", "partner", "both"]);

export const createItemSchema = z
  .object({
    type: itemTypeSchema,
    title: z.string().min(1, "Title is required").max(120),
    description: z.string().max(500).optional().or(z.literal("")),
    owner: ownerSchema.default("both"),
    priority: prioritySchema.default("normal"),
    start_date: z.string().optional().or(z.literal("")),
    due_date: z.string().optional().or(z.literal("")),
    checklist: z.array(z.string().min(1)).optional(),
    options: z
      .array(
        z.object({
          title: z.string().min(1),
          pros: z.array(z.string()).default([]),
          cons: z.array(z.string()).default([]),
        })
      )
      .optional(),
    tracking_type: z.enum(["numeric", "percentage", "milestone", "habit"]).optional(),
    target_value: z.coerce.number().optional(),
    weekly_frequency: z.coerce.number().int().min(1).max(7).optional(),
    target_amount: z.coerce.number().positive().optional(),
    current_amount: z.coerce.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "financial_target" && (data.target_amount == null || data.target_amount <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["target_amount"],
        message: "Target amount is required",
      });
    }
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
  parent_id: z.string().optional().nullable(),
});

export const contributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().max(200).optional().or(z.literal("")),
  contributed_at: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  mode: z.enum(["password", "magic"]).default("password"),
});

export const onboardingSchema = z.object({
  full_name: z.string().min(1, "Your name is required"),
  household_name: z.string().min(1, "Household name is required"),
  partner_email: z.string().email("Enter a valid partner email").optional().or(z.literal("")),
});
