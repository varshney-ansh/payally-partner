"use client";

import React, { useState } from "react";
import Link from "next/link";

type StageKey = "paid" | "growing" | "ahead";

export function EditorialFeatureSwitcher() {
  const [active, setActive] = useState<StageKey>("paid");

  return (
    <section className="w-full bg-black text-white py-28 px-4 sm:px-8">
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch">
        
        <div className="lg:col-span-6 flex flex-col justify-between py-2">
          <div className="flex flex-col items-start select-none space-y-1 w-full">
            <button
              type="button"
              onClick={() => setActive("paid")}
              style={{ fontSize: 'clamp(48px, 8vw, 64px)' }}
              className={`text-left font-black tracking-[-0.035em] leading-[1.05] transition-colors cursor-pointer w-full ${
                active === "paid" ? "text-white" : "text-[#3A3A3C] hover:text-neutral-500"
              }`}
            >
              Get paid
            </button>
            <button
              type="button"
              onClick={() => setActive("growing")}
              style={{ fontSize: 'clamp(48px, 8vw, 64px)' }}
              className={`text-left font-black tracking-[-0.035em] leading-[1.05] transition-colors cursor-pointer w-full ${
                active === "growing" ? "text-white" : "text-[#3A3A3C] hover:text-neutral-500"
              }`}
            >
              Get growing
            </button>
            <button
              type="button"
              onClick={() => setActive("ahead")}
              style={{ fontSize: 'clamp(48px, 8vw, 64px)' }}
              className={`text-left font-black tracking-[-0.035em] leading-[1.05] transition-colors cursor-pointer w-full ${
                active === "ahead" ? "text-white" : "text-[#3A3A3C] hover:text-neutral-500"
              }`}
            >
              Get ahead
            </button>
          </div>
          <div className="mt-16 lg:mt-0 max-w-[400px]">
            {active === "paid" && (
              <div>
                <p className="text-[18px] text-white leading-[1.5] font-normal">
                  Accept secure payments around the world. Give customers and AI agents multiple
                  ways to pay, while you get paid in your preferred currency.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 text-[14px] font-semibold text-[#48C6EF]">
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    No-code payment solutions
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Invoicing
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Checkout options and processing
                  </Link>
                </div>
              </div>
            )}

            {active === "growing" && (
              <div>
                <p className="text-[18px] text-white leading-[1.5] font-normal">
                  Scale your business globally with flexible, end-to-end payment and billing
                  lifecycle solutions.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 text-[14px] font-semibold text-[#48C6EF]">
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Automated Invoice Lifecycle
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    MCP Endpoint Deployment
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Recurring agent settlements
                  </Link>
                </div>
              </div>
            )}

            {active === "ahead" && (
              <div>
                <p className="text-[18px] text-white leading-[1.5] font-normal">
                  Run your business more efficiently. Help increase authorization rates, reduce
                  costs, and protect against automated fraud.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 text-[14px] font-semibold text-[#48C6EF]">
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Seller Protection
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Transaction Ledger &amp; Reporting
                  </Link>
                  <Link href="/signup" className="underline underline-offset-4 hover:text-white">
                    Gross Volume Analytics
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-[28px] overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center p-6">
            
            {active === "paid" && (
              <div className="w-full max-w-[330px] bg-white text-black rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-serif text-[18px] text-neutral-900">Payment Method</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100">
                    1 Item
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded border border-blue-600 font-semibold text-neutral-800">
                    &bull; Debit or Credit Card
                  </div>
                  <div className="p-2.5 rounded border border-neutral-200 text-neutral-500 font-mono">
                    **** **** **** 4829
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded border border-neutral-200 text-neutral-700">
                      09/29
                    </div>
                    <div className="p-2.5 rounded border border-neutral-200 text-neutral-700">
                      &bull;&bull;&bull;
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded bg-black text-white font-bold mt-2"
                  >
                    Continue
                  </button>
                  <div className="text-center text-[11px] text-neutral-400 py-0.5">or</div>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded bg-[#FFC439] text-[#003087] font-black"
                  >
                    PayPal
                  </button>
                </div>
              </div>
            )}
            {active === "growing" && (
              <div className="w-full max-w-[350px] rounded-[24px] bg-[#2A3B2C]/85 backdrop-blur-xl border border-white/15 p-6 text-white shadow-2xl">
                <p className="text-center text-[14px] font-semibold text-white/90 mb-4">
                  Send invoice
                </p>
                <div className="rounded-2xl bg-white/15 p-4 flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white text-emerald-800 font-black text-xs flex items-center justify-center">
                      FL
                    </div>
                    <div>
                      <p className="text-[13px] font-bold leading-tight">Flora Landscaping</p>
                      <p className="text-[11px] text-white/75">Invoice #264</p>
                    </div>
                  </div>
                  <span className="text-[24px] font-black tracking-tight">$220</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="py-2.5 rounded-full bg-[#48C6EF] text-black font-bold text-[12px]"
                  >
                    Share via SMS
                  </button>
                  <button
                    type="button"
                    className="py-2.5 rounded-full bg-black text-white font-bold text-[12px]"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            )}
            {active === "ahead" && (
              <div className="w-full max-w-[300px] rounded-[24px] bg-[#997B5C]/85 backdrop-blur-xl border border-white/15 p-6 text-white shadow-2xl">
                <p className="text-center text-[22px] font-black leading-tight mb-6">
                  Shopper
                  <br />
                  insights
                </p>
                <div className="flex items-end justify-between gap-3 h-40 px-2">
                  <div className="flex flex-col justify-between h-full text-[11px] text-white/80 font-medium py-1">
                    <span>3.5k</span>
                    <span>2.5k</span>
                    <span>1.5k</span>
                    <span>500</span>
                  </div>
                  <div className="flex items-end gap-3 flex-1 justify-around h-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-9 h-24 rounded-full bg-[#2EA8FF]" />
                      <span className="text-[10px] font-semibold">$90+</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-9 h-28 rounded-full bg-[#2EA8FF]" />
                      <span className="text-[10px] font-semibold">$90-300</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-9 h-28 rounded-full bg-[#2EA8FF]" />
                      <span className="text-[10px] font-semibold">$300+</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}