"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Container } from "./ui/Container";
import {
  Menu,
  X,
  Play,
  UploadCloud,
  Loader2,
  Trash2,
  Filter,
  LogOut,
  User,
} from "lucide-react";
import { Typography } from "./ui/Typography";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  stockCount?: number;
}

export default function Header({ stockCount = 0 }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? "bg-white/80 backdrop-blur-md border-b border-neutral-100"
        : "bg-transparent"
        }`}
    >
      <Container>
        <div className="flex items-center justify-between py-4">
          {/* Logo & Stock Count */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-52 h-16">
              <Image
                src="/logo1.png"
                alt="Aura Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            {stockCount > 0 && (
              <span className="hidden sm:inline-flex px-2 py-0.5 bg-neutral-100 text-[10px] font-bold rounded-full text-neutral-500">
                {stockCount} STOCKS
              </span>
            )}
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Navigation Links */}
            <div className="flex items-center bg-neutral-100/50 rounded-full p-1 mr-4 border border-neutral-200/50">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${pathname === "/dashboard"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${pathname === "/portfolio"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Portfolio
              </Link>
              <Link
                href="/stocks"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${pathname === "/stocks"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Stocks
              </Link>
              <Link
                href="/screener"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${pathname === "/screener"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Screener
              </Link>
              <Link
                href="/debt-optimizer"
                className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${pathname === "/debt-optimizer"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Debt Optimizer
              </Link>
              <Link
                href="/ask-klyx"
                className={`text-sm font-bold transition-all px-4 py-2 rounded-full ${pathname === "/ask-klyx"
                  ? "bg-[#ccf32f] text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
                  }`}
              >
                Ask Klyx
              </Link>
            </div>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-full">
                  <User size={16} className="text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-black text-white rounded-full font-medium text-sm hover:bg-neutral-800 transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-neutral-100 p-4 shadow-xl">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/dashboard"
              className="text-lg font-medium text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/portfolio"
              className="text-lg font-medium text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              href="/stocks"
              className="text-lg font-medium text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Stocks
            </Link>
            <Link
              href="/screener"
              className="text-lg font-medium text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Screener
            </Link>
            <Link
              href="/debt-optimizer"
              className="text-lg font-medium text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Debt Optimizer
            </Link>
            <Link
              href="/ask-klyx"
              className="text-lg font-bold text-neutral-600 hover:text-black py-2"
              onClick={() => setIsOpen(false)}
            >
              Ask Klyx
            </Link>

            {/* User Section */}
            <div className="pt-4 border-t border-neutral-200">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg mb-3">
                    <User size={16} className="text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-700">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all text-sm font-medium"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block text-center px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
