export interface InventoryConversion {
  mainUnits: number;
  remainingBaseUnits: number;
  display: string;
}

function pluralize(unitName: string, quantity: number): string {
  if (quantity === 1) {
    return unitName;
  }
  if (unitName.endsWith("s")) {
    return unitName;
  }
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
}): InventoryConversion {
  if (quantity < 0) {
    throw new Error("Inventory quantity cannot be negative.");
  }
  if (conversionFactor <= 0) {
    throw new Error("Conversion factor must be greater than zero.");
  }

  const mainUnits = Math.floor(quantity / conversionFactor);
  const remainingBaseUnits = quantity % conversionFactor;
  const displayParts: string[] = [];

  if (mainUnits) {
    displayParts.push(
      `${mainUnits.toLocaleString()} ${pluralize(mainUnitName, mainUnits)}`
    );
  }

  if (remainingBaseUnits || displayParts.length === 0) {
    displayParts.push(
      `${remainingBaseUnits.toLocaleString()} ${pluralize(
        baseUnitName,
        remainingBaseUnits
      )}`
    );
  }

  return {
    mainUnits,
    remainingBaseUnits,
    display: displayParts.join(" + "),
  };
}
