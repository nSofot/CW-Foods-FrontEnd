import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ImageSlider from "../../components/imageSlider";
import LoadingSpinner from "../../components/loadingSpinner";
import { addToCart, getCart } from "../../utils/cart";

export default function ProductOverview() {
    const params = useParams();
    const productId = params.Id
    const [status, setStatus] = useState("loading")//loading, success, error
    const [product, setProduct] = useState(null)
    const navigate = useNavigate();

    useEffect(
        () => {
            axios.get(import.meta.env.VITE_BACKEND_URL + "/api/products/" + productId).then(
                (res) => {
                    setProduct(res.data);
                    setStatus("success");
                }
            ).catch(
                (error) => {
                    setStatus("error");
                    toast.error("Error fetching product details")
                }
            )
        }
    , []);

    return (
        <>
            {status == "success" && (
                <div className="w-full h-full flex flex-col md:flex-row">
                    <h1 className="md:hidden my-8 w-full text-center text-2xl font-semibold text-secondary">{product.name}
                        {
                            product.altName.map((altName, index) => {
                                return (
                                    <span key={index} className="w-full text-center text-2xl font-semibold text-gray-600">{" | " + altName}</span>
                                )
                            })
                        }
                    </h1>
                    <div className="w-full md:w-[50%] h-full flex justify-center items-center">
                        <ImageSlider images={product.image}/>
                    </div>
                    <div className="w-full md:w-[50%] h-full flex justify-center items-center">
                        <div className="w-[400px] h-[400px] flex flex-col item-center">
                            <h1 className="hidden md:block w-full text-center text-2xl font-semibold text-secondary">{product.name}
                                {
                                    product.altName.map((altName, index) => {
                                        return (
                                            <span key={index} className="w-full text-center text-2xl font-semibold text-gray-600">{" | " + altName}</span>
                                        )
                                    })
                                }
                            </h1>
                            {/* product Id*/}
                            <h1 className="w-full text-center my-2 text-sm font-semibold text-gray-600">{product.productId}</h1>
                            {/* product description*/}
                            <h1 className="w-full text-center my-2 text-md font-semibold text-gray-600">{product.description}</h1>
                            {/* product price*/}
                            {
                                product.labelledPrice > product.price ? 
                                <div className="w-full flex justify-center items-center mt-4">
                                     <span className="text-4xl text-gray-900">{"Rs." + product.price.toFixed(2)}</span>
                                    <span className="text-2xl text-gray-500 line-through ml-6">Rs.{product.labelledPrice.toFixed(2)}</span>
                                   
                                </div>
                                :<span className="text-4xl text-center text-gray-900 mt-4">{"Rs." + product.price.toFixed(2)}</span>
                            }
                            <div className="w-full flex flex-col md:flex-row justify-center item-center mt-10">
                                <button className="md:w-full my-2 mx-4 cursor-pointer bg-green-600 text-sm text-white py-2 rounded-md hover:bg-green-700 active:bg-green-800"
                                		onClick={() => {
										navigate("/checkout", {
											state: {
												cart: [
													{
														productId: product.productId,
														name: product.name,
														image: product.image,
                                                        altName: product.altName,
                                                        description: product.description,
														price: product.price,
														labelledPrice: product.labelledPrice,
														qty: 1,
													},
												],
											},
										});
									}}>
                                    Buy Now
                                </button>

                                <button className="md:w-full my-2 mx-4 cursor-pointer bg-blue-600 text-sm text-white py-2 rounded-md hover:bg-blue-700 active:bg-blue-800" onClick={()=>{
                                    addToCart(product, 1)
                                    toast.success("Added to cart")
                                    }}>Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {
                status == "loading" && <LoadingSpinner/>
            }
        </>
    );
}

//FBFBFB primary
//393E46 secondary
//C5BAFF accent