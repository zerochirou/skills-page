"use client";

import {
  IconChevronRight,
  IconCircleCheckFilled,
  IconCircleDashed,
} from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  checkUsernameAvailability,
  completeOnboarding,
  type OnboardingState,
} from "@/features/onboarding/actions";
import { cn } from "@/lib/utils";

type InitialProfile = {
  username: string;
  displayName: string;
  role: string | null;
  bio: string | null;
};

type StepId = "username" | "displayName" | "details";

const STEP_META: { id: StepId; title: string; description: string }[] = [
  {
    id: "username",
    title: "Choose your username",
    description: "Pick a unique handle for your profile.",
  },
  {
    id: "displayName",
    title: "Set your display name",
    description: "This is how your name will appear across the app.",
  },
  {
    id: "details",
    title: "Add role & bio",
    description: "Optional details about what you do.",
  },
];

function CircularProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const strokeDashoffset = 100 - progress;

  return (
    <svg className="-rotate-90" height="14" viewBox="0 0 14 14" width="14">
      <circle
        className="stroke-muted"
        cx="7"
        cy="7"
        fill="none"
        pathLength="100"
        r="6"
        strokeWidth="2"
      />
      <circle
        className="stroke-primary"
        cx="7"
        cy="7"
        fill="none"
        pathLength="100"
        r="6"
        strokeDasharray="100"
        strokeLinecap="round"
        strokeWidth="2"
        style={{ strokeDashoffset }}
      />
    </svg>
  );
}

function StepIndicator({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <IconCircleCheckFilled
        aria-hidden="true"
        className="mt-1 size-4.5 shrink-0 text-primary"
      />
    );
  }
  return (
    <IconCircleDashed
      aria-hidden="true"
      className="mt-1 size-5 shrink-0 stroke-muted-foreground/40"
      strokeWidth={2}
    />
  );
}

const initialState: OnboardingState = {};

