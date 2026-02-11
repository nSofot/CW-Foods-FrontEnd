import { useState, useEffect } from "react";
import axios from 'axios'; 
import toast from 'react-hot-toast';
import { FaEdit, FaTrash } from "react-icons/fa";
import LoadingSpinner from '../../components/loadingSpinner';
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";


export default function LocationsPage() {

    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const navigate = useNavigate();

    const [locationId, setLocationId] = useState('');
    const [locationName, setLocationName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);



    useEffect(() => {

        window.scrollTo(0, 0);

        if(isLoading == true){
            axios.get(import.meta.env.VITE_BACKEND_URL + "/api/locations")
                .then((response) => {
                    setLocations(response.data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to fetch locations:", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isLoading]);


    function deleteUom(locationId) {

        const token = localStorage.getItem("token")

        if(token === null){
            toast.error("Please login first")
            return
        }

        axios.delete(import.meta.env.VITE_BACKEND_URL + "/api/locations/" + locationId, { 
            headers: { 
                Authorization: "Bearer " + token
            } 
        }).then(() => {
            toast.success("Location deleted successfully")
            setIsLoading(true)
        })
        .catch((error) => {
            toast.error("Failed to delete Location: " + (error?.response?.data?.message || error.message)); 
        });
    }


    async function handleSave() {

        const token = localStorage.getItem("token");

        if (!token) {
            return toast.error("Not authorized. Please login.");
        }

        if ( !locationName ) {
            return toast.error('Please fill in required fields');
        }

        try {
            const uomData = {
                locationName,
                createdAt: Date.now(),
            };

            const response = await axios.post(
                import.meta.env.VITE_BACKEND_URL + '/api/locations',
                uomData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            );

            toast.success("Location Added Successfully");
            setAddModal(false);
            setIsLoading(true);

        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to add Location');
        }
    }


    async function handleEdit() {
        const token = localStorage.getItem("token");

        if (!token) {
            return toast.error("Not authorized. Please login.");
        }

        if ( !locationName || !locationId ) {
            return toast.error('Please fill in all fields');
        }

        try {
            const uomdData = {
                locationId,
                locationName
            };

            await axios.put(
                import.meta.env.VITE_BACKEND_URL + '/api/locations/' + locationId,
                uomdData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            );

            toast.success("Location updated successfully");
            setEditModal(false);
            setIsLoading(true);

        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update Location');
        }
    }



    return (
        <div className="w-full h-full flex flex-col bg-gray-100 rounded-md p-4">

            <div className='flex justify-between items-center mb-4'>
                <div className='w-40% h-full flex flex-col item-center'>
                    <h1 className='text-xl font-semibold text-gray-800'>🏠 Stock Locations</h1>
                    <p className='text-sm text-gray-600'>Manage and track all locations where stock items are stored and maintained.</p>
                </div>
                <div className='w-30% flex justify-end gap-6'>
                    <button
                        onClick={() =>{
                            setLocationId('')
                            setLocationName('')
                            setAddModal(true)
                        }}
                        className="px-8 py-2 rounded text-sm font-medium shadow bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition duration-300 ease-in-out">
                        +  Add new Location
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
                <table className="min-w-full text-sm text-left border border-gray-200 rounded-md">
                    <thead className="bg-purple-600 text-white top-0 z-10 rounded-md">
                    <tr>
                        <th className="px-12 py-2 w-40">Loc/Id</th>
                        <th className="p-2 w-80">Location Name</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>
                </table>

                {/* Scrollable tbody container */}
                <div className="overflow-y-auto max-h-[400px]">
                    <table className="min-w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-200">
                        {locations.map((item) => (
                        <tr
                            key={item.locationId}
                            className="h-8 cursor-pointer hover:bg-tableHover transition duration-150"
                        >
                            <td className="px-12 py-2 w-40">{item.locationId}</td>
                            <td className="p-2 w-80">{item.locationName}</td>
                            <td className="p-2 flex gap-2">
                            <FaTrash
                                onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this UoM?")) {
                                    deleteUom(item.locationId);
                                }
                                }}
                                className="text-lg text-red-600 hover:text-red-800 cursor-pointer"
                            />
                            <FaEdit
                                onClick={(e) => {
                                e.stopPropagation();
                                setLocationId(item.locationId);
                                setLocationName(item.locationName);
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
                contentLabel="Add UoM"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold mb-4">🧺➕ Add New Location</h2>
                <label className="mt-10 block text-sm font-medium">Location Name</label>
                <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    type="text"
                    placeholder="Enter Location Name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-6">
                    <button 
                        disabled={isSubmitting}
                        onClick={async () =>{
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            await handleSave()
                            setIsSubmitting(false);
                            setIsLoading(true);
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
                contentLabel="Edit UOM"
                className="max-w-xl mx-auto bg-white p-10 rounded-lg shadow-2xl mt-15 border border-gray-400"
            >
                <h2 className="text-lg font-bold mb-4">🧺✏️ Edit Location</h2>
                <label className="mt-10 block text-sm font-medium">Location Name</label>
                <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    type="text"
                    placeholder="Enter Location Name"
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 mb-4 w-full"
                />
                <div className="mt-10 flex gap-6">
                    <button 
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            await handleEdit();
                            setIsSubmitting(false); 
                            setIsLoading(true);
                        }}
                            
                          className={`px-10 py-2 text-sm font-medium shadow bg-purple-600 text-white rounded-md 
                                    hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50`}
                        >
                        {isSubmitting ? 'Updatting...' : 'Update'}
                    </button>
                    <button onClick={() => setEditModal(false)} className="px-8 py-2 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded">
                        Cancel
                    </button>
                </div>
            </Modal>

        </div>
    );
}