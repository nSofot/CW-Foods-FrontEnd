import { useState, useEffect } from "react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from "react-icons/fa";
import LoadingSpinner from '../../components/loadingSpinner';
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";

Modal.setAppElement('#root'); // Prevent screen reader issues

export default function CategoryPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [category, setCategory] = useState([]);
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [categoryId, setCategoryId] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);

        axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category")
            .then((response) => setCategory(response.data))
            .catch((error) => console.error("Failed to fetch category:", error))
            .finally(() => setIsLoading(false));
    }, [isLoading]);

    const deleteCategory = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please login first");

        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/category/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Category deleted successfully");
            setIsLoading(true);
        } catch {
            toast.error("Failed to delete category");
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please login first");
        if (!categoryName) return toast.error("Please enter a category name");

        try {
            const categoryData = {
                categoryName,
                createdAt: Date.now(),
            };

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/category`, categoryData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Category added successfully");
            setAddModal(false);
            setIsLoading(true);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to add category");
        }
    };

    const handleEdit = async () => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Please login first");
        if (!categoryName || !categoryId) return toast.error("All fields are required");

        try {
            const categoryData = { categoryId, categoryName };

            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/category/${categoryId}`, categoryData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Category updated successfully");
            setEditModal(false);
            setIsLoading(true);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to update category");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 rounded-md px-12 py-4">

            <div className='flex justify-between items-center mb-4'>
                <div className='w-40% h-full flex flex-col item-center'>
                    <h1 className='text-xl font-semibold text-gray-800'>🧺 Product Category</h1>
                    <p className='text-sm text-gray-600'>Manage product category</p>
                </div>
                <div className="w-[30%] flex justify-end gap-6">
                    <button
                        onClick={() => {
                            setCategoryId('');
                            setCategoryName('');
                            setAddModal(true);
                        }}
                        className="px-6 py-2 rounded-md text-sm font-medium shadow bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition duration-300 ease-in-out flex items-center gap-2"
                    >
                        + Add new category
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
                        <th className="px-10 py-2 w-40">Category Id</th>
                        <th className="p-2 w-100">Category Name</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>
                </table>

                {/* Scrollable tbody container */}
                <div className="overflow-y-auto max-h-[400px]">
                    <table className="min-w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-200">
                        {category.map((item) => (
                        <tr
                            key={item.categoryId}
                            className="h-10 cursor-pointer hover:bg-tableHover transition duration-150"
                        >
                            <td className="px-10 py-2 w-40">{item.categoryId}</td>
                            <td className="p-2 w-100">{item.categoryName}</td>
                            <td className="p-2 flex gap-2">
                            <FaTrash
                                onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    window.confirm(
                                    "Are you sure you want to delete this category?"
                                    )
                                ) {
                                    deleteCategory(item.categoryId);
                                }
                                }}
                                className="text-lg text-red-600 hover:text-red-800 cursor-pointer"
                            />
                            <FaEdit
                                onClick={(e) => {
                                e.stopPropagation();
                                setCategoryId(item.categoryId);
                                setCategoryName(item.categoryName);
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

            {/* Add Modal */}
            <Modal
                isOpen={addModal}
                onRequestClose={() => setAddModal(false)}
                contentLabel="Add Category"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold mb-4">🧺➕ Add Category</h2>
                <label className="mt-10 block text-sm font-medium">Category name</label>
                <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    type="text"
                    placeholder="Enter category name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-4">
                    <button 
                        disabled={isSubmitting}
                        onClick={async () =>{
                            setIsSubmitting(true);
                            await handleSave()
                            setIsSubmitting(false);
                        }} 
                        className={`px-10 py-2 text-sm font-medium shadow bg-purple-600 text-white rounded-md 
                                    hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button onClick={() => setAddModal(false)} className="px-10 py-2 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded">
                        Cancel
                    </button>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={editModal}
                onRequestClose={() => setEditModal(false)}
                contentLabel="Edit Category"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold mb-4">🧺✏️ Edit Category</h2>
                <label className="mt-10 block text-sm font-medium">Category name</label>
                <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    type="text"
                    placeholder="Enter category name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-6">
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
                    <button onClick={() => setEditModal(false)} className="px-8 py-2 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded">
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
}
