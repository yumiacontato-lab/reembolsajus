import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

const features = [
  "3 uploads de extratos por mês",
  "Identificação automática por IA",
  "Edição e revisão de itens",
  "Relatórios PDF formatados",
  "Dados criptografados (LGPD)",
  "Suporte por e-mail",
];

export function Pricing() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Preço simples, valor real
          </h2>
          <p className="text-lg text-muted-foreground">
            Sem surpresas. Comece a recuperar custas hoje.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="relative p-8 rounded-2xl bg-card border-2 border-primary shadow-xl">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                Mais Popular
              </span>
            </div>

            {/* Price */}
            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-bold text-foreground mb-2">Plano Profissional</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-foreground">R$49</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cancele quando quiser
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="accent" size="xl" className="w-full group" asChild>
              <Link to="/signup">
                Começar Agora
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Garantia de 7 dias. Não gostou? Devolvemos seu dinheiro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
