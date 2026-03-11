import { useState, useEffect } from "react";
import axios from "axios";

export default function SupplierOverview({ supplierId }) {
    // 1️⃣ State
    const [supplier, setSupplier] = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    // 2️⃣ Fetch once we have an ID
    useEffect(() => {
        if (!supplierId) return;
        const fetchSupplier = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/supplier/${supplierId}`
            );
            setSupplier(data);
        } catch (err) {
            console.error("Failed to load supplier overview:", err);
            setError("Failed to load data.");
        } finally {
            setLoading(false);
        }
        };

        fetchSupplier();
    }, [supplierId]);

    // 3️⃣ Render guards
    if (loading)      return <div className="p-4 text-gray-600">Loading…</div>;
    if (error)        return <div className="p-4 text-red-500">{error}</div>;
    if (!supplier)    return <div className="p-4 text-gray-500">No data.</div>;

    // 4️⃣ Safe destructuring — rename supplierId ➡️ id
    const {
        supplierId: id,     // avoid shadowing the prop
        name,
        address,
        mobile,
        phone,
        email,
        contactPerson,
        taxNumber,
        balance,
        notes,
        isActive,
        createdAt,
        updatedAt,
    } = supplier;

    // 5️⃣ UI
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-md p-4 shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">📋 Personal Information</h3>
                <p><strong>Supplier&nbsp;ID:</strong> {id}</p>
                <p><strong>Tax&nbsp;Number:</strong> {taxNumber || "—"}</p>
                <p>
                <strong>Is&nbsp;Active:</strong>
                <span className={`font-semibold ml-1 ${isActive ? "text-green-600" : "text-red-500"}`}>
                    {isActive ? "Yes" : "No"}
                </span>
                </p>
                <p>
                <strong>Created&nbsp;At:</strong>{" "}
                {createdAt ? new Date(createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }) : "—"}
                </p>
                <p>
                <strong>Last&nbsp;Updated:</strong>{" "}
                {updatedAt ? new Date(updatedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                }) : "—"}
                </p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-md p-4 shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">📞 Contact Information</h3>
                <p><strong>Address:</strong> {address || "—"}</p>
                <p><strong>Mobile:</strong> {mobile || "—"}</p>
                <p><strong>Phone:</strong> {phone || "—"}</p>
                <p><strong>Email:</strong> {email || "—"}</p>
                <p><strong>Contact&nbsp;Person:</strong> {contactPerson || "—"}</p>
            </div>

            {/* Financial Details */}
            <div className="bg-gray-50 rounded-md p-4 shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">💰 Due Balance</h3>
                <h3 className="text-xl font-bold text-red-600">
                    Rs. {balance?.toLocaleString('en-GB', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </h3>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 rounded-md p-4 shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">🗒️ Notes</h3>
                <p className="whitespace-pre-line text-sm text-gray-700">
                    {notes?.trim() ? notes : "No notes available."}
                </p>
            </div>
        </div>
    );
}
