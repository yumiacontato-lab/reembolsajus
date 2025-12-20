import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  DollarSign
} from "lucide-react";

// Mock data - will be replaced with real data from backend
const mockUploads = [
  {
    id: "1",
    filename: "extrato_itau_nov_2024.pdf",
    date: "2024-11-15",
    status: "completed",
    itemsFound: 12,
    totalValue: 1847.50
  },
  {
    id: "2",
    filename: "extrato_bb_out_2024.pdf",
    date: "2024-10-20",
    status: "processing",
    itemsFound: null,
    totalValue: null
  },
];

const statusConfig = {
  completed: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "bg-success text-success-foreground"
  },
  processing: {
    label: "Processando",
    icon: Clock,
    className: "bg-primary/10 text-primary"
  },
  failed: {
    label: "Erro",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive"
  }
};

const Dashboard = () => {
  const uploadsUsed = 2;
  const uploadsLimit = 3;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Olá, Dr. João! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus extratos e recupere suas custas.
              </p>
            </div>
            <Button variant="accent" size="lg" asChild>
              <Link to="/upload">
                <Upload className="h-5 w-5" />
                Novo Upload
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Uploads Counter */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Uploads este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-foreground">{uploadsUsed}</span>
                    <span className="text-2xl text-muted-foreground">/{uploadsLimit}</span>
                  </div>
                  <div className="text-right">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(uploadsUsed / uploadsLimit) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total Recovered */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total recuperado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-foreground">R$ 1.847</span>
                    <span className="text-lg text-muted-foreground">,50</span>
                  </div>
                  <div className="text-right">
                    <DollarSign className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <p className="text-sm text-success-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +23% comparado ao mês anterior
                </p>
              </CardContent>
            </Card>

            {/* Items Found */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Itens identificados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-foreground">12</span>
                    <span className="text-lg text-muted-foreground"> itens</span>
                  </div>
                  <div className="text-right">
                    <CheckCircle2 className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Em 2 extratos processados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Uploads Recentes</CardTitle>
                  <CardDescription>
                    Seus últimos extratos processados
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/historico">
                    Ver todos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mockUploads.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum upload ainda
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Faça seu primeiro upload para começar a recuperar custas.
                  </p>
                  <Button variant="accent" asChild>
                    <Link to="/upload">
                      <Upload className="h-5 w-5" />
                      Fazer Upload
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockUploads.map((upload) => {
                    const status = statusConfig[upload.status as keyof typeof statusConfig];
                    const StatusIcon = status.icon;

                    return (
                      <div 
                        key={upload.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {upload.filename}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(upload.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {upload.status === "completed" && (
                            <div className="text-right hidden sm:block">
                              <p className="font-medium text-foreground">
                                {upload.itemsFound} itens
                              </p>
                              <p className="text-sm text-accent font-medium">
                                R$ {upload.totalValue?.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          )}

                          <Badge className={status.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>

                          {upload.status === "completed" && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/review/${upload.id}`}>
                                Ver
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;