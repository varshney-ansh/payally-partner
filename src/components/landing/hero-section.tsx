"use client";
import { motion } from "framer-motion";
import MagicRings from "@/components/MagicRings";

export function HeroSection() {
  return (
    <section className="w-full min-h-svh bg-black text-white overflow-hidden relative flex flex-col items-center justify-center">
      
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center z-0">
        <div className="min-w-[100vw] min-h-[100svh] w-full h-full relative transform scale-110 sm:scale-125 origin-center flex items-center justify-center">
          <MagicRings
            color="#0070BA"
            colorTwo="#48C6EF"
            motion="pulse"
            ringCount={3}
            speed={1}
            lineThickness={2}
            glow={0.95}
            hoverScale={1}
            clickBurst={false}
            baseRadius={0.35}
            radiusStep={0.1}
            expansion={0.1}
            taper={1.5}
            rotation={0}
            spin={0}
            tilt={0}
            dispersion={0}
            grain={0}
            opacity={0.85}
            followMouse={false}
            mouseInfluence={0.2}
            hoverIntensity={1}
            parallax={0.05}
            intro
          />
        </div>
      </div>
      <div className="relative z-20 max-w-[1100px] mx-auto px-4 text-center flex flex-col items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="font-black text-white select-none drop-shadow-md text-center"
          style={{
            fontSize: "clamp(44px, 7.5vw, 96px)",
            lineHeight: "1.02",
            letterSpacing: "-0.04em",
            fontWeight: 900
          }}
        >
          Where AI
          <br />
          agents
          <br />
          checkout.
        </motion.h1>
      </div>

    </section>
  );
}
