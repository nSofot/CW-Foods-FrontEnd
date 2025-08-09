import { Link, useNavigate, useLocation } from "react-router-dom";
import { BsCart3 } from "react-icons/bs";
import { GiHamburgerMenu } from "react-icons/gi";
import { useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";

export default function Header() {
    const [sideDrawerOpened, setSideDrawerOpened] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("token");
    const cart = localStorage.getItem("cart");
    const isLoggedIn = Boolean(token);
    const cartCount = cart ? JSON.parse(cart).length : 0;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    };

    // Close side drawer on route change
    useEffect(() => {
        setSideDrawerOpened(false);
    }, [location.pathname]);

    return (
        <header className="w-full h-[80px] shadow-2xl flex justify-between relative bg-red-600 z-50">
            {/* Hamburger Icon (Mobile) */}
            <GiHamburgerMenu
                className="h-full text-3xl md:hidden absolute left-4 cursor-pointer"
                onClick={() => setSideDrawerOpened(true)}
            />

            {/* Logo */}
            <img
                src="/Logo.jpg"
                alt="Logo"
                className="w-[180px] h-[70px] object-cover cursor-pointer pt-2 pl-2"
                onClick={() => navigate("/")}
            />

            {/* Desktop Nav Links */}
            <div className="w-[80%] flex hidden md:flex flex-col py-2">
                <span className="w-full text-2xl flex justify-center font-bold text-yellow-400">CW Foods Ceylon Pvt Ltd.</span>
                <nav className="flex-1 hidden md:flex justify-center items-center">
                    <Link to="/"         className="text-lg text-white font-bold mx-3 hover:underline">Home</Link>
                    <Link to="/products" className="text-lg text-white font-bold mx-3 hover:underline">Products</Link>
                    <Link to="/about"    className="text-lg text-white font-bold mx-3 hover:underline">About</Link>
                    <Link to="/contact"  className="text-lg text-white font-bold mx-3 hover:underline">Contact</Link>
                </nav>
            </div>


            {/* Desktop User + Cart */}
            <div className="w-[200px] hidden md:flex justify-center items-center gap-4 pr-2">
                <FaRegUser className="text-white text-2xl cursor-pointer" />

                {isLoggedIn ? (
                    <button onClick={handleLogout} className="text-md font-semibold text-gray-300">Logout</button>
                ) : (
                    <Link to="/login" className="text-md font-semibold text-gray-100">Login</Link>
                )}

                <div className="relative cursor-pointer">
                    <Link to="/cart">
                        <BsCart3 className="text-white text-2xl" />
                    </Link>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 text-xs text-white bg-black w-[20px] h-[20px] rounded-full flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile Side Drawer */}
            <div
                className={`fixed inset-0 bg-black/60 md:hidden transition-opacity duration-300 ${
                    sideDrawerOpened ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSideDrawerOpened(false)}
            >
                <aside
                    className={`w-[280px] bg-white h-full shadow-xl transform transition-transform duration-300 ${
                        sideDrawerOpened ? "translate-x-0" : "-translate-x-full"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drawer Header */}
                    <div className="h-[80px] shadow flex items-center px-4">
                        <GiHamburgerMenu
                            className="text-3xl cursor-pointer"
                            onClick={() => setSideDrawerOpened(false)}
                        />
                        <img
                            src="/CBC-Logo.png"
                            alt="Logo"
                            className="w-[60px] h-[60px] object-cover ml-auto cursor-pointer"
                            onClick={() => navigate("/")}
                        />
                    </div>

                    {/* Drawer Nav */}
                    <nav className="flex flex-col items-start px-6 gap-4 mt-6">
                        <Link to="/"         className="text-lg font-bold" onClick={() => setSideDrawerOpened(false)}>Home</Link>
                        <Link to="/products" className="text-lg font-bold" onClick={() => setSideDrawerOpened(false)}>Products</Link>
                        <Link to="/about"    className="text-lg font-bold" onClick={() => setSideDrawerOpened(false)}>About</Link>
                        <Link to="/contact"  className="text-lg font-bold" onClick={() => setSideDrawerOpened(false)}>Contact</Link>
                        <Link to="/cart"     className="text-lg font-bold" onClick={() => setSideDrawerOpened(false)}>
                            Cart <BsCart3 className="inline ml-2" />
                        </Link>
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="text-lg font-bold text-red-600 mt-2">
                                Logout
                            </button>
                        ) : (
                            <Link to="/login" className="text-lg font-bold text-blue-600 mt-2">
                                Login
                            </Link>
                        )}
                    </nav>
                </aside>
            </div>
        </header>
    );
}
