import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("❌ VITE_CLERK_PUBLISHABLE_KEY is missing! Authentication will not work.");
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#dc2626' }}>⚠️ Erro ao carregar a aplicação</h1>
          <p style={{ color: '#666' }}>{this.state.error?.message}</p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Verifique se as variáveis de ambiente estão configuradas corretamente.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Import React for ErrorBoundary class
import React from "react";

// Fallback component when Clerk is not configured
const ClerkMissingFallback = () => (
  <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
    <h1 style={{ color: '#dc2626' }}>⚠️ Configuração Incompleta</h1>
    <p style={{ color: '#666', maxWidth: '500px', margin: '20px auto' }}>
      A chave de autenticação do Clerk não foi encontrada.<br />
      Por favor, configure <code>VITE_CLERK_PUBLISHABLE_KEY</code> no seu arquivo .env ou nos Secrets do Replit.
    </p>
    <p style={{ fontSize: '14px', color: '#999' }}>
      Exemplo: <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx...</code>
    </p>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      ) : (
        <ClerkMissingFallback />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
