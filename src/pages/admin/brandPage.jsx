import { useState, useEffect } from "react";
import axios from 'axios'; 
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from "react-icons/fa";
import LoadingSpinner from '../../components/loadingSpinner';
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";


export default function BrandPage() {

    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [brands, setBrands] = useState([]);
    const navigate = useNavigate();

    const [brandId, setBrandId] = useState(''); 
    const [brandName, setBrandName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // const navigate = useNavigate();


    useEffect(() => {

        window.scrollTo(0, 0);

        if(isLoading == true){
            axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand")
                .then((response) => {
                    setBrands(response.data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to fetch brands:", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isLoading]);


    function deleteBrand(brandId) {

        const token = localStorage.getItem("token")

        if(token === null){
            toast.error("Please login first")
            return
        }

        axios.delete(import.meta.env.VITE_BACKEND_URL + "/api/brand/" + brandId, { 
            headers: { 
                Authorization: "Bearer " + token
            } 
        }).then(() => {
            toast.success("Brand deleted successfully")
            setIsLoading(true)
        })
        .catch((error) => {
            toast.error("Failed to delete brand")
        });
    }


    async function handleSave() {

        const token = localStorage.getItem("token");

        if (!token) {
            return toast.error("Not authorized. Please login.");
        }

        if ( !brandName ) {
            return toast.error('Please fill in required fields');
        }

        try {
            const brandData = {
                brandName,
                createdAt: Date.now(),
            };

            const response = await axios.post(
                import.meta.env.VITE_BACKEND_URL + '/api/brand',
                brandData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            );

            toast.success("Brand Added Successfully");
            setAddModal(false);
            setIsLoading(true);

        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to add brand');
        }
    }


    async function handleEdit() {
        const token = localStorage.getItem("token");

        if (!token) {
            return toast.error("Not authorized. Please login.");
        }

        if ( !brandName || !brandId ) {
            return toast.error('Please fill in all fields');
        }

        try {
            const brandData = {
                brandId,
                brandName
            };

            await axios.put(
                import.meta.env.VITE_BACKEND_URL + '/api/brand/' + brandId,
                brandData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            );

            toast.success("Brand updated successfully");
            setEditModal(false);
            setIsLoading(true);

        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update brand');
        }
    }


    return (
        <div className="w-full h-full flex flex-col bg-gray-100 rounded-md px-12 py-4">

            <div className='flex justify-between items-center mb-4'>
                <div className='w-40% h-full flex flex-col item-center'>
                    <h1 className='text-xl font-semibold text-gray-800'>🏷️ Product brands</h1>
                    <p className='text-sm text-gray-600'>Manage product brands</p>
                </div>
                <div className="w-[30%] flex justify-end gap-6">
                    <button
                        onClick={() =>{
                            setBrandId('')
                            setBrandName('')
                            setAddModal(true)
                        }}
                        className="px-6 py-2 rounded-md text-sm font-medium shadow bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition duration-300 ease-in-out">
                        +  Add new brand
                    </button> 
                    <button
                            onClick={() => navigate(-1)}
                            className="cursor-pointer rounded-md transition duration-300 ease-in-out"
                        >
                            ✖️
                    </button>
                </div>
            </div>            
            
            <div className="bg-white shadow rounded-md">
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="w-full">
                {/* Sticky header table */}
                <table className="min-w-full text-sm text-left border border-gray-200">
                    <thead className="bg-purple-600 text-white top-0 z-10">
                    <tr>
                        <th className="px-10 py-2 w-40">Brand Id</th>
                        <th className="p-2 w-100">Brand Name</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>
                </table>

                {/* Scrollable tbody container */}
                <div className="overflow-y-auto max-h-[400px]">
                    <table className="min-w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-200">
                        {brands.map((item) => (
                        <tr
                            key={item.brandId}
                            className="h-10 cursor-pointer hover:bg-tableHover transition duration-150"
                        >
                            <td className="px-10 py-2 w-40">{item.brandId}</td>
                            <td className="p-2 w-100">{item.brandName}</td>
                            <td className="p-2 flex gap-2">
                            <FaTrash
                                onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    window.confirm("Are you sure you want to delete this brand?")
                                ) {
                                    deleteBrand(item.brandId);
                                }
                                }}
                                className="text-lg text-red-600 hover:text-red-800 cursor-pointer"
                            />
                            <FaEdit
                                onClick={(e) => {
                                e.stopPropagation();
                                setBrandId(item.brandId);
                                setBrandName(item.brandName);
                                setEditModal(true);
                                }}
                                className="text-xl text-blue-600 hover:text-blue-800 cursor-pointer"
                            />
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
                isOpen={addModal}
                onRequestClose={() => setAddModal(false)}
                contentLabel="Add Brand"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold">🏷️➕ Add Brand</h2>
                <label className="mt-10 block text-sm font-medium">Brand name</label>
                <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    type="text"
                    placeholder="Enter brand name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-4">
                    <button 
                        disabled={isSubmitting}
                        onClick={async () => {
                            setIsSubmitting(true);
                            await handleSave();
                            setIsSubmitting(false);
                        }}
                        className={`px-10 py-2 text-sm font-medium shadow bg-purple-600 text-white rounded-md 
                                    hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>

                    <button onClick={() => setAddModal(false)} className="px-8 py-2 text-sm font-medium shadow rounded bg-red-600 text-white hover:bg-red-700 active:bg-red-800">
                        Cancel
                    </button>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={editModal}
                onRequestClose={() => setEditModal(false)}
                contentLabel="Edit Brand"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold mb-4">🏷️✏️ Edit Brand</h2>
                <label className="mt-10 block text-sm font-medium">Brand name</label>
                <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    type="text"
                    placeholder="Enter brand name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-4">
                    <button 
                        disabled={isSubmitting}
                        onClick={async () => {
                            setIsSubmitting(true);
                            await handleEdit();
                            setIsSubmitting(false);
                        }}
                        className={`px-10 py-2 text-sm font-medium shadow bg-purple-600 text-white rounded-md
                                    hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50`}
                    >
                        {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                    <button onClick={() => setEditModal(false)} className="px-10 py-2 text-sm font-medium shadow rounded bg-red-600 text-white hover:bg-red-700 active:bg-red-800">
                        Cancel
                    </button>
                </div>
            </Modal>

        </div>
    );
}
