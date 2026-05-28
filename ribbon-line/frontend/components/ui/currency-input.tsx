"use client";

import { useState } from "react";
import { fieldInputClass } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { formatLkr, parsePriceInput } from "@/lib/currency";

interface CurrencyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}

export function CurrencyInput({ id, value, onChange, disabled, "aria-invalid": ariaInvalid }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = focused ? draft : value > 0 ? value.toFixed(2) : "";

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
        LKR
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          setDraft(value > 0 ? String(value) : "");
        }}
        onBlur={() => {
          setFocused(false);
          onChange(parsePriceInput(draft));
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          onChange(parsePriceInput(next));
        }}
        className={cn(fieldInputClass, "pl-12 pr-3 tabular-nums")}
      />
      {!focused && value > 0 ? (
        <p className="mt-1 text-xs text-zinc-500">{formatLkr(value)}</p>
      ) : null}
    </div>
  );
}
