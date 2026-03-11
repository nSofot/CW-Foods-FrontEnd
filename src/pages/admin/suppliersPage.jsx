import axios from 'axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { HiOutlineHome } from "react-icons/hi";
import LoadingSpinner from '../../components/loadingSpinner';
import { useNavigate, Link } from 'react-router-dom';
import Modal from "react-modal";
import SupplierOverview from '../../components/viewSupplierOverview';



export default function SuppliersPage() {

    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeRecord, setActiveRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [query, setQuery] = useState("");
    const navigate = useNavigate();


		
	useEffect(() => {
		const fetchSuppliers = async () => {         
			try {
				const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/supplier/search?query=${query}`)
				setSuppliers(response.data);                
			} catch (err) {
				console.error("Search request failed:", err);
				toast.error("Failed to fetch suppliers.");
			} finally {
				setIsLoading(false);
			}
		};

		if (isLoading) {
			fetchSuppliers();
		}
	}, [isLoading, query]);


    function deleteSupplier(supplierId) {
        const token = localStorage.getItem("token")

        if(token === null){
            toast.error("Please login first")
            return
        }

        axios.delete(import.meta.env.VITE_BACKEND_URL + "/api/supplier/" + supplierId, { 
            headers: { 
                Authorization: "Bearer " + token
            } 
        }).then(() => {
            toast.success("Supplier deleted successfully")
            setIsLoading(true)
        })
        .catch((error) => {
            toast.error("Failed to delete supplier")
        });
    }


    return (

        <div className="hidden md:flex w-full h-full flex-col bg-gray-100 rounded-md p-4">

			<div className="flex justify-between items-center mb-4">
				<div>
					<h1 className="text-xl font-semibold text-gray-800">🚚 Suppliers</h1>
					<p className="text-sm text-gray-600">Manage supplier accounts</p>
				</div>
                <div className='w-[30%] flex justify-end gap-6'>
                    <Link
                        to="/admin/add-supplier"
                        className="cursor-pointer bg-green-600 text-white hover:bg-green-700 active:bg-green-800 px-6 py-2 rounded-md text-sm font-medium shadow-md"
                    >
                        + Add New Supplier
                    </Link>
                    <Link
                        to="/admin/welcome"
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="Go to Home"
                        >
                        <HiOutlineHome className="w-5 h-5" />
                    </Link>
                </div>
			</div>
                
			<div className="flex justify-between items-center">
				<div className="w-[40%]">
					<input
						type="text"
						placeholder="Search suppliers by name, address, mobile or phone ..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setIsLoading(true);
						}}
						className="w-full px-2 py-2 text-sm border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>	
                <p className='text-gray-500 text-sm'>Count: {suppliers.length}</p>
			</div>
          

            <div className="mt-2 h-[78%] bg-white shadow rounded-md">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="w-full h-full">
                        {/* Sticky header */}
                        <table className="min-w-full text-sm text-left border border-gray-200">
                            <thead className="bg-tableHeader text-tableHeaderText sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 w-26">#ID</th>
                                    <th className="px-4 py-2 w-60">Name</th>
                                    <th className="px-4 py-2 w-75">Address</th>
                                    <th className="px-4 py-2 w-30">Mobile</th>
                                    <th className="px-4 py-2 w-30">Phone</th>
                                    <th className="px-4 py-2 w-30 text-right">Balance</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable tbody container */}
                        <div className="h-[90%] overflow-y-auto max-h-[90%]">
                            <table className="min-w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-300">
                                    {suppliers.map((item, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => {
                                                setActiveRecord(item);
                                                setIsModalOpen(true);
                                            }}
                                            className="cursor-pointer hover:bg-tableHover transition duration-150"
                                        >
                                            <td className="px-4 py-3 w-26">{item.supplierId}</td>
                                            <td className="px-4 py-3 w-60">{item.name}</td>
                                            <td className="px-4 py-3 w-75">{item.address}</td>
                                            <td className="px-4 py-3 w-30">{item.mobile}</td>
                                            <td className="px-4 py-3 w-30">{item.phone}</td>
                                            <td className="px-4 py-3 w-30 text-right">{item.balance?.toFixed(2) || "0.00"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Are you sure you want to delete this supplier?")) {
                                                                deleteSupplier(item.supplierId);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <FaTrash className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate("/dashboard/purchases/update-supplier", { state: item });
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FaEdit className="text-xl" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Supplier Details"
                overlayClassName="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50"
                className="max-w-5xl w-full h-[97vh] overflow-y-auto bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
            >
                {activeRecord && (
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="w-full flex justify-between items-center pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">🚚 Supplier Details</h2>
                            <button
                                className="text-gray-500 hover:text-gray-800"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ✖
                            </button>
                        </div>

                        <p className="text-lg font-semibold">{activeRecord.name}</p>


						{/* Tabs */}
						<div className="flex border-b gap-6 text-sm font-medium text-gray-600">
							{['Overview' ].map(tab => (
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

                        {activeTab === 'Overview' && (
                            <SupplierOverview supplierId={activeRecord.supplierId} />
                        )}
                    </div>
                )}
            </Modal>

        </div>
    )
}