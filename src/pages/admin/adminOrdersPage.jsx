// AdminOrdersPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../../components/loadingSpinner";
import toast from "react-hot-toast";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeOrder, setActiveOrder] = useState(null);
	const [statusUpdate, setStatusUpdate] = useState("");


	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Please login first");
			return;
		}

		axios
			.get(import.meta.env.VITE_BACKEND_URL + "/api/order", {
				headers: { Authorization: "Bearer " + token },
			})
			.then((res) => {
				setOrders(res.data);
				setIsLoading(false);
			})
			.catch((error) => {
				toast.error(
					"Failed to load orders: " +
					(error.response?.data?.message || "Unknown error")
				);
				setIsLoading(false);
			});
	}, [isLoading]);

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}

	function formatCurrency(value) {
		return `Rs ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
	}

	return (
		<div className="w-full h-full overflow-y-auto p-4">
			<h1 className="text-xl font-semibold text-gray-800 mb-4">🧾 Orders</h1>

			{isLoading ? (
				<LoadingSpinner />
			) : (
				<div className="overflow-x-auto bg-white rounded-lg shadow">
					<table className="min-w-full text-sm text-left border border-gray-200">
						<thead className="bg-purple-600 text-white text-sm">
							<tr>
								<th className="px-4 py-2">Order ID</th>
								<th className="px-4 py-2">Date</th>
								<th className="px-4 py-2">Name</th>
								<th className="px-4 py-2">Email</th>
								<th className="px-4 py-2">Phone</th>
								<th className="px-4 py-2">Address</th>
								<th className="px-4 py-2 text-right">Total</th>
								<th className="px-4 py-2">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{orders.map((order, index) => (
								<tr
									key={index}
									onClick={() => {
										setActiveOrder(order);
										setIsModalOpen(true);
									}}
									className="hover:bg-purple-100 transition duration-150 cursor-pointer"
								>
									<td className="px-4 py-2 font-medium">{order.orderId}</td>
									<td className="px-4 py-2">{formatDate(order.createdAt)}</td>
									<td className="px-4 py-2">{order.name}</td>
									<td className="px-4 py-2">{order.email}</td>
									<td className="px-4 py-2">{order.phone}</td>
									<td className="px-4 py-2">{order.address}</td>
									<td className="px-4 py-2 text-right">{formatCurrency(order.total)}</td>
									<td className="px-4 py-2">
										<span
											className={`px-2 py-1 text-xs rounded-full font-medium ${
												order.status.toLowerCase() === "delivered"
													? "bg-green-100 text-green-700"
												: order.status.toLowerCase() === "pending"
												? "bg-yellow-100 text-yellow-700"
												: order.status.toLowerCase() === "cancelled"
												? "bg-red-100 text-red-700"
												: order.status.toLowerCase() === "returned"
												? "bg-blue-100 text-blue-700"	
												: order.status.toLowerCase() === "refunded"
												? "bg-pink-100 text-pink-700"
												: "bg-gray-100 text-gray-700"
											}`}
										>
											{order.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Modal
				isOpen={isModalOpen}
				onRequestClose={() => setIsModalOpen(false)}
				contentLabel="Order Details"
				// className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg mt-20 overflow-y-auto max-h-[80vh]"
				className="max-w-4xl max-h-[150vh] mx-auto bg-white p-6 rounded-lg shadow-lg mt-10 border border-gray-400"
			>
				{activeOrder && (
					<div className="space-y-4">
						<div className="w-full flex justify-between">
							<div className="w-[40%]">
								<h2 className="text-2xl font-bold text-gray-800 mb-1">
									Order #{activeOrder.orderId}
								</h2>
								<p className="text-sm text-gray-500">
									Placed on {formatDate(activeOrder.createdAt)}
								</p>
								<div className="mt-2">
									<span
										className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
											activeOrder.status.toLowerCase() === "delivered"
												? "bg-green-100 text-green-700"
											: activeOrder.status.toLowerCase() === "pending"
											? "bg-yellow-100 text-yellow-700"
											: activeOrder.status.toLowerCase() === "cancelled"
											? "bg-red-100 text-red-700"
											: activeOrder.status.toLowerCase() === "returned"
											? "bg-blue-100 text-blue-700"
											: activeOrder.status.toLowerCase() === "refunded"
											? "bg-pink-100 text-pink-700"
											: "bg-gray-100 text-gray-700"
										}`}
									>
										Status: {activeOrder.status}
									</span>

									<select
										value={statusUpdate}
										onChange={async (e) => {
											const updatedValue = e.target.value;
											setStatusUpdate(updatedValue); // update local state
											try {
												const token = localStorage.getItem("token");
												await axios.put(
													import.meta.env.VITE_BACKEND_URL + "/api/order/" + activeOrder.orderId + "/" + updatedValue,
													{},
													{ headers: { Authorization: "Bearer " + token } }
												);
												toast.success("Status updated");
												setIsLoading(true);
												const updatedOrders = {...activeOrder};
												updatedOrders.status = updatedValue;
												setActiveOrder(updatedOrders);
											} catch (e) {
												toast.error(e.response?.data?.message || "Update failed");
											}
										}}
										className="text-sm"
									>
										<option value="" >Change status</option>
										<option value="pending">Pending</option>
										<option value="delivered">Delivered</option>
										<option value="cancelled">Cancelled</option>
										<option value="returned">Returned</option>
										<option value="refunded">Refunded</option>
									</select>

								</div>
							</div>

							{/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700"> */}
								<div className="w-[30%]">
									<h3 className="font-semibold text-gray-900">Customer Info</h3>
									<p className="text-sm">Name: {activeOrder.name}</p>
									<p className="text-sm">Email: {activeOrder.email}</p>
									<p className="text-sm">Phone: {activeOrder.phone}</p>
								</div>

								<div className="w-[30%]">
									<h3 className="font-semibold text-gray-900">Shipping Address</h3>
									<p className="text-sm">{activeOrder.address}</p>
								</div>
							{/* </div> */}

						</div>

						<div className="w-full h-[300px] bg-gray-100 border-t px-6 pt-4 overflow-y-auto">
							<h3 className="text-lg font-semibold text-purple-700 mb-3">Products</h3>
							<div className="space-y-2">
								{activeOrder.products.map((item, i) => (
									<div
										key={i}
										className="flex flex-col md:flex-row items-start gap-4 border py-2 px-4 rounded-md"
									>
										<img
											src={item.productInfo.images[0]}
											alt={item.productInfo.name}
											className="w-20 h-20 mt-1 object-cover rounded"
										/>
										<div className="flex-1">
											<h4 className="font-semibold text-gray-800 text-base">
												{item.productInfo.name}
											</h4>
											<p className="text-gray-600 text-sm italic mb-1">
												{item.productInfo.altNames.join(", ")}
											</p>
											<p className="text-gray-700 text-sm">
												Qty: {item.quantity} | Price:{" "}
												{formatCurrency(item.productInfo.price)} | Labelled:{" "}
												{formatCurrency(item.productInfo.labelledPrice)}
											</p>
											<p className="text-gray-500 text-xs mt-1">
												{item.productInfo.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="w-full flex justify-between">

							<div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white z-10">
								<button
									className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
									onClick={() => setIsModalOpen(false)}
								>
									Close
								</button>
								<button
									className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
									onClick={() => window.print()}
								>
									Print
								</button>
							</div>

							<div className="pr-4 text-right">
								<p className="text-lg font-semibold text-gray-800">
									Total: {formatCurrency(activeOrder.total)}
								</p>
								<p className="text-sm text-gray-500">
									Labelled Total: {formatCurrency(activeOrder.labelledTotal)}
								</p>
							</div>
						</div>

					</div>
				)}
			</Modal>

		</div>
	);
}