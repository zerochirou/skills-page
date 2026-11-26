"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Plus,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import BranchedMenu, { type BranchedMenuItem } from "@/components/branched-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TreeSubSkill {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  unitsCount: number;
}

export interface TreeUnit {
  id: number;
  subSkillId: number;
  slug: string;
  title: string;
  unitType: "page" | "reference" | "guide";
  estimatedMinutes: number | null;
}

export interface RepositoryTreeProps {
  embedded?: boolean;
  subSkills: TreeSubSkill[];
  units: TreeUnit[];
  activeTarget:
    | { kind: "overview" }
    | { kind: "subSkill"; subSkillId: number }
    | { kind: "unit"; unitId: number };
  onSelectOverview: () => void;
  onSelectSubSkill?: (subSkillId: number) => void;
  onSelectUnit: (unitId: number) => void;
  onPrefetchUnit: (unitId: number) => void;
  onCreateSubSkill: (title: string) => Promise<void>;
  onRenameSubSkill: (subSkillId: number, title: string) => Promise<void>;
  onDuplicateSubSkill: (subSkillId: number) => Promise<void>;
  onDeleteSubSkill: (subSkillId: number) => Promise<void>;
  onCreateUnit: (subSkillId: number, title: string) => Promise<void>;
  onRenameUnit: (unitId: number, title: string) => Promise<void>;
  onDuplicateUnit: (unitId: number) => Promise<void>;
  onDeleteUnit: (unitId: number) => Promise<void>;
  onReorder?: (
    nextSubSkillIds: number[],
    nextUnits: { id: number; subSkillId: number; sortOrder: number }[]
  ) => Promise<void>;
}

type DragItem =
  | { kind: "sub"; id: number }
  | { kind: "unit"; id: number; subSkillId: number };

