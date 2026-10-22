"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export function DeveloperSection() {
  return (
    <section id="developers" className="w-full bg-white text-black py-24 px-4 sm:px-8 border-t border-neutral-200/70">
      <div className="max-w-[1080px] mx-auto">
        <div className="max-w-[680px]">
          <h2 className="text-[40px] sm:text-[56px] font-black tracking-[-0.035em] leading-[1.05]">
            Developer resources
          </h2>
          <p className="mt-4 text-[16px] sm:text-[17px] text-neutral-800 leading-[1.5]">
            Get API credentials, demo product experiences, and configure your MCP endpoints.
          </p>
          <div className="mt-6">
            <Link
              href="/docs"
              className="inline-block px-6 py-2.5 rounded-full bg-[#E9EEF4] text-neutral-950 font-bold text-[13px] hover:bg-[#dce4ed] transition-colors"
              style={{ backgroundColor: '#000000', color: '#ffffff', display: 'inline-flex' }}
            >
              Explore Developer Documentation
            </Link>
          </div>
        </div>
        <div className="mt-12 relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[28px] bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-start p-6 sm:p-12">
          
          <span className="absolute top-4 right-5 text-xs font-mono text-neutral-400">
            public/assets/developer-working.jpg
          </span>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full max-w-[680px]">
            <div className="w-full sm:w-[380px] rounded-2xl bg-[#111317]/95 backdrop-blur-md text-neutral-300 p-5 shadow-2xl border border-white/10 font-mono text-[11px] leading-[1.6]">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              </div>
              <pre className="overflow-x-auto text-neutral-300">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <script
    src="https://www.paypal.com/sdk/js?
    client-id=PAYALLY_MCP_CLIENT_ID&
    components=buttons,fastlane"
    data-sdk-integration="payally-mcp"
  ></script>
</head>`}
              </pre>
            </div>
            <div className="flex flex-col gap-2.5 w-full sm:w-[250px] sm:-ml-8 mt-2 sm:mt-0">
              <div className="px-4 py-3 rounded-xl bg-neutral-800/80 backdrop-blur-md text-white text-[13px] font-semibold flex items-center justify-between border border-white/10 shadow-lg">
                <span>Create transaction</span>
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              </div>

              <div className="px-4 py-3.5 rounded-xl bg-neutral-700/90 backdrop-blur-md text-white text-[13px] font-bold flex items-center justify-between border border-white/20 shadow-xl scale-[1.03]">
                <span>Vault data</span>
                <span className="w-5 h-5 rounded-full bg-[#2EA8FF] text-black flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <div className="px-4 py-3 rounded-xl bg-neutral-800/80 backdrop-blur-md text-white text-[13px] font-semibold flex items-center justify-between border border-white/10 shadow-lg">
                <span>Transaction processed</span>
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}