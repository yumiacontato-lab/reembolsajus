import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadEligibility } from "@/hooks/useUserSync";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Crown,
  AlertTriangle
} from "lucide-react";
import type { Upload as UploadType } from "../../shared/schema";

const statusConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-muted text-muted-foreground"
  },
  parsing: {
    label: "Processando",
    icon: Clock,
    className: "bg-primary/10 text-primary"
  },
  analyzing: {
    label: "Analisando",
    icon: Clock,
    className: "bg-primary/10 text-primary"
  },
  review: {
    label: "Revisar",
    icon: AlertCircle,
    className: "bg-warning/10 text-warning"
  },
  completed: {
    label: "Concluido",
    icon: CheckCircle2,
    className: "bg-success/20 text-success-foreground"
  },
  failed: {
    label: "Erro",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive"
  },
  concierge: {
    label: "Concierge",
    icon: Crown,
    className: "bg-accent/10 text-accent"
  }
};

const Dashboard = () => {
  const { user } = useUser();
  const { data: eligibility, isLoading: eligibilityLoading } = useUploadEligibility();

  const { data: uploads, isLoading: uploadsLoading } = useQuery<UploadType[]>({
    queryKey: ["/api/uploads"],
  });

  const firstName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "Usuario";

  const totalRecovered = uploads?.reduce((sum, u) => {
    return sum + (u.reimbursableTotal ? parseFloat(u.reimbursableTotal) : 0);
  }, 0) || 0;

  const totalItems = uploads?.reduce((sum, u) => sum + (u.totalItems || 0), 0) || 0;

  const displayLimit = eligibility?.hasActiveSubscription
    ? eligibility.monthlyLimit
    : eligibility?.freeUploadsLimit || 5;

  const displayUsed = eligibility?.hasActiveSubscription
    ? eligibility.uploadsThisMonth
    : eligibility?.freeUploadsUsed || 0;

  const handleSubscribe = async () => {
    try {
      const res = await apiRequest("POST", "/api/create-checkout-session");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Subscription error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-welcome">
                Ola, {firstName}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus extratos e recupere suas custas.
              </p>
            </div>
            <Button
              variant="accent"
              size="lg"
              asChild
              disabled={!eligibility?.canUpload}
              data-testid="button-new-upload"
            >
              <Link to="/upload">
                <Upload className="h-5 w-5" />
                Novo Upload
              </Link>
            </Button>
          </div>

          {!eligibility?.canUpload && eligibility?.reason && (
            <Card className="mb-6 border-warning">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="h-6 w-6 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{eligibility.reason}</p>
                  {!eligibility.hasActiveSubscription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Assine o plano por R$49/mes para continuar processando extratos.
                    </p>
                  )}
                </div>
                {!eligibility.hasActiveSubscription && (
                  <Button variant="accent" onClick={handleSubscribe} data-testid="button-subscribe">
                    <Crown className="h-4 w-4 mr-2" />
                    Assinar Agora
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {eligibility?.hasActiveSubscription ? "Uploads este mes" : "Uploads gratuitos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eligibilityLoading ? (
                  <Skeleton className="h-12 w-24" />
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <span className="text-4xl font-bold text-foreground" data-testid="text-uploads-used">
                          {displayUsed}
                        </span>
                        <span className="text-2xl text-muted-foreground" data-testid="text-uploads-limit">
                          /{displayLimit}
                        </span>
                      </div>
                      <div className="text-right">
                        {eligibility?.hasActiveSubscription ? (
                          <Crown className="h-8 w-8 text-accent" />
                        ) : (
                          <FileText className="h-8 w-8 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((displayUsed / displayLimit) * 100, 100)}%` }}
                      />
                    </div>
                    {!eligibility?.hasActiveSubscription && displayUsed >= displayLimit && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Limite atingido. Assine para continuar.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total recuperado</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <Skeleton className="h-12 w-32" />
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <span className="text-4xl font-bold text-foreground" data-testid="text-total-recovered">
                          R$ {Math.floor(totalRecovered).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-lg text-muted-foreground">
                          ,{(totalRecovered % 1).toFixed(2).slice(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <DollarSign className="h-8 w-8 text-accent" />
                      </div>
                    </div>
                    {totalRecovered > 0 && (
                      <p className="text-sm text-success-foreground mt-2 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Valores identificados para reembolso
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Itens identificados</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <Skeleton className="h-12 w-20" />
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <span className="text-4xl font-bold text-foreground" data-testid="text-total-items">
                          {totalItems}
                        </span>
                        <span className="text-lg text-muted-foreground"> itens</span>
                      </div>
                      <div className="text-right">
                        <CheckCircle2 className="h-8 w-8 text-accent" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Em {uploads?.length || 0} extrato{uploads?.length !== 1 ? 's' : ''} processado{uploads?.length !== 1 ? 's' : ''}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Uploads Recentes</CardTitle>
                  <CardDescription>
                    Seus ultimos extratos processados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {uploadsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !uploads || uploads.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum upload ainda
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Faca seu primeiro upload para comecar a recuperar custas.
                  </p>
                  <Button variant="accent" asChild data-testid="button-first-upload">
                    <Link to="/upload">
                      <Upload className="h-5 w-5" />
                      Fazer Upload
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploads.slice(0, 5).map((upload) => {
                    const status = statusConfig[upload.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={upload.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border hover-elevate"
                        data-testid={`row-upload-${upload.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {upload.fileName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          {upload.status === "completed" && (
                            <div className="text-right hidden sm:block">
                              <p className="font-medium text-foreground">
                                {upload.totalItems || 0} itens
                              </p>
                              <p className="text-sm text-accent font-medium">
                                R$ {upload.reimbursableTotal ? parseFloat(upload.reimbursableTotal).toFixed(2).replace('.', ',') : '0,00'}
                              </p>
                            </div>
                          )}

                          <Badge className={status.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>

                          {(upload.status === "completed" || upload.status === "review") && (
                            <Button variant="outline" size="sm" asChild data-testid={`button-view-${upload.id}`}>
                              <Link to={`/review/${upload.id}`}>
                                Ver
                                <ArrowRight className="h-4 w-4" />
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
