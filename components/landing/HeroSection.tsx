"use client";
import { useState } from "react";
import * as motion from "framer-motion/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, FileText, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Textarea } from "@/components/ui/textarea";

export function HeroSection() {
  const [file, setFile] = useState<File | null>(null);
  const [jobOffer, setJobOffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  const handleOptimize = async () => {
    if (!file || !jobOffer) return;

    setIsProcessing(true);
    setIsCompleted(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobOffer", jobOffer);

      const response = await fetch("/api/process-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process CV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cv-optimizado.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsCompleted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al procesar tu CV. Por favor intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-20 lg:pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
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
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Dropzone Area */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Upload className="mr-2 h-5 w-5 text-primary" />
              1. Sube tu CV (PDF)
            </h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-64 ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              } ${file ? "bg-green-50/10 border-green-500/50" : ""}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <>
                  <FileText className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-100/10" onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}>
                    Eliminar
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Arrastra tu CV aquí</p>
                  <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-2">Solo archivos PDF</p>
                </>
              )}
            </div>
          </div>

          {/* Job Offer Area */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              2. Pega la oferta de trabajo
            </h3>
            <Textarea
              placeholder="Pega aquí la descripción completa del trabajo..."
              className="h-64 resize-none text-base p-4 rounded-xl border-muted-foreground/25 focus:border-primary"
              value={jobOffer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobOffer(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex justify-center"
        >
          <Button 
            size="lg" 
            className={`h-16 px-12 text-lg font-bold rounded-full shadow-lg transition-all ${
              isCompleted ? "bg-green-600 hover:bg-green-700" : ""
            }`}
            disabled={!file || !jobOffer || isProcessing}
            onClick={handleOptimize}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Optimizando CV...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle className="mr-2 h-6 w-6" />
                ¡CV Optimizado! (Descargar de nuevo)
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-6 w-6" />
                Optimizar CV con IA
              </>
            )}
          </Button>
        </motion.div>
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

