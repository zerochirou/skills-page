export type WikiLinkTargetType = "skill" | "sub_skill" | "unit";

export interface WikiLinkItem {
  targetType: WikiLinkTargetType;
  targetId: number;
  label: string;
  subtitle?: string;
}
