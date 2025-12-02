"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const scrollToMarket = () => {
    const marketSection = document.getElementById('market');
    if (marketSection) {
      marketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[600px] overflow-hidden py-20 sm:py-32">
      
      {/* Animated Floating Orbs (Pure CSS) - More subtle now */}
      <div className="orb-cyan top-10 left-10 opacity-60" style={{ animationDelay: '0s' }} />
      <div className="orb-purple bottom-10 right-10 opacity-60" style={{ animationDelay: '2s' }} />
      <div className="orb-cyan top-1/3 right-1/4 opacity-50" style={{ width: '300px', height: '300px', animationDelay: '4s' }} />
      
      {/* Glassmorphic Content Card */}
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-3xl p-12 sm:p-16 text-center border-2 border-white/10"
        >
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-web3-accent-purple/20 to-web3-accent-cyan/20 border border-web3-accent-cyan/30 px-4 py-2 mb-6"
          >
            <Sparkles className="h-4 w-4 text-web3-accent-cyan" />
            <span className="text-sm font-semibold text-web3-accent-cyan">Trusted by 10,000+ Players</span>
          </motion.div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-7xl mb-6 break-words">
            Level Up Your{" "}
            <span className="gradient-text block sm:inline">FishIt</span>
            {" "}Experience
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-web3-text-secondary leading-relaxed mb-10 px-2">
            The #1 Marketplace for Roblox FishIt. Get instant delivery on Mythic items, high-tier accounts, and millions of coins. 
            <span className="text-web3-accent-cyan font-semibold block sm:inline mt-2 sm:mt-0"> Secure, fast, and reliable.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <button
              onClick={scrollToMarket}
              className="group w-full sm:w-auto rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-glow-cyan inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Shopping
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              onClick={scrollToMarket}
              className="w-full sm:w-auto rounded-xl border-2 border-web3-accent-cyan/30 bg-web3-accent-cyan/10 px-8 py-4 text-base font-bold text-web3-accent-cyan backdrop-blur-sm transition-all hover:bg-web3-accent-cyan/20 hover:border-web3-accent-cyan/50 hover:shadow-glow-cyan flex items-center justify-center cursor-pointer"
            >
              View Collection
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 pt-12 border-t border-white/10">
            <div className="p-2">
              <div className="text-3xl font-bold gradient-text">10K+</div>
              <div className="text-sm text-web3-text-secondary mt-1">Happy Players</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-web3-text-secondary mt-1">Support</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-bold gradient-text">99.9%</div>
              <div className="text-sm text-web3-text-secondary mt-1">Success Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
