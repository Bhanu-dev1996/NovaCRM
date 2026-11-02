"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function defaultRowKey(row, index) {
  return row.id ?? row.email ?? `row-${index}`;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  title,
  description,
  requiredHint = "Required: first_name, last_name, email",
  entityName = "record",
  entityNamePlural,
  previewColumns,
  onParseFile,
  onImport,
  maxWidth = 512,
}) {
  const plural = entityNamePlural || `${entityName}s`;
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);

  function resetState() {
    setFileName("");
    setPreview([]);
    setErrors([]);
    setBusy(false);
    setImporting(false);
    setProgress({ current: 0, total: 0 });
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen && importing) return;
    onOpenChange?.(nextOpen);
    if (!nextOpen) resetState();
  }

  async function processFile(file) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please upload a .csv file");
      return;
    }

    setBusy(true);
    try {
      const { valid, errors: parseErrors } = await onParseFile(file);
      setFileName(file.name);
      setPreview(valid || []);
      setErrors(parseErrors || []);
      const validCount = valid?.length || 0;
      const errorCount = parseErrors?.length || 0;
      if (!validCount && errorCount) {
        toast.error(`No valid ${plural} found in this CSV`);
      } else if (errorCount) {
        toast.message(
          `${validCount} ready to import · ${errorCount} row${errorCount === 1 ? "" : "s"} skipped`
        );
      } else if (validCount) {
        toast.success(
          `${validCount} ${validCount === 1 ? entityName : plural} ready to import`
        );
      }
    } catch (error) {
      setFileName("");
      setPreview([]);
      setErrors([]);
      toast.error(error.message || "Could not read CSV file");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportClick() {
    if (!preview.length || importing) {
      if (!preview.length) {
        toast.error(`Choose a CSV with at least one valid ${entityName}`);
      }
      return;
    }
    setImporting(true);
    setProgress({ current: 0, total: preview.length });
    try {
      await onImport(preview, {
        reportProgress(current, total) {
          setProgress({ current, total });
        },
      });
      handleOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  }

  const columns =
    previewColumns?.length > 0
      ? previewColumns
      : [
          {
            header: "Name",
            cell: (row) =>
              [row.firstName, row.lastName].filter(Boolean).join(" ") || "—",
          },
          { header: "Email", cell: (row) => row.email || "—" },
        ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title={title}
        description={description}
        maxWidth={maxWidth}
        onClose={importing ? undefined : () => handleOpenChange(false)}
      >
        <DialogBody className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) processFile(file);
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragOver(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              const file = event.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            className={cn(
              "rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              dragOver
                ? "border-primary-400 bg-primary-50/70 dark:border-primary-500 dark:bg-primary-950/40"
                : "border-neutral-200 dark:border-neutral-700"
            )}
          >
            <FileSpreadsheet className="mx-auto size-8 text-neutral-400" />
            <p className="mt-3 text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
              {busy
                ? "Reading CSV…"
                : fileName || "Drop a CSV file here, or choose a file"}
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">{requiredHint}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || importing}
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Choose file
              </Button>
            </div>
          </div>

          {fileName ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-[12px] dark:border-neutral-700">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                  {fileName}
                </p>
                <p className="text-neutral-500">
                  {preview.length} valid · {errors.length} skipped
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear file"
                disabled={importing}
                onClick={resetState}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}

          {preview.length > 0 ? (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.header} className="px-3 py-2 font-medium">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((row, index) => (
                    <tr
                      key={defaultRowKey(row, index)}
                      className="border-t border-neutral-100 dark:border-neutral-800"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.header}
                          className="px-3 py-2 text-neutral-600 dark:text-neutral-300"
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 8 ? (
                <p className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-500 dark:border-neutral-800">
                  +{preview.length - 8} more
                </p>
              ) : null}
            </div>
          ) : null}

          {errors.length > 0 ? (
            <div className="max-h-28 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              {errors.slice(0, 6).map((error, index) => (
                <p key={`${error.rowNumber ?? error.row ?? index}-${error.message}`}>
                  Row {error.rowNumber ?? error.row}: {error.message}
                </p>
              ))}
              {errors.length > 6 ? (
                <p>+{errors.length - 6} more issues</p>
              ) : null}
            </div>
          ) : null}

          {importing ? (
            <div className="rounded-lg border border-primary-100 bg-primary-50/70 px-3 py-3 dark:border-primary-900 dark:bg-primary-950/40">
              <div className="flex items-center gap-2 text-[13px] font-medium text-primary-800 dark:text-primary-200">
                <Loader2 className="size-4 animate-spin" />
                Importing {progress.current} of {progress.total}…
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-200"
                  style={{
                    width: `${
                      progress.total
                        ? Math.round((progress.current / progress.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={importing || busy}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary-600 text-white hover:bg-primary-700"
            disabled={!preview.length || busy || importing}
            onClick={handleImportClick}
          >
            {importing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Importing {progress.current}/{progress.total}
              </>
            ) : preview.length ? (
              `Import ${preview.length} ${preview.length === 1 ? entityName : plural}`
            ) : (
              `Import ${plural}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
