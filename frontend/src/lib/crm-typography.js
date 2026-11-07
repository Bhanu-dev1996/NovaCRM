/**
 * NovaCRM typography scale — use across CRM surfaces (detail pages, dialogs, forms, lists).
 */

export const crmType = {
  sectionLabel:
    "text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase",
  fieldLabel:
    "text-[13px] font-medium leading-none text-neutral-600 dark:text-neutral-400",
  fieldLabelMuted: "text-[12px] font-medium text-muted-foreground",
  body: "text-[13px] font-normal text-neutral-900 dark:text-neutral-100",
  bodyMedium: "text-[13px] font-medium text-neutral-900 dark:text-neutral-100",
  bodySemibold: "text-[13px] font-semibold text-neutral-900 dark:text-neutral-50",
  meta: "text-[12px] font-normal text-neutral-500 dark:text-neutral-400",
  metaMedium: "text-[12px] font-medium text-neutral-500",
  metaLeading: "text-[12px] font-normal leading-5 text-neutral-500",
  helper: "text-[12px] font-normal text-neutral-400",
  emptyTitle: "text-[13px] font-semibold text-neutral-900 dark:text-neutral-50",
  emptyDescription: "text-[12px] font-normal leading-5 text-neutral-500",
  placeholder: "text-[13px] font-normal text-neutral-400",
  dashedEmpty: "text-[12px] font-normal text-muted-foreground",
  badge: "text-[11px] font-medium",
  badgeSemibold: "text-[11px] font-semibold",
  tab: "text-[13px] font-medium",
  tabLine:
    "relative flex-none rounded-none px-0 pt-0 pb-2.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-800 data-active:bg-transparent data-active:text-primary-700 group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 group-data-horizontal/tabs:after:bg-primary-600 dark:text-neutral-400 dark:hover:text-neutral-200 dark:data-active:text-primary-400 dark:group-data-horizontal/tabs:after:bg-primary-500",
  dialogTitle: "text-[16px] font-semibold text-neutral-900 dark:text-neutral-50",
  dialogDescription: "text-[13px] font-normal text-neutral-500",
  pageTitle:
    "text-[18px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-neutral-50",
  pageDescription: "text-[14px] font-normal text-neutral-500",
  breadcrumb: "text-[12px] text-primary-500/80",
  recordLabel: "text-[11px] font-normal text-neutral-500",
  recordValue: "text-[13px] font-medium text-neutral-900 dark:text-neutral-100",
  avatarLg: "text-[13px] font-bold text-primary-700 dark:text-primary-300",
  avatarSm: "text-[11px] font-semibold text-neutral-600 dark:text-neutral-300",
  linkTitle:
    "text-[13px] font-semibold text-primary-700 hover:underline dark:text-primary-300",
  linkMeta:
    "text-[12px] font-normal text-primary-700 hover:underline dark:text-primary-300",
  linkGhost:
    "text-[12px] font-medium text-primary-600 no-underline hover:no-underline hover:text-primary-700",
  sidebarRow: "flex items-start justify-between gap-3 text-[12px]",
  sidebarMeta: "text-[12px] font-normal text-neutral-600 dark:text-neutral-400",
  noteBody:
    "text-[13px] font-normal leading-5 text-neutral-600 dark:text-neutral-400",
  mentionPickerTitle:
    "text-[11px] font-medium tracking-wide text-neutral-400 uppercase",
  stepperLabel: "text-[11px] font-medium text-muted-foreground",
  error: "text-[11px] font-normal text-error-text",
};

export const crmControl = {
  input: "h-9 text-[13px] font-normal",
  inputMt: "mt-1.5 h-9 text-[13px] font-normal",
  select: "h-9 w-full text-[13px] font-normal",
  selectMt: "mt-1.5 h-9 w-full text-[13px] font-normal",
  picker: "text-[13px] font-normal",
  pickerMt: "mt-1.5 text-[13px] font-normal",
  pickerTrigger:
    "h-9 w-full justify-start gap-2 rounded-lg border-input bg-transparent px-2.5 text-[13px] font-normal shadow-none dark:bg-input/30",
  btnOutlineSm: "h-8 gap-1.5 text-[12px] font-medium",
  btnPrimarySm: "h-8 gap-1.5 text-[12px] font-semibold",
  btnDialog: "text-[13px] font-medium",
  btnDialogPrimary: "text-[13px] font-semibold",
  textarea:
    "text-[13px] font-normal leading-5 text-neutral-900 dark:text-neutral-100",
  textareaEditor:
    "min-h-[72px] w-full resize-y overflow-auto rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-[13px] font-normal leading-5 text-neutral-900 shadow-none outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-100",
};
