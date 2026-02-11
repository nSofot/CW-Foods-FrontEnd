import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/loadingSpinner";

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
	const [uoms, setUoms] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();
	const token = localStorage.getItem("token");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeRecord, setActiveRecord] = useState(null);
    const [activeImage, setActiveImage] = useState("/placeholder.png");
    const [activeTab, setActiveTab] = useState('Overview');

	useEffect(() => {
        if (!isLoading) return;
			window.scrollTo(0, 0);
			setIsLoading(true);
            const fetchInitialData = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    };

                    const [proRes, catRes, braRes, uomRes] = await Promise.all([
						axios.get(import.meta.env.VITE_BACKEND_URL + "/api/products", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom", config),
                    ]);
					setProducts(
						proRes.data.sort((a, b) => a.productId.localeCompare(b.productId))
					);
                    setCategories(catRes.data);
                    setBrands(braRes.data);
                    setUoms(uomRes.data);

                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

        fetchInitialData();			
	}, [location, isLoading]);

    function getCategoryName(categoryId) {  
        const category = categories.find(p => p.categoryId === categoryId);
        return category ? category.categoryName : categoryId;
    }

   function getBrandName(brandId) {      
        const brand = brands.find(p => p.brandId === brandId);
        return brand ? brand.brandName : brandId;
    }

    function getUomName(uomId) {      
        const uom = uoms.find(p => p.uomId === uomId);
        return uom ? uom.uomName : uomId;
    }

	function deleteProduct(productId) {
		const confirmed = window.confirm(
			"Are you sure you want to delete this product? This action cannot be undone."
		);

		if (!confirmed) return;

		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Please login first");
			return;
		}

		axios
			.delete(
				import.meta.env.VITE_BACKEND_URL + "/api/products/" + productId,
				{
					headers: {
						Authorization: "Bearer " + token,
					},
				}
			)
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
								<th className="px-4 py-2">Product</th>
								<th className="px-4 py-2 text-right">MRP</th>
								<th className="px-4 py-2 text-right">Discounted</th>
								<th className="px-4 py-2 text-right">Retail</th>
								<th className="px-4 py-2 text-right">Distributor</th>
								<th className="px-4 py-2 text-right">Discount</th>
								<th className="px-4 py-2 text-right">Stock</th>
								<th className="px-4 py-2">UOM</th>
								<th className="px-4 py-2">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{products.map((item, index) => (
								<tr
									key={index}
                         			onClick={() => {
										setActiveRecord(item);
										setIsModalOpen(true);
									}}									
									className="hover:bg-purple-100 transition duration-150 cursor-pointer">
									<td className="px-4 py-2">
										<img
											src={item.image[0]}
											alt={item.name}
											className="w-12 h-12 object-cover rounded-md"
										/>
									</td>
									<td className="px-4 py-2 font-medium">{item.productId}</td>
									<td className="px-4 py-2">
										<div className="flex flex-col">
											<span>{getBrandName(item.brandId)} {getCategoryName(item.categoryId)}</span>
											<span>{item.name}</span>
										</div>
									</td>
									<td className="px-4 py-2 text-right">{item.labelledPrice.toFixed(2)}</td>
									<td className="px-4 py-2 text-right">{item.price.toFixed(2)}</td>
									<td className="px-4 py-2 text-right">{item.retailPrice.toFixed(2)}</td>
									<td className="px-4 py-2 text-right">{item.distributorPrice.toFixed(2)}</td>
									<td className="px-4 py-2 text-right">{item.discountRate.toFixed(2) + "%"}</td>
									<td className="px-4 py-2 text-right">
										{item.stock.map(s => `${s.locationId}: ${s.quantity}`).join(", ")}
									</td>

									<td className="px-4 py-2">{getUomName(item.uomId)}</td>
									<td className="px-4 py-2">	
										<div className="flex gap-3">
											<button
												onClick={() => deleteProduct(item.productId)}
												className="text-red-600 hover:text-red-800 cursor-pointer"
											>
												<FaTrash className="text-lg" />
											</button>
											<button
												onClick={() =>
													navigate("/admin/edit-product", {
													state: {
														productId: item.productId,
														categoryName: getCategoryName(item.categoryId),
														brandName: getBrandName(item.brandId),
														uomId: item.uomId,
														uomName: getUomName(item.uomId),
														name: item.name,
														altNames: item.altName,
														description: item.description,
														image: item.image,
														labelledPrice: item.labelledPrice,
														price: item.price,
														retailPrice: item.retailPrice,
														distributorPrice: item.distributorPrice,
														discountRate: item.discountRate,
														stock: item.stock,
													},
												})}
												className="text-blue-600 hover:text-blue-800 cursor-pointer"
											>
												<FaEdit className="text-xl" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Order Details"
                overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
                className="max-w-4xl w-full h-[97vh] bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
                >
                {activeRecord && (
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="w-full flex justify-between items-center pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">🍭️ Product Details</h2>
                            <button
                            className="text-gray-500 hover:text-gray-800"
                            onClick={() => setIsModalOpen(false)}
                            >
                            ✖
                            </button>
                        </div>
                        <div className='flex gap-6'>      
                            <p className='text-center'><strong>Product:</strong> {getBrandName(activeRecord.brandId)} {getCategoryName(activeRecord.categoryId)} {activeRecord.name}</p>  
                            <p className='text-right'><strong>Stock:</strong> {activeRecord.stock ?? 0} {getUomName(activeRecord.uomId)}</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b gap-6 text-sm font-medium text-gray-600">
                            {['Overview', 'Bin Card'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 ${
                                activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : ''
                                }`}
                            >
                                {tab}
                            </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {/* {activeTab === 'Overview' && (
                            <ProductOverview product={activeRecord} getCategoryName={getCategoryName} />
                        )}

                        {activeTab === 'Bin Card' && (
                            <BinCardView product={activeRecord} />
                        )} */}


                    </div>
                )}
            </Modal>

		</div>
	);
}
