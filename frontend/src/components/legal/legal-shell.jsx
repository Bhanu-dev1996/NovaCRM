import Link from "next/link";

export function LegalShell({ title, description, children }) {
  return (
    <div className="min-h-dvh w-full bg-[#eef0f6]">
      <header className="sticky top-0 z-50 bg-[#0b0620]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1080px] items-center justify-center px-6">
          <Link
            href="/login"
            className="group flex items-center gap-2.5"
            aria-label="NovaCRM AI"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nova-mark.svg"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain transition-opacity group-hover:opacity-90"
            />
            <span className="text-[18px] font-bold tracking-tight text-white">
              NovaCRM AI
            </span>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0b0620] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.28),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_40%),linear-gradient(180deg,transparent_60%,rgba(238,240,246,0.08)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent)]"
        />

        <div className="relative mx-auto w-full max-w-[1080px] px-6 pt-10 pb-14 desktop:pt-14 desktop:pb-16">
          <div className="max-w-[720px]">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-primary-300 uppercase">
              Legal &amp; support
            </p>
            <h1 className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-bold tracking-[-0.04em] text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-[52ch] text-[15px] leading-6 text-white/65 desktop:text-[16px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <main className="relative -mt-6 mx-auto w-full max-w-[1080px] px-6 pb-16 desktop:-mt-8 desktop:pb-24">
        <div className="grid gap-8 desktop:grid-cols-[200px_minmax(0,1fr)] desktop:gap-12">
          <aside className="hidden desktop:block">
            <div className="sticky top-24 space-y-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
                On this page
              </p>
              <p className="text-[13px] leading-5 text-neutral-500">
                Scroll through the sections below for the full document.
              </p>
              <div className="h-px w-10 bg-primary-500" />
            </div>
          </aside>

          <article className="min-w-0 rounded-[20px] border border-white bg-[#fbfbfd] px-6 py-2 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] desktop:px-10">
            <div className="divide-y divide-neutral-200/70">{children}</div>
          </article>
        </div>

        <footer className="mt-12 border-t border-neutral-200/80 pt-6 text-[12px] text-neutral-400">
          <span>© 2026 NovaCRM AI</span>
        </footer>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="scroll-mt-28 space-y-3 py-8 first:pt-7 last:pb-9">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-500"
        />
        <h2 className="text-[18px] leading-7 font-semibold tracking-[-0.015em] text-neutral-900">
          {title}
        </h2>
      </div>
      <div className="pl-[18px] space-y-3 text-[15px] leading-7 text-neutral-600 [&_a]:font-medium [&_a]:text-primary-600 [&_a]:underline-offset-2 hover:[&_a]:underline [&_h3]:pt-1 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-neutral-800 [&_strong]:font-semibold [&_strong]:text-neutral-800 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
