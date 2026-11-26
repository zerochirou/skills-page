"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  SquareMinusIcon,
  SquarePlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { TreeSubSkill, TreeUnit } from "./repository-tree";

interface SkillTableOfContentsProps {
  subSkills: TreeSubSkill[];
  units: TreeUnit[];
  onSelectSubSkill?: (subSkillId: number) => void;
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
  onSelectSubSkill,
  onSelectUnit,
  onPrefetchUnit,
  onReorder,
}: SkillTableOfContentsProps) {
  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({});

  const allCollapsed =
    subSkills.length > 0 && subSkills.every((s) => collapsedMap[s.id]);

  function toggleAll() {
    if (allCollapsed) {
      setCollapsedMap({});
      return;
    }
    const next: Record<number, boolean> = {};
    for (const sub of subSkills) {
      next[sub.id] = true;
    }
    setCollapsedMap(next);
  }

  function toggleSubSkill(subSkillId: number) {
    setCollapsedMap((prev) => ({
      ...prev,
      [subSkillId]: !prev[subSkillId],
    }));
  }

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
      className="flex flex-col pt-2"
    >
      <Separator className="mb-8" />

      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl font-normal tracking-[-0.02em] text-primary sm:text-[34px]">
          Table of Contents
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {units.length} {units.length === 1 ? "unit" : "units"} ·{" "}
            {subSkills.length}{" "}
            {subSkills.length === 1 ? "sub-skill" : "sub-skills"}
          </span>
          {subSkills.length > 0 ? (
            <>
              <span aria-hidden="true" className="h-3.5 w-px bg-border" />
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm text-body underline underline-offset-4 transition-colors hover:text-primary"
              >
                {allCollapsed ? "Expand all" : "Collapse all"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {subSkills.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No sub-skills yet. Add a folder in the sidebar to organize units.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {subSkills.map((sub, subIndex) => {
            const subUnits = units.filter((u) => u.subSkillId === sub.id);
            const isCollapsed = Boolean(collapsedMap[sub.id]);

            return (
              <div key={sub.id} className="flex flex-col gap-2">
                <div className="group/sub flex items-center justify-between gap-3 py-1">
                  <div className="flex min-w-0 items-baseline gap-4">
                    <span className="w-9 shrink-0 text-sm text-muted-foreground tabular-nums">
                      {subIndex + 1}.
                    </span>
                    {onSelectSubSkill ? (
                      <button
                        type="button"
                        onClick={() => onSelectSubSkill(sub.id)}
                        className="truncate text-left text-sm font-semibold text-primary transition-colors hover:underline"
                      >
                        {sub.title}
                      </button>
                    ) : (
                      <span className="truncate text-sm font-semibold text-primary">
                        {sub.title}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={subIndex === 0}
                      aria-label={`Move ${sub.title} up`}
                      className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground group-hover/sub:opacity-100 focus-visible:opacity-100"
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
                      className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground group-hover/sub:opacity-100 focus-visible:opacity-100"
                      onClick={() => void moveSubSkill(subIndex, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={
                        isCollapsed
                          ? `Expand ${sub.title}`
                          : `Collapse ${sub.title}`
                      }
                      aria-expanded={!isCollapsed}
                      className="text-body hover:text-primary"
                      onClick={() => toggleSubSkill(sub.id)}
                    >
                      {isCollapsed ? <SquarePlusIcon /> : <SquareMinusIcon />}
                    </Button>
                  </div>
                </div>

                {!isCollapsed ? (
                  subUnits.length === 0 ? (
                    <p className="pl-13 text-xs text-muted-foreground">
                      No units in this sub-skill.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {subUnits.map((unit, unitIndex) => (
                        <div
                          key={unit.id}
                          className="group/unit -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                        >
                          <button
                            type="button"
                            onMouseEnter={() => onPrefetchUnit(unit.id)}
                            onFocus={() => onPrefetchUnit(unit.id)}
                            onClick={() => onSelectUnit(unit.id)}
                            className="flex min-w-0 flex-1 items-baseline gap-4 text-left"
                          >
                            <span className="w-9 shrink-0 text-sm text-muted-foreground tabular-nums">
                              {subIndex + 1}.{unitIndex + 1}
                            </span>
                            <span className="truncate text-sm text-body transition-colors group-hover/unit:text-primary">
                              {unit.title}
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center gap-1">
                            <span className="mr-1 font-mono text-xs text-muted-foreground tabular-nums">
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
                              className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground group-hover/unit:opacity-100 focus-visible:opacity-100"
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
                              className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground group-hover/unit:opacity-100 focus-visible:opacity-100"
                              onClick={() =>
                                void moveUnit(sub.id, unitIndex, 1)
                              }
                            >
                              <ArrowDownIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
