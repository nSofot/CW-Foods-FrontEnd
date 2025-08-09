import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/loadingSpinner";

export default function AdminProductsPage() {
	const [products, setProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();
	const token = localStorage.getItem("token");

	useEffect(() => {
		window.scrollTo(0, 0);
		setIsLoading(true);
		axios
			.get(import.meta.env.VITE_BACKEND_URL + "/api/products")
			.then((res) => {
				setProducts(res.data);
				setIsLoading(false);
			});
	}, [location]);

	function deleteProduct(productId) {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Please login first");
			return;
		}
		axios
			.delete(import.meta.env.VITE_BACKEND_URL + "/api/products/" + productId, {
				headers: {
					Authorization: "Bearer " + token,
				},
			})
			.then(() => {
				toast.success("Product deleted successfully");
				setIsLoading(true); // reload products
			})
			.catch((e) => {
				toast.error(e.response?.data?.message || "Delete failed");
			});
	}

	return (
		<div className="w-full h-full flex flex-col p-4">
			<div className="flex justify-between items-center mb-4">
				<div>
					<h1 className="text-xl font-semibold text-gray-800">🛍️ Products</h1>
					<p className="text-sm text-gray-500">Manage your product inventory</p>
				</div>
				<Link
					to="/admin/add-product"
					className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow">
					+ Add New Product
				</Link>
			</div>

			<div className="bg-white shadow rounded-md overflow-x-auto">
				{isLoading ? (
					<LoadingSpinner />
				) : (
					<table className="min-w-full text-sm text-left border border-gray-200">
						<thead className="bg-purple-600 text-white">
							<tr>
								<th className="px-4 py-2">Image</th>
								<th className="px-4 py-2">Product ID</th>
								<th className="px-4 py-2">Name</th>
								<th className="px-4 py-2 text-right">Labelled Price</th>
								<th className="px-4 py-2 text-right">Selling Price</th>
								<th className="px-4 py-2 text-right">Wholesale Price</th>
								<th className="px-4 py-2 text-right">Stock</th>
								<th className="px-4 py-2">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{products.map((item, index) => (
								<tr
									key={index}
									className="hover:bg-purple-100 transition duration-150">
									<td className="px-4 py-2">
										<img
											src={item.image[0]}
											alt={item.name}
											className="w-12 h-12 object-cover rounded-md"
										/>
									</td>
										<td className="px-4 py-2 font-medium">{item.productId}</td>
										<td className="px-4 py-2">{item.name}</td>
										<td className="px-4 py-2 text-right">{item.labelledPrice.toFixed(2)}</td>
										<td className="px-4 py-2 text-right">{item.price.toFixed(2)}</td>
										<td className="px-4 py-2 text-right">{item.wholesalePrice.toFixed(2)}</td>
										<td className="px-4 py-2 text-right">{item.stock}</td>
										<td className="px-4 py-2">
											
										<div className="flex gap-3">
											<button
												onClick={() => deleteProduct(item.productId)}
												className="text-red-600 hover:text-red-800"
											>
												<FaTrash className="text-lg" />
											</button>
											<button
												onClick={() =>
													navigate("/admin/edit-product", {
														state: {
															productId: item.productId,
															name: item.name,
															altNames: item.altName,
															description: item.description,
															image: item.image,
															labelledPrice: item.labelledPrice,
															price: item.price,
															wholesalePrice: item.wholesalePrice,
															stock: item.stock,
														},
													})
												}
												className="text-blue-600 hover:text-blue-800"
											>
												<FaEdit className="text-lg" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
