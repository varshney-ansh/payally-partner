"use client";

export function GlobalCommerceSection() {
  return (
    <section id="global" className="w-full bg-white text-black">
      <div className="w-full bg-[#003087] text-white py-24 px-4 text-center">
        <h2 className="text-[42px] sm:text-[64px] font-black tracking-[-0.035em] leading-[1.05] max-w-[780px] mx-auto">
          Built to power your
          <br />
          business
        </h2>
      </div>

      <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-24">
        <div className="text-center max-w-[720px] mx-auto mb-20">
          <h3 className="text-[36px] sm:text-[54px] font-black tracking-[-0.03em] leading-[1.06]">
            Accelerate growth across
            <br />
            borders
          </h3>
          <p className="mt-5 text-[16px] sm:text-[17px] text-neutral-700 leading-[1.55]">
            Get paid. Get growing. Get ahead. We connect businesses and autonomous consumers
            globally. With solutions and insights for every stage of business.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-[24px] bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-mono text-neutral-400">
                public/assets/merchant-inventory.jpg
              </span>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-neutral-900/75 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-baseline gap-4">
                  <span className="text-[26px] font-black">130+</span>
                  <span className="text-[26px] font-black">200+</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200">
                  Global PayPal Rails
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <div className="pb-7 border-b border-neutral-200 relative">
              <h4 className="text-[24px] font-black tracking-[-0.02em] leading-[1.2] text-black">
                Accept payments from around the world
              </h4>
              <p className="mt-3 text-[15px] text-neutral-700 leading-[1.55] max-w-[440px]">
                Allow your customers and AI shopping agents to pay from 200+ markets in 130+
                currencies on major eCommerce platforms.
              </p>
              <div className="absolute bottom-0 left-0 w-24 h-[3px] bg-[#003087]" />
            </div>
            <div className="py-7 border-b border-neutral-200">
              <h4 className="text-[24px] font-black tracking-[-0.02em] leading-[1.2] text-black">
                Offer customers choice in how they pay
              </h4>
            </div>
            <div className="pt-7">
              <h4 className="text-[24px] font-black tracking-[-0.02em] leading-[1.2] text-black">
                Access up to 400 million active accounts globally
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}