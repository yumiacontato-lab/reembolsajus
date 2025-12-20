import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Download,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Printer
} from "lucide-react";

// Mock report data
const reportData = {
  id: "1",
  createdAt: "2024-11-20",
  filename: "relatorio_reembolso_nov_2024.pdf",
  source: "extrato_itau_nov_2024.pdf",
  itemCount: 5,
  totalValue: 577.20,
  items: [
    { description: "UBER *TRIP PZXY1234", value: 47.90, client: "Cliente A" },
    { description: "1 CARTORIO NOTAS SP", value: 156.80, client: "Cliente A" },
    { description: "GRU SIMPLES TRF3", value: 315.00, client: "Cliente B" },
    { description: "99 *CORRIDA 892341", value: 32.50, client: "Cliente A" },
    { description: "ESTAC SHOPPING MORUMBI", value: 25.00, client: "Cliente A" },
  ]
};

const Report = () => {
  const handleDownload = () => {
    // Simulate download - will be replaced with real PDF generation
    const element = document.createElement("a");
    element.href = "#";
    element.download = reportData.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Back Link */}
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>

          {/* Success Banner */}
          <div className="flex items-center gap-4 p-6 rounded-xl bg-success/50 border border-success mb-8">
            <div className="p-3 rounded-full bg-accent/20">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-success-foreground">
                Relatório gerado com sucesso!
              </h2>
              <p className="text-success-foreground/80">
                Seu PDF está pronto para download ou compartilhamento.
              </p>
            </div>
          </div>

          {/* Report Preview Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{reportData.filename}</CardTitle>
                    <CardDescription>
                      Gerado em {new Date(reportData.createdAt).toLocaleDateString('pt-BR')} • 
                      Origem: {reportData.source}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Report Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Itens incluídos</p>
                  <p className="text-2xl font-bold text-foreground">{reportData.itemCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor total</p>
                  <p className="text-2xl font-bold text-accent">
                    R$ {reportData.totalValue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border">
                  <h4 className="font-medium text-foreground">Prévia dos itens</h4>
                </div>
                <div className="divide-y divide-border">
                  {reportData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.client}</p>
                      </div>
                      <p className="font-mono font-medium text-foreground">
                        R$ {item.value.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-primary/5 border-t border-border flex items-center justify-between">
                  <p className="font-medium text-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {reportData.totalValue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  <Printer className="h-5 w-5" />
                  Imprimir
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos passos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
                  <span className="text-foreground">Baixe o relatório em PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
                  <span className="text-foreground">Anexe ao processo ou petição</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">3</span>
                  <span className="text-foreground">Envie para seu cliente para aprovação</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Report;