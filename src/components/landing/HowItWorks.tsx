import { Upload, Cpu, FileCheck, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Faça Upload",
    description: "Arraste seu extrato bancário em PDF para nossa plataforma segura."
  },
  {
    number: "02",
    icon: Cpu,
    title: "IA Analisa",
    description: "Nossa inteligência artificial identifica todas as despesas reembolsáveis automaticamente."
  },
  {
    number: "03",
    icon: FileCheck,
    title: "Revise e Confirme",
    description: "Verifique os itens detectados, atribua clientes e ajuste o que precisar."
  },
  {
    number: "04",
    icon: Download,
    title: "Gere o Relatório",
    description: "Baixe o PDF formatado pronto para cobrança ou anexo processual."
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como funciona?
          </h2>
          <p className="text-lg text-muted-foreground">
            Em 4 passos simples, transforme seu extrato em um relatório de cobrança.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-border" />
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="w-32 h-32 rounded-full bg-card border-2 border-border flex items-center justify-center mb-6 shadow-md">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-accent mb-1">{step.number}</span>
                    <step.icon className="h-10 w-10 text-primary mx-auto" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
