// Shared Zod schemas — client forms reuse these, but the SERVER is the
// source of truth: every mutation re-validates with the same schemas.
import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(320)
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128);

const nameField = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(100);

const isoDate = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date.`)
    .refine((s) => {
      const d = new Date(`${s}T00:00:00.000Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    }, `${label} must be a valid date.`);

export const applicationFormBase = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: emailSchema,
  nationality: z.string().trim().min(1, "Nationality is required.").max(100),
  university: z.string().trim().min(1, "University is required.").max(200),
  course: z.string().trim().min(1, "Course or program is required.").max(200),
  graduationYear: z
    .coerce
    .number()
    .int()
    .min(1950, "Graduation year looks invalid.")
    .max(2100, "Graduation year looks invalid."),
  preferredStart: isoDate("Preferred start date"),
  preferredEnd: isoDate("Preferred end date"),
  additionalInformation: z.string().trim().max(5000).optional().default(""),
  consentPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Privacy consent is required." }),
  }),
  consentTerms: z.literal(true, {
    errorMap: () => ({ message: "Terms consent is required." }),
  }),
});

function checkDateRange<T extends { preferredStart: string; preferredEnd: string }>(
  v: T,
  ctx: z.RefinementCtx,
): void {
  if (v.preferredStart > v.preferredEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preferred end date must be on or after the start date.",
      path: ["preferredEnd"],
    });
  }
}

export const applicationFormSchema = applicationFormBase.superRefine(checkDateRange);

/** Post-submit edit subset: consent already captured at submit time. */
export const applicationEditSchema = applicationFormBase
  .omit({ consentPrivacy: true, consentTerms: true })
  .superRefine(checkDateRange);

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const quotationInputSchema = z.object({
  // Major units as typed by the admin; converted to integer minor units
  // server-side (never floats). SGD only.
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .regex(/^\d[\d,]*(\.\d{1,2})?$/, "Enter a valid SGD amount, e.g. 1250.50."),
  notesStudent: z
    .string()
    .trim()
    .min(1, "Student-facing quotation terms are required.")
    .max(5000),
  notesInternal: z.string().trim().max(5000).optional().default(""),
});

export const internshipInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(200),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe lowercase."),
    city: z.string().trim().min(1, "City is required.").max(120),
    countryCode: z
      .string()
      .trim()
      .length(2, "Country must be a 2-letter code.")
      .toUpperCase(),
    categoryId: z.string().uuid().nullable().optional(),
    startDate: isoDate("Start date"),
    endDate: isoDate("End date"),
    description: z.string().trim().min(1, "Description is required."),
    responsibilities: z.string().trim().min(1, "Responsibilities are required."),
    requirements: z.string().trim().min(1, "Requirements are required."),
    publicationStatus: z.enum(["Draft", "Published", "Unpublished"]),
    featured: z.boolean().default(false),
    applicationDeadline: z.string().trim().optional().nullable(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: emailSchema,
  subject: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(1, "Message is required.").max(5000),
  turnstileToken: z.string().min(1, "Bot verification is required."),
});

export const placementInputSchema = z
  .object({
    studentUserId: z.string().uuid(),
    applicationId: z.string().uuid().nullable().optional(),
    organization: z.string().trim().min(1, "Organization is required.").max(200),
    role: z.string().trim().min(1, "Role is required.").max(200),
    countryCode: z.string().trim().length(2).toUpperCase(),
    startDate: z.string().trim().optional().nullable(),
    endDate: z.string().trim().optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine(
    (v) =>
      !v.startDate ||
      !v.endDate ||
      v.startDate.length === 0 ||
      v.endDate.length === 0 ||
      v.startDate <= v.endDate,
    { message: "End date must be on or after the start date.", path: ["endDate"] },
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
