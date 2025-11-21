import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Sube tu CV actual",
    description: "Arrastra y suelta tu CV en formato PDF o Word. Analizaremos tu experiencia y habilidades actuales.",
  },
  {
    number: "02",
    title: "Añade la oferta",
    description: "Pega el enlace de la oferta de trabajo o copia la descripción. Identificaremos qué buscan exactamente.",
  },
  {
    number: "03",
    title: "Recibe tu CV optimizado",
    description: "En segundos, obtén una versión de tu CV perfectamente alineada con los requisitos del puesto.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Tan simple como copiar y pegar
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              No necesitas ser un experto en redacción ni pasar horas ajustando formatos. Nuestra tecnología se encarga de la parte difícil para que tú te concentres en la entrevista.
            </p>
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-xl opacity-50"></div>
            <div className="relative bg-card border rounded-xl shadow-2xl p-6 md:p-8">
              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
                <div className="h-32 w-full bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="mx-auto h-10 w-10 text-muted-foreground mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Arrastra tu CV aquí</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <div className="h-10 flex-1 bg-primary/10 rounded flex items-center px-3 text-sm text-muted-foreground">
                    https://linkedin.com/jobs/...
                  </div>
                  <div className="h-10 w-10 bg-primary rounded flex items-center justify-center text-primary-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
