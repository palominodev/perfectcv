import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, FileText, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-20 lg:pt-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            <span className="text-muted-foreground">IA de última generación para tu carrera</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 pb-2">
            Consigue el trabajo de tus sueños con un <span className="text-primary">CV perfecto</span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Sube tu CV y la oferta de trabajo. Nuestra IA optimizará tu perfil para destacar y superar los filtros ATS automáticamente.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base group">
              Optimizar mi CV ahora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Ver ejemplo
            </Button>
          </div>

          <div className="mt-20 relative w-full max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-20"></div>
            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x border-b">
                <div className="p-6 flex flex-col items-center text-center bg-muted/30">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">1. Sube tu CV</h3>
                  <p className="text-sm text-muted-foreground mt-2">Soporte para PDF y Word</p>
                </div>
                <div className="p-6 flex flex-col items-center text-center bg-muted/30">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">2. Añade la oferta</h3>
                  <p className="text-sm text-muted-foreground mt-2">Pega el link o el texto</p>
                </div>
                <div className="p-6 flex flex-col items-center text-center bg-muted/30">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">3. Recibe tu CV</h3>
                  <p className="text-sm text-muted-foreground mt-2">Optimizado para la oferta</p>
                </div>
              </div>
              <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground border-t">
                Más de 10,000 CVs optimizados este mes
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 -z-10 h-full w-full bg-white dark:bg-black">
        <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(173,109,244,0.5)] opacity-50 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 right-auto top-auto h-[500px] w-[500px] translate-x-[10%] translate-y-[10%] rounded-full bg-[rgba(173,109,244,0.5)] opacity-50 blur-[80px]"></div>
      </div>
    </section>
  );
}
