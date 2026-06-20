export type ProductIconCategory =
  | "stationery"
  | "floral"
  | "ribbon"
  | "textile"
  | "office"
  | "tools"
  | "electronics"
  | "miscellaneous";

export interface ProductIconOption {
  category: ProductIconCategory;
  label: string;
  url: string;
}

const ICON_SLUGS: Record<ProductIconCategory, string[]> = {
  stationery: ["notebook", "pencil", "eraser", "ruler", "marker", "clipboard", "paper-stack", "binder", "stapler", "tape-dispenser", "scissors", "folder", "label-roll"],
  floral: ["floral-tape", "rose-bundle", "leaf-spray", "stem-wire", "petal-pack", "bouquet-wrap", "garden-tie", "flower-box", "floral-foam", "wreath-ring", "orchid-clip", "vase-wrap", "bud-roll"],
  ribbon: ["satin-ribbon", "grosgrain-roll", "organza-pack", "velvet-spool", "curling-ribbon", "lace-roll", "bow-pack", "ribbon-card", "metallic-roll", "printed-ribbon", "edge-ribbon", "wide-ribbon", "thin-ribbon"],
  textile: ["fabric-roll", "thread-cone", "lace-bundle", "felt-pack", "canvas-roll", "cotton-bale", "zipper-pack", "button-box", "elastic-roll", "needle-set", "yarn-ball", "trim-spool", "linen-fold"],
  office: ["file-box", "desk-tray", "paper-ream", "ink-cartridge", "toner-box", "stamp-pad", "calculator", "pen-cup", "badge-holder", "receipt-roll", "envelope-pack", "whiteboard-kit", "desk-labels"],
  tools: ["toolbox", "wrench", "hammer", "pliers", "utility-knife", "measuring-tape", "glue-gun", "drill-bit", "screw-pack", "brush-set", "clamp", "safety-glove", "cutting-mat"],
  electronics: ["adapter", "cable-roll", "led-strip", "battery-pack", "switch-box", "sensor", "charger", "connector-kit", "circuit-board", "display-module", "power-supply", "usb-hub", "wire-spool"],
  miscellaneous: ["storage-bin", "shipping-box", "poly-bag", "wrap-roll", "tag-pack", "sample-card", "gift-box", "cleaning-cloth", "jar-pack", "seal-roll", "clip-pack", "hanger-set", "misc-cube"],
};

function toLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const PRODUCT_ICON_CATEGORIES: ProductIconCategory[] = [
  "stationery",
  "floral",
  "ribbon",
  "textile",
  "office",
  "tools",
  "electronics",
  "miscellaneous",
];

export const PRODUCT_ICONS: ProductIconOption[] = PRODUCT_ICON_CATEGORIES.flatMap((category) =>
  ICON_SLUGS[category].map((slug) => ({
    category,
    label: toLabel(slug),
    url: `/assets/product-icons/${category}/${slug}.svg`,
  }))
);
