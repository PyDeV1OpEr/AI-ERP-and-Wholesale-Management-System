"use client";

import { useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { PRODUCT_ICON_CATEGORIES, PRODUCT_ICONS, type ProductIconCategory } from "@/lib/product-icons";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  imageUrl: string | null;
  uploading?: boolean;
  onSelect: (file: File) => void;
  onImageUrlChange?: (value: string | null) => void;
}

export function ImageUploader({ imageUrl, uploading, onSelect, onImageUrlChange }: ImageUploaderProps) {
  const [activeCategory, setActiveCategory] = useState<ProductIconCategory>("ribbon");
  const visibleIcons = useMemo(
    () => PRODUCT_ICONS.filter((icon) => icon.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#12121A]">
        {imageUrl ? (
          <ProductImage
            src={imageUrl}
            alt="Product preview"
            className="h-full w-full object-cover"
            containerClassName="h-full w-full"
          />
        ) : (
          <ImagePlus className="h-6 w-6 text-zinc-600" />
        )}
        </div>
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer flex-col justify-center rounded-xl border border-dashed border-white/15 bg-[#12121A] px-4 py-3 transition hover:border-violet-500/40 hover:bg-violet-500/5",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <span className="text-sm font-medium text-zinc-200">
              {uploading ? "Uploading image..." : "Upload custom image"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">PNG, JPG, or WebP. Square works best.</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onSelect(file);
              }}
            />
            {uploading ? <Loader2 className="mt-2 h-4 w-4 animate-spin text-violet-400" /> : null}
          </label>
          <button
            type="button"
            disabled={!imageUrl}
            onClick={() => onImageUrlChange?.(null)}
            className="rounded-xl border border-white/10 bg-[#12121A] px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Remove image
            <span className="mt-1 block text-xs text-zinc-500">Clear the current preview.</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] p-3">
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
          {PRODUCT_ICON_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs capitalize transition",
                activeCategory === category
                  ? "bg-violet-500/20 text-violet-100"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
          {visibleIcons.map((icon) => (
            <button
              key={icon.url}
              type="button"
              title={icon.label}
              onClick={() => onImageUrlChange?.(icon.url)}
              className={cn(
                "aspect-square rounded-lg border p-1.5 transition hover:border-violet-400/60",
                imageUrl === icon.url ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-black/10"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon.url} alt={icon.label} loading="lazy" className="h-full w-full rounded-md object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
