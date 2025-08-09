import "./productCard.css";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

export default function ProductCard({ product }) {
    const {
        productId,
        name,
        description,
        image,
        price,
        labelledPrice,
        stock,
        isAvailable,
        rating = 0,       
        reviewCount = 0,     
    } = product;

    const stars = Array.from({ length: 5 }, (_, i) => (
        <FaStar
            key={i}
            size={14}
            className={i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"}
        />
    ));

    return (
        <Link
            to={`/overview/${productId}`}
            className="w-[300px] h-[460px] bg-white shadow-lg rounded-xl overflow-hidden m-2 flex flex-col transition-transform hover:scale-105 duration-300"
        >
            {/* -------- product image -------- */}
            <div className="h-[50%] w-full bg-gray-100 flex items-center justify-center">
                <img
                    src={image?.[0] || "/placeholder.png"}
                    alt={name}
                    className="object-contain h-full"
                />
            </div>

            {/* -------- product details -------- */}
            <div className="p-4 flex flex-col flex-1">
                <h2 className="text-base font-semibold truncate">{name}</h2>

                <p className="text-sm text-gray-600 mb-2 h-[42px] overflow-hidden">
                    {description || "No description available."}
                </p>

                {/* price */}
                <div className="flex items-center space-x-2 mb-1">
                    {labelledPrice > price && (
                        <span className="text-sm text-gray-400 line-through">
                            Rs.{labelledPrice}
                        </span>
                    )}
                    <span className="text-base font-bold text-green-600">Rs.{price}</span>
                </div>

                {/* NEW ───────────── reviews */}
                <div className="flex items-center gap-1 text-xs mb-2">
                    {reviewCount > 0 ? (
                        <>
                            {stars}
                            <span className="text-gray-500 ml-1">({reviewCount})</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">No reviews</span>
                    )}
                </div>

                {/* stock + CTA */}
                <div className="flex items-center justify-between mt-auto">
                    <span
                        className={`text-sm ${
                            isAvailable && stock > 0 ? "text-green-500" : "text-red-500"
                        }`}
                    >
                        {isAvailable && stock > 0
                            ? `In Stock (${stock})`
                            : "Out of Stock"}
                    </span>

                    <button
                        // placeholder — hook up to cart/checkout later
                        onClick={(e) => {
                            e.preventDefault(); // prevent link navigation
                            // handleAddToCart(productId);
                        }}
                        disabled={!isAvailable || stock <= 0}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </Link>
    );
}
