import { useState } from "react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiCheckCircle,
} from "react-icons/fi";

export default function Contact() {
  /* ---------------------- state ---------------------- */
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /* -------------------- handlers --------------------- */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      /* === REPLACE with your real API endpoint === */
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------- reusable field component ----------- */
  const Field = ({ label, name, type = "text", textarea = false }) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={5}
          className="p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-300"
          value={form[name]}
          onChange={handleChange}
          required
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className="p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-300"
          value={form[name]}
          onChange={handleChange}
          required
        />
      )}
    </div>
  );

  /* --------------------- render ---------------------- */
  return (
    <main className="min-h-screen flex flex-col">
      {/* ------------ hero banner ------------ */}
      <section className="relative h-[40vh] bg-indigo-600 flex items-center justify-center overflow-hidden">
        <img
          src="/contact-hero.jpg" /* place any wide hero in /public */
          alt="Contact us"
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
        />
        <h1 className="relative text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
          Get in Touch
        </h1>
      </section>

      {/* ---------- main content grid ---------- */}
      <section className="flex-1 max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12">
        {/* ====== contact information ====== */}
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl font-bold">We’d love to hear from you</h2>
          <p className="text-gray-700">
            Whether you have a question about products, shipping, or returns, or
            you just want to share your feedback—our team is ready to help!
          </p>

          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <FiMail className="text-2xl text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold">Email us</p>
                <a
                  href="mailto:support@cbcbeauty.lk"
                  className="text-indigo-600 hover:underline"
                >
                  cwfoodsceylon@gmail.com
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <FiPhone className="text-2xl text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold">Call us</p>
                <a href="tel:+94112345678" className="text-indigo-600 hover:underline">
                  +94 77 206 9430
                </a>
                <p className="text-sm text-gray-500">Mon–Fri, 9 AM – 6 PM</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <FiMapPin className="text-2xl text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold">Visit us</p>
                <address className="not-italic">
                  123 Hiriwadunna,<br />
                  Kegalle, Sri Lanka
                </address>
              </div>
            </li>
          </ul>

          {/* optional embedded map */}
          <div className="rounded-xl overflow-hidden shadow-lg">
            <iframe
              title="CW Foods Ceylon (Pvt) Ltd. HQ map"
              // src="https://maps.google.com/maps?q=colombo%2007&t=&z=13&ie=UTF8&iwloc=&output=embed"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1468.2150791711329!2d80.3833100205428!3d7.288392804487054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2slk!4v1754668664888!5m2!1sen!2slk"
              loading="lazy"
              className="w-full h-64 border-0"
            />
          </div>
        </div>

        {/* ============ contact form ============ */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

          {success && (
            <p className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
              <FiCheckCircle className="text-xl" /> Thank you! We’ll get back to
              you soon.
            </p>
          )}

          {error && (
            <p className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Name" name="name" />
            <Field label="Email" name="email" type="email" />
            <Field label="Subject" name="subject" />
            <Field label="Message" name="message" textarea />

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  Sending...
                  <FiSend className="animate-pulse" />
                </>
              ) : (
                <>
                  Send Message
                  <FiSend />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
