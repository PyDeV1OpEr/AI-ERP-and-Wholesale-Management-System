import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, helper, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-200">
        {label}
        {required ? <span className="ml-1 text-violet-400">*</span> : null}
      </label>
      {children}
      {helper && !error ? <p className="text-xs text-zinc-500">{helper}</p> : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export const fieldInputClass =
  "w-full rounded-xl border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20";
