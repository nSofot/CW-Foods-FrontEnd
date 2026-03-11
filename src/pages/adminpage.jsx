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
import CustomerOutstandingPage from "./admin/customersOutstandingAgeAnalyzis";
import GrnPage from "./admin/grnPage";
import InvoicePage from "./admin/invoicePage";
import SalesReturnPage from "./admin/salesReturnPage";
import StockTransfersPage from "./admin/stockTransfersPage";
import StockAdjustmentPage from "./admin/stockAdjustmentPage";
import UsersPage from "./admin/usersPage";
import CashRegisterPage from "./admin/cashRegister";
import AdminOrdersPage from "./admin/adminOrdersPage";
import ReviewsPage from "./admin/reviewsPage";

import CustomersOutstandingReport from "./reports/customersOutstandingReport";
import CustomerStatementReport from "./reports/customerStatementReport";
import CustomerOutstandingStatementReport from "./reports/customerOutstandingStatement";
import CustomerPaymentsPage from "./admin/customerPaymentsPage";
import CustomerAdjustmentPage from "./admin/customerAdjustmentPage";

import SupplierPage from "./admin/suppliersPage";
import CreateSupplierPage from "./admin/createSupplier";
import UpdateSupplierPage from "./admin/updateSupplier";
// import PurchaseInvoicePage from "./admin/purchaseInvoicePage";
// import SupplierPaymentPage from "./admin/supplierPaymentPage";
import SupplierAdjustmentPage from "./admin/supplierAdjustmentPage";

import Loading from "../components/loadingSpinner";
import NotFoundPage from "./notFoundPage";

