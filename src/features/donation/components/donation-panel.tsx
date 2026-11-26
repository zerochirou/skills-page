"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Share2Icon, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GOPAY_NUMBER = "+61 851 7341 2967";
const PRESET_IDR_AMOUNTS = [15000, 25000, 50000, 100000] as const;

function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function DonationPanel() {
  const [selectedAmount, setSelectedAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);

  const parsedCustom = Number(customAmount.replace(/[^0-9]/g, ""));
  const effectiveAmount =
    customAmount.trim() && Number.isFinite(parsedCustom) && parsedCustom > 0
      ? parsedCustom
      : selectedAmount;

  const formattedAmount = formatIdr(effectiveAmount);

  async function handleCopyGopay() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(GOPAY_NUMBER);
      setCopiedNumber(true);
      window.setTimeout(() => setCopiedNumber(false), 1800);
    } catch {
      // Ignore clipboard permission errors cleanly.
    }
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
      aria-label="GoPay donation options"
      className="rounded-[12px] border border-hairline bg-surface-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Donate via GoPay
            </span>
            <h2 className="mt-1 font-serif text-2xl font-normal tracking-tight text-primary">
              Transfer directly to GoPay
            </h2>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1 font-mono text-xs text-primary">
            <SmartphoneIcon className="size-3.5" />
            <span>GoPay IDR</span>
          </span>
        </div>

        {/* GoPay number highlight card */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-[10px] border border-hairline bg-canvas p-5 sm:flex-row sm:items-center">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              GoPay Number
            </span>
            <p className="mt-1 font-mono text-2xl font-medium tracking-tight text-primary sm:text-3xl">
              {GOPAY_NUMBER}
            </p>
            <p className="mt-1 text-xs text-body">
              Open GoPay or Gojek, choose Transfer to Phone Number, and send{" "}
              <span className="font-mono font-medium text-ink">
                {formattedAmount}
              </span>
              .
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleCopyGopay()}
            className="min-h-[44px] w-full shrink-0 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-active sm:w-auto"
          >
            {copiedNumber ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            <span>{copiedNumber ? "Number Copied" : "Copy GoPay Number"}</span>
          </Button>
        </div>

        {/* Suggested amount selector */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Suggested Amounts
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESET_IDR_AMOUNTS.map((amount) => {
              const isSelected =
                !customAmount.trim() && selectedAmount === amount;
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
                    {formatIdr(amount)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px]",
                      isSelected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    GoPay transfer
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amount + Share */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label
              htmlFor="custom-donation-amount"
              className="text-xs font-medium whitespace-nowrap text-body"
            >
              Custom amount (IDR)
            </label>
            <Input
              id="custom-donation-amount"
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 75000"
              className="min-h-[44px] w-full font-mono text-sm sm:w-44"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopyDonationLink()}
            className="min-h-[44px] shrink-0 rounded-full px-5"
          >
            {copiedPageUrl ? (
              <CheckIcon className="size-4" />
            ) : (
              <Share2Icon className="size-4" />
            )}
            <span>{copiedPageUrl ? "Link Copied" : "Share Donation Page"}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
