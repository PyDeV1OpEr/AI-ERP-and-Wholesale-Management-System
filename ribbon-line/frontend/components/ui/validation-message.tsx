import { AlertCircle } from "lucide-react";

interface ValidationMessageProps {
  message: string;
}

export function ValidationMessage({ message }: ValidationMessageProps) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <p className="text-sm text-rose-200">{message}</p>
    </div>
  );
}
