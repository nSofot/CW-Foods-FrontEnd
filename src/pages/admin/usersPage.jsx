import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/loadingSpinner";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");              
                if (!token) {
                    toast.error("Please login first");
                    navigate("/login");
                    return;
                }

                const res = await axios.get(
                    import.meta.env.VITE_BACKEND_URL + "/api/user/all-users",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
                    setUsers([res.data]); // single user
                } else if (Array.isArray(res.data)) {
                    setUsers(res.data); // multiple users
                } else {
                    console.error("Unexpected data format", res.data);
                    setUsers([]);
                }

            } catch (err) {
                console.error("❌ API error", err);
                toast.error(err.response?.data?.message || "Failed to fetch users");
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [location, isLoading]);


    function deleteUser(userId) {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }
        axios
            .delete(`${import.meta.env.VITE_BACKEND_URL}/api/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(() => {
                toast.success("User deleted successfully");
                setUsers(prev => prev.filter(user => user._id !== userId));
            })
            .catch((e) => {
                toast.error(e.response?.data?.message || "Delete failed");
            });
    }

    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">👤 Users</h1>
                    <p className="text-sm text-gray-500">Manage registered users and access levels</p>
                </div>
                <Link
                    to="/admin/add-user"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow">
                    + Add New User
                </Link>
            </div>

            <div className="bg-white shadow rounded-md overflow-x-auto">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <table className="min-w-full text-sm text-left border border-gray-200">
                        <thead className="bg-purple-600 text-white">
                            <tr>
                                <th className="px-4 py-2">Image</th>
                                <th className="px-4 py-2">First Name</th>
                                <th className="px-4 py-2">Last Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Role</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((item) => (
                            <tr key={item._id} className="hover:bg-purple-100 transition duration-150">
                            <td className="px-4 py-2">
                                <img
                                src={item.image}
                                alt={`${item.firstName} ${item.lastName}`}
                                className="w-12 h-12 object-cover rounded-md"
                                />
                            </td>
                            <td className="px-4 py-2">{item.firstname}</td>
                            <td className="px-4 py-2">{item.lastname}</td>
                            <td className="px-4 py-2">{item.email}</td>
                            <td className="px-4 py-2">{item.role}</td>
                            <td className="px-4 py-2">
                                <div className="flex gap-3">
                                <button
                                    onClick={() => deleteUser(item._id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <FaTrash className="text-lg" />
                                </button>
                                <button
                                    onClick={() => navigate("/admin/edit-user", { state: item })}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <FaEdit className="text-lg" />
                                </button>
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>

                    </table>
                )}
            </div>
        </div>
    );
}
