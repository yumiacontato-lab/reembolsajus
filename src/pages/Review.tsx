import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FileText,
  Download,
  Filter,
  Check,
  X,
  Car,
  Building2,
  Landmark,
  Fuel,
  ParkingCircle,
  Receipt,
  Mail,
  ArrowLeft,
  Loader2
} from "lucide-react";
import type { Upload, Transaction } from "../../shared/schema";

const tagConfig: Record<string, { icon: React.ElementType; color: string }> = {
  "Transporte": { icon: Car, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  "Cartorio": { icon: Building2, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  "Custas Processuais": { icon: Landmark, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  "Deslocamento": { icon: ParkingCircle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  "Correios": { icon: Mail, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  "Copias": { icon: Receipt, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  "Diligencias": { icon: Car, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  "Outros": { icon: Receipt, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

type FilterType = "all" | "reimbursable" | "not_reimbursable" | "review";

const Review = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [clientNames, setClientNames] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: upload, isLoading: uploadLoading } = useQuery<Upload>({
    queryKey: ["/api/upload", uploadId],
    enabled: !!uploadId,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", uploadId],
    enabled: !!uploadId,
  });

  useEffect(() => {
    if (transactions) {
      const reimbursableIds = transactions
        .filter(t => t.category === "reimbursable" && t.isIncluded)
        .map(t => t.id);
      setSelectedItems(reimbursableIds);

      const names: Record<number, string> = {};
      transactions.forEach(t => {
        if (t.clientName) {
          names[t.id] = t.clientName;
        }
      });
      setClientNames(names);
    }
  }, [transactions]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Transaction> }) => {
      const res = await apiRequest("PATCH", `/api/transaction/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", uploadId] });
    },
  });

  const filteredItems = transactions?.filter(item => {
    if (filter === "all") return true;
    return item.category === filter;
  }) || [];

  const selectedTotal = transactions
    ?.filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0) || 0;

  const toggleItem = (id: number) => {
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

  const updateClient = (id: number, client: string) => {
    setClientNames(prev => ({ ...prev, [id]: client }));
  };

  const saveClientName = (id: number) => {
    const clientName = clientNames[id];
    if (clientName !== undefined) {
      updateMutation.mutate({ id, data: { clientName } });
    }
  };

  const handleGenerateReport = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para gerar o relatorio.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // First save any pending changes
      for (const tx of transactions || []) {
        const isSelected = selectedItems.includes(tx.id);
        const clientName = clientNames[tx.id] || null;

        if (tx.isIncluded !== isSelected || tx.clientName !== clientName) {
          await updateMutation.mutateAsync({
            id: tx.id,
            data: { isIncluded: isSelected, clientName },
          });
        }
      }

      // Then generate the report
      const res = await apiRequest("POST", `/api/report/${uploadId}/generate`);
      const report = await res.json();

      toast({
        title: "Sucesso!",
        description: "Relatório gerado com sucesso.",
      });

      navigate(`/report/${report.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = uploadLoading || transactionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild data-testid="button-back">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground" data-testid="text-filename">
                  {isLoading ? <Skeleton className="h-8 w-48" /> : upload?.fileName}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-5 w-64" />
                ) : (
                  `${transactions?.length || 0} itens identificados - Total: R$ ${transactions?.reduce((s, i) => s + Math.abs(parseFloat(i.amount)), 0).toFixed(2).replace('.', ',') || '0,00'}`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Selecionados</p>
                <p className="text-xl font-bold text-accent" data-testid="text-selected-total">
                  R$ {selectedTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Button
                variant="accent"
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating || isLoading}
                data-testid="button-generate-report"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Salvar Selecoes
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="button-filter-all"
            >
              Todos ({transactions?.length || 0})
            </Button>
            <Button
              variant={filter === "reimbursable" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("reimbursable")}
              data-testid="button-filter-reimbursable"
            >
              Reembolsaveis ({transactions?.filter(i => i.category === "reimbursable").length || 0})
            </Button>
            <Button
              variant={filter === "review" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("review")}
              data-testid="button-filter-review"
            >
              Revisar ({transactions?.filter(i => i.category === "review").length || 0})
            </Button>
            <Button
              variant={filter === "not_reimbursable" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("not_reimbursable")}
              data-testid="button-filter-not-reimbursable"
            >
              Nao Reembolsaveis ({transactions?.filter(i => i.category === "not_reimbursable").length || 0})
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Despesas Identificadas</CardTitle>
                  <CardDescription>
                    Revise, edite e selecione os itens para o relatorio
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll} data-testid="button-toggle-all">
                  {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
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
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum item encontrado com este filtro.</p>
                </div>
              ) : (
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
                          Descricao
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
                      {filteredItems.map((item) => {
                        const tagInfo = tagConfig[item.tag || "Outros"] || tagConfig["Outros"];
                        const TagIcon = tagInfo.icon;
                        const isSelected = selectedItems.includes(item.id);

                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-border last:border-0 transition-colors ${isSelected ? "bg-accent/5" : "hover:bg-muted/50"
                              }`}
                            data-testid={`row-transaction-${item.id}`}
                          >
                            <td className="py-4 px-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleItem(item.id)}
                                data-testid={`checkbox-${item.id}`}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-foreground font-mono">
                                {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-foreground">
                                {item.description}
                              </span>
                              {item.category === "review" && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Revisar
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={tagInfo.color}>
                                <TagIcon className="h-3 w-3 mr-1" />
                                {item.tag || "Outros"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-sm font-medium text-foreground font-mono">
                                R$ {Math.abs(parseFloat(item.amount)).toFixed(2).replace('.', ',')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <Input
                                placeholder="Nome do cliente"
                                value={clientNames[item.id] || ""}
                                onChange={(e) => updateClient(item.id, e.target.value)}
                                onBlur={() => saveClientName(item.id)}
                                className="h-8 text-sm max-w-[180px]"
                                data-testid={`input-client-${item.id}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Review;
