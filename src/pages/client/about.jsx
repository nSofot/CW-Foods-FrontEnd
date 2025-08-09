import { Fragment } from "react";
// import { Helmet } from "react-helmet-async";         // optional—remove if you’re not using Helmet
import { motion } from "framer-motion";              // framer‑motion already available per style‑guide
import {
  FaHandsHelping,
  FaLeaf,
  FaRocket,
  FaUsers,
  FaGlobeAsia,
} from "react-icons/fa";

export default function About() {
  return (
    <Fragment>
      {/* ---------- SEO / meta ---------- */}
      <title>
        <title>About | CBC Store</title>
        <meta
          name="description"
          content="Learn about CBC Store’s history, mission, and the values that drive us."
        />
      </title>

      {/* ---------- Hero ---------- */}
      <section className="relative w-full h-[50vh] bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden">
        <motion.img
          src="/about-hero.jpg"               /* <-- put any hero image in /public */
          alt="Our team at work"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.h1
          className="relative text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          About CW Foods Ceylon Store
        </motion.h1>
      </section>

      {/* ---------- Mission & vision ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed text-gray-700">
              At CW Foods Ceylon (Pvt) Ltd., our mission is to deliver the rich 
              heritage and authentic flavors of Sri Lanka to kitchens 
              around the world. We are committed to sourcing the highest 
              quality spices and food products sustainably, supporting 
              local farmers, and preserving traditional methods — 
              all while ensuring freshness, purity, and taste in every pack.
          </p>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
          <p className="text-lg leading-relaxed text-gray-700">
              To be a globally trusted name in authentic Sri Lankan food 
              and spices — celebrated for quality, sustainability, 
              and our deep connection to the island’s culinary heritage. 
              We envision a world where every meal can be enriched with the 
              vibrant flavors of Ceylon.
          </p>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 text-center gap-8">
          {[
            { value: "30+", label: "Years in Business" },
            { value: "500K+", label: "Happy Customers" },
            { value: "8", label: "Regional Warehouses" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-blue-700">{value}</p>
              <p className="mt-2 text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Core values ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Our Core Values</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaHandsHelping size={40} />,
              title: "Integrity",
              desc: "We do what’s right—even when no one’s watching.",
            },
            {
              icon: <FaLeaf size={40} />,
              title: "Sustainability",
              desc: "We invest in eco‑friendly processes that protect our island home.",
            },
            {
              icon: <FaUsers size={40} />,
              title: "People First",
              desc: "Employees and customers sit at the heart of every decision.",
            },
            {
              icon: <FaRocket size={40} />,
              title: "Innovation",
              desc: "We embrace change and constantly iterate to serve you better.",
            },
            {
              icon: <FaGlobeAsia size={40} />,
              title: "Community",
              desc: "Giving back to Sri Lanka is woven into our DNA.",
            },
          ].map(({ icon, title, desc }) => (
            <motion.div
              key={title}
              className="bg-white rounded-2xl p-8 shadow-md text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-center mb-4 text-blue-700">{icon}</div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Call‑to‑action ---------- */}
      <section className="w-full bg-indigo-600 text-white py-16">
        <div className="max-w-full mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to experience CW Foods quality?
          </h2>
          <p className="mb-8 text-lg">
            Browse our latest collection or get in touch—our team is here to help.
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-2xl font-semibold bg-white text-indigo-600 shadow"
              onClick={() => (window.location.href = "/products")}
            >
              Shop Now
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-2xl font-semibold border border-white shadow"
              onClick={() => (window.location.href = "/contact")}
            >
              Contact Us
            </motion.button>
          </div>
        </div>
      </section>
    </Fragment>
  );
}
