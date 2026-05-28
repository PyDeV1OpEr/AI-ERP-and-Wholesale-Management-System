from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.products import Brand, Category, Product, ProductUnit, ProductPackagingConversion, StockMovement


DEMO_BRANDS = ["Ribbon Line", "PremiumWeave", "SilkRoute", "EcoFiber"]
DEMO_CATEGORIES = ["Premium Rolls", "Standard Packs", "Bulk Bundles", "Eco Line"]
DEMO_PRODUCTS = [
    {
        "name": "Ribbon Line Premium Roll",
        "brand": "Ribbon Line",
        "category": "Premium Rolls",
        "base_unit": "Roll",
        "selling_price": 58.25,
        "cost_price": 32.50,
        "stock_quantity": 1240,
        "max_capacity": 1800,
        "reorder_level": 600,
        "standard_pack_size": 24,
        "packaging": [{"unit_name": "Box", "contains": 24}, {"unit_name": "Pallet", "contains": 48}],
    },
    {
        "name": "Ribbon Line Standard Pack",
        "brand": "Ribbon Line",
        "category": "Standard Packs",
        "base_unit": "Pack",
        "selling_price": 42.00,
        "cost_price": 22.80,
        "stock_quantity": 510,
        "max_capacity": 1200,
        "reorder_level": 500,
        "standard_pack_size": 20,
        "packaging": [{"unit_name": "Carton", "contains": 20}],
    },
    {
        "name": "Ribbon Line Midweight Bundle",
        "brand": "Ribbon Line",
        "category": "Bulk Bundles",
        "base_unit": "Bundle",
        "selling_price": 76.00,
        "cost_price": 45.00,
        "stock_quantity": 780,
        "max_capacity": 1500,
        "reorder_level": 400,
        "standard_pack_size": 10,
        "packaging": [{"unit_name": "Bale", "contains": 10}],
    },
    {
        "name": "PremiumWeave Silk Ribbon",
        "brand": "PremiumWeave",
        "category": "Premium Rolls",
        "base_unit": "Roll",
        "selling_price": 92.00,
        "cost_price": 58.00,
        "stock_quantity": 45,
        "max_capacity": 400,
        "reorder_level": 100,
        "standard_pack_size": 12,
        "packaging": [{"unit_name": "Box", "contains": 12}],
    },
    {
        "name": "EcoFiber Jute Wrap Roll",
        "brand": "EcoFiber",
        "category": "Eco Line",
        "base_unit": "Roll",
        "selling_price": 34.00,
        "cost_price": 18.50,
        "stock_quantity": 0,
        "max_capacity": 600,
        "reorder_level": 200,
        "standard_pack_size": 1,
        "packaging": [],
    },
    {
        "name": "SilkRoute Organza Pack",
        "brand": "SilkRoute",
        "category": "Standard Packs",
        "base_unit": "Pack",
        "selling_price": 65.00,
        "cost_price": 38.00,
        "stock_quantity": 230,
        "max_capacity": 800,
        "reorder_level": 150,
        "standard_pack_size": 25,
        "packaging": [{"unit_name": "Carton", "contains": 25}],
    },
    {
        "name": "EcoFiber Hemp Twine Bundle",
        "brand": "EcoFiber",
        "category": "Eco Line",
        "base_unit": "Bundle",
        "selling_price": 28.00,
        "cost_price": 14.00,
        "stock_quantity": 15,
        "max_capacity": 300,
        "reorder_level": 80,
        "standard_pack_size": 1,
        "packaging": [],
    },
    {
        "name": "PremiumWeave Velvet Ribbon Spool",
        "brand": "PremiumWeave",
        "category": "Premium Rolls",
        "base_unit": "Spool",
        "selling_price": 120.00,
        "cost_price": 72.00,
        "stock_quantity": 890,
        "max_capacity": 1200,
        "reorder_level": 300,
        "standard_pack_size": 6,
        "packaging": [{"unit_name": "Case", "contains": 6}, {"unit_name": "Pallet", "contains": 24}],
    },
]

DEMO_MOVEMENTS = [
    {"type": "received", "quantity": 200, "notes": "Supplier restock — main warehouse"},
    {"type": "sent", "quantity": -50, "notes": "Fulfilled order #ORD-3021"},
    {"type": "received", "quantity": 120, "notes": "Supplier restock — express shipment"},
    {"type": "sent", "quantity": -30, "notes": "Fulfilled order #ORD-3018"},
    {"type": "adjusted", "quantity": -5, "notes": "Quality check — damaged units removed"},
    {"type": "received", "quantity": 500, "notes": "Bulk supplier restock"},
]


def seed_demo_data(db: Session) -> None:
    existing_count = db.query(Product).count()
    if existing_count > 0:
        return

    brand_map: dict[str, Brand] = {}
    for name in DEMO_BRANDS:
        existing = db.query(Brand).filter(Brand.name == name).first()
        if existing:
            brand_map[name] = existing
        else:
            brand = Brand(name=name)
            db.add(brand)
            db.flush()
            brand_map[name] = brand

    category_map: dict[str, Category] = {}
    for name in DEMO_CATEGORIES:
        existing = db.query(Category).filter(Category.name == name).first()
        if existing:
            category_map[name] = existing
        else:
            category = Category(name=name)
            db.add(category)
            db.flush()
            category_map[name] = category

    for idx, data in enumerate(DEMO_PRODUCTS):
        product = Product(
            name=data["name"],
            brand_id=brand_map[data["brand"]].id,
            category_id=category_map[data["category"]].id,
            base_unit=data["base_unit"],
            selling_price=data["selling_price"],
            cost_price=data["cost_price"],
            stock_quantity=data["stock_quantity"],
            max_capacity=data["max_capacity"],
            reorder_level=data["reorder_level"],
            standard_pack_size=data["standard_pack_size"],
            is_active=True,
            is_archived=False,
        )
        db.add(product)
        db.flush()

        units: list[ProductUnit] = [
            ProductUnit(product_id=product.id, name=data["base_unit"], is_base=True, level=0)
        ]
        for level_idx, pkg in enumerate(data["packaging"], start=1):
            units.append(
                ProductUnit(
                    product_id=product.id,
                    name=pkg["unit_name"],
                    is_base=False,
                    level=level_idx,
                )
            )
        db.add_all(units)
        db.flush()

        unit_map = {u.name.lower(): u for u in units}
        conversions: list[ProductPackagingConversion] = []
        child_name = data["base_unit"]
        for pkg in data["packaging"]:
            parent = unit_map[pkg["unit_name"].lower()]
            child = unit_map[child_name.lower()]
            conversions.append(
                ProductPackagingConversion(
                    product_id=product.id,
                    parent_unit_id=parent.id,
                    child_unit_id=child.id,
                    quantity=pkg["contains"],
                )
            )
            child_name = pkg["unit_name"]
        db.add_all(conversions)

        for mov in DEMO_MOVEMENTS:
            movement = StockMovement(
                product_id=product.id,
                quantity=abs(mov["quantity"]) if mov["type"] == "received" else -abs(mov["quantity"]),
                type=mov["type"],
                notes=mov["notes"],
            )
            db.add(movement)

    db.commit()
