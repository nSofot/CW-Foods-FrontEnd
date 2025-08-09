import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  FaStar,
  FaRegStar,
  FaRegSadCry,
  FaRegMeh
} from "react-icons/fa";
import {
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiChevronDown,
  FiSearch,
  FiLoader,
  FiFilter
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`)
      .then((res) => {
        if (isMounted) setReviews(res.data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to fetch reviews");
      })
      .finally(() => isMounted && setLoading(false));
    return () => (isMounted = false);
  }, []);

  const handleStatusChange = (id, newStatus) => {
    axios
      .patch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${id}`, {
        status: newStatus
      })
      .then(() => {
        toast.success(`Review ${newStatus}`);
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      })
      .catch(() => toast.error("Action failed. Try again."));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this review permanently?")) return;
    axios
      .delete(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${id}`)
      .then(() => {
        toast.success("Review deleted");
        setReviews((prev) => prev.filter((r) => r._id !== id));
      })
      .catch(() => toast.error("Delete failed"));
  };

  const filtered = useMemo(() => {
    let data = [...reviews];
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.productName.toLowerCase().includes(term) ||
          r.userName.toLowerCase().includes(term) ||
          r.comment.toLowerCase().includes(term)
      );
    }
    data.sort((a, b) =>
      sortDir === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
    return data;
  }, [reviews, statusFilter, search, sortDir]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-80 text-indigo-600 animate-spin">
        <FiLoader size={28} />
      </div>
    );
  if (error) return <p className="text-center text-red-600 py-10">{error}</p>;

  return (
    <section className="p-6 md:p-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Product Reviews</h1>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <label className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              className="pl-9 pr-3 py-2 rounded-full border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="relative">
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-full border text-sm shadow-sm hover:bg-gray-50"
              onClick={() => setShowStatus((s) => !s)}
            >
              <FiFilter />
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <FiChevronDown />
            </button>
            <AnimatePresence>
              {showStatus && (
                <StatusMenu
                  current={statusFilter}
                  onSelect={(v) => {
                    setStatusFilter(v);
                    setShowStatus(false);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="px-4 py-2 rounded-full border shadow-sm text-sm hover:bg-gray-50"
          >
            Sort: {sortDir === "asc" ? "Oldest" : "Newest"}
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
          <FaRegSadCry size={48} />
          <p>No reviews match your criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Reviewer</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3 text-left">Comment</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <AnimatePresence>
                {filtered.map((r) => (
                  <Row
                    key={r._id}
                    review={r}
                    onApprove={() => handleStatusChange(r._id, "approved")}
                    onReject={() => handleStatusChange(r._id, "rejected")}
                    onDelete={() => handleDelete(r._id)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Row({ review, onApprove, onReject, onDelete }) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="text-sm"
    >
      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3 min-w-[200px]">
        <img
          src={review.productImage}
          alt={review.productName}
          onError={(e) => (e.currentTarget.src = "/placeholder-product.png")}
          className="w-10 h-10 rounded object-cover border"
        />
        <span>{review.productName}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap min-w-[160px]">
        <p className="font-medium">{review.userName || "Anonymous"}</p>
        <p className="text-gray-500 text-xs">{review.userEmail || "N/A"}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <Stars rating={review.rating} />
      </td>
      <td className="px-6 py-4 max-w-[280px] truncate" title={review.comment}>
        {review.comment}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {new Date(review.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        })}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={review.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right min-w-[140px] space-x-2">
        {review.status === "pending" && (
          <>
            <ActionButton icon={FiCheckCircle} label="Approve" onClick={onApprove} />
            <ActionButton icon={FiXCircle} label="Reject" onClick={onReject} />
          </>
        )}
        <ActionButton icon={FiTrash2} label="Delete" onClick={onDelete} variant="danger" />
      </td>
    </motion.tr>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex justify-center gap-px">
      {Array.from({ length: 5 }).map((_, i) => {
        if (rating >= i + 1) return <FaStar key={i} className="text-yellow-400" />;
        if (rating > i && rating < i + 1) return <FaRegMeh key={i} className="text-yellow-400" />;
        return <FaRegStar key={i} className="text-gray-300" />;
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = "primary" }) {
  const base = "inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium gap-1";
  const styles = {
    primary: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} title={label}>
      <Icon />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function StatusMenu({ current, onSelect }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onSelect(current);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [current, onSelect]);

  const options = ["all", "pending", "approved", "rejected"];

  return (
    <motion.ul
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-10"
    >
      {options.map((opt) => (
        <li
          key={opt}
          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 capitalize ${
            current === opt ? "font-semibold text-indigo-600" : "text-gray-700"
          }`}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </li>
      ))}
    </motion.ul>
  );
}