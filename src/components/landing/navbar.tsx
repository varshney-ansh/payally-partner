"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="w-full sticky top-0 z-50 bg-white">
      <header className="w-full bg-white border-b border-neutral-200/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2" aria-label="Payally Home">
              <div className="relative flex items-center">
                <span className="text-[26px] font-black tracking-tighter text-[#003087]">
                  Pay
                </span>
                <span className="text-[26px] font-black tracking-tighter text-[#0070BA]">
                  ally
                </span>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-7 text-[15px] font-semibold text-neutral-900">
              <Link href="#agent-ready" className="flex items-center gap-1.5 hover:text-[#003087] transition-colors">
                <span>Platform</span>
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link href="#global" className="flex items-center gap-1.5 hover:text-[#003087] transition-colors">
                <span>Business</span>
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link href="#developers" className="flex items-center gap-1.5 hover:text-[#003087] transition-colors">
                <span>Developers</span>
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link href="/contact" className="flex items-center gap-1.5 hover:text-[#003087] transition-colors">
                Contact
              </Link>
              <Link href="/about" className="hover:text-[#003087] transition-colors">
                About
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="px-6 py-2 rounded-full border border-neutral-900 text-[15px] font-bold text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 rounded-full bg-black text-[15px] font-bold text-white hover:bg-neutral-800 transition-colors"
              style={{ backgroundColor: '#000000', color: '#ffffff', display: 'inline-flex' }}
            >
              Sign Up
            </Link>
          </div>
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger className="md:hidden p-2 text-neutral-900 rounded-full hover:bg-neutral-100">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open menu</span>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity" />
              <Dialog.Popup className="fixed top-0 right-0 z-50 h-full w-[82%] max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                    <span className="text-2xl font-black tracking-tighter text-[#003087]">
                    </span>
                    <Dialog.Close className="p-2 text-neutral-600 hover:text-black rounded-full">
                      <X className="w-5 h-5" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Title className="sr-only">Site Navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Mobile navigation links</Dialog.Description>

                  <nav className="flex flex-col gap-5 mt-8 text-[17px] font-bold text-neutral-900">
                    <Link href="#agent-ready" onClick={() => setMobileOpen(false)}>
                      Platform
                    </Link>
                    <Link href="#store-sync" onClick={() => setMobileOpen(false)}>
                      Business
                    </Link>
                    <Link href="#developers" onClick={() => setMobileOpen(false)}>
                      Developers
                    </Link>
                    <Link href="/about" onClick={() => setMobileOpen(false)}>
                      About
                    </Link>
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      Contact Sales
                    </Link>
                  </nav>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-neutral-200">
                  <Link
                    href="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3 rounded-full border border-neutral-900 text-center font-bold text-[15px]"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3 rounded-full bg-black text-white text-center font-bold text-[15px]"
                    style={{ backgroundColor: '#000000', color: '#ffffff' }}
                  >
                    Sign Up
                  </Link>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
    </div>
  );
}