"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSWRConfig } from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/features/editor";
import { ApiError, fetcher, swrKeys } from "@/lib/swr";
import { createSkillSchema } from "../schemas/create-skill.schema";
import { slugify } from "../utils/slugify";
import { BannerPickerPopover } from "./banner-picker-popover";

const STEPS = [
  {
    id: 1 as const,
    title: "Repository Details",
    description: "Configure the core attributes for your skill repository.",
  },
  {
    id: 2 as const,
    title: "Overview (README.md)",
    description: "Write the main Markdown overview for this skill.",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
  }),
};

export function CreateSkillForm() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState(1);

  const [title, setTitle] = useState("");
  const slug = slugify(title);
  const [summary, setSummary] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [overview, setOverview] = useState(
    "## Overview\n\nDescribe what this skill repository covers.\n"
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function validateStepOne(): boolean {
    const parsed = createSkillSchema
      .pick({
        title: true,
        slug: true,
        summary: true,
        visibility: true,
        status: true,
      })
      .safeParse({
        title,
        slug,
        summary: summary.trim() || undefined,
        visibility,
        status,
      });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setErrorMessage("Please complete the required repository details.");
      return false;
    }

    setFieldErrors({});
    setErrorMessage(null);
    return true;
  }

  function goToStep(nextStep: 1 | 2) {
    if (nextStep === step) return;
    if (nextStep === 2 && !validateStepOne()) return;
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      goToStep(2);
      return;
    }

    setErrorMessage(null);
    setFieldErrors({});

    const parsed = createSkillSchema.safeParse({
      title,
      slug,
      summary: summary.trim() || undefined,
      bannerImage: bannerImage.trim() || undefined,
      visibility,
      status,
      overview,
      subSkills: [],
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setErrorMessage("Please review your repository details.");
      return;
    }

    setSubmitting(true);
    try {
      await fetcher("/api/skills", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      await mutate(swrKeys.skills.list());
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to create skill. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const currentMeta = STEPS[step - 1];

  return (
    <div className="mx-auto my-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-normal tracking-tight">
            Create New Skill
          </h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of {STEPS.length} - {currentMeta.title}
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {step}/{STEPS.length}
        </span>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to continue</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <FieldGroup>
                <Field
                  data-invalid={Boolean(fieldErrors.title || fieldErrors.slug)}
                >
                  <FieldLabel htmlFor="skill-title">Title</FieldLabel>
                  <Input
                    id="skill-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Next.js & Cloudflare D1"
                    aria-invalid={Boolean(
                      fieldErrors.title || fieldErrors.slug,
                    )}
                  />
                  <FieldDescription>
                    The URL will be displayed like this:{" "}
                    <span className="font-mono text-brand">
                      /{slug || "skill-slug"}
                    </span>
                  </FieldDescription>
                  {fieldErrors.title?.[0] || fieldErrors.slug?.[0] ? (
                    <FieldError>
                      {fieldErrors.title?.[0] ?? fieldErrors.slug?.[0]}
                    </FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="skill-summary">
                    Summary (Markdown)
                  </FieldLabel>
                  <Textarea
                    id="skill-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short Markdown summary shown on explorer and dashboard cards..."
                    rows={3}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Visibility</FieldLabel>
                    <Select
                      value={visibility}
                      onValueChange={(val) => {
                        if (val === "public" || val === "private") {
                          setVisibility(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={status}
                      onValueChange={(val) => {
                        if (
                          val === "draft" ||
                          val === "published" ||
                          val === "archived"
                        ) {
                          setStatus(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => goToStep(2)}>
                  Continue to Overview
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    Write the Markdown overview for{" "}
                    <span className="font-mono text-foreground">
                      /{slug || "new-skill"}
                    </span>
                    . Sub-skills and units can be added afterward in the editor.
                  </p>
                </div>
                <BannerPickerPopover
                  currentBanner={bannerImage || null}
                  onSelect={async (url) => setBannerImage(url ?? "")}
                />
              </div>

              {bannerImage ? (
                <div className="relative h-40 w-full overflow-hidden rounded-[12px] border border-border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerImage}
                    alt="Overview banner preview"
                    className="size-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent via-card/60 to-card" />
                </div>
              ) : null}

              {fieldErrors.bannerImage?.[0] ? (
                <FieldError>{fieldErrors.bannerImage[0]}</FieldError>
              ) : null}

              <MarkdownEditor value={overview} onChange={setOverview} />

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(1)}
                >
                  <ArrowLeftIcon data-icon="inline-start" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary-active"
                >
                  {submitting ? "Creating..." : "Create Skill"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