export function OnboardingForm({
  defaultDisplayName,
  initialProfile,
}: {
  defaultDisplayName: string;
  initialProfile?: InitialProfile | null;
}) {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState
  );
  const isEditing = Boolean(initialProfile);

  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? defaultDisplayName
  );
  const [role, setRole] = useState(initialProfile?.role ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");

  const [openStepId, setOpenStepId] = useState<StepId | null>("username");
  const [completedSteps, setCompletedSteps] = useState<Record<StepId, boolean>>({
    username: Boolean(initialProfile?.username),
    displayName: Boolean(initialProfile?.displayName),
    details: Boolean(initialProfile?.role || initialProfile?.bio),
  });

  const [usernameStatus, setUsernameStatus] = useState<{
    state: "idle" | "checking" | "available" | "unavailable";
    message?: string;
  }>({ state: "idle" });

  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || (isEditing && trimmed === initialProfile?.username)) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed);
      if (cancelled) return;
      setUsernameStatus(
        result.available
          ? { state: "available", message: "Username is available" }
          : {
              state: "unavailable",
              message: result.reason ?? "Username is already taken.",
            }
      );
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, isEditing, initialProfile?.username]);

  function handleUsernameChange(value: string) {
    setUsername(value);
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus({ state: "idle" });
    } else if (isEditing && trimmed === initialProfile?.username) {
      setUsernameStatus({ state: "available", message: "Current username" });
    } else {
      setUsernameStatus({ state: "checking" });
    }
  }

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const canContinueUsername =
    username.trim().length >= 3 &&
    usernameStatus.state !== "unavailable" &&
    usernameStatus.state !== "checking";
  const canContinueDisplayName = displayName.trim().length > 0;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <CardFrame className="w-full max-w-md">
        <CardFrameHeader>
          <CardFrameTitle>
            {isEditing ? "Edit your profile" : "Complete your profile"}
          </CardFrameTitle>
          <CardFrameAction>
            <div className="flex items-center">
              <CircularProgress
                completed={completedCount}
                total={STEP_META.length}
              />
              <span className="ml-1.5 text-muted-foreground text-sm">
                <span className="font-medium text-foreground">
                  {completedCount}
                </span>{" "}
                / {STEP_META.length}
              </span>
            </div>
          </CardFrameAction>
        </CardFrameHeader>
        <Card>
          <CardPanel className="p-4">
            <form action={formAction}>
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="displayName" value={displayName} />
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="bio" value={bio} />

          {state.error ? (
            <p
              role="alert"
              className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <div className="space-y-0">
            {STEP_META.map((step, index) => {
              const isOpen = openStepId === step.id;
              const isCompleted = completedSteps[step.id];
              const isFirst = index === 0;
              const prevStep = index > 0 ? STEP_META[index - 1] : null;
              const isPrevOpen = prevStep ? openStepId === prevStep.id : false;
              const showBorderTop = !isFirst && !isOpen && !isPrevOpen;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "group",
                    isOpen && "rounded-lg",
                    showBorderTop && "border-t border-border",
                  )}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenStepId(isOpen ? null : step.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenStepId(isOpen ? null : step.id);
                      }
                    }}
                    className={cn(
                      "block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isOpen && "rounded-lg",
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex items-center justify-between rounded-lg py-3 pr-2 pl-2 transition-colors",
                        !isOpen && "hover:bg-muted/50",
                        isOpen && "border border-border bg-muted/40",
                      )}
                    >
                      <div className="flex w-full items-start gap-3">
                        <StepIndicator completed={isCompleted} />
                        <div className="min-w-0 flex-1 pr-2">
                          <h2
                            className={cn(
                              "font-medium text-sm leading-none",
                              isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {step.title}
                          </h2>
                          <Collapsible open={isOpen}>
                            <CollapsibleContent>
                              <p className="mt-1.5 text-pretty text-muted-foreground text-xs">
                                {step.description}
                              </p>
                              <div
                                className="mt-3 space-y-3 px-1 pb-1"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                {step.id === "username" ? (
                                  <>
                                    <div className="relative flex items-center">
                                      <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground">
                                        @
                                      </span>
                                      <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                          handleUsernameChange(e.target.value)
                                        }
                                        placeholder="your_username"
                                        autoComplete="username"
                                        className="bg-card pl-7"
                                        disabled={isPending}
                                      />
                                    </div>
                                    {usernameStatus.state === "checking" ? (
                                      <p className="text-xs text-muted-foreground">
                                        Checking availability...
                                      </p>
                                    ) : usernameStatus.state === "available" ? (
                                      <p className="text-xs text-[#1f8a65]">
                                        {usernameStatus.message}
                                      </p>
                                    ) : usernameStatus.state ===
                                      "unavailable" ? (
                                      <p className="text-xs text-destructive">
                                        {usernameStatus.message}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        3-30 lowercase letters, numbers, _ or -.
                                      </p>
                                    )}
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!canContinueUsername}
                                      onClick={() => {
                                        setCompletedSteps((prev) => ({
                                          ...prev,
                                          username: true,
                                        }));
                                        setOpenStepId("displayName");
                                      }}
                                    >
                                      Continue
                                    </Button>
                                  </>
                                ) : null}

                                {step.id === "displayName" ? (
                                  <>
                                    <Input
                                      id="displayName"
                                      type="text"
                                      value={displayName}
                                      onChange={(e) =>
                                        setDisplayName(e.target.value)
                                      }
                                      placeholder="Your name"
                                      autoComplete="name"
                                      className="bg-card"
                                      disabled={isPending}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!canContinueDisplayName}
                                      onClick={() => {
                                        setCompletedSteps((prev) => ({
                                          ...prev,
                                          displayName: true,
                                        }));
                                        setOpenStepId("details");
                                      }}
                                    >
                                      Continue
                                    </Button>
                                  </>
                                ) : null}

                                {step.id === "details" ? (
                                  <>
                                    <Input
                                      id="role"
                                      type="text"
                                      value={role}
                                      onChange={(e) => setRole(e.target.value)}
                                      placeholder="Role (e.g. Frontend Engineer)"
                                      className="bg-card"
                                      disabled={isPending}
                                    />
                                    <textarea
                                      id="bio"
                                      rows={3}
                                      value={bio}
                                      onChange={(e) => setBio(e.target.value)}
                                      placeholder="A short note about what you're building..."
                                      disabled={isPending}
                                      className="flex w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <Button
                                      type="submit"
                                      size="sm"
                                      className="w-full"
                                      disabled={
                                        isPending ||
                                        !canContinueUsername ||
                                        !canContinueDisplayName
                                      }
                                    >
                                      {isPending
                                        ? "Saving..."
                                        : isEditing
                                          ? "Save changes"
                                          : "Finish & go to dashboard"}
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                      {!isOpen && (
                        <IconChevronRight
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </form>
          </CardPanel>
        </Card>
      </CardFrame>
    </div>
  );
}
