import { CheckCircle2, Clock, DollarSign, FileSearch, Receipt, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: FileSearch,
    title: "Identificação Automática",
    description: "Nossa IA reconhece padrões de custas brasileiras: Uber, 99, Cartórios, OAB, GRU, Tribunais, pedágios e muito mais."
  },
  {
    icon: Clock,
    title: "Economize Horas",
    description: "Transforme horas de conferência manual em minutos. Mais tempo para advogar, menos para planilhas."
  },
  {
    icon: DollarSign,
    title: "Recupere Receita",
    description: "Custas esquecidas viram receita recuperada. Cada extrato pode esconder reembolsos que você não cobrou."
  },
  {
    icon: Receipt,
    title: "Relatórios Prontos",
    description: "Gere PDFs formatados por cliente, prontos para enviar ou anexar ao processo."
  },
  {
    icon: CheckCircle2,
    title: "Revisão Facilitada",
    description: "Edite, confirme ou exclua itens antes de gerar o relatório. Você mantém o controle total."
  },
  {
    icon: TrendingUp,
    title: "Melhore sua Margem",
    description: "Advogados que usam ReembolsaJus recuperam em média 15% mais custas por mês."
  }
];

export function Benefits() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que advogados escolhem o{" "}
            <span className="text-primary">ReembolsaJus</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            Desenvolvido especificamente para a realidade dos escritórios brasileiros.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
