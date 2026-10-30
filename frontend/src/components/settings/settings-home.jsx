"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ImagePlus,
  Loader2,
  Shield,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Software & Technology",
  "Software / SaaS",
  "Professional Services",
  "Finance & Insurance",
  "Financial Services",
  "Fintech",
  "Healthcare",
  "Biotechnology",
  "Education",
  "Retail & E-commerce",
  "Retail",
  "Manufacturing",
  "Marketing / Agencies",
  "Media & Marketing",
  "Cloud Infrastructure",
  "Telecommunications",
  "Real Estate",
  "Other",
];

const COMPANY_SIZES = [
  "1-10",
  "1–10",
  "11-50",
  "11–50",
  "51-200",
  "51–200",
  "201-500",
  "201–1,000",
  "501-1000",
  "1,001–5,000",
  "1001+",
  "5,000+",
];

const UNIQUE_COMPANY_SIZES = [...new Set(COMPANY_SIZES)];

const ROLE_STYLES = {
  owner:
    "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  admin:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  member:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-[12px] text-error-text">
      {children}
    </p>
  );
}

function initials(name = "", email = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
      <div className="space-y-2">
        <div className="h-3 w-36 animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800" />
        <div className="h-8 w-56 animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800" />
      </div>
      <div className="h-10 w-72 animate-pulse rounded-lg bg-neutral-200/70 dark:bg-neutral-800" />
      <div className="h-80 animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800" />
    </div>
  );
}

