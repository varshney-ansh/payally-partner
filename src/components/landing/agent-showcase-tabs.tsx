"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs } from "@base-ui/react/tabs";
import { Check, Menu, X } from "lucide-react";

export function AgentShowcaseTabs() {
  return (
    <section id="agent-ready" className="w-full bg-white text-black py-24 px-4 sm:px-8">
      <div className="max-w-[1140px] mx-auto flex flex-col items-center">
        <h2 className="text-[38px] sm:text-[56px] font-black tracking-[-0.03em] leading-[1.06] text-center max-w-[780px]">
          Show up in AI shopping.
          <br />
          Get paid with confidence.
        </h2>

        <p className="mt-6 text-[16px] sm:text-[18px] text-neutral-700 text-center max-w-[700px] leading-[1.55]">
          Two solutions, one seamless experience. Agent Ready is your payments foundation. Use it
          standalone or pair it with Store Sync to orchestrate and simplify the agentic commerce
          experience.
        </p>

        <Tabs.Root defaultValue="agent-ready" className="w-full mt-10 flex flex-col items-center">
          <Tabs.List className="inline-flex items-center p-1.5 rounded-full bg-[#F1F2F4]">
            <Tabs.Tab
              value="agent-ready"
              className="px-7 py-2.5 rounded-full text-[14px] font-bold transition-all cursor-pointer data-[selected]:bg-black data-[selected]:text-white text-neutral-700"
            >
              Agent Ready
            </Tabs.Tab>
            <Tabs.Tab
              value="store-sync"
              className="px-7 py-2.5 rounded-full text-[14px] font-bold transition-all cursor-pointer data-[selected]:bg-black data-[selected]:text-white text-neutral-700"
            >
              Store Sync
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="agent-ready" className="w-full mt-12 outline-none">
            <div className="w-full bg-[#F5F7FA] pt-14 px-4 flex justify-center overflow-hidden">
              <div className="w-full max-w-[360px] bg-white rounded-t-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-b-0 border-neutral-200/70 pt-5 pb-20 px-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <Menu className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[12px] font-bold text-neutral-900">AI Assistant</span>
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="pt-14 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-[#0070BA] text-white flex items-center justify-center mb-4">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <p className="text-[15px] font-bold text-neutral-950">
                    Your order is confirmed!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-14 items-start">
              <div className="md:col-span-6 lg:col-span-5">
                <h3 className="text-[28px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.15]">
                  Power payments in AI platforms
                </h3>
                <p className="mt-4 text-[16px] text-neutral-700 leading-[1.6]">
                  Agent Ready is the foundation for accepting and processing payments on multiple
                  agentic surfaces. Built on 25 years of trusted PayPal payments infrastructure.
                </p>
                <div className="mt-7">
                  <Link
                    href="/signup"
                    className="inline-block px-7 py-3 rounded-full border border-neutral-900 text-[14px] font-bold text-black hover:bg-neutral-100 transition-colors"
                  >
                    Discover Agent Ready
                  </Link>
                </div>
              </div>

              <div className="md:col-span-6 lg:col-offset-2 lg:col-span-5 md:ml-auto">
                <h3 className="text-[28px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.15]">
                  How Agent Ready works
                </h3>
                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3.5">
                    <span className="mt-1 w-5 h-5 rounded-full bg-[#D9F2FF] text-[#003087] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-[16px] text-neutral-800 leading-[1.5]">
                      Accept payments natively within AI channels
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="mt-1 w-5 h-5 rounded-full bg-[#D9F2FF] text-[#003087] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-[16px] text-neutral-800 leading-[1.5]">
                      Simple integration built on your existing PayPal account
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="store-sync" id="store-sync" className="w-full mt-12 outline-none">
            <div className="w-full bg-[#F5F7FA] pt-14 px-4 flex justify-center overflow-hidden">
              <div className="w-full max-w-[360px] bg-white rounded-t-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-b-0 border-neutral-200/70 pt-5 pb-16 px-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <span className="text-[12px] font-bold text-neutral-900">MCP Store Sync</span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#D9F2FF] text-[#003087]">
                    Active
                  </span>
                </div>
                <div className="pt-8 space-y-3 text-left">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                    <p className="text-[13px] font-bold text-neutral-900">CSV Catalog Batch Ingest</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">
                      Products exposed as standardized MCP tools
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                    <p className="text-[13px] font-bold text-neutral-900">Real-Time Inventory Lock</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">
                      Synchronized with Payally Partner Ledger
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-14 items-start">
              <div className="md:col-span-6 lg:col-span-5">
                <h3 className="text-[28px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.15]">
                  Make your catalog discoverable to AI agents
                </h3>
                <p className="mt-4 text-[16px] text-neutral-700 leading-[1.6]">
                  Store Sync translates your product inventory into structured Model Context
                  Protocol (MCP) endpoints so AI agents can query stock and initiate orders.
                </p>
                <div className="mt-7">
                  <Link
                    href="/signup"
                    className="inline-block px-7 py-3 rounded-full border border-neutral-900 text-[14px] font-bold text-black hover:bg-neutral-100 transition-colors"
                  >
                    Configure Store Sync
                  </Link>
                </div>
              </div>

              <div className="md:col-span-6 lg:col-span-5 md:ml-auto">
                <h3 className="text-[28px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.15]">
                  How Store Sync works
                </h3>
                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3.5">
                    <span className="mt-1 w-5 h-5 rounded-full bg-[#D9F2FF] text-[#003087] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-[16px] text-neutral-800 leading-[1.5]">
                      Ingest products via CRUD dashboard or batch CSV upload
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="mt-1 w-5 h-5 rounded-full bg-[#D9F2FF] text-[#003087] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-[16px] text-neutral-800 leading-[1.5]">
                      Deploy instant MCP Server URLs for agent discovery
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Tabs.Panel>
        </Tabs.Root>
      </div>
    </section>
  );
}