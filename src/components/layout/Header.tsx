import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isLanding ? "bg-transparent" : "bg-card/95 backdrop-blur-sm border-b border-border"
    }`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`p-2 rounded-lg transition-colors ${
              isLanding ? "bg-accent-foreground/10" : "bg-primary"
            }`}>
              <Scale className={`h-5 w-5 ${isLanding ? "text-accent-foreground" : "text-primary-foreground"}`} />
            </div>
            <span className={`text-xl font-bold ${isLanding ? "text-accent-foreground" : "text-foreground"}`}>
              ReembolsaJus
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isLanding ? (
              <>
                <Link 
                  to="/login" 
                  className="text-accent-foreground/80 hover:text-accent-foreground transition-colors font-medium"
                >
                  Entrar
                </Link>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/signup">Começar Agora</Link>
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/upload" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Novo Upload
                </Link>
                <Button variant="ghost" asChild>
                  <Link to="/">Sair</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className={`h-6 w-6 ${isLanding ? "text-accent-foreground" : "text-foreground"}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isLanding ? "text-accent-foreground" : "text-foreground"}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 border-t ${
            isLanding ? "border-accent-foreground/20" : "border-border"
          }`}>
            <nav className="flex flex-col gap-4">
              {isLanding ? (
                <>
                  <Link 
                    to="/login" 
                    className="text-accent-foreground/80 hover:text-accent-foreground transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Começar Agora
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/upload" 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Novo Upload
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
