"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  FileTextIcon,
  FolderIcon,
  ListTreeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreeSubSkill, TreeUnit } from "./repository-tree";

interface SkillTableOfContentsProps {
  subSkills: TreeSubSkill[];
  units: TreeUnit[];
  onSelectUnit: (unitId: number) => void;
  onPrefetchUnit: (unitId: number) => void;
  onReorder: (
    nextSubSkillIds: number[],
    nextUnits: { id: number; subSkillId: number; sortOrder: number }[]
  ) => Promise<void>;
}

function buildUnitPayload(
  subSkills: TreeSubSkill[],
  units: TreeUnit[]
): { id: number; subSkillId: number; sortOrder: number }[] {
  const payload: { id: number; subSkillId: number; sortOrder: number }[] = [];
  for (const sub of subSkills) {
    const group = units.filter((u) => u.subSkillId === sub.id);
    group.forEach((u, idx) => {
      payload.push({ id: u.id, subSkillId: sub.id, sortOrder: idx });
    });
  }
  return payload;
}

export function SkillTableOfContents({
  subSkills,
  units,
  onSelectUnit,
  onPrefetchUnit,
  onReorder,
}: SkillTableOfContentsProps) {
  async function moveSubSkill(index: number, delta: -1 | 1) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= subSkills.length) return;
    const ids = subSkills.map((s) => s.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(nextIndex, 0, moved);
    await onReorder(ids, []);
  }

  async function moveUnit(
    subSkillId: number,
    unitIndex: number,
    delta: -1 | 1
  ) {
    const group = units.filter((u) => u.subSkillId === subSkillId);
    const nextIndex = unitIndex + delta;
    if (nextIndex < 0 || nextIndex >= group.length) return;

    const reorderedGroup = [...group];
    const [moved] = reorderedGroup.splice(unitIndex, 1);
    reorderedGroup.splice(nextIndex, 0, moved);

    const others = units.filter((u) => u.subSkillId !== subSkillId);
    const combined = [...others, ...reorderedGroup];
    await onReorder(
      subSkills.map((s) => s.id),
      buildUnitPayload(subSkills, combined)
    );
  }

  return (
    <section
      aria-label="Table of contents"
      className="flex flex-col overflow-hidden rounded-[12px] border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ListTreeIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Table of Contents
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {subSkills.length} {subSkills.length === 1 ? "sub-skill" : "sub-skills"} ·{" "}
          {units.length} {units.length === 1 ? "unit" : "units"}
        </span>
      </div>

      {subSkills.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No sub-skills yet. Add a folder in the sidebar to organize units.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {subSkills.map((sub, subIndex) => {
            const subUnits = units.filter((u) => u.subSkillId === sub.id);

            return (
              <div key={sub.id} className="flex flex-col gap-2 px-5 py-4">
                <div className="group/sub flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {String(subIndex + 1).padStart(2, "0")}
                    </span>
                    <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {sub.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="mr-1 font-mono text-xs text-muted-foreground">
                      {subUnits.length} {subUnits.length === 1 ? "unit" : "units"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={subIndex === 0}
                      aria-label={`Move ${sub.title} up`}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => void moveSubSkill(subIndex, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={subIndex === subSkills.length - 1}
                      aria-label={`Move ${sub.title} down`}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => void moveSubSkill(subIndex, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                  </div>
                </div>

                {subUnits.length === 0 ? (
                  <p className="pl-7.5 text-xs text-muted-foreground">
                    No units in this sub-skill.
                  </p>
                ) : (
                  <div className="ml-2.5 flex flex-col gap-0.5 border-l border-border pl-5">
                    {subUnits.map((unit, unitIndex) => (
                      <div
                        key={unit.id}
                        className="group/unit flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        <button
                          type="button"
                          onMouseEnter={() => onPrefetchUnit(unit.id)}
                          onFocus={() => onPrefetchUnit(unit.id)}
                          onClick={() => onSelectUnit(unit.id)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {subIndex + 1}.{unitIndex + 1}
                          </span>
                          <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/unit:text-brand" />
                          <span className="truncate text-sm text-foreground/90 transition-colors group-hover/unit:text-foreground">
                            {unit.title}
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <span className="mr-1 font-mono text-xs text-muted-foreground">
                            {unit.estimatedMinutes
                              ? `${unit.estimatedMinutes}m`
                              : unit.unitType}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={unitIndex === 0}
                            aria-label={`Move ${unit.title} up`}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              void moveUnit(sub.id, unitIndex, -1)
                            }
                          >
                            <ArrowUpIcon />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={unitIndex === subUnits.length - 1}
                            aria-label={`Move ${unit.title} down`}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => void moveUnit(sub.id, unitIndex, 1)}
                          >
                            <ArrowDownIcon />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
