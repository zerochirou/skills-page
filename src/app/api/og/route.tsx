import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import {
  getSiteHost,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo";

const KIND_LABELS: Record<string, string> = {
  default: "REPOSITORY",
  skill: "SKILL",
  unit: "UNIT",
  profile: "CREATOR",
};

function truncate(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = truncate(
    searchParams.get("title") || `${SITE_NAME} / ${SITE_TAGLINE}`,
    96
  );
  const subtitle = truncate(
    searchParams.get("subtitle") || SITE_DESCRIPTION,
    160
  );
  const eyebrow = truncate(searchParams.get("eyebrow") || SITE_NAME, 48);
  const kindKey = searchParams.get("kind") || "default";
  const kindLabel = KIND_LABELS[kindKey] ?? KIND_LABELS.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f7f4",
          color: "#26251e",
          padding: "48px 56px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                backgroundColor: "#312f30",
              }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#26251e",
              }}
            >
              {SITE_NAME}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 14px",
              borderRadius: "9999px",
              border: "1px solid #e6e5e0",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "#6b695f",
            }}
          >
            {kindLabel}
          </div>
        </div>

        {/* Main editorial card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            border: "1px solid #e6e5e0",
            borderRadius: "16px",
            padding: "44px 48px",
            gap: "18px",
            flex: 1,
            marginTop: "28px",
            marginBottom: "28px",
          }}
        >
          {eyebrow && eyebrow !== SITE_NAME ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "18px",
                fontWeight: 500,
                color: "#312f30",
                letterSpacing: "-0.01em",
              }}
            >
              <span>{eyebrow}</span>
            </div>
          ) : null}

          <div
            style={{
              fontSize: title.length > 52 ? "44px" : "54px",
              fontWeight: 400,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#26251e",
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                fontSize: "22px",
                fontWeight: 400,
                lineHeight: 1.45,
                color: "#6b695f",
                maxWidth: "960px",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: "16px",
            color: "#6b695f",
          }}
        >
          <span>{getSiteHost()}</span>
          <span>Structured technical skills &amp; modular units</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
