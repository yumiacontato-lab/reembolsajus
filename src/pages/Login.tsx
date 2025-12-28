import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex">
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
              Entrar na sua conta
            </h1>
            <p className="text-muted-foreground">
              Acesse sua conta para gerenciar seus reembolsos.
            </p>
          </div>

          <SignIn 
            routing="path" 
            path="/login" 
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90",
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
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline" data-testid="link-signup">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold text-accent-foreground mb-4">
            Recupere custas em minutos
          </h2>
          <p className="text-accent-foreground/80 text-lg">
            Nossa IA identifica automaticamente despesas reembolsáveis nos seus extratos bancários.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
