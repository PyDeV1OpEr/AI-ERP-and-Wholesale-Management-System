"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { resolveProductImageUrl } from "@/lib/product-image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackLabel?: string;
  showFallbackLabel?: boolean;
}

export function ProductImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackLabel = "No image",
  showFallbackLabel = true
}: ProductImageProps) {
  const resolvedSrc = resolveProductImageUrl(src);
  const [failed, setFailed] = useState(false);

  const shellClass = cn("overflow-hidden bg-[#12121A]", containerClassName);

  if (!resolvedSrc || failed) {
    return (
      <div className={cn(shellClass, "flex flex-col items-center justify-center text-zinc-600")}>
        <ImageIcon className="h-6 w-6 opacity-60" strokeWidth={1.5} />
        {showFallbackLabel && fallbackLabel ? (
          <span className="mt-1 text-[10px] text-zinc-500">{fallbackLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
