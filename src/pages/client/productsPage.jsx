import axios from "axios";
import { useEffect, useState } from "react";
import ProductCard from "../../components/productCard";
import LoadingSpinner from "../../components/loadingSpinner";
import toast from "react-hot-toast";

export default function ProductPage() {
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [brands, setBrands] = useState([]);
	const [uoms, setUoms] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [query, setQuery] = useState("");

	
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/search?query=${query}`);
				const catRes = axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category");
				const braRes = axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand");
				const uomRes = axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom");

				const categories = (await catRes).data;
				const brands = (await braRes).data;
				const uoms = (await uomRes).data;

				// enrich products with names
				const enrichedProducts = response.data.map((p) => ({
				...p,
				categoryName: categories.find((c) => c.categoryId === p.categoryId)?.categoryName || p.categoryId,
				brandName: brands.find((b) => b.brandId === p.brandId)?.brandName || p.brandId,
				uomName: uoms.find((u) => u.uomId === p.uomId)?.uomName || p.uomId,
				}));

				setProducts(enrichedProducts);
				setCategories(categories);
				setBrands(brands);
				setUoms(uoms);

			} catch (err) {
				console.error("Search request failed:", err);
				toast.error("Failed to fetch products.");
			} finally {
				setIsLoading(false);
			}
		};

		if (isLoading) {
			fetchProducts();
		}
	}, [isLoading, query]);

	return (
		<div className="w-full h-full flex justify-top items-center flex-col gap-4 p-4">
			<input
				type="text"
				placeholder="Search for products..."
				className="w-[400px] h-[50px] p-2 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setIsLoading(true);
				}}
			/>

			<div className="w-full h-full flex flex-wrap justify-center items-center">
				{isLoading ? (
					<LoadingSpinner />
				) : products.length === 0 ? (
					<p className="text-gray-500 text-lg mt-4">No products found.</p>
				) : (
					products.map((product) => (
						<ProductCard key={product.productId} product={product} />
					))
				)}
			</div>
		</div>
	);
}
