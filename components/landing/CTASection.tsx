import { Button } from "@/components/ui/button";
import * as motion from "framer-motion/client";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-primary px-6 py-16 sm:px-12 sm:py-24 md:py-32 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
              ¿Listo para conseguir ese trabajo?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Únete a miles de profesionales que ya han optimizado sus CVs y conseguido entrevistas en las mejores empresas.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                Ver Demo
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60 pt-4">
              No se requiere tarjeta de crédito • Plan gratuito disponible
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
