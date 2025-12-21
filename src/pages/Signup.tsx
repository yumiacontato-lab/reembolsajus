import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Scale, Check } from "lucide-react";

const benefits = [
  "5 uploads gratuitos para começar",
  "Identificação automática por IA",
  "Relatórios PDF formatados",
  "Dados 100% seguros (LGPD)",
];

const Signup = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-accent-foreground mb-6">
            Comece grátis com 5 uploads
          </h2>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-accent/20">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span className="text-accent-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="p-2 rounded-lg bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              ReembolsaJus
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Criar sua conta
            </h1>
            <p className="text-muted-foreground">
              Comece a recuperar custas em poucos minutos.
            </p>
          </div>

          <SignUp 
            routing="path" 
            path="/signup" 
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: "bg-accent hover:bg-accent/90 text-accent-foreground",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-border",
                formFieldInput: "border-border",
                footerActionLink: "text-primary hover:text-primary/80",
              }
            }}
          />

          <p className="text-center text-muted-foreground mt-8">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
