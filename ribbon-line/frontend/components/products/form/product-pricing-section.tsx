"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";

interface ProductPricingSectionProps {
  buyingPrice: number;
  sellingPrice: number;
  errors: { buyingPrice?: string; sellingPrice?: string };
  onBuyingPriceChange: (value: number) => void;
  onSellingPriceChange: (value: number) => void;
}

export function ProductPricingSection({
  buyingPrice,
  sellingPrice,
  errors,
  onBuyingPriceChange,
  onSellingPriceChange
}: ProductPricingSectionProps) {
  return (
    <FormSection
      title="Pricing (LKR)"
      description="All amounts are in Sri Lankan Rupees. Customer-specific pricing can be added later."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Buying Price (LKR)"
          htmlFor="buying-price"
          required
          helper="Supplier or import cost for this product."
          error={errors.buyingPrice}
        >
          <CurrencyInput
            id="buying-price"
            value={buyingPrice}
            onChange={onBuyingPriceChange}
            aria-invalid={!!errors.buyingPrice}
          />
        </FormField>

        <FormField
          label="Default Selling Price (LKR)"
          htmlFor="selling-price"
          required
          helper="Default price used when no customer-specific price applies."
          error={errors.sellingPrice}
        >
          <CurrencyInput
            id="selling-price"
            value={sellingPrice}
            onChange={onSellingPriceChange}
            aria-invalid={!!errors.sellingPrice}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
