
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Crown, CheckCircle2, AlertTriangle, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useUploadEligibility } from "@/hooks/useUserSync";
import { useToast } from "@/hooks/use-toast";

const Billing = () => {
    const { data: eligibility, isLoading } = useUploadEligibility();
    const { toast } = useToast();

    const handleSubscribe = async () => {
        try {
            const res = await apiRequest("POST", "/api/create-checkout-session");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            toast({
                title: "Erro ao iniciar assinatura",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const handleManageSubscription = async () => {
        try {
            const res = await apiRequest("POST", "/api/create-portal-session");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            toast({
                title: "Erro ao abrir portal",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const PlanFeature = ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm">{children}</span>
        </div>
    );

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

                    <h1 className="text-3xl font-bold mb-2">Assinatura e Cobrança</h1>
                    <p className="text-muted-foreground mb-8">
                        Gerencie seu plano e histórico de pagamentos.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Current Plan Card */}
                        <Card className={eligibility?.hasActiveSubscription ? "border-accent" : ""}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Plano Atual
                                    {eligibility?.hasActiveSubscription && (
                                        <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-normal">
                                            Ativo
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Detalhes da sua conta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isLoading ? (
                                    <Skeleton className="h-20 w-full" />
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold">
                                                {eligibility?.hasActiveSubscription ? "Pro" : "Gratuito"}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground">Uso este mês</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Uploads realizados</span>
                                                <span className="font-bold">
                                                    {eligibility?.hasActiveSubscription
                                                        ? eligibility?.uploadsThisMonth
                                                        : eligibility?.freeUploadsUsed}
                                                    /
                                                    {eligibility?.hasActiveSubscription
                                                        ? eligibility?.monthlyLimit
                                                        : eligibility?.freeUploadsLimit}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${eligibility?.hasActiveSubscription ? "bg-accent" : "bg-primary"
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            ((eligibility?.hasActiveSubscription
                                                                ? (eligibility?.uploadsThisMonth || 0)
                                                                : (eligibility?.freeUploadsUsed || 0)) /
                                                                (eligibility?.hasActiveSubscription
                                                                    ? (eligibility?.monthlyLimit || 1)
                                                                    : (eligibility?.freeUploadsLimit || 1))) * 100,
                                                            100
                                                        )}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {eligibility?.hasActiveSubscription ? (
                                            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Gerenciar Assinatura
                                            </Button>
                                        ) : (
                                            <div className="p-4 rounded-lg bg-warning/10 text-warning text-sm flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                                <p>
                                                    Você está usando o plano gratuito limitado. Assine o Pro para aumentar seus limites.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upgrade Card */}
                        {!eligibility?.hasActiveSubscription && (
                            <Card className="border-2 border-accent/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                                    RECOMENDADO
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-accent" />
                                        Plano Pro
                                    </CardTitle>
                                    <CardDescription>
                                        Para advogados que precisam de mais volume
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">R$ 49</span>
                                        <span className="text-muted-foreground">/mês</span>
                                    </div>

                                    <div className="space-y-3">
                                        <PlanFeature>3 uploads processados por mês</PlanFeature>
                                        <PlanFeature>Relatórios detalhados em PDF</PlanFeature>
                                        <PlanFeature>Classificação automática com IA</PlanFeature>
                                        <PlanFeature>Suporte prioritário</PlanFeature>
                                    </div>

                                    <Button onClick={handleSubscribe} variant="accent" className="w-full" size="lg">
                                        Assinar Agora
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Billing;
