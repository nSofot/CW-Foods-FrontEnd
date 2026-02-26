import { Route, Routes, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Admin Pages
import WelcomePage from "./admin/welcomePage";
import AdminProductsPage from "./admin/adminProductPage";
import AddProductPage from "./admin/addProductPage";
import EditProductPage from "./admin/editProductPage";
import CategoryPage from "./admin/categoryPage";
import BrandPage from "./admin/brandPage";
import UomPage from "./admin/uomPage";
import LocationPage from "./admin/locationsPage";
import CustomerPage from "./admin/customerPage";
import AddCustomerPage from "./admin/addCustomerPage";
import EditCustomerPage from "./admin/editCustomerPage";
import GrnPage from "./admin/grnPage";
import InvoicePage from "./admin/invoicePage";
import StockTransfersPage from "./admin/stockTransfersPage";
import UsersPage from "./admin/usersPage";
import AdminOrdersPage from "./admin/adminOrdersPage";
import ReviewsPage from "./admin/reviewsPage";
import Loading from "../components/loadingSpinner";
import NotFoundPage from "./notFoundPage";

export default function AdminPage() {
    const location = useLocation();
    const path = location.pathname;
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [openProducts, setOpenProducts] = useState(false);
    const [openCustomers, setOpenCustomers] = useState(false);
    const [openTransactions, setOpenTransactions] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setStatus("unauthenticated");
            toast.error("Please login");
            navigate("/login", { replace: true });
            return;
        }

        axios
            .get(`${import.meta.env.VITE_BACKEND_URL}/api/user/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
              const role = res.data.role?.toLowerCase();
              if (role !== "admin") {
                setStatus("unauthorized");
                toast.error("Unauthorized access");
                navigate("/", { replace: true });
              } else {
                setStatus("authenticated");
              }
          })
          .catch(() => {
            setStatus("unauthenticated");
            toast.error("Session expired. Please login again");
            navigate("/login", { replace: true });
          });
    }, [navigate]);

    const getClass = (name) =>
        path.includes(`/admin/${name}`)
          ? "text-white bg-purple-600 px-3 py-2 rounded hover:bg-gray-600 transition"
          : "text-purple-600 px-3 py-2 rounded hover:bg-gray-300 transition";

    const handleLogout = () => {
        localStorage.removeItem("token");
        toast.success("Logged out successfully");
        navigate("/login", { replace: true });
    };

    if (status === "loading") return <Loading />;

    return (
      <div className="w-full h-screen bg-purple-600 flex flex-col font-sans">
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[256px] bg-white border-r shadow-md flex flex-col justify-between p-4">
                <div className="flex flex-col space-y-2">
                    <h2 className="text-lg font-semibold text-purple-800">CW Foods Ceylon (Pvt) Ltd.</h2>
                    <h2 className="text-lg font-semibold text-purple-800 mb-4">Admin Panel</h2>

                    <Link className="flex items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 transition space-x-2" 
                        to="/admin/welcome">🏠 Dashboard</Link>
                    {/* Products menu */}
                    <button
                      onClick={() => setOpenProducts(!openProducts)}
                      className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 transition"
                    >
                      📦 Products
                      <span>{openProducts ? "▲" : "▼"}</span>
                    </button>
                    {openProducts && (
                        <div className="ml-4 flex flex-col space-y-1">
                            <Link className={getClass("products")} to="/admin/products">All Products</Link>
                            <Link className={getClass("category")} to="/admin/category">Category</Link>
                            <Link className={getClass("brand")} to="/admin/brand">Brand</Link>
                            <Link className={getClass("uom")} to="/admin/uom">UOM</Link>
                            <Link className={getClass("locations")} to="/admin/locations">Locations</Link>
                        </div>
                    )}

                    {/* Customers menu */}
                    <button
                      onClick={() => setOpenCustomers(!openCustomers)}
                      className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 transition"
                    >
                      📦 Customers
                      <span>{openCustomers ? "▲" : "▼"}</span>
                    </button>
                    {openCustomers && (
                        <div className="ml-4 flex flex-col space-y-1">
                            <Link className={getClass("customers")} to="/admin/customers">All Customers</Link>

                        </div>
                    )}

                    {/* Transactions menu */}
                    <button
                      onClick={() => setOpenTransactions(!openTransactions)}
                      className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 transition"
                    >
                      📦 Transactions
                      <span>{openTransactions? "▲" : "▼"}</span>
                    </button>
                    {openTransactions && (
                        <div className="ml-4 flex flex-col space-y-1">
                            <Link className={getClass("grn")} to="/admin/grn">GRN</Link>
                            <Link className={getClass("sales_invoice")} to="/admin/sales_invoice">Sales Invoice</Link>
                            <Link className={getClass("stock_transfer")} to="/admin/stock_transfer">Stock Transfers</Link>
                            <Link className={getClass("stock_adjustment")} to="/admin/stock_adjustment">Stock Adjustment</Link>
                            <Link className={getClass("goods_returns")} to="/admin/goods_returns">Goods Returns</Link>
                        </div>
                    )}                    

                    <Link className={getClass("users")} to="/admin/users">👤 Users</Link>
                    <Link className={getClass("orders")} to="/admin/orders">🧾 Orders</Link>
                    <Link className={getClass("reviews")} to="/admin/reviews">⭐ Reviews</Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-6 text-red-600 font-semibold px-3 py-2 rounded hover:bg-red-100 transition text-left"
                >
                  🔓 Logout
                </button>
            </aside>

          {/* Page Content */}
          <main className="h-full w-[calc(100%-256px)] border-purple-600 border-4 rounded-xl bg-white overflow-y-auto">
            <Routes>
              <Route index element={<Navigate to="welcome" replace />} />
              <Route path="welcome" element={<WelcomePage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="add-product" element={<AddProductPage />} />
              <Route path="edit-product" element={<EditProductPage />} />            
              <Route path="category" element={<CategoryPage />} />
              <Route path="brand" element={<BrandPage />} />
              <Route path="uom" element={<UomPage />} />
              <Route path="locations" element={<LocationPage />} />
              <Route path="customers" element={<CustomerPage />} />
              <Route path="add-customer" element={<AddCustomerPage />} />
              <Route path="edit-customer" element={<EditCustomerPage />} />
              <Route path="grn" element={<GrnPage />} />
              <Route path="sales_invoice" element={<InvoicePage />} />
              <Route path="stock_transfer" element={<StockTransfersPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    );
}
