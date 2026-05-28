import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
