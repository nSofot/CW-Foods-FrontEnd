import { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    FiShoppingBag,
    FiCreditCard,
    FiTruck,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);  
    const [isLoading, setIsLoading] = useState(true);

    /* ------------------ dummy spotlight data (fallback) ------------------ */
    const spotlight = [
      {
        productId: "spotlight-1",
        name: "Hydra Glow Serum",
        price: 4990,
        image: ["/products/serum.jpg"],
      },
      {
        productId: "spotlight-2",
        name: "Velvet Matte Lipstick",
        price: 2450,
        image: ["/products/lipstick.jpg"],
      },
      {
        productId: "spotlight-3",
        name: "Renew Night Cream",
        price: 5600,
        image: ["/products/nightcream.jpg"],
      },
    ];

    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const [prodRes, catRes, braRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products`),
            axios.get(import.meta.env.VITE_BACKEND_URL + "/api/category"),
            axios.get(import.meta.env.VITE_BACKEND_URL + "/api/brand"),
          ]);

          setProducts(prodRes.data);
          setCategories(catRes.data);
          setBrands(braRes.data);
        } catch (err) {
          console.error("Search request failed:", err);
          toast.error("Failed to fetch products. Showing featured picks.");
          setProducts(spotlight); // fallback spotlight data
        } finally {
          setIsLoading(false);
        }
      };

      if (isLoading) {
        fetchProducts();
      }
    }, [isLoading]);


    function getCategoryName(categoryId) {  
          const category = categories.find(p => p.categoryId === categoryId);
          return category ? category.categoryName : categoryId;
    }

    function getBrandName(brandId) {      
          const brand = brands.find(p => p.brandId === brandId);
          return brand ? brand.brandName : brandId;
    }


    return (
        <Fragment>
          {/* ---------- HERO ---------- */}
          <section className="relative w-full h-[70vh] bg-gradient-to-r from-red-600 to-indigo-600 flex items-center justify-center overflow-hidden">
              <motion.img
                src="/banner01.jpg"
                alt="Beauty banner"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
              />

              <div className="relative text-center text-white px-4">
                <motion.h1
                  className="text-4xl md:text-6xl font-extrabold drop-shadow-lg"
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Spice Up Every &nbsp;Meal
                </motion.h1>

                <motion.p
                  className="mt-4 max-w-xl mx-auto text-lg md:text-xl"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Discover Sri Lanka’s finest spices and gourmet essentials &amp; — delivered fresh, fast, and with care.
                </motion.p>

                <motion.div
                  className="mt-8 flex justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link
                    to="/products"
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full shadow hover:bg-gray-100"
                  >
                    Shop Now
                  </Link>
                  <Link
                    to="/about"
                    className="px-6 py-3 border border-white font-semibold rounded-full hover:bg-white hover:text-indigo-600"
                  >
                    Learn More
                  </Link>
                </motion.div>
              </div>
            </section>

            {/* ---------- FEATURES ---------- */}
            <section className="bg-white py-12">
              <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
                {[
                  {
                    icon: <FiTruck size={36} />,
                    title: "Express Delivery",
                    desc: "Colombo same‑day, island‑wide in 2‑3 days",
                  },
                  {
                    icon: <FiCreditCard size={36} />,
                    title: "Secure Payments",
                    desc: "Card, bank transfer, Cash‑on‑Delivery",
                  },
                  {
                    icon: <FiShoppingBag size={36} />,
                    title: "100% Authentic",
                    desc: "We’re an authorised retailer—no fakes, ever",
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex flex-col items-center">
                    <div className="text-indigo-600">{icon}</div>
                    <h3 className="mt-3 font-bold">{title}</h3>
                    <p className="mt-1 text-gray-600 text-sm text-center px-4">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- SPOTLIGHT / BESTSELLERS ---------- */}
            <section className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-bold text-center mb-10">Trending Now</h2>

              {isLoading ? (
                <p className="text-center">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-gray-500">No products available at the moment.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-10">
                  {products.slice(0, 3).map((item, idx) => (
                    <motion.article
                      key={item.productId}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link to={`/overview/${item.productId}`}>
                        <img
                          src={item.image[0]}
                          alt={item.name}
                          className="w-full h-64 object-cover"
                        />
                        <div className="p-6">
                          <h2 className="text-lg font-semibold">{getBrandName(item.brandId)} {getCategoryName(item.categoryId)}</h2>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="mt-2 text-indigo-600 font-bold">
                            Rs.{item.price}
                          </p>

                          <p className="mt-2 flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} size={14} />
                            ))}
                            <span className="ml-1 text-sm text-gray-600">
                              (1k reviews)
                            </span>
                          </p>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}

              <div className="text-center mt-12">
                <Link
                  to="/products"
                  className="inline-block px-8 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-full hover:bg-indigo-50"
                >
                  Browse All Products
                </Link>
              </div>
            </section>

            {/* ---------- CTA BANNER ---------- */}
            <section className="w-full bg-indigo-600 text-white py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold bg-indigo-600">
                  Join Our Spice Lover’s Circle
              </h2>
              <p className="mt-4 max-w-2xl mx-auto">
                  Get 10% off your first order, early access to sales, and exclusive
                  Get 10% off your first order, early access to seasonal offers, and exclusive recipes & flavor tips straight to your 
                  inbox.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-full shadow hover:bg-gray-100"
              >
                Sign&nbsp;Up&nbsp;Free
              </Link>
            </section>
        </Fragment>
    );
}
