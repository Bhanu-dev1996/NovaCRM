import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh bg-white desktop:grid-cols-[minmax(480px,1.05fr)_minmax(480px,0.95fr)]">
      <BrandPanel />
      <div className="relative min-h-dvh min-w-0 overflow-y-auto bg-white">
        {children}
      </div>
    </div>
  );
}
