"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  signUpSchema,
  type SignUpInput,
} from "@/features/auth/schemas/auth-schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PASSWORD_CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}",
};

function generateStrongPassword(length = 16): string {
  const allChars =
    PASSWORD_CHARSETS.lower +
    PASSWORD_CHARSETS.upper +
    PASSWORD_CHARSETS.digits +
    PASSWORD_CHARSETS.symbols;

  const required = [
    PASSWORD_CHARSETS.lower,
    PASSWORD_CHARSETS.upper,
    PASSWORD_CHARSETS.digits,
    PASSWORD_CHARSETS.symbols,
  ];

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  const chars = Array.from({ length }, (_, index) => {
    const pool = index < required.length ? required[index] : allChars;
    return pool[randomValues[index] % pool.length];
  });

  // Fisher-Yates shuffle so required character classes aren't fixed at the start
  const shuffleValues = new Uint32Array(length);
  crypto.getRandomValues(shuffleValues);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSocialPending, setIsSocialPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isPending = isSubmitting || isSocialPending;

  function handleGeneratePassword() {
    const generated = generateStrongPassword(16);
    setValue("password", generated, { shouldValidate: true, shouldDirty: true });
    setValue("confirmPassword", generated, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setShowPassword(true);
    setShowConfirmPassword(true);
  }

  async function onSubmit(values: SignUpInput) {
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/onboarding",
    });

    if (signUpError) {
      setError(signUpError.message ?? "Failed to sign up.");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    setError(null);
    setIsSocialPending(true);

    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: "/onboarding",
    });

    if (socialError) {
      setError(socialError.message ?? `Failed to sign in with ${provider}.`);
      setIsSocialPending(false);
    }
  }

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Sign up</CardFrameTitle>
        <CardFrameDescription>Create a new account.</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              disabled={isPending}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              disabled={isPending}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:pointer-events-none"
              >
                <RefreshCw className="size-3" />
                Generate
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                aria-invalid={Boolean(errors.password)}
                disabled={isPending}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isPending}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                aria-invalid={Boolean(errors.confirmPassword)}
                disabled={isPending}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                disabled={isPending}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-border" />
          <span className="mx-3 shrink-0 text-xs text-muted-foreground">
            or continue with
          </span>
          <div className="grow border-t border-border" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => handleSocialSignIn("google")}
          >
            <Image
              src="https://thesvg.org/icons/google/default.svg"
              alt=""
              width={16}
              height={16}
              className="size-4"
              unoptimized
            />
            Gmail
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => handleSocialSignIn("github")}
          >
            <Image
              src="https://thesvg.org/icons/github/default.svg"
              alt=""
              width={16}
              height={16}
              className="size-4 dark:invert"
              unoptimized
            />
            GitHub
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
        </CardPanel>
      </Card>
    </CardFrame>
  );
}
