import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/loadingSpinner";
import { set } from "lodash";
import { b } from "framer-motion/client";

export default function CustomerPage() {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [customers, setCustomers] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeRecord, setActiveRecord] = useState(null);
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

                    const [cusRes, locRes] = await Promise.all([
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/customer", config),
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/locations", config),
                    ]);
                    setCustomers(
                        cusRes.data.sort((a, b) => a.customerId.localeCompare(b.customerId))
                    );
                    // setRouteList(locRes.data);

                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

        fetchInitialData();			
    }, [location, isLoading]);


    function deleteCustomer(customerId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this customer? This action cannot be undone."
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        axios
            .delete(
                import.meta.env.VITE_BACKEND_URL + "/api/customer/" + customerId,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            )
            .then(() => {
                toast.success("Customer deleted successfully");
                setIsLoading(true); // reload customers
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Delete failed");
            });
    }


    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">👤 Customers</h1>
                    <p className="text-sm text-gray-500">Manage customer profiles</p>
                </div>
                <Link
                    to="/admin/add-customer"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow">
                    + Add New Customer
                </Link>
            </div>

            <div className="bg-white shadow rounded-md overflow-x-auto">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <table className="min-w-full text-sm text-left border border-gray-200">
                        <thead className="bg-purple-600 text-white">
                            <tr>
                                <th className="px-4 py-2">Code</th>
                                <th className="px-4 py-2">Business Name</th>
                                <th className="px-4 py-2">Contact Name</th>
                                <th className="px-4 py-2">Mobile</th>
                                <th className="px-4 py-2">Address</th>
                                <th className="px-4 py-2 text-right">Due Balance</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.map((item, index) => (
                                <tr
                                    key={index}
                                    onClick={() => {
                                        setActiveRecord(item);
                                        setIsModalOpen(true);
                                    }}									
                                    className="hover:bg-purple-100 transition duration-150 cursor-pointer">
                                    <td className="px-4 py-2 font-medium">{item.customerId}</td>
                                    <td className="px-4 py-2">{item.businessName}</td>
                                    <td className="px-4 py-2">{item.contactName}</td>
                                    <td className="px-4 py-2">{item.mobile}</td>
                                    <td className="px-4 py-2">{item.address.join(", ")}</td>
                                    <td className="px-4 py-2 text-right">{item.balance.toFixed(2)}</td>

      

                                    <td className="px-4 py-2">	
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => deleteCustomer(item.customerId)}
                                                className="text-red-600 hover:text-red-800 cursor-pointer"
                                            >
                                                <FaTrash className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    navigate("/admin/edit-customer", {
                                                    state: {
                                                        customerId: item.customerId,
                                                        businessName: item.businessName,
                                                        contactName: item.contactName,
                                                        email: item.email,
                                                        mobile: item.mobile,
                                                        phone: item.phone,
                                                        address: item.address.join(", "),
                                                        discount: item.discount,
                                                        route: item.route,
                                                        creditLimit: item.creditLimit,
                                                        creditPeriod: item.creditPeriod,
                                                        balance: item.balance,
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
                            <h2 className="text-2xl font-bold text-gray-800">👤 Customer Details</h2>
                            <button
                            className="text-gray-500 hover:text-gray-800"
                            onClick={() => setIsModalOpen(false)}
                            >
                            ✖
                            </button>
                        </div>
                        {/* <div className='flex gap-6'>      
                            <p className='text-center'><strong>Product:</strong> {getBrandName(activeRecord.brandId)} {getCategoryName(activeRecord.categoryId)} {activeRecord.name}</p>  
                            <p className='text-right'><strong>Stock:</strong> {activeRecord.stock ?? 0} {getUomName(activeRecord.uomId)}</p>
                        </div> */}

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
                           {/* Overview */}
                            {activeTab === 'Overview' && (
                            <div className="space-y-4">
                                <p><strong>Customer ID:</strong> {activeRecord.customerId}</p>
                                <p><strong>Business Name:</strong> {activeRecord.businessName}</p>
                                <p><strong>Contact Name:</strong> {activeRecord.contactName}</p>
                                <p><strong>Email:</strong> {activeRecord.email}</p>
                                <p><strong>Mobile:</strong> {activeRecord.mobile}</p>
                                <p><strong>Phone:</strong> {activeRecord.phone}</p>
                                <p><strong>Address:</strong> {activeRecord.address.join(', ')}</p>
                                <p><strong>Discount:</strong> {activeRecord.discount}%</p>
                                <p><strong>Route:</strong> {activeRecord.route}</p>
                                <p><strong>Credit Limit:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(activeRecord.creditLimit)}</p>
                                <p><strong>Credit Period:</strong> {activeRecord.creditPeriod} days</p>
                                <p><strong>Balance:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(activeRecord.balance)}</p>
                            </div>
                            )}
                            {/* Bin Card */}
                            {activeTab === 'Bin Card' && (
                            <div className="space-y-4">
                                <p>Bin Card details would go here.</p>
                            </div>
                            )}                        
                    </div>
                )}
            </Modal>

        </div>
    );
}
