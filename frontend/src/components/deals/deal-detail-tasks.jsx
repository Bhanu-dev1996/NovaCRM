"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ListTodo,
  Loader2,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";

import { FieldError } from "@/components/crm/crm-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  combineDateAndTime,
  DatePicker,
  TimePicker,
} from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmControl, crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function findOwnerById(owners, id) {
  if (id == null || id === "") return null;
  const key = String(id);
  return owners.find((o) => String(o.id) === key) ?? null;
}

function assigneeLabel(owners, assigneeId) {
  return findOwnerById(owners, assigneeId)?.name || null;
}

const PRIORITY_STYLES = {
  high: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  medium: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

const STATUS_LABEL = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

const STATUS_STYLES = {
  todo: "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
  doing:
    "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const PRIORITY_ACCENT = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-neutral-300 dark:bg-neutral-600",
};

function TaskLabeledMeta({ label, children, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className={crmType.recordLabel}>{label}</p>
      <div
        className={cn(
          "mt-1 min-w-0 text-neutral-700 dark:text-neutral-300",
          crmType.meta
        )}
      >
        {children}
      </div>
    </div>
  );
}

function taskMentionsDeal(text, deal, companyName) {
  const hay = String(text || "").toLowerCase();
  const needles = [deal?.name, companyName].filter(Boolean);
  return needles.some((needle) => {
    const value = String(needle).trim().toLowerCase();
    return value.length >= 3 && hay.includes(value);
  });
}

export function resolveDealTasks(tasks, deal, companyName = "") {
  if (!deal?.id) return [];
  return (tasks || []).filter((row) => {
    if (row.deal_id && String(row.deal_id) === String(deal.id)) return true;
    return (
      taskMentionsDeal(row.title, deal, companyName) ||
      taskMentionsDeal(row.description, deal, companyName)
    );
  });
}

function duePartsFromTask(task) {
  if (!task?.due_at) return { dueDate: null, dueTime: "" };
  const d = new Date(task.due_at);
  if (Number.isNaN(d.getTime())) return { dueDate: null, dueTime: "" };
  const pad = (n) => String(n).padStart(2, "0");
  const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return {
    dueDate,
    dueTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function formatTaskDue(value) {
  if (!value) return "No due date";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "No due date";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "No due date";
  }
}

const TITLE_MAX_LENGTH = 200;

function taskFormSnapshot(values) {
  return {
    title: values.title,
    dueDate: values.dueDate,
    dueTime: values.dueTime,
    priority: values.priority,
  };
}

function taskFieldError(field, values) {
  const { title, dueDate, dueTime, priority } = taskFormSnapshot(values);

  if (field === "title") {
    const trimmed = String(title || "").trim();
    if (!trimmed) return "Title is required.";
    if (trimmed.length < 2) return "Title must be at least 2 characters.";
    if (trimmed.length > TITLE_MAX_LENGTH) {
      return `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
    }
    return undefined;
  }

  if (field === "dueDate") {
    if (
      !dueDate ||
      !(dueDate instanceof Date) ||
      Number.isNaN(dueDate.getTime())
    ) {
      return "Select a due date.";
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(dueDate);
    picked.setHours(0, 0, 0, 0);
    if (picked.getTime() < today.getTime()) {
      return "Due date cannot be in the past.";
    }
    return undefined;
  }

  if (field === "dueTime") {
    if (!dueTime) return "Select a time.";
    const dateErr = taskFieldError("dueDate", values);
    if (dateErr) return undefined;
    const combined = combineDateAndTime(dueDate, dueTime);
    if (!combined || Number.isNaN(combined.getTime())) return undefined;
    if (combined.getTime() < Date.now() - 60_000) {
      return "Due time must be in the future.";
    }
    return undefined;
  }

  if (field === "priority") {
    if (!priority) return "Select a priority.";
    return undefined;
  }

  return undefined;
}

function TaskFieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor} className="gap-1">
      {required ? (
        <span className="text-error-text" aria-hidden="true">
          *
        </span>
      ) : null}
      {children}
    </Label>
  );
}

export function DealDetailTasksTab({
  deal,
  companyName = "",
  tasks = [],
  owners = [],
  currentUserId,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const dealTasks = useMemo(
    () => resolveDealTasks(tasks, deal, companyName),
    [tasks, deal, companyName]
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [errors, setErrors] = useState({});

  const name = deal?.name || "Deal";

  const formRef = useRef({ title, dueDate, dueTime, priority });
  formRef.current = { title, dueDate, dueTime, priority };

  function applyFieldErrors(patch) {
    setErrors((prev) => ({ ...prev, ...patch }));
  }

  function validateSnapshot(snapshot, field) {
    if (field === "dueDate") {
      return {
        dueDate: taskFieldError("dueDate", snapshot),
        dueTime: taskFieldError("dueTime", snapshot),
      };
    }
    if (field === "dueTime") {
      return { dueTime: taskFieldError("dueTime", snapshot) };
    }
    return { [field]: taskFieldError(field, snapshot) };
  }

  function blurField(field) {
    const snapshot = formRef.current;
    applyFieldErrors(validateSnapshot(snapshot, field));
  }

  function validateAll() {
    const snapshot = formRef.current;
    const fields = ["title", "dueDate", "dueTime", "priority"];
    const next = {};
    for (const field of fields) {
      const message = taskFieldError(field, snapshot);
      if (message) next[field] = message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const assigneeName = assigneeLabel(owners, assigneeId);
  const assigneeSelectValue =
    assigneeId && assigneeName ? String(assigneeId) : null;

  const editingTask = useMemo(
    () => dealTasks.find((row) => row.id === editingTaskId) ?? null,
    [dealTasks, editingTaskId]
  );
  const deleteTask = useMemo(
    () => dealTasks.find((row) => row.id === deleteTaskId) ?? null,
    [dealTasks, deleteTaskId]
  );

  function resetTaskForm() {
    setTitle("");
    setDueDate(null);
    setDueTime("");
    setPriority("");
    setAssigneeId("");
    setErrors({});
  }

  function openAddTask() {
    setEditingTaskId(null);
    resetTaskForm();
    setAddOpen(true);
  }

  function openEditTask(task) {
    const { dueDate: taskDue, dueTime: taskTime } = duePartsFromTask(task);
    setEditingTaskId(task.id);
    setTitle(task.title || "");
    setDueDate(taskDue);
    setDueTime(taskTime);
    setPriority(task.priority || "");
    setAssigneeId(task.assignee_id ? String(task.assignee_id) : "");
    setErrors({});
    setAddOpen(true);
  }

  function closeTaskDialog() {
    setAddOpen(false);
    setEditingTaskId(null);
    setErrors({});
  }

  async function submitTask() {
    if (!validateAll()) return;
    if (!title.trim()) return;
    setSaving(true);
    try {
      const dueAt = (() => {
        const combined = combineDateAndTime(dueDate, dueTime);
        return combined && !Number.isNaN(combined.getTime())
          ? combined.toISOString()
          : null;
      })();
      const assigneePayload =
        assigneeId && findOwnerById(owners, assigneeId)
          ? String(assigneeId)
          : null;

      if (editingTaskId && onUpdateTask) {
        await onUpdateTask(editingTaskId, {
          title: title.trim(),
          description: editingTask?.description || undefined,
          priority,
          due_at: dueAt,
          assignee_id: assigneePayload,
        });
      } else if (onCreateTask) {
        await onCreateTask({
          title: title.trim(),
          description: `Task for deal ${name}${companyName ? ` · ${companyName}` : ""}.`,
          status: "todo",
          priority,
          due_at: dueAt,
          assignee_id: assigneePayload,
          deal_id: deal.id,
        });
      }
      closeTaskDialog();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTaskId || !onDeleteTask) return;
    setDeleting(true);
    try {
      await onDeleteTask(deleteTaskId);
      setDeleteTaskId(null);
    } finally {
      setDeleting(false);
    }
  }

  const addTaskButtonClass = cn(
    "rounded-lg bg-primary-600 text-white hover:bg-primary-700",
    crmControl.btnPrimarySm
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className={crmType.sectionLabel}>Open tasks</p>
        <Button
          type="button"
          size="sm"
          className={addTaskButtonClass}
          onClick={openAddTask}
        >
          <Plus className="size-3.5" />
          Add task
        </Button>
      </div>

      {dealTasks.length ? (
        <ul className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30">
          {dealTasks.map((task, index) => {
            const assignee = assigneeLabel(owners, task.assignee_id);
            const status = task.status || "todo";
            const priority = task.priority || "medium";
            return (
              <li
                key={task.id}
                className={cn(
                  "group relative bg-white transition-colors hover:bg-neutral-50/80 dark:bg-neutral-950 dark:hover:bg-neutral-900/80",
                  index > 0 && "border-t border-neutral-100 dark:border-neutral-800"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 bottom-3 left-0 w-1 rounded-r-full",
                    PRIORITY_ACCENT[priority] || PRIORITY_ACCENT.medium
                  )}
                />
                <div className="flex items-start gap-2 py-3 pr-2 pl-3.5 sm:pr-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-1">
                      <h3
                        className={cn(
                          "min-w-0 max-w-full",
                          crmType.bodySemibold
                        )}
                      >
                        {task.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 shrink-0 border px-2 font-medium",
                          crmType.badge,
                          STATUS_STYLES[status] || STATUS_STYLES.todo
                        )}
                      >
                        {STATUS_LABEL[status] || status}
                      </Badge>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 min-[420px]:gap-4">
                      <TaskLabeledMeta label="Due date">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <CalendarDays
                            className="size-3.5 shrink-0 text-neutral-400"
                            aria-hidden
                          />
                          <span className="truncate">
                            {formatTaskDue(task.due_at)}
                          </span>
                        </span>
                      </TaskLabeledMeta>
                      <TaskLabeledMeta label="Priority">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 w-fit border-transparent px-1.5 capitalize",
                            crmType.badge,
                            PRIORITY_STYLES[priority] ||
                              PRIORITY_STYLES.medium
                          )}
                        >
                          {priority}
                        </Badge>
                      </TaskLabeledMeta>
                      <TaskLabeledMeta label="Assignee">
                        {assignee ? (
                          <span className="block truncate">{assignee}</span>
                        ) : (
                          <span className="text-neutral-400">Unassigned</span>
                        )}
                      </TaskLabeledMeta>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => openEditTask(task)}
                    >
                      <SquarePen className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-neutral-400 hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center dark:border-neutral-800">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
            <ListTodo className="size-5" aria-hidden="true" />
          </span>
          <p className={cn("mt-3", crmType.emptyTitle)}>No tasks yet</p>
          <p className={cn("mx-auto mt-1", crmType.emptyDescription)}>
            Add a follow-up or reminder tied to this deal.
          </p>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={(open) => !open && closeTaskDialog()}>
        <DialogContent
          title={editingTaskId ? "Edit task" : "Add task"}
          description={
            editingTaskId
              ? `Update task details for ${name}.`
              : `Create a task for ${name}.`
          }
          onClose={closeTaskDialog}
        >
          <DialogBody className="space-y-3">
            <div>
              <TaskFieldLabel htmlFor="lead-task-title" required>
                Title
              </TaskFieldLabel>
              <Input
                id="lead-task-title"
                value={title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setTitle(nextTitle);
                  const snapshot = { ...formRef.current, title: nextTitle };
                  applyFieldErrors(validateSnapshot(snapshot, "title"));
                }}
                onBlur={() => blurField("title")}
                aria-invalid={Boolean(errors.title)}
                className={crmControl.inputMt}
                placeholder={`e.g. Follow up with ${name}`}
                maxLength={TITLE_MAX_LENGTH + 1}
              />
              <FieldError message={errors.title} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <TaskFieldLabel htmlFor="lead-task-due-date" required>
                  Due date
                </TaskFieldLabel>
                <DatePicker
                  id="lead-task-due-date"
                  className={crmControl.pickerMt}
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                    const snapshot = { ...formRef.current, dueDate: date };
                    applyFieldErrors(validateSnapshot(snapshot, "dueDate"));
                  }}
                  aria-invalid={Boolean(errors.dueDate)}
                  placeholder="Select due date"
                  align="start"
                />
                <FieldError message={errors.dueDate} />
              </div>
              <div>
                <TaskFieldLabel htmlFor="lead-task-due-time" required>
                  Time
                </TaskFieldLabel>
                <TimePicker
                  id="lead-task-due-time"
                  className={crmControl.pickerMt}
                  value={dueTime}
                  onChange={(time) => {
                    setDueTime(time);
                    const snapshot = { ...formRef.current, dueTime: time };
                    applyFieldErrors(validateSnapshot(snapshot, "dueTime"));
                  }}
                  aria-invalid={Boolean(errors.dueTime)}
                  placeholder="Select time"
                  align="end"
                />
                <FieldError message={errors.dueTime} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <TaskFieldLabel htmlFor="lead-task-priority" required>
                  Priority
                </TaskFieldLabel>
                <Select
                  value={priority || null}
                  onValueChange={(value) => {
                    setPriority(value);
                    const snapshot = { ...formRef.current, priority: value };
                    applyFieldErrors(validateSnapshot(snapshot, "priority"));
                  }}
                  onOpenChange={(open) => {
                    if (!open) {
                      setTimeout(() => blurField("priority"), 0);
                    }
                  }}
                >
                  <SelectTrigger
                    id="lead-task-priority"
                    aria-invalid={Boolean(errors.priority)}
                    className={cn(
                      crmControl.selectMt,
                      errors.priority && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select priority">
                      {priority ? PRIORITY_LABELS[priority] : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={errors.priority} />
              </div>
              <div>
                <TaskFieldLabel htmlFor="lead-task-assignee">
                  Assignee
                </TaskFieldLabel>
                <Select
                  value={assigneeSelectValue}
                  onValueChange={(value) => setAssigneeId(String(value))}
                >
                  <SelectTrigger
                    id="lead-task-assignee"
                    className={crmControl.selectMt}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-left",
                        !assigneeName && "text-muted-foreground"
                      )}
                    >
                      {assigneeName || "Select assignee"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem
                        key={owner.id}
                        value={String(owner.id)}
                      >
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={crmControl.btnDialog}
              onClick={closeTaskDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className={cn(
                "gap-1.5 bg-primary-600 text-white hover:bg-primary-700",
                crmControl.btnDialogPrimary
              )}
              onClick={submitTask}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : editingTaskId ? (
                "Save changes"
              ) : (
                "Create task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTaskId)}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
      >
        <DialogContent
          title="Delete task"
          description="This cannot be undone."
          onClose={() => setDeleteTaskId(null)}
        >
          <DialogBody>
            <p className={crmType.body}>
              Delete{" "}
              <span className={crmType.bodySemibold}>
                {deleteTask?.title || "this task"}
              </span>
              ?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={crmControl.btnDialog}
              onClick={() => setDeleteTaskId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={deleting}
              className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteTask}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function dealTaskCount(tasks, deal, companyName = "") {
  return resolveDealTasks(tasks, deal, companyName).length;
}
