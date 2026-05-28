"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  imageUrl: string | null;
  uploading?: boolean;
  onSelect: (file: File) => void;
}

export function ImageUploader({ imageUrl, uploading, onSelect }: ImageUploaderProps) {
  return (
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
      <label
        className={cn(
          "flex flex-1 cursor-pointer flex-col justify-center rounded-xl border border-dashed border-white/15 bg-[#12121A] px-4 py-3 transition hover:border-violet-500/40 hover:bg-violet-500/5",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <span className="text-sm font-medium text-zinc-200">
          {uploading ? "Uploading image..." : "Upload product image"}
        </span>
        <span className="mt-1 text-xs text-zinc-500">PNG, JPG, or WebP. Recommended square image.</span>
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
    </div>
  );
}
