import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import mediaUpload from "../../utils/mediaUpload";

export default function AddProductPage() {
  const navigate = useNavigate();

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [altNames, setAltNames] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState([]);
  const [labelledPrice, setLabelledPrice] = useState("");
  const [price, setPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [stock, setStock] = useState("");

  const handleAddProduct = async () => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Please log in first.");

    if (!productId || !name || !description || !labelledPrice || !price || !wholesalePrice || !stock) {
      return toast.error("Please fill in all fields.");
    }

    if (image.length === 0) {
      return toast.error("Please select at least one product image.");
    }

    try {
      const uploadedImages = await Promise.all(image.map((img) => mediaUpload(img)));

      const newProduct = {
        productId,
        name,
        altName: altNames.split(",").map((n) => n.trim()),
        description,
        image: uploadedImages,
        labelledPrice: Number(labelledPrice),
        price: Number(price),
        wholesalePrice: Number(wholesalePrice),
        stock: Number(stock),
      };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Product added successfully!");
      navigate("/admin/products");
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
        {/* Add Button */}
            <div className="flex justify-end gap-6">
                <button
                  onClick={handleAddProduct}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-smfont-medium shadow-md transition duration-300"
                >
                  Add Product
                </button>
            
              <Link
                to="/admin/products"
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-md text-sm font-medium shadow"
              >
                Cancel
              </Link>
          </div>
      </div>

      <div className="bg-white w-full h-full px-10 py-6 shadow rounded-xl border border-gray-200 flex flex-col">
        <div className="flex justify-between">
          {/* Left Column */}
          <div className="w-[55%] h-full space-y-10">
            <div className="w-full flex justify-between">
              <div className="w-[20%]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-[75%]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Apple iPhone 15"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Names (comma-separated)</label>
              <input
                type="text"
                value={altNames}
                onChange={(e) => setAltNames(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. iPhone, iPhone 15"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Labelled Price</label>
                <input
                  type="number"
                  value={labelledPrice}
                  onChange={(e) => setLabelledPrice(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 999.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 899.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
                <input
                  type="number"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 899.99"
                />    
              </div>                          
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 150"
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