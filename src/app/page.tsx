import type { Metadata } from "next";
import {
  buildWebApplicationJsonLd,
  buildWebsiteJsonLd,
  JsonLd,
} from "@/components/seo/json-ld";
import { HomePage } from "@/features/home";
import { createMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: "/",
  markdownUrl: "/llms.txt",
  keywords: ["skills page", "skills repository", "technical learning"],
});

export default function Home() {
  return (
    <>
      <JsonLd data={[buildWebsiteJsonLd(), buildWebApplicationJsonLd()]} />
      <HomePage />
    </>
  );
}
