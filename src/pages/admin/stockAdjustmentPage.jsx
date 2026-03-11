import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import Modal from "react-modal";
import LoadingSpinner from "../../components/loadingSpinner";


const REASONS = {
  inwards: [
    { code: "AI01", label: "Opening Stock" },
    { code: "AI02", label: "Stock Correction (Gain)" },
  ],
  outwards: [
    { code: "AO01", label: "Stock Damage/Loss" },
    { code: "AO02", label: "Stock Correction (Loss)" },
    { code: "AO03", label: "Expired Stock" },
  ],
};

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [trxDetails, setTrxDetails] = useState({
    adjustDate: new Date().toISOString().split("T")[0],
    adjustType: "",
    adjustReason: "",
    adjustDescription: "",
    adjustTotal: 0,
    adjustItems: [],
  });

  useEffect(() => {
    if (!isLoading) return;

    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [prodRes, categoryRes, brandRes, uomRes] = await Promise.all([
          axios.get(import.meta.env.VITE_BACKEND_URL + "/api/products", config),
          axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category", config),
          axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand", config),
          axios.get(import.meta.env.VITE_BACKEND_URL + "/api/uom", config),
        ]);

        setCategories(categoryRes.data);
        setBrands(brandRes.data);
        setUoms(uomRes.data);

        const enrichedProducts = prodRes.data.map((product) => {
          const categoryName = categoryRes.data.find(c => c.categoryId === product.categoryId)?.categoryName || "";
          const brandName = brandRes.data.find(b => b.brandId === product.brandId)?.brandName || "";
          const uomName = uomRes.data.find(u => u.uomId === product.uomId)?.uomName || "";

          return {
            ...product,
            categoryName,
            brandName,
            uomName,
          };
        });
        setProducts(enrichedProducts);
        
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isLoading]);

  useEffect(() => {
    if (!productQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const regex = new RegExp(productQuery, "i");
    const filtered = products.filter((p) =>
      regex.test(p.name) ||
      regex.test(p.categoryName) ||
      regex.test(p.brandName) ||
      regex.test(Array.isArray(p.description) ? p.description.join(" ") : p.description || "")
    );
    setFilteredProducts(filtered);
  }, [productQuery, products]);

  const addItem = (product) => {
    if (!product) return;

    const exists = trxDetails.adjustItems.find((item) => item.productId === product.productId);
    if (exists) {
      toast.error("Item already added");
      return;
    }

    setTrxDetails((prev) => ({
      ...prev,
      adjustItems: [
        ...prev.adjustItems,
        {
          productId: product.productId,
          image: product.image,
          name: product.name,
          categoryName: product.categoryName,
          brandName: product.brandName,
          quantity: "",
          unit: product.uomName,
          rate: product.price,
          cost: product.avarageCost ?? 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = trxDetails.adjustItems.filter((_, i) => i !== index);
    setTrxDetails((prev) => ({ ...prev, adjustItems: updatedItems }));
  };

  const handleItemChange = (index, field, value) => {
      setTrxDetails(prev => {
        const items = [...prev.adjustItems];
        items[index][field] = value;
        const qty = parseFloat(items[index].quantity) || 0;
        const cost = parseFloat(items[index].cost) || 0;
        items[index].amount = qty * cost;
        return { ...prev, adjustItems: items };
      });
    };

    useEffect(() => {
      const total = trxDetails.adjustItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.cost) || 0;
        return sum + qty * cost;
      }, 0);
      setTrxDetails(prev => ({ ...prev, adjustTotal: total }));
    }, [trxDetails.adjustItems]);

    const handleSubmit = async () => {
        if (!trxDetails.adjustType) {
          toast.error("Please select an adjustment type");
          return;
        }
        if (!trxDetails.adjustReason) {
          toast.error("Please select a reason");
          return;
        }
        if (trxDetails.adjustItems.length === 0) {
          toast.error("Add at least one item");
          return;
        }

        const hasInvalidQty = trxDetails.adjustItems.some(item => !item.quantity || isNaN(item.quantity) || item.quantity <= 0);
        if (hasInvalidQty) {
          toast.error("Enter valid quantities for all items");
          return;
        }

        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const trxType = "adjustment";
            // 1️⃣ Prepare product transaction
            try {
                const payload = {
                    transactionType: trxType,
                    transactionDate: trxDetails.adjustDate,
                    description: `${trxDetails.adjustReason} - ${trxDetails.adjustDescription || ""}`,
                    isAdded: trxDetails.adjustType === "inwards",
                    type: trxDetails.adjustType,
                    products: trxDetails.adjustItems.map((product) => ({   // 🟢 CHANGED from items → products
                        productId: product.productId,
                        productName: product.name,
                        quantity: parseFloat(product.quantity),
                        rate: parseFloat(product.cost),
                        uom: product.unit,
                        amount: parseFloat(product.amount),
                        category: product.categoryName,
                        brand: product.brandName,
                    })),
                };
                await axios.post(
                    import.meta.env.VITE_BACKEND_URL + "/api/productTransactions",
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );
                console.log("1️⃣✅ Product transaction saved");
            } catch (error) {
                console.error("1️⃣⚠️ Failed to save product transaction:", error);
                return;
            }

            // 2️⃣ Prepare stock updates
            try {
                const updates = trxDetails.adjustItems
                    .map(d => ({
                        productId: d.productId,
                        quantity: parseFloat(d.quantity),
                        rate: d.cost
                    }))
                    .filter(u => u.quantity > 0); // skip non-positive quantities

                if (trxDetails.adjustType === "inwards") {
                    await axios.put(
                        `${import.meta.env.VITE_BACKEND_URL}/api/product/add`,
                        { updates }, // ✅ Send updates as a flat array
                        { headers: { Authorization: "Bearer " + token } }
                    );

                } else {
                    if (updates.length > 0) {
                        await axios.put(
                          `${import.meta.env.VITE_BACKEND_URL}/api/product/subtract`,
                          { updates }, // ✅ not [updates]
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                    }
                } 
                console.log("2️⃣✅ Product stock updated");
            } catch (error) {
                console.error("2️⃣⚠️ Failed to update product stock:", error);
                toast.error("Failed to update product stock. Please try again.");
                return;
            }

            toast.success("✅ Stock adjustment submitted successfully!");

            // Reset form
            setTrxDetails({
              adjustDate: new Date().toISOString().split("T")[0],
              adjustType: "",
              adjustReason: "",
              adjustDescription: "",
              adjustTotal: 0,
              adjustItems: [],
            });

        } catch (err) {
            console.error("⚠️ Submit failed:", err);
            toast.error("Failed to submit stock adjustment. Please try again.");
        }
    };

  return (
    <div className="p-4 h-full bg-gray-200 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">🛍️✏️ Stock Adjustment</h1>
          <p className="text-sm text-gray-600">Manage and correct inventory discrepancies in real-time.</p>
        </div>
        <div className="w-[50%] flex justify-end gap-6">
          <button
            className="px-6 py-2 rounded shadow text-sm font-medium bg-buttonAdd text-buttonAddText hover:bg-buttonAddHover active:bg-buttonAddActive disabled:opacity-50 mr-10"
            onClick={() => setIsProductModalOpen(true)}
          >
            + Add Item
          </button>
          <button
            disabled={isSubmitting}
            onClick={async () => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              const id = toast.loading("Submitting...");
              await handleSubmit();
              toast.dismiss(id);
              setIsSubmitting(false);
            }}
            className="px-10 py-2 text-sm font-medium bg-buttonSave text-buttonSaveText rounded-md hover:bg-buttonSaveHover active:bg-buttonSaveActive disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <Link
            to="/"
            className="px-10 py-2 text-sm font-medium bg-buttonCancel text-buttonCancelText rounded-md hover:bg-buttonCancelHover active:bg-buttonCancelActive"
          >
            Cancel
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="h-[87%] flex justify-between gap-8">
          <div className="w-[25%] h-full flex flex-col gap-5">
            <div>
              <label>Adjustment Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded focus:outline-blue-500"
                value={trxDetails.adjustDate}
                onChange={(e) => setTrxDetails({ ...trxDetails, adjustDate: e.target.value })}
              />
            </div>
            <div>
              <label>Adjustment Type</label>
              <select
                className="w-full border p-2 rounded focus:outline-blue-500"
                value={trxDetails.adjustType}
                onChange={(e) => setTrxDetails({ ...trxDetails, adjustType: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="inwards">Inwards</option>
                <option value="outwards">Outwards</option>
              </select>
            </div>
            <div>
              <label>Reason</label>
              <select
                className="w-full border p-2 rounded focus:outline-blue-500"
                value={trxDetails.adjustReason}
                onChange={(e) => setTrxDetails({ ...trxDetails, adjustReason: e.target.value })}
              >
                <option value="">Select reason</option>
                {REASONS[trxDetails.adjustType]?.map((r) => (
                  <option key={r.label} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Description</label>
              <textarea
                className="w-full border p-2 rounded focus:outline-blue-500"
                value={trxDetails.adjustDescription}
                onChange={(e) => setTrxDetails({ ...trxDetails, adjustDescription: e.target.value })}
              />
            </div>
            <div className="w-full h-3xl flex justify-between bg-gray-200 items-center rounded-md border border-gray-400 px-4 py-2 mt-2">
              <label className="text-md block">Total Cost: Rs.</label>
              <label className="text-md block">
                {trxDetails.adjustTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </label>
            </div>
          </div>

          <div className="w-[75%] h-full rounded-md border border-gray-400 flex flex-col gap-2 bg-white p-4 overflow-y-auto">
            {trxDetails.adjustItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b py-2">
                <img
                  src={Array.isArray(item.image) ? item.image[0] : item.image}
                  alt="product"
                  className="w-14 h-14 object-cover rounded"
                />
                <div className="flex-1 px-4">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.categoryName}</p>
                  <p className="text-xs text-gray-500">
                    {item.brandName} | {item.productId} | Rs.
                    {(item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  className="w-20 p-1 text-sm border rounded mr-4"
                />
                <span className="text-sm">{item.unit}</span>
                <span className="ml-6 text-sm font-medium">
                  Rs. {(item.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  className="ml-4 text-gray-600 hover:text-white border border-gray-600 rounded p-1 hover:bg-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isProductModalOpen}
        onRequestClose={() => setIsProductModalOpen(false)}
        contentLabel="Search Products"
        overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
        className="max-w-5xl w-full max-h-[150vh] overflow-y-auto bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-4">🛒 Search Products</h2>
          <button className="text-gray-500 hover:text-gray-800" onClick={() => setIsProductModalOpen(false)}>
            ✖
          </button>
        </div>
        <div className="w-[50%]">
          <input
            type="text"
            placeholder="Search products..."
            value={productQuery}
            onChange={(e) => {
              setProductQuery(e.target.value);
              setIsProductLoading(false);
            }}
            className="w-full px-2 py-1 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="h-[400px] mt-4 rounded border border-gray-400 overflow-y-auto">
          {isProductLoading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <p className="mt-4 text-lg text-gray-500">No products found.</p>
          ) : (
            <table className="min-w-full text-sm text-left table-fixed">
              <thead className="sticky top-0 z-10 bg-gray-200">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Brand</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.productId}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      addItem(product);
                      setIsProductModalOpen(false);
                    }}
                  >
                    <td className="px-6 py-3">{product.name}</td>
                    <td className="px-6 py-3">{product.categoryName}</td>
                    <td className="px-6 py-3">{product.brandName}</td>
                    <td className="px-6 py-3">{product.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
