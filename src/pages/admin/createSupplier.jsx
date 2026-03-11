import axios from 'axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';



export default function CreateSupplier() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            navigate('/login');
        }
    }, [navigate]);


    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [balance, setBalance] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);



    function handleCancel() {
        setName('');
        setAddress('');
        setMobile('');
        setPhone('');
        setEmail('');
        setBalance('');
        setContactPerson('');
        setTaxNumber('');
        setNotes('');
        setIsActive(true);

        navigate("/dashboard/purchases/suppliers")
    }



   async function handleSave() {
        const token = localStorage.getItem("token");

        if (!token) {
            return toast.error("Not authorized. Please login.");
        }

        if ( !name || !address || !mobile ) {
            return toast.error('Please fill in required fields');
        }


        try {
            const supplierData = {
                name,
                address,
                mobile,
                phone,
                email,
                balance: Number(balance) || 0,
                contactPerson,
                taxNumber,
                notes,
                isActive
            };

            const response = await axios.post(
                import.meta.env.VITE_BACKEND_URL + '/api/supplier',
                supplierData,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    }
                }
            );

            toast.success("Supplier added successfully");
            navigate("/admin/suppliers");

        } catch (e) {
            console.error("Error adding supplier:", e.response?.data || e.message);
            toast.error(e?.response?.data?.message || 'Failed to add supplier');
        }
    }



    return (
        <div className="w-full max-h-full flex flex-col bg-gray-100 rounded-md p-4">

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">🚚➕ Add Supplier</h1>
                    <p className="text-sm text-gray-600">Fill out the form below to register a new supplier</p>
                </div>
                <div className="w-[30%] flex justify-end gap-6">
                    <button
                        disabled={isSubmitting}
                        onClick={async () =>{
                            if (isSubmitting) return;
                            setIsSubmitting(true);
                            await handleSave();
                            setIsSubmitting(false);
                        }}
                        className={`px-10 py-2 text-sm font-medium shadow bg-green-500 text-white rounded-md 
                                    hover:bg-green-600 active:bg-green-700 disabled:opacity-50`}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
              
                    <Link
                        to="/admin/suppliers"
                        className="cursor-pointer bg-gray-400 text-white hover:bg-gray-500 active:bg-gray-600 px-10 py-2 rounded-md text-sm font-medium shadow"
                    >
                        Cancel
                    </Link> 
                </div>
            </div>

            <div className="w-full max-h-full bg-secondary2 rounded-md shadow-xl p-10">
                <div className="w-full flex justify-between">
                    <div className="w-[45%] flex flex-col space-y-4"> 
                        <div className='w-full'>
                            <label className="block text-sm font-medium">Name *</label>
                            <input  
                                type="text"
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className='w-full'>
                            <label className="block text-sm font-medium">Address *</label>
                            <input  
                                type="text"
                                value={address} 
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className='w-full'>
                            <label className="block text-sm font-medium">Contact Person </label>
                            <input  
                                type="text"
                                value={contactPerson} 
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className='w-full flex justify-between'>
                            <div className='w-[35%]'>
                                <label className="block text-sm font-medium">Mobile Number *</label>
                                <input  
                                    type="text"
                                    value={mobile} 
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className='w-[60%]'>
                                <label className="block text-sm font-medium">Email </label>
                                <input  
                                    type="text"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className='w-full flex justify-between'>
                            <div className='w-[35%]'>
                                <label className="block text-sm font-medium">Phone Number </label>
                                <input  
                                    type="text"
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div> 
                            <div className='w-[60%]'>
                                <label className="block text-sm font-medium">Tax Number</label>
                                <input  
                                    type="text"
                                    value={taxNumber} 
                                    onChange={(e) => setTaxNumber(e.target.value)}
                                    className="w-full text-sm border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>
                        
                    </div>


                    <div className="w-[45%] flex flex-col justify-between space-y-6">

                        <div className="w-full h-[70%]">
                            <label className="block text-sm font-medium mb-1" htmlFor="notes">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full text-sm h-full text-sm border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Enter your notes here..."
                            />
                        </div> 
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center space-x-3">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-blue-600 scale-125"
                />
                <label className="text-sm font-medium text-gray-700">Is Active</label>
            </div>
         </div>
    );
}