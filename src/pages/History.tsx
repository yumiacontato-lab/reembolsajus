import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

type UploadItem = {
  id: string;
  filename: string;
  date: string;
  status: "completed" | "processing" | "failed";
  itemsFound: number | null;
  totalValue: number | null;
};

const DASHBOARD_UPLOADS_STORAGE_KEY = "reembolsajus:dashboard:uploads";

const History = () => {
  const uploads = useMemo<UploadItem[]>(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_UPLOADS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Extratos</CardTitle>
              <CardDescription>
                Lista dos extratos processados para facilitar seus testes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploads.length === 0 ? (
                <p className="text-muted-foreground">Nenhum extrato no histórico.</p>
              ) : (
                <div className="space-y-3">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="p-4 border border-border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{upload.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(upload.date).toLocaleDateString("pt-BR")} • {upload.status}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {upload.totalValue ? `R$ ${upload.totalValue.toFixed(2).replace(".", ",")}` : "Sem total"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;