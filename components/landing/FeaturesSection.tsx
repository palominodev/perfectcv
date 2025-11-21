import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, Target, Shield, BarChart, Users } from "lucide-react";

const features = [
  {
    title: "Optimización IA Avanzada",
    description: "Nuestros algoritmos analizan la oferta de trabajo y adaptan tu CV palabra por palabra.",
    icon: Zap,
  },
  {
    title: "Supera los filtros ATS",
    description: "Garantizamos que tu CV sea legible por los sistemas de seguimiento de candidatos.",
    icon: Shield,
  },
  {
    title: "Palabras Clave Exactas",
    description: "Identificamos e integramos las keywords críticas que buscan los reclutadores.",
    icon: Target,
  },
  {
    title: "Análisis de Compatibilidad",
    description: "Recibe una puntuación de match entre tu perfil y la oferta antes de aplicar.",
    icon: BarChart,
  },
  {
    title: "Formato Profesional",
    description: "Mantén un diseño limpio y profesional mientras optimizas el contenido.",
    icon: CheckCircle2,
  },
  {
    title: "Para todos los niveles",
    description: "Desde juniors hasta ejecutivos, nuestra IA se adapta a tu nivel de experiencia.",
    icon: Users,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Todo lo que necesitas para destacar
          </h2>
          <p className="text-lg text-muted-foreground">
            Deja de enviar el mismo CV a todas las ofertas. Personaliza tu candidatura en segundos y multiplica tus entrevistas.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
