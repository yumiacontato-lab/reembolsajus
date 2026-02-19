import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Política de Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Os dados utilizados nos testes são processados para fins de demonstração da plataforma.</p>
              <p>Recomendamos anonimizar informações sensíveis em ambientes de homologação e desenvolvimento.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Privacy;