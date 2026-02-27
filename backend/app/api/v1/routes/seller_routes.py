"""
Seller router - /api/seller/*
Seller protected APIs. Requires JWT with role seller or admin.
"""
from fastapi import APIRouter

from . import seller_dashboard, products, vendors, categories, variants, attributes, attribute_values

router = APIRouter(prefix="/api/seller", tags=["Seller"])

router.include_router(seller_dashboard.router)
router.include_router(products.router)
router.include_router(vendors.router)
router.include_router(categories.router)
router.include_router(variants.router)
router.include_router(attributes.router)
router.include_router(attribute_values.router)
