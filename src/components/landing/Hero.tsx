import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, Zap, Shield } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-foreground/10 border border-accent-foreground/20 mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent-foreground">
              Automatize a recuperação de custas
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-accent-foreground mb-6 animate-slide-up leading-tight">
            Recupere custas esquecidas{" "}
            <span className="text-accent">em minutos</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-accent-foreground/80 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Suba seu extrato bancário e nossa IA identifica automaticamente 
            despesas reembolsáveis — custas, deslocamentos, cartórios, GRU e mais.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup" className="group">
                Comece por R$49/mês
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/login">
                Já tenho conta
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <FeatureCard 
              icon={FileText}
              title="Upload Simples"
              description="Arraste seu PDF e deixe a IA trabalhar"
            />
            <FeatureCard 
              icon={Zap}
              title="Análise em Minutos"
              description="Resultados rápidos e precisos"
            />
            <FeatureCard 
              icon={Shield}
              title="100% Seguro"
              description="Dados criptografados e LGPD"
            />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-accent-foreground/5 border border-accent-foreground/10 backdrop-blur-sm hover:bg-accent-foreground/10 transition-colors">
      <div className="inline-flex p-3 rounded-lg bg-accent/20 mb-4">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-accent-foreground mb-2">{title}</h3>
      <p className="text-sm text-accent-foreground/70">{description}</p>
    </div>
  );
}