export function RepositoryTree({
  embedded = false,
  subSkills,
  units,
  activeTarget,
  onSelectOverview,
  onSelectSubSkill,
  onSelectUnit,
  onPrefetchUnit,
  onCreateSubSkill,
  onRenameSubSkill,
  onDuplicateSubSkill,
  onDeleteSubSkill,
  onCreateUnit,
  onRenameUnit,
  onDuplicateUnit,
  onDeleteUnit,
  onReorder,
}: RepositoryTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Record<number, boolean>>({});
  const [addingSubSkill, setAddingSubSkill] = useState(false);
  const [newSubSkillTitle, setNewSubSkillTitle] = useState("");
  const [addingUnitForSubId, setAddingUnitForSubId] = useState<number | null>(
    null
  );
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  function toggleCollapse(subId: number) {
    setCollapsedIds((prev) => ({ ...prev, [subId]: !prev[subId] }));
  }

  async function submitNewSubSkill(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newSubSkillTitle.trim();
    if (!trimmed) return;
    await onCreateSubSkill(trimmed);
    setNewSubSkillTitle("");
    setAddingSubSkill(false);
  }

  async function submitNewUnit(e: React.FormEvent, subSkillId: number) {
    e.preventDefault();
    const trimmed = newUnitTitle.trim();
    if (!trimmed) return;
    await onCreateUnit(subSkillId, trimmed);
    setNewUnitTitle("");
    setAddingUnitForSubId(null);
  }

  async function submitRename(
    e: React.FormEvent,
    kind: "sub" | "unit",
    id: number
  ) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingKey(null);
      return;
    }
    if (kind === "sub") {
      await onRenameSubSkill(id, trimmed);
    } else {
      await onRenameUnit(id, trimmed);
    }
    setRenamingKey(null);
  }

  async function handleDropOnSub(targetSubId: number) {
    setDropTargetKey(null);
    if (!dragItem || !onReorder) return;

    if (dragItem.kind === "sub" && dragItem.id !== targetSubId) {
      const ids = subSkills.map((s) => s.id);
      const fromIdx = ids.indexOf(dragItem.id);
      const toIdx = ids.indexOf(targetSubId);
      if (fromIdx === -1 || toIdx === -1) return;
      const [moved] = ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, moved);
      setDragItem(null);
      await onReorder(ids, []);
      return;
    }

    if (dragItem.kind === "unit") {
      const cloned = units.map((u) => ({ ...u }));
      const movedIdx = cloned.findIndex((u) => u.id === dragItem.id);
      if (movedIdx === -1) return;
      const [moved] = cloned.splice(movedIdx, 1);
      moved.subSkillId = targetSubId;
      cloned.push(moved);
      setDragItem(null);
      await onReorder(
        subSkills.map((s) => s.id),
        buildUnitOrderPayload(subSkills, cloned)
      );
    }
  }

  async function handleDropOnUnit(targetUnit: TreeUnit) {
    setDropTargetKey(null);
    if (!dragItem || dragItem.kind !== "unit" || dragItem.id === targetUnit.id || !onReorder) {
      return;
    }

    const cloned = units.map((u) => ({ ...u }));
    const fromIdx = cloned.findIndex((u) => u.id === dragItem.id);
    if (fromIdx === -1) return;
    const [moved] = cloned.splice(fromIdx, 1);
    moved.subSkillId = targetUnit.subSkillId;
    const toIdx = cloned.findIndex((u) => u.id === targetUnit.id);
    cloned.splice(toIdx === -1 ? cloned.length : toIdx, 0, moved);
    setDragItem(null);

    await onReorder(
      subSkills.map((s) => s.id),
      buildUnitOrderPayload(subSkills, cloned)
    );
  }

  const hoverClass = embedded
    ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    : "hover:bg-muted/60";
  const activeItemClass = embedded
    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
    : "bg-muted text-foreground font-medium";

  const [unitPrompt, setUnitPrompt] = useState<{
    subSkillId: number;
    title: string;
  } | null>(null);
  const [renamePrompt, setRenamePrompt] = useState<{
    subSkillId: number;
    title: string;
    initialTitle: string;
  } | null>(null);

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        embedded
          ? "px-0.5 py-1"
          : "rounded-[12px] border border-border bg-card p-2"
      )}
    >
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Files
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Add sub-skill folder"
          onClick={() => setAddingSubSkill((prev) => !prev)}
        >
          <Plus />
        </Button>
      </div>

      {addingSubSkill ? (
        <form
          onSubmit={submitNewSubSkill}
          className="flex items-center gap-1.5 px-1.5 pb-1.5"
        >
          <Input
            size="sm"
            value={newSubSkillTitle}
            onChange={(e) => setNewSubSkillTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAddingSubSkill(false);
                setNewSubSkillTitle("");
              }
            }}
            placeholder="Folder name..."
            className="text-xs"
            autoFocus
          />
          <Button type="submit" size="xs" className="h-7 shrink-0 px-2.5">
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 shrink-0 px-2 text-muted-foreground"
            onClick={() => {
              setAddingSubSkill(false);
              setNewSubSkillTitle("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : null}

      <BranchedMenu
        items={[
          { label: "README.md", value: "overview" },
          ...subSkills.map<BranchedMenuItem>((sub) => ({
            label: sub.title,
            value: `sub-${sub.id}`,
            actions: (
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  aria-label={`Actions for ${sub.title}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/section:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() =>
                        setUnitPrompt({ subSkillId: sub.id, title: "" })
                      }
                    >
                      New Unit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setRenamePrompt({
                          subSkillId: sub.id,
                          title: sub.title,
                          initialTitle: sub.title,
                        })
                      }
                    >
                      Rename
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => void onDeleteSubSkill(sub.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            children: units
              .filter((u) => u.subSkillId === sub.id)
              .map((unit) => ({
                value: `unit-${unit.id}`,
                label: unit.title,
              })),
          })),
        ]}
        defaultOpen={subSkills.map((_, idx) => idx + 1)}
        defaultActive={
          activeTarget.kind === "overview"
            ? "overview"
            : activeTarget.kind === "subSkill"
              ? `sub-${activeTarget.subSkillId}`
              : `unit-${activeTarget.unitId}`
        }
        onSelect={(value) => {
          if (value === "overview") {
            onSelectOverview();
          } else if (value.startsWith("sub-")) {
            const subId = Number(value.slice(4));
            if (Number.isInteger(subId) && subId > 0) {
              onSelectSubSkill?.(subId);
            }
          } else if (value.startsWith("unit-")) {
            const unitId = Number(value.slice(5));
            if (Number.isInteger(unitId) && unitId > 0) {
              onSelectUnit(unitId);
            }
          }
        }}
        color="var(--muted-foreground)"
        accentColor="var(--primary)"
        lineColor="var(--border)"
        width={230}
      />

      <Dialog
        open={unitPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setUnitPrompt(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New unit</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!unitPrompt) return;
              const trimmed = unitPrompt.title.trim();
              if (!trimmed) return;
              void onCreateUnit(unitPrompt.subSkillId, trimmed);
              setUnitPrompt(null);
            }}
            className="flex flex-col gap-4"
          >
            <Input
              autoFocus
              placeholder="Unit title"
              value={unitPrompt?.title ?? ""}
              onChange={(e) =>
                setUnitPrompt((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUnitPrompt(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!unitPrompt?.title.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renamePrompt !== null}
        onOpenChange={(open) => {
          if (!open) setRenamePrompt(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename sub-skill</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!renamePrompt) return;
              const trimmed = renamePrompt.title.trim();
              if (trimmed && trimmed !== renamePrompt.initialTitle) {
                void onRenameSubSkill(renamePrompt.subSkillId, trimmed);
              }
              setRenamePrompt(null);
            }}
            className="flex flex-col gap-4"
          >
            <Input
              autoFocus
              placeholder="Sub-skill title"
              value={renamePrompt?.title ?? ""}
              onChange={(e) =>
                setRenamePrompt((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenamePrompt(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!renamePrompt?.title.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildUnitOrderPayload(
  subSkills: TreeSubSkill[],
  units: TreeUnit[]
): { id: number; subSkillId: number; sortOrder: number }[] {
  const result: { id: number; subSkillId: number; sortOrder: number }[] = [];
  for (const sub of subSkills) {
    const group = units.filter((u) => u.subSkillId === sub.id);
    group.forEach((u, idx) => {
      result.push({
        id: u.id,
        subSkillId: sub.id,
        sortOrder: idx,
      });
    });
  }
  return result;
}
