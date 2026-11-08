"use client";

import Link from "next/link";
import { ArrowUpRight, Loader2, Plus, Unlink } from "lucide-react";

import { fullName } from "@/components/contacts/contacts-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

export function UnlinkRecordButton({ label, onClick, unlinking }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="absolute top-1.5 right-1 size-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={unlinking}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {unlinking ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Unlink className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}

export function SidebarAddLinkMenu({ label, onPick }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="link"
            className={cn("h-auto gap-1 px-0", crmType.linkGhost)}
          />
        }
      >
        <Plus className="size-3.5" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => onPick("create")}>Add new</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPick("existing")}>
          Add existing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function contactDisplayName(row) {
  const fromFull = fullName(row);
  if (fromFull) return fromFull;
  const legacy = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return legacy || row.email || "Contact";
}

function isPersistedCompanyId(id) {
  return id && !String(id).startsWith("lead-company-");
}

function isPersistedContactId(id) {
  return id && !String(id).startsWith("contact-");
}

const companyNameClass =
  "text-[13px] font-semibold text-neutral-900 hover:text-primary-700 hover:underline dark:text-neutral-100 dark:hover:text-primary-300";

function companyWebsiteMeta(row) {
  const website = row?.website?.trim() || "";
  const domain = row?.domain?.trim() || "";
  const href = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : domain
      ? domain.startsWith("http")
        ? domain
        : `https://${domain.replace(/^https?:\/\//, "")}`
      : null;
  const displayUrl = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : domain
      ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
      : "";
  return { href, displayUrl };
}

export function CompanyProfileCard({ row, onUnlink, unlinking }) {
  const { href, displayUrl } = companyWebsiteMeta(row);
  const companyHref = isPersistedCompanyId(row?.id)
    ? `/companies/${row.id}`
    : null;

  return (
    <div className="relative rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 pr-10 dark:border-neutral-800 dark:bg-neutral-900/40">
      {onUnlink ? (
        <UnlinkRecordButton
          label={`Unlink ${row?.name || "company"}`}
          unlinking={unlinking}
          onClick={() => onUnlink(row)}
        />
      ) : null}
      <div className="min-w-0">
        {companyHref ? (
          <Link href={companyHref} className={cn(companyNameClass, "block truncate")}>
            {row.name}
          </Link>
        ) : (
          <p className={cn(crmType.bodySemibold, "truncate")}>{row?.name}</p>
        )}
        {href && displayUrl ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "mt-1 flex max-w-full items-center gap-0.5 truncate",
              crmType.linkMeta
            )}
          >
            <span className="truncate">{displayUrl}</span>
            <ArrowUpRight className="size-3 shrink-0" />
          </a>
        ) : (
          <p className={cn("mt-1 block", crmType.helper)}>No website</p>
        )}
      </div>
    </div>
  );
}

export function ContactProfileCard({ row, onUnlink, unlinking }) {
  const phone = row?.phone?.trim();
  const email = row?.email?.trim();
  const name = contactDisplayName(row);

  return (
    <div className="relative rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 pr-10 dark:border-neutral-800 dark:bg-neutral-900/40">
      {onUnlink ? (
        <UnlinkRecordButton
          label={`Unlink ${name}`}
          unlinking={unlinking}
          onClick={() => onUnlink(row)}
        />
      ) : null}
      {isPersistedContactId(row?.id) ? (
        <Link href={`/contacts/${row.id}`} className={crmType.linkTitle}>
          {name}
        </Link>
      ) : (
        <p className={crmType.bodySemibold}>{name}</p>
      )}
      <div className={cn("mt-1.5 space-y-0.5", crmType.meta)}>
        <p className="text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-400">Mobile · </span>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="font-medium text-neutral-800 hover:text-primary-700 dark:text-neutral-200 dark:hover:text-primary-300"
            >
              {phone}
            </a>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </p>
        <p className="truncate text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-400">Email · </span>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="font-medium text-neutral-800 hover:text-primary-700 dark:text-neutral-200 dark:hover:text-primary-300"
            >
              {email}
            </a>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function RelatedSidebarSection({ title, count, addAction, emptyMessage, children }) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={crmType.sectionLabel}>
          {title}
          {count > 1 ? ` (${count})` : ""}
        </p>
        {addAction}
      </div>
      {children ?? (
        <p
          className={cn(
            "rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center dark:border-neutral-800",
            crmType.dashedEmpty
          )}
        >
          {emptyMessage}
        </p>
      )}
    </>
  );
}
