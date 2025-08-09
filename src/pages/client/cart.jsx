import { useState } from "react";
import { addToCart, getCart, removeFromCart, getItemsTotal, getItemsDiscount, getSubTotal, getEstimatedTotal } from "../../utils/cart"
import { BiMinus, BiPlus, BiTrash } from "react-icons/bi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";


export default function CartPage() {

    const [cart, setCart] = useState(getCart());
    const [selectedItems, setSelectedItems] = useState({});

    const toggleSelectItem = (productId) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };


    return (
        <div className="bg-gray-200 w-[95%] md:w-full md:h-full flex flex-col md:flex-row justify-between items-center md:pl-25 md:pr-25 pt-1 md:pt-4 pb-1 md:pb-4">

            {/* Cart Items */}
            <div className="bg-gray-100 w-[95%] md:w-[65%] md:h-full flex flex-col items-left rounded-md p-1 md:p-6 md:overflow-y-scroll">
                {
                    cart.map((item) => {
                        return (
                            <div key={item.productId} className="w-[100%] md:h-[115px] bg-white my-1 rounded-md flex flex-col md:flex-row justify-between items-center p-2">
                                
                                {/* Checkbox */}
                                <div className="p-4">
                                    <input 
                                        type="checkbox"
                                        checked={!!selectedItems[item.productId]}
                                        onChange={() => toggleSelectItem(item.productId)}
                                        className="w-5 h-5 rounded-full border-2 cursor-pointer hover:border-red-600"
                                    />
                                </div>

                                {/* Product Image */}
                                <div className="md:w-[15%] h-full">
                                    <img src={item.image[0]} className="w-[100px] h-[100px] object-cover rounded-md" />
                                </div>

                                {/* Product Details */}
                                <div className="w-full md:w-[65%] h-full flex flex-col justify-top item-center md:items-start ml-4 mr-4">
                                    <div className="w-full h-full flex flex-col justify-top">
                                        <div>
                                            <h1 className="text-1xl text-secondary font-semibold flex justify-center md:justify-start">{item.name}</h1>
                                            <h1 className="text-sm text-gray-600 font-normal flex justify-center md:justify-start">{item.productId}</h1>
                                        </div>
                                        <div className="w-full flex flex-col md:flex-row md:justify-between items-center">
                                            {
                                                item.labelledPrice > item.price ?
                                                    <div>
                                                        <span className="text-lg font-semibold text-secondary">Rs.{item.price.toFixed(2)}</span>
                                                        <span className="text-md mx-2 text-gray-500 line-through">Rs.{item.labelledPrice.toFixed(2)}</span>
                                                    </div>
                                                    :
                                                    <span className="text-lg font-semibold text-accent">Rs.{item.price.toFixed(2)}</span>
                                            }
                                            <span className="text-sm text-gray-600 font-semibold mr-2">Rs.{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="w-[100px] h-[100px] flex flex-col justify-top items-center md:items-end space-y-4">
                                    <button className="text-2xl cusor-pointer hover:bg-red-600 hover:text-white rounded-full"
                                        onClick={() => {
                                        removeFromCart(item.productId)
                                        setCart(getCart())
                                        toast.success("Item removed from cart")
                                    }}>
                                        <BiTrash />
                                    </button>
                                    <div className="w-[100px] h-[30px] flex flex-row justify-center items-center border-1 border-gray-200 rounded-xl p-2">
                                        <button className="text-1xl mx-1 rounded-xl hover:bg-blue-400 active:bg-blue-600 p-2 text-gray-600 font-semibold cursor-pointer aspect-round"
                                            onClick={() => {
                                                if (item.qty > 0) {
                                                    addToCart(item, -1)
                                                    setCart(getCart())
                                                }
                                            }}>
                                            <BiMinus />
                                        </button>
                                        <h1 className="text-1xl mx-1 text-secondary font-semibold h-full flex items-center">{item.qty}</h1>
                                        <button className="text-1xl mx-1 rounded-xl hover:bg-blue-400 active:bg-blue-600 p-2 text-gray-600 font-semibold cursor-pointer aspect-square"
                                            onClick={() => {
                                                addToCart(item, 1);
                                                setCart(getCart());
                                            }}>
                                            <BiPlus />
                                        </button>
                                    </div>
                                    
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            {/* Summary */}
            <div className="bg-gray-100 w-[95%] md:w-[33%] h-full mt-4 md:mt-0 mb-4 md:mb-0flex flex-col rounded-md p-8">
                <h1 className="text-2xl font-semibold text-gray-900">Summary</h1>
                <div className="w- full flex justify-between pt-8">
                    <p className="text-sm font-normal text-gray-400">Total Items:</p>
                    <p className="text-sm font-normal text-gray-900"> {cart.length}</p>
                </div>
                <div className="w-full flex justify-between">
                    <p className="text-sm font-normal text-gray-400">Items Total:</p>
                    <span className="text-sm font-normal text-gray-400 line-through">Rs.{getItemsTotal().toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between">
                    <p className="text-sm font-semibold text-gray-400">Items Discount:</p>
                    <p className="text-sm font-nrmal text-red-600">- Rs.{getItemsDiscount().toFixed(2)} </p>
                </div>
                <div className="w-full flex justify-between">
                    <p className="text-sm font-semibold text-gray-900">Sub Total:</p>
                    <p className="text-sm font-semibold text-gray-900">Rs.{getSubTotal().toFixed(2)}</p>
                </div>
                <div className="w-full flex justify-between pt-2">
                    <p className="text-sm font-semibold text-gray-900">Shipping:</p>
                    <p className="text-sm font-semibold text-gray-900">Rs.00.00</p>
                </div>
                <div className="w-full flex justify-between pt-4">
                    <p className="text-lg font-semibold text-gray-900">Estimated Total:</p>
                    <p className="text-lg font-semibold text-gray-900">Rs.{getEstimatedTotal().toFixed(2)}</p>
                </div>

                <div className="w-full flex justify-center">
                <Link
                    to="/checkout"
                    state={{
                        cart: Object.values(selectedItems).some(Boolean)
                            ? cart.filter(item => selectedItems[item.productId])
                            : cart
                    }}
                    className="w-full bg-red-600 text-center text-white hover:bg-red-700 cursor-pointer text-white font-semibold py-2 px-4 rounded-md mt-8"
                >
                    Checkout
                </Link>
                </div>


                <p className="text-sm font-semibold text-gray-600 mt-4">* Shipping and taxes are calculated at checkout.</p>
            </div>
        </div>
    );
}
