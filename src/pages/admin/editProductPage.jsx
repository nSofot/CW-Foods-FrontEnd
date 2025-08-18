import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import mediaUpload from "../../utils/mediaUpload";

export default function EditProductPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);

	const [productId, setProductId] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [brandName, setBrandName] = useState("");
	const [uomName, setUomName] = useState("");
	const [uom, setUom] = useState([]);
    const [uomId, setUomId] = useState("");	
	const [name, setName] = useState("");
	const [altNames, setAltNames] = useState("");
	const [description, setDescription] = useState("");
	const [image, setImage] = useState([]);
    const [marketPrice, setMarketPrice] = useState("");
    const [retailPrice, setRetailPrice] = useState("");
    const [distributorPrice, setDistributorPrice] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");
    const [discountRate, setDiscountRate] = useState("");

	const [existingImages, setExistingImages] = useState([]);


	useEffect(() => {
	if (location.state) {
		const data = location.state;
		setProductId(data.productId || "");
		setCategoryName(data.categoryName || "");
		setBrandName(data.brandName || "");
		setUomName(data.uomName || "");
		setUomId(data.uomId || "");
		setName(data.name || "");
		setAltNames(Array.isArray(data.altNames) ? data.altNames.join(", ") : "");
		setDescription(data.description || "");
		setMarketPrice(data.labelledPrice || "");
		setDiscountedPrice(data.price || "");
		setRetailPrice(data.retailPrice || "");
		setDistributorPrice(data.distributorPrice || "");
		setDiscountRate(data.discountRate || "");
		setExistingImages(data.image || []);
	}
	}, [location.state]);

    useEffect(() => {
        if (!isLoading) return;

            const fetchInitialData = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    };

                    const [uomRes] = await Promise.all([
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom", config),
                    ]);

                    setUom(uomRes.data);

                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

        fetchInitialData();

    }, [isLoading]);

	async function updateProduct() {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Please login first");
			return;
		}

		try {
			let uploadedNewImages = [];

			if (image.length > 0) {
			const uploadPromises = image.map((img) => mediaUpload(img));
			uploadedNewImages = await Promise.all(uploadPromises);
			}

			const updatedProduct = {
				name,
				altName: altNames.split(",").map((n) => n.trim()),
				description,
				image: [...existingImages, ...uploadedNewImages],
				labelledPrice: marketPrice,
				price: discountedPrice,
				retailPrice,
				distributorPrice,
				discountRate,
			};

			await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`, updatedProduct, {
			headers: { Authorization: "Bearer " + token },
			});

			toast.success("Product updated successfully");
			navigate(-1);
		} catch (error) {
			console.error(error);
			toast.error(error?.response?.data?.message || "Update failed");
		}
	}

	return (

		<div className="w-full h-full flex flex-col p-4">
			<div className="flex justify-between items-center mb-4">
				<div>
					<h1 className="text-xl font-semibold text-gray-800">✏️ Edit Product</h1>
					<p className="text-sm text-gray-500">Update existing product information</p>
				</div>
				{/* Update Button */}
				<div className="flex justify-end gap-6">
					<button
                        disabled={isUpdating}
                        onClick={async () => {
                            if (isUpdating) return;
                            setIsUpdating(true);
                            const id = toast.loading("Updating product....");
                            await updateProduct();
                            toast.dismiss(id);
                            setIsUpdating(false);
                        }}
                        className={`px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 active:bg-purple-800 transition disabled:opacity-50`}
                    >
                        {isUpdating ? "Updating..." : "Update Product"}
					</button>
					<button
						onClick={() => navigate(-1)}
						className="bg-red-500 hover:bg-red-600 text-white px-10 py-2 rounded-md text-sm font-medium shadow"
					>
						Cancel
					</button>
				</div>
			</div>

			<div className="bg-white w-full px-10 py-6 shadow rounded-xl border border-gray-200 flex flex-col">

				<div className=" flex justify-between">				
					{/* Left Column */}
					<div className="w-[55%] h-full space-y-6">
						<div className="w-full flex justify-between">
							<div className='w-[48%]'>
								<label className="text-sm font-medium block mb-1">Brand *</label>
								<span className="px-2 py-2 text-sm font-medium block bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1">{brandName}</span>
							</div>							
							<div className='w-[48%]'>
								<label className="text-sm font-medium block mb-1">Category *</label>
								<span className="px-2 py-2 text-sm font-medium block bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1">{categoryName}</span>
							</div>
						</div>

						<div className="w-full flex justify-between">
							<div className="w-[68%]">
								<label className="block text-sm text-gray-700 mb-1">Product Name *</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. Apple iPhone 15"
								/>
							</div>
							<div className='w-[28%]'>
								<label className="text-sm font-medium block mb-1">UOM *</label>
								<select
									value={uomId}
									onChange={(e) => setUomId(e.target.value)}
									className="w-full text-sm  border border-gray-300 rounded-md p-2 focus:outline-blue-500"
								>
									<option value="">Select UOM</option>
									{uom.map(uoms => (
									<option key={uoms.uomId} value={uoms.uomId}>
										{uoms.uomName}
									</option>
									))}
								</select>
							</div>                                
						</div>

						{/* Alt Names */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Alt Names (comma-separated)</label>
							<input
								type="text"
								value={altNames}
								onChange={(e) => setAltNames(e.target.value)}
								className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="e.g. Chilli Powder, Red Chilli Powder, Red Chilli, Miris Kudu, මිරිස් කුඩු, மிளகாய் தூள்"
							/>
						</div>

						{/* Description */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
							rows="2"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Write a detailed description of the product..."
							></textarea>
						</div>

						<div className="w-full flex justify-between gap-2">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">MRP *</label>
								<input
									type="number"
									value={marketPrice}
									onChange={(e) => setMarketPrice(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. 900.00"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Discounted *</label>
								<input
									type="number"
									value={discountedPrice}
									onChange={(e) => setDiscountedPrice(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. 950.00"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Retail *</label>
								<input
									type="number"
									value={retailPrice}
									onChange={(e) => setRetailPrice(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. 600.00"
								/>    
							</div>                          
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Distributor *</label>
								<input
									type="number"
									value={distributorPrice}
									onChange={(e) => setDistributorPrice(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. 500.00"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Discount % *</label>
								<input
									type="number"
									value={discountRate}
									onChange={(e) => setDiscountRate(e.target.value)}
									className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g. 10"
								/>
							</div>                              
                        </div>

					</div>


					{/* Right Column */}
					<div className="w-[40%] h-full rounded-lg flex flex-col justify-between">
						{/* Existing Images */}
						<p className="text-sm text-gray-700 font-medium mb-1">Existing Images</p>
						<div className="w-full h-80 overflow-y-auto bg-white rounded-md shadow-inner">
						{existingImages.length > 0 && (
							<div className="space-y-2">
								<div className="grid grid-cols-3 gap-3">
									{/* Existing Images */}
									{existingImages.map((imgUrl, index) => (
									<div key={`existing-${index}`} className="relative border rounded-md overflow-hidden group">
										<img src={imgUrl} alt={`existing-${index}`} className="w-full h-20 object-cover" />
										<button
										type="button"
										onClick={() => {
											const filtered = existingImages.filter((_, i) => i !== index);
											setExistingImages(filtered);
										}}
										className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs rounded-full px-2 py-0.5 hover:bg-red-600"
										>
										✕
										</button>
									</div>
									))}

									{/* New Images */}
									{image.map((file, index) => (
									<div key={`new-${index}`} className="relative border rounded-md overflow-hidden group">
										<img src={URL.createObjectURL(file)} alt={`new-${index}`} className="w-full h-20 object-cover" />
										<button
										type="button"
										onClick={() => {
											const filtered = image.filter((_, i) => i !== index);
											setImage(filtered);
										}}
										className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs rounded-full px-2 py-0.5 hover:bg-red-600"
										>
										✕
										</button>
									</div>
									))}
								</div>
							</div>
						)}
						</div>


						{/* Image Upload */}
						<div className="mt-8">
							<label className="block text-sm font-medium text-gray-700 mb-1">Add New Images (optional)</label>
							<input
							type="file"
							multiple
							onChange={(e) => setImage(Array.from(e.target.files))}
							className="w-full text-sm text-blue-500 font-italic file-input file-input-bordered rounded-lg cursor-pointer hover:text-blue-800"
							/>
						</div>
					</div>
				</div>
			</div> 
		</div>
	);
}
