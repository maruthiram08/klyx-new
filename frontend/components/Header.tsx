"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Typography } from "./ui/Typography";

interface HeaderProps {
  stockCount?: number;
  onUpload?: (files: FileList) => void;
  onRunAnalysis?: () => void;
  onClearData?: () => void;
  isProcessing?: boolean;
}

export default function Header({
  stockCount = 0,
  onUpload,
  onRunAnalysis,
  onClearData,
  isProcessing = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
    }
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
          <div className="hidden md:flex items-center gap-4">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept=".xlsx,.xls,.csv"
            />

            <Link
              href="/stocks"
              className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-full ${pathname === "/stocks"
                ? "text-black bg-[#ccf32f]"
                : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
            >
              Stocks
            </Link>

            <Link
              href="/screener"
              className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-full ${pathname === "/screener"
                ? "text-black bg-[#ccf32f]"
                : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
            >
              <Filter size={18} />
              Screener
            </Link>

            {onClearData && (
              <button
                onClick={onClearData}
                className="p-2 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Clear All Data"
              >
                <Trash2 size={20} />
              </button>
            )}

            <div className="h-6 w-px bg-neutral-200 mx-2"></div>

            {onUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-neutral-600 hover:text-black transition-colors flex items-center gap-2 px-3 py-2 rounded-full hover:bg-neutral-50"
              >
                <UploadCloud size={18} />
                Upload
              </button>
            )}

            {onRunAnalysis && (
              <Button
                variant="primary"
                size="md"
                onClick={onRunAnalysis}
                disabled={isProcessing}
                className="rounded-full shadow-lg shadow-lime-400/20 min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Run Analysis
                  </>
                )}
              </Button>
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
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setIsOpen(false);
              }}
              className="text-lg font-medium text-neutral-600 hover:text-black py-2 flex items-center gap-2"
            >
              <UploadCloud size={20} />
              Upload New Files
            </button>

            {onClearData && (
              <button
                onClick={() => {
                  if (confirm("Clear all data?")) {
                    onClearData();
                    setIsOpen(false);
                  }
                }}
                className="text-lg font-medium text-rose-500 hover:text-rose-700 py-2 flex items-center gap-2"
              >
                <Trash2 size={20} />
                Clear All Data
              </button>
            )}

            <div className="h-px bg-neutral-100 my-2"></div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                onRunAnalysis?.();
                setIsOpen(false);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Run Analysis"}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
