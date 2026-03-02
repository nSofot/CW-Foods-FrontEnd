import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { debounce } from "lodash";

const CustomerSelector = ({ onSelect, selectedCustomerId }) => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);  

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(import.meta.env.VITE_BACKEND_URL + "/api/customer");
                const sortedCustomers = res.data.sort((a, b) =>
                    a.businessName.localeCompare(b.businessName)
                );
                setCustomers(sortedCustomers);
                setFilteredCustomers(sortedCustomers);
            } catch (err) {
                console.error("Failed to fetch customers:", err);
                setError("Failed to load customers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, []);


    useEffect(() => {
        const debouncedFilter = debounce(() => {
            const filtered = customers.filter(customer =>
                customer.businessName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }, 200);

        debouncedFilter();

        return () => debouncedFilter.cancel();
    }, [searchTerm, customers]);


    const handleSelect = (customer) => {
        if (typeof onSelect === "function") {
            onSelect(customer);
        } else {
            console.warn("onSelect is not a function", onSelect);
        }
    };


    if (isLoading) return <p>Loading customers...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex flex-col gap-3">
            <label htmlFor="customer-search" className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    Find Customer
                </div>
            </label>
            <input
                id="customer-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type customer name..."
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="rounded-md h-48 overflow-y-auto divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                        <div
                            key={customer.customerId}
                            onClick={() => handleSelect(customer)}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                selectedCustomerId === customer.customerId ? "bg-blue-100" : ""
                            }`}
                        >
                            <div
                                className="text-sm font-medium"
                                dangerouslySetInnerHTML={{
                                    __html: customer.businessName.replace(
                                        new RegExp(searchTerm, "gi"),
                                        (match) => `<mark class="bg-yellow-200">${match}</mark>`
                                    )
                                }}
                            />
                            <div className="text-xs text-gray-500">
                                {customer.address?.join(", ") || customer.mobile || "No contact"}
                            </div>
                            <div className="text-xs text-gray-500">
                                {customer.customerId}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-2 text-gray-500">No customers found</div>
                )}
            </div>
        </div>
    );
};

export default CustomerSelector;
