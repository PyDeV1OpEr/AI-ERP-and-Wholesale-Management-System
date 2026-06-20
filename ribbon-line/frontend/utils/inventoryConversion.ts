export interface InventoryConversionResult {
  mainUnits: number;
  remainingBaseUnits: number;
  display: string;
}

function pluralize(unitName: string, quantity: number): string {
  if (quantity === 1 || unitName.endsWith("s")) return unitName;
  return `${unitName}s`;
}

export function convertInventory({
  quantity,
  conversionFactor,
  mainUnitName,
  baseUnitName,
}: {
  quantity: number;
  conversionFactor: number;
  mainUnitName: string;
  baseUnitName: string;
}): InventoryConversionResult {
  const safeQuantity = Math.max(0, Math.trunc(quantity || 0));
  const safeFactor = Math.max(1, Math.trunc(conversionFactor || 1));
  const mainUnits = Math.floor(safeQuantity / safeFactor);
  const remainingBaseUnits = safeQuantity % safeFactor;
  const parts: string[] = [];

  if (mainUnits > 0) {
    parts.push(`${mainUnits.toLocaleString()} ${pluralize(mainUnitName, mainUnits)}`);
  }
  if (remainingBaseUnits > 0 || parts.length === 0) {
    parts.push(`${remainingBaseUnits.toLocaleString()} ${pluralize(baseUnitName, remainingBaseUnits)}`);
  }

  return {
    mainUnits,
    remainingBaseUnits,
    display: parts.join(" + "),
  };
}
