"use client";

import { useState } from "react";
import { MinusIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditProfileForm } from "@/features/profile/components/edit-profile-form";

interface SettingsSectionProps {
  id: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: SettingsSectionProps) {
  return (
    <div className="border-b border-border py-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="mt-1 shrink-0 text-muted-foreground">
          {isOpen ? (
            <MinusIcon className="size-4" />
          ) : (
            <PlusIcon className="size-4" />
          )}
        </span>
      </button>

      {isOpen ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default function DashboardSettingsPage() {
  const [openSection, setOpenSection] = useState<string | null>("profile");
  const [dialogOpen, setDialogOpen] = useState(false);

  function toggle(id: string) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <div className="mx-auto my-auto flex w-full max-w-2xl flex-col">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-normal tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace account and public profile.
        </p>
      </div>

      <div className="border-t border-border">
        <SettingsSection
          id="profile"
          title="Public profile"
          subtitle="Update your name, username, avatar, banner, website, and biography"
          isOpen={openSection === "profile"}
          onToggle={() => toggle("profile")}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your public profile is visible on your skills, leaderboard
              entries, and public profile page.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="w-fit">
                    <PencilIcon data-icon="inline-start" />
                    Edit profile
                  </Button>
                }
              />
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                </DialogHeader>
                <EditProfileForm embedded />
              </DialogContent>
            </Dialog>
          </div>
        </SettingsSection>

        <SettingsSection
          id="workspace"
          title="Workspace preferences"
          subtitle="Configure default visibility and repository behavior"
          isOpen={openSection === "workspace"}
          onToggle={() => toggle("workspace")}
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            New skills default to draft status until you publish them to the
            public leaderboard.
          </p>
        </SettingsSection>
      </div>
    </div>
  );
}
