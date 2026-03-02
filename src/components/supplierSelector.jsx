import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { debounce } from "lodash";

const SupplierSelector = ({ onSelect, selectedSupplierId }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);  

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await axios.get(import.meta.env.VITE_BACKEND_URL + "/api/supplier");
                const sortedSuppliers = res.data.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setSuppliers(sortedSuppliers);
                setFilteredSuppliers(sortedSuppliers);
            } catch (err) {
                console.error("Failed to fetch suppliers:", err);
                setError("Failed to load suppliers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuppliers();
    }, []);


    useEffect(() => {
        const debouncedFilter = debounce(() => {
            const filtered = suppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSuppliers(filtered);
        }, 200);

        debouncedFilter();

        return () => debouncedFilter.cancel();
    }, [searchTerm, suppliers]);


    const handleSelect = (supplier) => {
        if (typeof onSelect === "function") {
            onSelect(supplier);
        } else {
            console.warn("onSelect is not a function", onSelect);
        }
    };


    if (isLoading) return <p>Loading suppliers...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex flex-col gap-3">
            <label htmlFor="supplier-search" className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    Find Supplier
                </div>
            </label>
            <input
                id="supplier-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type supplier name..."
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="rounded-md h-48 overflow-y-auto divide-y divide-gray-200">
                {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(supplier => (
                        <div
                            key={supplier.supplierId}
                            onClick={() => handleSelect(supplier)}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                selectedSupplierId === supplier.supplierId ? "bg-blue-100" : ""
                            }`}
                        >
                            <div
                                className="text-sm font-medium"
                                dangerouslySetInnerHTML={{
                                    __html: supplier.name.replace(
                                        new RegExp(searchTerm, "gi"),
                                        (match) => `<mark class="bg-yellow-200">${match}</mark>`
                                    )
                                }}
                            />
                            <div className="text-xs text-gray-500">
                                {supplier.address || supplier.mobile || "No contact"}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-2 text-gray-500">No suppliers found</div>
                )}
            </div>
        </div>
    );
};

export default SupplierSelector;
