import { useState } from "react";
import toast from "react-hot-toast";
import { BiMinus, BiPlus, BiTrash } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CheckOutPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [cart, setCart] = useState(() => {
        const items = location.state?.cart || [];
        
        return items.map(item => {
            const info = item.productInfo || item;
            return {
                productId: info.productId,
                name: info.name,
                description: info.description || "",
                image: Array.isArray(info.image) ? info.image : [info.image || ""],
                altName: Array.isArray(info.altName) ? info.altName : [info.altName || ""], // 👈 ensure array
                labelledPrice: info.labelledPrice || info.price,
                price: info.price,
                qty: info.qty || info.quantity || 1
            };
        });

    });

    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");

    const getItemsTotal = () =>
        cart.reduce((total, item) => total + item.labelledPrice * item.qty, 0);

    const getItemsDiscount = () =>
        cart.reduce((total, item) => total + (item.labelledPrice - item.price) * item.qty, 0);

    const getSubTotal = () =>
        cart.reduce((total, item) => total + item.price * item.qty, 0);

    const getEstimatedTotal = () =>
        cart.reduce((total, item) => total + item.price * item.qty, 0);

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const changeQty = (index, delta) => {
        const updated = [...cart];
        updated[index].qty = Math.max(1, updated[index].qty + delta);
        setCart(updated);
    };

    const placeOrder = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first");
            return;
        }

        if (!phoneNumber || !address) {
            toast.error("Please enter phone number and address");
            return;
        }

        if (cart.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        const orderInformation = {
            phone: phoneNumber,
            address: address,
            products: cart.map(item => ({
                productInfo: {
                    productId: item.productId,
                    name: item.name,
                    altNames: Array.isArray(item.altName) ? item.altName : [item.altName], // ✅ fix here
                    quantity: item.qty,
                    description: item.description,
                    price: item.price,
                    images: Array.isArray(item.image) ? item.image : [item.image], // ✅ fix here
                    labelledPrice: item.labelledPrice
                }
            }))
        };


        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/order`,
                orderInformation,
                {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                }
            );

            toast.success("Order placed successfully!");
            navigate("/products");
        } catch (err) {
            toast.error("Error placing order");
        }
    };

    return (
        <div className="bg-gray-200 w-[95%] md:w-full md:h-full flex flex-col md:flex-row justify-between items-center p-1 md:p-4">
            {/* Cart Section */}
            <div className="bg-gray-100 w-full md:w-[65%] h-full flex flex-col rounded-md p-1 md:p-6 md:overflow-y-scroll">
               
                {cart.map((item, index) => (
                    <div key={item.productId || index} className="w-full h-full md:h-[115px] bg-white my-1 rounded-md flex flex-col md:flex-row md:justify-between items-center p-2">
                        <div className="w-[15%] h-full ml-4">
                            <img src={item.image[0]} alt={item.image[0]} className="w-[100px] h-[100px] object-cover rounded-md" />
                        </div>

                        <div className="w-full md:w-[65%] h-full flex flex-col justify-top item-center md:items-start ml-4 mr-4">
                            <h1 className="text-1xl text-secondary font-semibold flex justify-center md:justify-start">{item.name}</h1>
                            {/* <p className="text-xs text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-600">{item.altName}</p> */}
                            <p className="text-xs text-gray-600 flex justify-center md:justify-start">{item.productId}</p>
                            <div className="w-full flex flex-col md:flex-row md:justify-between items-center">
                                {item.labelledPrice > item.price ? (
                                    <div>
                                        <span className="text-lg font-semibold text-secondary ">Rs.{item.price.toFixed(2)}</span>
                                        <span className="text-md mx-2 text-gray-500 line-through">Rs.{item.labelledPrice.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <span className="text-lg font-semibold text-accent">Rs.{item.price.toFixed(2)}</span>
                                )}
                                <span className="text-sm font-semibold text-gray-600">Rs.{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="w-[100px] h-[100px] flex flex-col justify-between items-center md:items-end space-y-2">
                            <button className="text-2xl hover:bg-red-600 hover:text-white rounded-full"
                                onClick={() => removeFromCart(index)}><BiTrash />
                            </button>
                            <div className="flex border rounded-xl p-1 items-center">
                                <button onClick={() => changeQty(index, -1)} className="p-1 hover:bg-blue-400 rounded-xl"><BiMinus /></button>
                                <span className="mx-2">{item.qty}</span>
                                <button onClick={() => changeQty(index, 1)} className="p-1 hover:bg-blue-400 rounded-xl"><BiPlus /></button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>

            {/* Summary Section */}
            <div className="bg-gray-100 w-full md:w-[33%] h-full mt-4 md:mt-0 mb-4 md:mb-0 flex flex-col rounded-md p-8">
                <h1 className="text-2xl font-semibold text-gray-900">Summary</h1>
                <div className="pt-8 space-y-2">
                    <SummaryRow label="Total Items" value={cart.length} />
                    <SummaryRow label="Items Total" value={`Rs.${getItemsTotal().toFixed(2)}`} strike />
                    <SummaryRow label="Items Discount" value={`- Rs.${getItemsDiscount().toFixed(2)}`} highlight />
                    <SummaryRow label="Sub Total" value={`Rs.${getSubTotal().toFixed(2)}`} bold />
                    <SummaryRow label="Shipping" value="Rs.00.00" bold />
                    <SummaryRow label="Estimated Total" value={`Rs.${getEstimatedTotal().toFixed(2)}`} bold large />
                </div>

                <input
                    className="w-full text-sm rounded-md border-2 border-gray-200 py-2 px-4 mt-8"
                    type="text"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <input
                    className="w-full text-sm rounded-md border-2 border-gray-200 py-2 px-4 mt-4"
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />

                <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md mt-8"
                    disabled={cart.length === 0}
                    onClick={placeOrder}
                >
                    Place Order
                </button>

                <p className="text-sm font-semibold text-gray-600 mt-4">
                    * Shipping and taxes are calculated at checkout.
                </p>
            </div>
        </div>
    );
}

// Helper component to reduce repetition
function SummaryRow({ label, value, strike, bold, highlight, large }) {
    const baseStyle = "text-sm";
    const labelStyle = `${baseStyle} ${bold ? "font-semibold" : "font-normal"} text-gray-400`;
    const valueStyle = `${baseStyle} ${bold ? "font-semibold" : "font-normal"} ${
        highlight ? "text-red-600" : "text-gray-900"
    } ${strike ? "line-through" : ""} ${large ? "text-lg" : ""}`;

    return (
        <div className="w-full flex justify-between">
            <p className={labelStyle}>{label}</p>
            <p className={valueStyle}>{value}</p>
        </div>
    );
}
