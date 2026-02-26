import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import mediaUpload from "../../utils/mediaUpload";
import LoadingSpinner from "../../components/loadingSpinner";
import { b } from "framer-motion/client";

export default function AddCustomerPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [routeList, setRouteList] = useState([]);
    const [discountList, setDiscountList] = useState([5, 10, 15, 20, 25, 30]);
    const [creditPeriodList, setCreditPeriodList] = useState([7, 14, 30, 60, 90]);

    const [businessName, setBusinessName] = useState("");
    const [contactName, setContactName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [discount, setDiscount] = useState(0);
    const [route, setRoute] = useState("");
    const [creditLimit, setCreditLimit] = useState(0);
    const [creditPeriod, setCreditPeriod] = useState(0);
    const [balance, setBalance] = useState(0);


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

                    const [locRes] = await Promise.all([
                        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/locations", config),
                    ]);

                    setRouteList(locRes.data);

                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

        fetchInitialData();

    }, [isLoading]);


    const handleAddCustomer = async () => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please log in first.");

        if (!businessName || !contactName || !mobile || !address || !discount || !route || !creditLimit || !creditPeriod) {
          return toast.error("Please fill in all required fields.");
        }

        try {
            const newCustomer = {
                businessName: businessName.trim(),
                contactName: contactName.trim(),
                email: email.trim(),
                mobile,
                phone: phone.trim() || null,
                address: address.split(",").map((n) => n.trim()),
                discount,
                route,
                creditLimit: creditLimit ? Number(creditLimit) : 0,
                creditPeriod,
                balance: 0
            };

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/customer`, newCustomer, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Customer added successfully!");
            navigate(-1);
        } catch (err) {
          toast.error(err?.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">👤 Add New Customer</h1>
                    <p className="text-sm text-gray-500">Fill the customer details to add it</p>
                </div>

                <div className="flex justify-end gap-6">
                    <button
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            const id = toast.loading("Submitting customer....");
                            await handleAddCustomer();
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

            <div className="bg-white w-full px-10 py-6 shadow rounded-xl border border-gray-200 flex flex-col">
                <div className="flex justify-between">
                    {/* Left Column */}
                    <div className="w-[55%] h-full space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Customer business name"
                            />
                        </div>                               

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Customer contact person name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address (comma-separated) *</label>
                            <textarea
                                rows="2"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="No. 123, Main Street, Colombo 01"
                            ></textarea>
                        </div>

                        <div className="w-full flex justify-between gap-2">
                            <div className="w-[25%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mobile *
                                </label>

                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    value={mobile}
                                    onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 10) {
                                        setMobile(value);
                                    }
                                    }}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0712345678"
                                />
                            </div>
                            <div className="w-[25%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>

                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    value={phone}
                                    onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 10) {
                                        setPhone(value);
                                    }
                                    }}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0112345678"
                                />
                            </div>
                            <div className="w-[50%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    inputMode="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="customer@example.com"
                                />
                            </div>                         
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-[40%] h-full rounded-lg flex flex-col justify-between">
                        
                        <div className='w-[48%]'>
                            <label className="text-sm font-medium block mb-1">Route *</label>
                            <select
                                value={route}
                                onChange={(e) => setRoute(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                            >
                                <option value="">Select Route</option>
                                {routeList.map(routes => (
                                <option key={routes.locationId} value={routes.locationId}>
                                    {routes.locationName}
                                </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-[48%]">
                            <label className="text-sm font-medium block mb-1">
                                Discount Rate *
                            </label>

                            <select
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                            >
                                <option value="">Select Discount</option>

                                {discountList.map(rate => (
                                <option key={rate} value={rate}>
                                    {rate}%
                                </option>
                                ))}
                            </select>
                        </div>     

                        <div className='w-[48%]'>
                            <label className="text-sm font-medium block mb-1">Credit Period *</label>
                            <select
                                value={creditPeriod}
                                onChange={(e) => setCreditPeriod(Number(e.target.value))}
                                className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                            >
                                <option value="">Select Credit Period</option>
                                {creditPeriodList.map(period => (

                                <option key={period} value={period}>
                                    {period} days
                                </option>
                                ))}
                            </select>
                        </div>

                        <div className='w-[48%]'>
                            <label className="text-sm font-medium block mb-1">Credit Limit *</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step="1"
                                value={Number(creditLimit) || 0}
                                onChange={(e) => setCreditLimit(e.target.value.replace(/\D/g, ""))}
                                className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-blue-500"
                                placeholder="100000"
                            />
                        </div>     
                                                                 
                    </div>
                </div>
            </div>
        </div>
    );
}