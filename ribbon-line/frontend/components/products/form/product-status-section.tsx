"use client";

import { FormSection } from "@/components/ui/form-section";
import { StatusToggle } from "@/components/ui/status-toggle";

interface ProductStatusSectionProps {
  isActive: boolean;
  isArchived: boolean;
  onActiveChange: (value: boolean) => void;
  onArchivedChange: (value: boolean) => void;
}

export function ProductStatusSection({
  isActive,
  isArchived,
  onActiveChange,
  onArchivedChange
}: ProductStatusSectionProps) {
  return (
    <FormSection
      title="Status"
      description="Archived products stay in the database and remain linked to historical records."
    >
      <StatusToggle
        isActive={isActive}
        isArchived={isArchived}
        onActiveChange={onActiveChange}
        onArchivedChange={onArchivedChange}
      />
    </FormSection>
  );
}
