import { MenuIcon, XIcon, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { name: "Home", href: "/" },
    { name: "Agents", href: "#agents" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Pricing", href: "#pricing" },
    { name: "Docs", href: "#docs" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <>
      <motion.nav
        className={`sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3.5 md:px-16 lg:px-24 transition-colors ${isScrolled ? "bg-white/15 backdrop-blur-lg" : ""}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <a href="/">
          <img
            src="/assets/logo.svg"
            alt="logo"
            className="h-8.5 w-auto"
            width={205}
            height={48}
          />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center space-x-10 md:flex">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="transition hover:text-gray-300"
            >
              {link.name}
            </a>
          ))}

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to="/language-select" className="btn glass">
                Get Started
              </Link>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="size-4 text-white/60" />
                <span className="max-w-[120px] truncate">
                  {user?.name || "Account"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
                title="Logout"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn glass">
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(true)}
          className="transition active:scale-90 md:hidden"
        >
          <MenuIcon className="size-6.5" />
        </button>
      </motion.nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/20 text-lg font-medium backdrop-blur-2xl transition duration-300 md:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {links.map((link) => (
          <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
            {link.name}
          </a>
        ))}

        {isLoggedIn ? (
          <>
            <Link
              to="/language-select"
              className="btn glass"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <User className="size-4 text-white/60" />
              <span>{user?.name || "Account"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/70 hover:text-white transition"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="btn glass"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="rounded-md p-2 glass"
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