export function SettingsHome() {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("workspace");
  const [role, setRole] = useState("member");
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersStatus, setMembersStatus] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    company_size: "",
    logo_url: "",
  });

  const canEdit = role === "owner" || role === "admin";

  const industryOptions = useMemo(() => {
    const values = new Set(INDUSTRIES);
    if (form.industry) values.add(form.industry);
    return [...values];
  }, [form.industry]);

  const sizeOptions = useMemo(() => {
    const values = new Set(UNIQUE_COMPANY_SIZES);
    if (form.company_size) values.add(form.company_size);
    return [...values];
  }, [form.company_size]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const ws = await apiFetch("/api/workspace");
        if (cancelled) return;
        const org = ws.organization || {};
        setOrganization(org);
        setRole(ws.role || "member");
        setForm({
          name: org.name || "",
          website: org.website || "",
          industry: org.industry || "",
          company_size: org.company_size || "",
          logo_url: org.logo_url || "",
        });
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load workspace settings");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== "members" || membersStatus !== "idle") return;
    let cancelled = false;
    async function loadMembers() {
      setMembersStatus("loading");
      try {
        const data = await apiFetch("/api/workspace/members");
        if (cancelled) return;
        setMembers(data.data || []);
        setMembersStatus("ready");
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || "Could not load members");
          setMembersStatus("error");
        }
      }
    }
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [tab, membersStatus]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setErrors((prev) => ({
        ...prev,
        logo: "Logo must be under 1MB.",
      }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateField("logo_url", String(reader.result || ""));
      setErrors((prev) => ({ ...prev, logo: "" }));
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    updateField("logo_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit || saving) return;

    const nextErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      nextErrors.name = "Workspace name must be at least 2 characters.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await apiFetch("/api/workspace", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          website: form.website.trim() || null,
          industry: form.industry || null,
          company_size: form.company_size || null,
          logo_url: form.logo_url || null,
        }),
      });
      setOrganization(result.organization);
      setForm({
        name: result.organization?.name || "",
        website: result.organization?.website || "",
        industry: result.organization?.industry || "",
        company_size: result.organization?.company_size || "",
        logo_url: result.organization?.logo_url || "",
      });
      window.dispatchEvent(
        new CustomEvent("novacrm:workspace-updated", {
          detail: {
            organization: result.organization,
            organizations: result.organizations || [],
            role: result.role,
            user: result.user,
          },
        })
      );
      toast.success("Workspace settings saved");
    } catch (error) {
      toast.error(error.message || "Could not save workspace settings");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <SettingsSkeleton />;

  if (status === "error") {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center py-16 text-center">
        <Building2 className="mb-3 size-8 text-neutral-300" />
        <h1 className="text-[22px] font-bold tracking-[-0.03em]">
          Couldn’t load settings
        </h1>
        <p className="mt-2 text-[14px] text-neutral-500">
          Check your connection and try again.
        </p>
        <Button
          type="button"
          className="mt-5"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-primary-500/80">
          <span>Workspace</span>
          <span className="text-primary-300">/</span>
          <span className="font-medium text-primary-700 dark:text-primary-300">
            Settings
          </span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] leading-8 font-bold tracking-[-0.03em] text-neutral-900 sm:text-[28px] dark:text-neutral-50">
              Manage workspace
            </h1>
            <p className="mt-1 max-w-[56ch] text-[14px] text-neutral-500">
              Update organization details and review who has access to{" "}
              {organization?.name || "this workspace"}.
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn("h-auto capitalize", ROLE_STYLES[role] || ROLE_STYLES.member)}
          >
            Your role · {role}
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="workspace" className="gap-1.5">
            <Building2 className="size-3.5" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="size-3.5" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px]">Workspace details</CardTitle>
              <CardDescription>
                {canEdit
                  ? "These details appear in the sidebar switcher and workspace profile."
                  : "You can view workspace details. Ask an owner or admin to make changes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSave}>
                <div className="grid gap-4 sm:grid-cols-[112px_1fr]">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                      {form.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.logo_url}
                          alt=""
                          className="size-full object-contain"
                        />
                      ) : (
                        <ImagePlus className="size-5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={!canEdit || saving}
                      onChange={handleLogoChange}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit || saving}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {form.logo_url ? "Replace logo" : "Upload logo"}
                      </Button>
                      {form.logo_url ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!canEdit || saving}
                          onClick={clearLogo}
                        >
                          <X className="size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      PNG, JPG, WebP, or SVG up to 1MB.
                    </p>
                    <FieldError>{errors.logo}</FieldError>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="workspace-name">Workspace name</Label>
                    <Input
                      id="workspace-name"
                      value={form.name}
                      disabled={!canEdit || saving}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      className="mt-1.5"
                    />
                    <FieldError>{errors.name}</FieldError>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="workspace-website">Website</Label>
                    <Input
                      id="workspace-website"
                      type="url"
                      placeholder="https://company.com"
                      value={form.website}
                      disabled={!canEdit || saving}
                      onChange={(event) =>
                        updateField("website", event.target.value)
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Industry</Label>
                    <Select
                      value={form.industry || undefined}
                      onValueChange={(value) => updateField("industry", value)}
                      disabled={!canEdit || saving}
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Company size</Label>
                    <Select
                      value={form.company_size || undefined}
                      onValueChange={(value) =>
                        updateField("company_size", value)
                      }
                      disabled={!canEdit || saving}
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <div className="text-[12px] text-muted-foreground">
                    Slug ·{" "}
                    <span className="font-medium text-foreground">
                      {organization?.slug || "—"}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {!canEdit ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Shield className="size-3.5" />
                        View only
                      </span>
                    ) : null}
                    <Button type="submit" disabled={!canEdit || saving}>
                      {saving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card className="overflow-hidden py-0">
            <CardHeader className="px-4 pt-4 sm:px-5">
              <CardTitle className="text-[16px]">Team members</CardTitle>
              <CardDescription>
                People with access to this workspace and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {membersStatus === "loading" || membersStatus === "idle" ? (
                <div className="space-y-3 px-4 py-6 sm:px-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-12 animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800"
                    />
                  ))}
                </div>
              ) : membersStatus === "error" ? (
                <div className="px-4 py-10 text-center text-[13px] text-muted-foreground sm:px-5">
                  Couldn’t load members.
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersStatus("idle")}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="px-4 sm:px-5">Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Job title
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="px-4 py-3 sm:px-5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                              {initials(member.name, member.email)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">
                                {member.name || "Unnamed"}
                              </span>
                              <span className="block truncate text-[12px] text-muted-foreground">
                                {member.email}
                              </span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-auto capitalize",
                              ROLE_STYLES[member.role] || ROLE_STYLES.member
                            )}
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {member.job_role || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              member.email_verified
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            )}
                          >
                            {member.email_verified ? "Verified" : "Unverified"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SettingsSkeletonExport() {
  return <SettingsSkeleton />;
}
