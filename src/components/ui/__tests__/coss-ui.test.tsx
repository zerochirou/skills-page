import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

describe("coss.ui + Base UI migration", () => {
  it("has zero @radix-ui dependencies in package.json", () => {
    const pkgRaw = fs.readFileSync(
      path.resolve(process.cwd(), "package.json"),
      "utf8",
    );
    const pkg = JSON.parse(pkgRaw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    const radixDeps = Object.keys(allDeps).filter((name) =>
      name.startsWith("@radix-ui/"),
    );
    expect(radixDeps).toEqual([]);
  });

  it("renders Button with Base UI useRender and loading state", () => {
    const { rerender } = render(
      <Button render={<a href="https://coss.com/ui" />}>Explore Skills</Button>,
    );
    const link = screen.getByRole("link", { name: "Explore Skills" });
    expect(link).toHaveAttribute("href", "https://coss.com/ui");
    expect(link).toHaveAttribute("data-slot", "button");

    rerender(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button", { name: /Saving/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).toHaveAttribute("data-loading", "");
  });

  it("renders Alert with error variant", () => {
    render(
      <Alert variant="error">
        <AlertTitle>Action failed</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText("Action failed")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders Base UI Avatar with fallback", () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="avatar"]'),
    ).toBeInTheDocument();
  });

  it("renders Card, CardContent alias, and Badge", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Skill Title</CardTitle>
          <CardDescription>Summary</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge>Published</Badge>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText("Skill Title")).toBeInTheDocument();
    expect(screen.getByText("Published")).toHaveAttribute("data-slot", "badge");
  });

  it("renders FieldGroup, Field, FieldLabel, Input, and FieldDescription", () => {
    render(
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="skill-name">Skill Name</FieldLabel>
          <Input id="skill-name" defaultValue="TypeScript" />
          <FieldDescription>Public repository name</FieldDescription>
        </Field>
      </FieldGroup>,
    );
    expect(screen.getByLabelText("Skill Name")).toHaveValue("TypeScript");
    expect(screen.getByText("Public repository name")).toBeInTheDocument();
  });

  it("opens DropdownMenu (coss Menu alias) on trigger click", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button>Actions</Button>} />
        <DropdownMenuContent>
          <DropdownMenuItem>Edit Skill</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByText("Edit Skill")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("opens Dialog on trigger click", () => {
    render(
      <Dialog>
        <DialogTrigger render={<Button>Open Modal</Button>} />
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>Proceed with migration.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Modal" }));
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Proceed with migration.")).toBeInTheDocument();
  });

  it("renders Base UI NavigationMenu", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/how-to-use">
              How to use
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    expect(screen.getByRole("button", { name: /Docs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How to use" })).toHaveAttribute(
      "href",
      "/how-to-use",
    );
  });
});
