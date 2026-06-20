from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class InventoryConversion:
    main_units: int
    remaining_base_units: int
    display: str


def _pluralize(unit_name: str, quantity: int) -> str:
    if quantity == 1:
        return unit_name
    if unit_name.endswith("s"):
        return unit_name
    return f"{unit_name}s"


def convert_inventory(
    *,
    quantity: int,
    conversion_factor: int,
    main_unit_name: str,
    base_unit_name: str,
) -> InventoryConversion:
    if quantity < 0:
        raise ValueError("Inventory quantity cannot be negative.")
    if conversion_factor <= 0:
        raise ValueError("Conversion factor must be greater than zero.")

    main_units = quantity // conversion_factor
    remaining_base_units = quantity % conversion_factor
    display_parts: list[str] = []
    if main_units:
        display_parts.append(f"{main_units:,} {_pluralize(main_unit_name, main_units)}")
    if remaining_base_units or not display_parts:
        display_parts.append(f"{remaining_base_units:,} {_pluralize(base_unit_name, remaining_base_units)}")

    return InventoryConversion(
        main_units=main_units,
        remaining_base_units=remaining_base_units,
        display=" + ".join(display_parts),
    )
