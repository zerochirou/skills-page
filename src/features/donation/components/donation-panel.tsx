"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  HeartHandshakeIcon,
  MailIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Frequency = "one-time" | "monthly";
type Currency = "USD" | "IDR";

interface ExternalChannel {
  id: string;
  label: string;
  description: string;
  href: string;
}

const PRESET_AMOUNTS: Record<Currency, readonly number[]> = {
  USD: [5, 15, 30, 50],
  IDR: [25000, 50000, 150000, 300000],
};

function formatAmount(amount: number, currency: Currency): string {
  if (currency === "IDR") {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }
  return `$${amount}`;
}

function getConfiguredChannels(): ExternalChannel[] {
  const candidates: Array<{
    id: string;
    label: string;
    description: string;
    href: string | undefined;
  }> = [
    {
      id: "github-sponsors",
      label: "GitHub Sponsors",
      description: "Recurring or one-time open-source sponsorship.",
      href: process.env.NEXT_PUBLIC_DONATION_GITHUB_SPONSORS_URL,
    },
    {
      id: "saweria",
      label: "Saweria",
      description: "Local IDR support via QRIS, e-wallet, or bank transfer.",
      href: process.env.NEXT_PUBLIC_DONATION_SAWERIA_URL,
    },
    {
      id: "trakteer",
      label: "Trakteer",
      description: "Direct Indonesian creator support.",
      href: process.env.NEXT_PUBLIC_DONATION_TRAKTEER_URL,
    },
    {
      id: "kofi",
      label: "Ko-fi",
      description: "Quick card or PayPal contribution with zero platform fee.",
      href: process.env.NEXT_PUBLIC_DONATION_KOFI_URL,
    },
    {
      id: "paypal",
      label: "PayPal",
      description: "Direct international transfer.",
      href: process.env.NEXT_PUBLIC_DONATION_PAYPAL_URL,
    },
  ];

  return candidates
    .filter((item): item is ExternalChannel => Boolean(item.href?.trim()))
    .map((item) => ({ ...item, href: item.href.trim() }));
}

export function DonationPanel() {
  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedAmount, setSelectedAmount] = useState<number>(15);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);

  const channels = getConfiguredChannels();
  const parsedCustom = Number(customAmount.replace(/[^0-9]/g, ""));
  const effectiveAmount =
    customAmount.trim() && Number.isFinite(parsedCustom) && parsedCustom > 0
      ? parsedCustom
      : selectedAmount;

  const formattedEffective = formatAmount(effectiveAmount, currency);
  const supportEmail =
    process.env.NEXT_PUBLIC_DONATION_EMAIL?.trim() || "hello@skills-page.dev";
  const pledgeSubject = encodeURIComponent(
    `Skills Page ${frequency === "monthly" ? "Monthly" : "One-time"} Support (${formattedEffective})`
  );
  const pledgeBody = encodeURIComponent(
    `Hi Skills Page team,\n\nI would like to make a ${
      frequency === "monthly" ? "monthly" : "one-time"
    } contribution of ${formattedEffective} to support the project.\n\nPlease share the active payment link or details.\n`
  );
  const mailtoHref = `mailto:${supportEmail}?subject=${pledgeSubject}&body=${pledgeBody}`;

  function handleCurrencySwitch(nextCurrency: Currency) {
    setCurrency(nextCurrency);
    setSelectedAmount(PRESET_AMOUNTS[nextCurrency][1]);
    setCustomAmount("");
  }

  async function handleCopyDonationLink() {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/donation`);
      setCopiedPageUrl(true);
      window.setTimeout(() => setCopiedPageUrl(false), 1800);
    } catch {
      // Ignore clipboard permission errors cleanly.
    }
  }

  return (
    <section
      aria-label="Contribution options"
      className="rounded-[12px] border border-hairline bg-surface-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Choose Contribution
            </span>
            <h2 className="mt-1 font-serif text-2xl font-normal tracking-tight text-primary">
              Select an amount and frequency
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Contribution frequency"
              className="inline-flex rounded-full border border-hairline bg-canvas p-1"
            >
              {(
                [
                  { value: "one-time", label: "One-time" },
                  { value: "monthly", label: "Monthly" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFrequency(item.value)}
                  className={cn(
                    "min-h-[36px] rounded-full px-3.5 text-xs font-medium transition-colors",
                    frequency === item.value
                      ? "bg-primary text-primary-foreground"
                      : "text-body hover:text-primary"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div
              role="group"
              aria-label="Currency selector"
              className="inline-flex rounded-full border border-hairline bg-canvas p-1"
            >
              {(["USD", "IDR"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleCurrencySwitch(unit)}
                  className={cn(
                    "min-h-[36px] rounded-full px-3 font-mono text-xs transition-colors",
                    currency === unit
                      ? "bg-primary text-primary-foreground"
                      : "text-body hover:text-primary"
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preset amount pills */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESET_AMOUNTS[currency].map((amount) => {
            const isSelected = !customAmount.trim() && selectedAmount === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={cn(
                  "flex min-h-[52px] flex-col items-start justify-center rounded-[10px] border px-4 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-hairline bg-canvas hover:border-hairline-strong hover:bg-canvas-soft"
                )}
              >
                <span className="font-mono text-sm font-medium">
                  {formatAmount(amount, currency)}
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {frequency === "monthly" ? "per month" : "single gift"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom amount input */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="custom-donation-amount"
            className="text-xs font-medium text-body"
          >
            Or enter a custom {currency} amount
          </label>
          <div className="w-full sm:max-w-[220px]">
            <Input
              id="custom-donation-amount"
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={currency === "IDR" ? "e.g. 100000" : "e.g. 25"}
              className="min-h-[44px] font-mono text-sm"
            />
          </div>
        </div>

        {/* Channels or direct pledge */}
        {channels.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-hairline pt-5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Continue via Supported Platform ({formattedEffective})
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {channels.map((channel) => (
                <a
                  key={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-[10px] border border-hairline bg-canvas px-4 py-3 transition-colors hover:border-primary/40 hover:bg-canvas-soft"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {channel.label}
                    </div>
                    <p className="text-xs text-body">{channel.description}</p>
                  </div>
                  <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-start justify-between gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 text-xs text-body">
            <HeartHandshakeIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="leading-relaxed">
              Ready to contribute{" "}
              <strong className="font-mono font-medium text-ink">
                {formattedEffective}
              </strong>{" "}
              ({frequency === "monthly" ? "monthly" : "one-time"}). Send a direct
              support message or share this page with your team.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopyDonationLink()}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              {copiedPageUrl ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              <span>{copiedPageUrl ? "Link Copied" : "Share Page"}</span>
            </Button>

            <a
              href={mailtoHref}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-initial"
            >
              <MailIcon className="size-4" />
              <span>Support ({formattedEffective})</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