export default function AdminPage() {

  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);
  const [openCustomers, setOpenCustomers] = useState(false);
  const [openSuppliers, setOpenSuppliers] = useState(false);
  const [openTransactions, setOpenTransactions] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);

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
        headers: { Authorization: `Bearer ${token}` }
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
      ? "flex items-left text-white bg-purple-600 px-3 py-2 rounded hover:bg-purple-700 transition"
      : "flex items-left text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition";

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  if (status === "loading") return <Loading />;

  return (

    <div className="w-full h-screen flex flex-col bg-gray-100">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow">

        <h1 className="font-bold text-purple-700">
          Admin Panel
        </h1>

        <button
          onClick={() => setSidebarOpen(true)}
          className="text-2xl font-bold text-purple-700"
        >
          ☰
        </button>

      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 relative overflow-hidden">

        {/* Sidebar */}
        <aside
          className={`fixed md:static z-50 top-0 left-0 h-full w-[260px] bg-white border-r shadow-md flex flex-col justify-between p-4 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >

          <div className="flex flex-col h-full overflow-hidden">

            {/* Scrollable Menu */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">

              <h2 className="text-lg font-bold text-purple-800">
                CW Foods Ceylon
              </h2>

              <h2 className="text-sm font-semibold text-purple-600 mb-2">
                Admin Panel
              </h2>

              <Link
                className="flex items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100"
                to="/admin/welcome"
              >
                🏠 Dashboard
              </Link>

              {/* Products */}
              <button
                onClick={() => setOpenProducts(!openProducts)}
                className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 w-full"
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
                  <Link className={getClass("stock_transfer")} to="/admin/stock_transfer">Stock Transfers</Link>                  
                  <Link className={getClass("payment-receipt")} to="/admin/stock_adjustment">Stock Adjustment</Link>                  
                </div>
              )}

              {/* Customers */}
              <button
                onClick={() => setOpenCustomers(!openCustomers)}
                className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 w-full"
              >
                👥 Customers
                <span>{openCustomers ? "▲" : "▼"}</span>
              </button>

              {openCustomers && (
                <div className="ml-4 flex flex-col space-y-1">
                  <Link className={getClass("customers")} to="/admin/customers">All Customers</Link>
                  <Link className={getClass("add-customer")} to="/admin/add-customer">Add Customer</Link>
                  <Link className={getClass("customer-outstanding")} to="/admin/customer-outstanding">Outstanding & Age Analysis</Link>
                  <Link className={getClass("customer-payment")} to="/admin/customer-payment">Customer Payment</Link>
                  <Link className={getClass("customer-adjustment")} to="/admin/customer-adjustment">Customer Adjustment</Link>
                </div>
              )}

              {/* Suppliers */}
              <button
                onClick={() => setOpenSuppliers(!openSuppliers)}
                className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 w-full"
              >
                � Suppliers
                <span>{openSuppliers ? "▲" : "▼"}</span>
              </button>

              {openSuppliers && (
                <div className="ml-4 flex flex-col space-y-1">
                  <Link className={getClass("suppliers")} to="/admin/suppliers">All Suppliers</Link>
                  <Link className={getClass("add-supplier")} to="/admin/add-supplier">Add Supplier</Link>
                  <Link className={getClass("supplier-adjustment")} to="/admin/supplier-adjustment">Supplier Adjustment</Link>
                </div>
              )}

              {/* Transactions */}
              <button
                onClick={() => setOpenTransactions(!openTransactions)}
                className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 w-full"
              >
                💳 Transactions
                <span>{openTransactions ? "▲" : "▼"}</span>
              </button>

              {openTransactions && (
                <div className="ml-4 flex flex-col space-y-1">
                  <Link className={getClass("grn")} to="/admin/grn">GRN</Link>
                  <Link className={getClass("sales_invoice")} to="/admin/sales_invoice">Sales Invoice</Link>
                  <Link className={getClass("sales_return")} to="/admin/sales_return">Sales Return</Link>
                </div>
              )}

              {/* Finance */}
              <button
                onClick={() => setOpenFinance(!openFinance)}
                className="flex justify-between items-center text-purple-800 font-semibold px-3 py-2 rounded hover:bg-purple-100 w-full"
              >
                💳 Finance
                <span>{openFinance ? "▲" : "▼"}</span>
              </button>

              {openFinance && (
                <div className="ml-4 flex flex-col space-y-1">
                  <Link className={getClass("grn")} to="/admin/cashbook">Cash Book</Link>
                </div>
              )}

              <Link className={getClass("users")} to="/admin/users">👤 Users</Link>
              <Link className={getClass("orders")} to="/admin/orders">🧾 Orders</Link>
              <Link className={getClass("reviews")} to="/admin/reviews">⭐ Reviews</Link>

            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-left text-red-600 font-semibold px-3 py-2 rounded hover:bg-red-100 mt-4"
            >
              🔓 Logout
            </button>

          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-[10px] h-full border-purple-600 border-4 rounded-xl bg-white overflow-y-auto">

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
            <Route path="customer-outstanding" element={<CustomerOutstandingPage />} />

            <Route path="grn" element={<GrnPage />} />
            <Route path="sales_invoice" element={<InvoicePage />} />
            <Route path="sales_return" element={<SalesReturnPage />} />
            <Route path="stock_transfer" element={<StockTransfersPage />} />
            <Route path="stock_adjustment" element={<StockAdjustmentPage />} />

            <Route path="users" element={<UsersPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reviews" element={<ReviewsPage />} />

            <Route path="customers-oustanding" element={<CustomersOutstandingReport />} />
            <Route path="customer-statement" element={<CustomerStatementReport />} />
            <Route path="customer-outstanding-statement" element={<CustomerOutstandingStatementReport />} />
            <Route path="customer-payment" element={<CustomerPaymentsPage />} />
            <Route path="customer-adjustment" element={<CustomerAdjustmentPage />} />

            <Route path="suppliers" element={<SupplierPage />} />
            <Route path="add-supplier" element={<CreateSupplierPage />} />
            <Route path="edit-supplier" element={<UpdateSupplierPage />} />
            <Route path="supplier-adjustment" element={<SupplierAdjustmentPage />} />

            <Route path="cashbook" element={<CashRegisterPage />} />

            <Route path="*" element={<NotFoundPage />} />

          </Routes>

        </main>

      </div>

    </div>

  );
}