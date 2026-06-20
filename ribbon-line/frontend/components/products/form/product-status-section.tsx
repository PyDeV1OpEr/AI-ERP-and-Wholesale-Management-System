"use client";

import { FormSection } from "@/components/ui/form-section";
import { StatusToggle } from "@/components/ui/status-toggle";

interface ProductStatusSectionProps {
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
}

export function ProductStatusSection({ isActive, onActiveChange }: ProductStatusSectionProps) {
  return (
    <FormSection
      title="Status"
      description="Use Archive Manager to remove products from active catalog without losing stock history."
    >
      <StatusToggle isActive={isActive} onActiveChange={onActiveChange} />
    </FormSection>
  );
}
