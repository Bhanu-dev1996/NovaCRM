import Link from "next/link";

import { crmType } from "@/lib/crm-typography";
import { cn } from "@/lib/utils";

/**
 * @param {{ items: { href?: string; label: string }[]; className?: string }} props
 */
export function PageBreadcrumb({ items, className }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        crmType.breadcrumb,
        className
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <span
                  className="text-primary-300 dark:text-primary-700"
                  aria-hidden
                >
                  /
                </span>
              ) : null}
              {!isLast && item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast &&
                      "font-medium text-primary-800 dark:text-primary-200"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
