import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-100dvh w-full bg-white text-black flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="max-w-560px mx-auto flex flex-col items-center justify-center">
        {/* Brand Mark */}
        <Link href="/" className="mb-10 inline-flex items-center" aria-label="Payally Home">
          <span className="text-[28px] font-black tracking-tighter text-[#003087]">
            Pay
          </span>
          <span className="text-[28px] font-black tracking-tighter text-[#0070BA]">
            ally
          </span>
        </Link>

        <span className="text-[12px] font-mono font-bold tracking-widest uppercase text-neutral-400 mb-3">
          Error 404
        </span>

        <h1 className="text-[36px] sm:text-[48px] font-black tracking-[-0.035em] leading-[1.08] text-neutral-950">
          We can&apos;t find
          <br />
          that page.
        </h1>
        
        <p className="mt-4 text-[15px] sm:text-[16px] text-neutral-600 leading-[1.6] max-w-[420px]">
          The address may have been mistyped, the route relocated, or the agentic endpoint is no longer reachable.
        </p>


        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-black text-white font-bold text-[14px] hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
            style={{ backgroundColor: '#000000', color: '#ffffff', display: 'inline-flex' }}
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/docs"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full border border-neutral-300 text-neutral-900 font-bold text-[14px] hover:bg-neutral-100 transition-colors active:scale-95"
            
          >
            Developer Docs
          </Link>
        </div>


        <div className="mt-12 text-[12px] text-neutral-400 font-medium">
          Need assistance?{" "}
          <Link href="/contact" className="text-black underline underline-offset-4 hover:text-[#003087]">
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}