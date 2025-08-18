import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import mediaUpload from "../../utils/mediaUpload";
import LoadingSpinner from "../../components/loadingSpinner";

export default function AddProductPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [altNames, setAltNames] = useState("");
    const [category, setCategory] = useState([]);
    const [brand, setBrand] = useState([]);
    const [uom, setUom] = useState([]);
    const [categoryId, setCategoryId] = useState("");
    const [brandId, setBrandId] = useState("");
    const [uomId, setUomId] = useState("");
    // const [categoryName, setCategoryName] = useState("");
    // const [brandName, setBrandName] = useState("");
    // const [uomName, setUomName] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState([]);
    const [marketPrice, setMarketPrice] = useState("");
    const [retailPrice, setRetailPrice] = useState("");
    const [distributorPrice, setDistributorPrice] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");
    const [discountRate, setDiscountRate] = useState("");


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

                    const [catRes, braRes, uomRes] = await Promise.all([
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom", config),
                    ]);

                    setCategory(catRes.data);
                    setBrand(braRes.data);
                    setUom(uomRes.data);

                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

        fetchInitialData();

    }, [isLoading]);


    const handleAddProduct = async () => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please log in first.");

        if (!name  || !categoryId|| !brandId || !uomId || !marketPrice || !retailPrice || !distributorPrice || !discountedPrice || !discountRate) {
          return toast.error("Please fill in all required fields.");
        }

        if (image.length === 0) {
          return toast.error("Please select at least one product image.");
        }

        try {
            const uploadedImages = await Promise.all(image.map((img) => mediaUpload(img)));

            const newProduct = {
                categoryId,
                brandId,
                uomId,
                name,
                altName: altNames.split(",").map((n) => n.trim()),
                description,
                image: uploadedImages,
                labelledPrice: Number(marketPrice),
                price: Number(discountedPrice),
                retailPrice: Number(retailPrice),
                distributorPrice: Number(distributorPrice),
                discountRate: Number(discountRate),
                averageCost: Number(0),
                stock: Number(0),
            };

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/products`, newProduct, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Product added successfully!");
            navigate(-1);
        } catch (err) {
          toast.error(err?.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">🛒 Add New Product</h1>
                    <p className="text-sm text-gray-500">Fill the product details to add it</p>
                </div>

                <div className="flex justify-end gap-6">
                    <button
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            const id = toast.loading("Submitting product....");
                            await handleAddProduct();
                            toast.dismiss(id);
                            setIsSubmitting(false);
                        }}
                        className={`px-10 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 active:bg-purple-800 transition disabled:opacity-50`}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-red-500 hover:bg-red-600 text-white px-10 py-2 rounded-md text-sm font-medium shadow"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div className="bg-white w-full h-full px-10 py-6 shadow rounded-xl border border-gray-200 flex flex-col">
                <div className="flex justify-between">
                      {/* Left Column */}
                      <div className="w-[55%] h-full space-y-6">
                          <div className="w-full flex justify-between">
                              <div className='w-[48%]'>
                                  <label className="text-sm font-medium block mb-1">Category *</label>
                                  <select
                                      value={categoryId}
                                      onChange={(e) => setCategoryId(e.target.value)}
                                      className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                                  >
                                      <option value="">Select Category</option>
                                      {category.map(categories => (
                                      <option key={categories.categoryId} value={categories.categoryId}>
                                          {categories.categoryName}
                                      </option>
                                      ))}
                                  </select>
                              </div>
                              <div className='w-[48%]'>
                                  <label className="text-sm font-medium block mb-1">Brand *</label>
                                  <select
                                      value={brandId}
                                      onChange={(e) => setBrandId(e.target.value)}
                                      className="w-full text-sm  border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                                  >
                                      <option value="">Select Brand</option>
                                      {brand.map(brands => (
                                      <option key={brands.brandId} value={brands.brandId}>
                                          {brands.brandName}
                                      </option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div className="w-full flex justify-between">
                              <div className="w-[68%]">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
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

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                  rows="4"
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
                        <p className="text-sm text-gray-700 font-medium mb-1">Selected Images</p>
                        <div className="w-full h-80 overflow-y-auto bg-white rounded-md shadow-inner">
                          {image.length > 0 && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-3">
                                {image.map((file, index) => (
                                  <div key={`new-${index}`} className="relative border rounded-md overflow-hidden group">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`new-${index}`}
                                      className="w-full h-20 object-cover"
                                    />
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

                        <div className="mt-8">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
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