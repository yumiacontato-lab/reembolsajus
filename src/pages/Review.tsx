import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  REPORT_SESSION_STORAGE_KEY,
  UPLOAD_SESSION_STORAGE_KEY,
  type ReportSession,
  type UploadSession,
} from "@/lib/report-session";
import { 
  FileText, 
  Download,
  Filter,
  Check,
  X,
  Edit2,
  Car,
  Building2,
  Landmark,
  Fuel,
  ParkingCircle,
  Receipt
} from "lucide-react";

const tagConfig: Record<string, { icon: React.ElementType; color: string }> = {
  TRANSPORTE: { icon: Car, color: "bg-blue-100 text-blue-800" },
  CARTORIO: { icon: Building2, color: "bg-purple-100 text-purple-800" },
  GRU: { icon: Landmark, color: "bg-green-100 text-green-800" },
  ESTACIONAMENTO: { icon: ParkingCircle, color: "bg-orange-100 text-orange-800" },
  OAB: { icon: Receipt, color: "bg-red-100 text-red-800" },
  COMBUSTIVEL: { icon: Fuel, color: "bg-yellow-100 text-yellow-800" },
  REVISAR: { icon: Edit2, color: "bg-muted text-muted-foreground" },
};

type FilterType = "all" | "reimbursable" | "possible";

const parseCurrencyInput = (raw: string): number => {
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getUploadSession = (): UploadSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(UPLOAD_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed?.uploadId || !Array.isArray(parsed?.items)) {
      return null;
    }

    return parsed as UploadSession;
  } catch {
    return null;
  }
};

const Review = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const uploadSession = useMemo(() => getUploadSession(), []);
  const isCurrentUpload = uploadSession?.uploadId === uploadId;
  const initialItems = isCurrentUpload ? uploadSession.items : [];
  const sourceFilename = isCurrentUpload ? uploadSession.filename : "extrato_sem_referencia.pdf";
  
  const [items, setItems] = useState(initialItems);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    initialItems.filter(i => i.status === "reimbursable").map(i => i.id)
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.value, 0);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const updateClient = (id: string, client: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, client } : item
      )
    );
  };

  const updateValue = (id: string, value: string) => {
    const parsedValue = parseCurrencyInput(value);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              value: parsedValue,
            }
          : item,
      ),
    );
  };

  const handleGenerateReport = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsGenerating(false);

    const selectedReportItems = items
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({
        description: item.description,
        value: item.value,
        client: item.client || "Cliente não informado",
      }));

    const reportId = crypto.randomUUID();
    const reportSession: ReportSession = {
      id: reportId,
      createdAt: new Date().toISOString(),
      filename: `relatorio_reembolso_${new Date().toISOString().slice(0, 10)}.pdf`,
      source: sourceFilename,
      itemCount: selectedReportItems.length,
      totalValue: selectedReportItems.reduce((sum, item) => sum + item.value, 0),
      items: selectedReportItems,
    };

    localStorage.setItem(REPORT_SESSION_STORAGE_KEY, JSON.stringify(reportSession));
    
    toast({
      title: "Relatório gerado!",
      description: "Seu PDF está pronto para download.",
    });

    navigate(`/report/${reportId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {sourceFilename}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {items.length} itens identificados • Total: R$ {items.reduce((s, i) => s + i.value, 0).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Selecionados</p>
                <p className="text-xl font-bold text-accent">
                  R$ {selectedTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Button 
                variant="accent" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="h-5 w-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todos ({items.length})
            </Button>
            <Button 
              variant={filter === "reimbursable" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("reimbursable")}
            >
              Reembolsáveis ({items.filter(i => i.status === "reimbursable").length})
            </Button>
            <Button 
              variant={filter === "possible" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("possible")}
            >
              Possíveis ({items.filter(i => i.status === "possible").length})
            </Button>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Despesas Identificadas</CardTitle>
                  <CardDescription>
                    Revise, edite e selecione os itens para o relatório
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedItems.length === filteredItems.length ? (
                    <>
                      <X className="h-4 w-4" />
                      Desmarcar todos
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Selecionar todos
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground w-12">
                        <span className="sr-only">Selecionar</span>
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                        Data
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                        Descrição
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                        Categoria
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                        Valor
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                        Cliente
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                          Nenhuma despesa encontrada para este filtro no extrato atual.
                        </td>
                      </tr>
                    )}
                    {filteredItems.map((item) => {
                      const tagInfo = tagConfig[item.tag] || { icon: Receipt, color: "bg-muted text-muted-foreground" };
                      const TagIcon = tagInfo.icon;
                      const isSelected = selectedItems.includes(item.id);

                      return (
                        <tr 
                          key={item.id}
                          className={`border-b border-border last:border-0 transition-colors ${
                            isSelected ? "bg-accent/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <td className="py-4 px-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-foreground font-mono">
                              {new Date(item.date).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-foreground">
                              {item.description}
                            </span>
                            {item.status === "possible" && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Revisar
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={tagInfo.color}>
                              <TagIcon className="h-3 w-3 mr-1" />
                              {item.tag}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={item.value.toFixed(2).replace('.', ',')}
                              onChange={(e) => updateValue(item.id, e.target.value)}
                              className="h-8 text-sm max-w-[120px] ml-auto text-right font-mono"
                              aria-label={`Valor do item ${item.description}`}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              placeholder="Nome do cliente"
                              value={item.client}
                              onChange={(e) => updateClient(item.id, e.target.value)}
                              className="h-8 text-sm max-w-[180px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Review;