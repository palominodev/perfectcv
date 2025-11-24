import Link from "next/link";
import * as motion from "framer-motion/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, FileText, Sparkles } from "lucide-react";

import { ComingSoonModal } from "@/components/landing/ComingSoonModal";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-20 lg:pt-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            <span className="text-muted-foreground">IA de última generación para tu carrera</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 pb-2"
          >
            Consigue el trabajo de tus sueños con un <span className="text-primary">CV perfecto</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Sube tu CV y la oferta de trabajo. Nuestra IA optimizará tu perfil para destacar y superar los filtros ATS automáticamente.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <ComingSoonModal>
              <Button size="lg" className="h-12 px-8 text-base group w-full sm:w-auto">
                Optimizar mi CV ahora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </ComingSoonModal>
            <ComingSoonModal>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                Ver ejemplo
              </Button>
            </ComingSoonModal>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 relative w-full max-w-4xl mx-auto"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-20"></div>
            <div className="relative rounded-xl border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden p-8 flex items-center justify-center">
              <img 
                src="/hero-illustration.svg" 
                alt="AI CV Optimization" 
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 -z-10 h-full w-full bg-background">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-primary/20 opacity-50 blur-[80px]"
        ></motion.div>
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-0 right-auto top-auto h-[500px] w-[500px] translate-x-[10%] translate-y-[10%] rounded-full bg-purple-500/20 opacity-50 blur-[80px]"
        ></motion.div>
      </div>
    </section>
  );
}
