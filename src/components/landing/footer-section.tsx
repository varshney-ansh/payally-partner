"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

export function FooterSection() {
  return (
    <div className="w-full">
      <section className="w-full bg-[#003087] text-white py-24 px-4 text-center">
        <div className="max-w-[760px] mx-auto flex flex-col items-center">

          <h2 className="text-[44px] sm:text-[68px] font-black tracking-[-0.035em] leading-[1.04]">
            One platform
            <br />
            for your business
          </h2>

          <p className="mt-6 text-[16px] sm:text-[18px] text-white/90 leading-[1.6]">
            Get paid. Get growing. Get ahead.
            <br />
            Do more with the platform designed to power agentic commerce.
          </p>

          <div className="mt-9 flex flex-row items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="px-7 py-3 rounded-full bg-white text-black font-bold text-[14px] hover:bg-neutral-100 transition-colors"
              style={{ backgroundColor: '#ffffff', color: '#000000', display: 'inline-flex' }}
            >
              Sign Up
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3 rounded-full bg-white/15 text-white font-bold text-[14px] hover:bg-white/25 transition-colors"
              style={{ backgroundColor: '#000000', color: '#ffffff', display: 'inline-flex' }}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
      <footer className="w-full bg-black text-white py-16 px-4 sm:px-8">
        <div className="max-w-[1140px] mx-auto">
          <div className="mb-10">
            <span className="text-[28px] font-black tracking-tighter text-white">
              Payally
            </span>
          </div>
          <div className="pb-6 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] font-bold text-white">
            <div className="flex flex-wrap gap-x-7 gap-y-3">
              <Link href="/about" className="hover:underline">
                Help
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact us
              </Link>
              <Link href="/about" className="hover:underline">
                Fees
              </Link>
              <Link href="/about" className="hover:underline">
                Security
              </Link>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
              <Link href="#developers" className="hover:underline">
                Business Resource Center
              </Link>
            </div>

            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <Globe className="w-4 h-4" />
              <span>India</span>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] font-bold text-white">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/about" className="hover:underline">
                About
              </Link>
              <Link href="/about" className="hover:underline">
                Newsroom
              </Link>
              <Link href="#developers" className="hover:underline">
                Developers
              </Link>
              <Link href="/about" className="hover:underline">
                Partners
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/about" className="hover:underline">
                Accessibility
              </Link>
              <Link href="/about" className="hover:underline">
                Cookies
              </Link>
              <Link href="/about" className="hover:underline">
                Privacy
              </Link>
              <Link href="/about" className="hover:underline">
                Legal
              </Link>
            </div>
          </div>
          <div className="text-[11px] text-neutral-400 leading-[1.6]">
          </div>
        </div>
      </footer>
    </div>
  );
}