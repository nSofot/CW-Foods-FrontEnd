import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductSelector = ({ onSelect, selectedProductId }) => {
    const [categories, setCategory] = useState([]);
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch products, categories, brands, and uoms
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, categoryRes, brandRes, uomRes] = await Promise.all([
                    axios.get(import.meta.env.VITE_BACKEND_URL + "/api/products"),
                    axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category"),
                    axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand"),
                    axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom"),
                ]);

                setProducts(productRes.data);
                setFilteredProducts(productRes.data);
                setCategory(categoryRes.data);
                setBrands(brandRes.data);
                setUoms(uomRes.data);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load products, brands, or UOMs.");
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Unified filter: category-wise, brand-wise, or both
    useEffect(() => {
        let filtered = products;

        if (selectedCategoryId) {
            filtered = filtered.filter(p => p.categoryId === selectedCategoryId);
        }

        if (selectedBrandId) {
            filtered = filtered.filter(p => p.brandId === selectedBrandId);
        }

        setFilteredProducts(filtered);
    }, [selectedCategoryId, selectedBrandId, products]);

    const handleCategoryChange = (e) => {
        setSelectedCategoryId(e.target.value);
        onSelect(null);
    };

    const handleBrandChange = (e) => {
        setSelectedBrandId(e.target.value);
        onSelect(null);
    };

    const handleProductChange = (e) => {
        const selectedId = e.target.value;
        const selectedProduct = products.find(p => p.productId === selectedId);

        if (selectedProduct) {
            const category = categories.find(c => c.categoryId === selectedProduct.categoryId);
            const brand = brands.find(b => b.brandId === selectedProduct.brandId);
            const uom = uoms.find(u => u.uomId === selectedProduct.uomId);

            const enrichedProduct = {
                ...selectedProduct,
                categoryName: category ? category.categoryName : "Unknown",
                brandName: brand ? brand.brandName : "Unknown",
                uomName: uom ? uom.uomName : "Unknown"
            };

            onSelect(enrichedProduct);
        } else {
            onSelect(null);
        }
    };

    if (isLoading) return <p>Loading data...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div className="flex flex-col gap-4">
            {/* Category Filter */}
            <div className="flex flex-col gap-1">
                <label htmlFor="category-select" className="text-sm font-medium text-gray-700">
                    Filter by Category
                </label>
                <select
                    id="category-select"
                    value={selectedCategoryId}
                    onChange={handleCategoryChange}
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- All Categories --</option>
                    {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId}>
                            {category.categoryName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Brand Filter */}
            <div className="flex flex-col gap-1">
                <label htmlFor="brand-select" className="text-sm font-medium text-gray-700">
                    Filter by Brand
                </label>
                <select
                    id="brand-select"
                    value={selectedBrandId}
                    onChange={handleBrandChange}
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- All Brands --</option>
                    {brands.map(brand => (
                        <option key={brand.brandId} value={brand.brandId}>
                            {brand.brandName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Product Selector */}
            <div className="flex flex-col gap-1">
                <label htmlFor="product-select" className="text-sm font-medium text-gray-700">
                    Select Product
                </label>
                <select
                    id="product-select"
                    value={selectedProductId || ""}
                    onChange={handleProductChange}
                    className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Choose a Product --</option>
                    {filteredProducts.map(product => (
                        <option key={product.productId} value={product.productId}>
                            {product.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ProductSelector;
