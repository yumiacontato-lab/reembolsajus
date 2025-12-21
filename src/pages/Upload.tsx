import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface UploadEligibility {
  canUpload: boolean;
  reason: string;
  remainingUploads: number;
  freeUploadsUsed: number;
  freeUploadsLimit: number;
  hasActiveSubscription: boolean;
  uploadsThisMonth: number;
  monthlyLimit: number;
}

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery<UploadEligibility>({
    queryKey: ["/api/user/upload-eligibility"],
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O limite e de 10MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(droppedFile);
      setErrorMessage("");
    } else {
      toast({
        title: "Formato invalido",
        description: "Por favor, envie apenas arquivos PDF.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O limite e de 10MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setErrorMessage("");
    } else {
      toast({
        title: "Formato invalido",
        description: "Por favor, envie apenas arquivos PDF.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setUploadId(data.id);
      setStatus("processing");

      queryClient.invalidateQueries({ queryKey: ["/api/user/upload-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });

    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido");
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (status !== "processing" || !uploadId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/upload/${uploadId}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (data.status === "completed" || data.status === "review") {
          setStatus("success");
          toast({
            title: "Upload concluido!",
            description: `${data.totalItems || 0} transacoes encontradas.`,
          });
          
          setTimeout(() => {
            navigate(`/review/${uploadId}`);
          }, 1500);
        } else if (data.status === "failed") {
          setStatus("error");
          setErrorMessage(data.processingError || "Erro ao processar o arquivo");
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [status, uploadId, navigate, toast]);

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    setUploadId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Novo Upload
            </h1>
            <p className="text-muted-foreground">
              Envie seu extrato bancario em PDF para analise
            </p>
          </div>

          {!eligibility?.canUpload && !eligibilityLoading && (
            <Card className="mb-6 border-warning">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
                <AlertCircle className="h-8 w-8 text-warning shrink-0" />
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-medium text-foreground">{eligibility?.reason}</p>
                  {!eligibility?.hasActiveSubscription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Assine o plano por R$49/mes para continuar.
                    </p>
                  )}
                </div>
                {!eligibility?.hasActiveSubscription && (
                  <Button variant="accent" asChild data-testid="button-subscribe">
                    <Link to="/pricing">
                      <Crown className="h-4 w-4" />
                      Assinar
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Extrato Bancario</CardTitle>
              <CardDescription>
                {eligibilityLoading ? (
                  "Carregando..."
                ) : eligibility?.canUpload ? (
                  `Aceita arquivos PDF de ate 10MB. Voce tem ${eligibility.remainingUploads} upload${eligibility.remainingUploads > 1 ? 's' : ''} restante${eligibility.remainingUploads > 1 ? 's' : ''}.`
                ) : (
                  "Limite de uploads atingido."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    !eligibility?.canUpload 
                      ? "opacity-50 pointer-events-none" 
                      : isDragging 
                        ? "border-accent bg-accent/5 scale-[1.02]" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="dropzone"
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={!eligibility?.canUpload}
                    data-testid="input-file"
                  />
                  
                  <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${
                      isDragging ? "bg-accent/20" : "bg-primary/10"
                    }`}>
                      <UploadIcon className={`h-8 w-8 ${
                        isDragging ? "text-accent" : "text-primary"
                      }`} />
                    </div>
                    
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Arraste seu PDF aqui
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      ou clique para selecionar
                    </p>
                    <Button variant="outline" disabled={!eligibility?.canUpload}>
                      Selecionar arquivo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground" data-testid="text-filename">
                          {file.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    {status === "idle" && (
                      <button
                        onClick={removeFile}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        data-testid="button-remove-file"
                      >
                        <X className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}

                    {status === "success" && (
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                    )}
                  </div>

                  {(status === "uploading" || status === "processing") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {status === "uploading" ? "Enviando..." : "Processando com IA..."}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent animate-pulse" style={{ width: "100%" }} />
                      </div>
                    </div>
                  )}

                  {status === "success" && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-success/50">
                      <CheckCircle2 className="h-5 w-5 text-success-foreground" />
                      <p className="text-success-foreground font-medium">
                        Extrato processado! Redirecionando...
                      </p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-destructive font-medium">
                          Erro ao processar
                        </p>
                        {errorMessage && (
                          <p className="text-sm text-destructive/80">{errorMessage}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {status === "idle" && (
                    <Button 
                      variant="accent" 
                      size="lg" 
                      className="w-full"
                      onClick={handleUpload}
                      data-testid="button-upload"
                    >
                      <UploadIcon className="h-5 w-5" />
                      Enviar e Processar
                    </Button>
                  )}

                  {(status === "uploading" || status === "processing") && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      disabled
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {status === "uploading" ? "Enviando..." : "Analisando com IA..."}
                    </Button>
                  )}

                  {status === "error" && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      onClick={removeFile}
                      data-testid="button-try-again"
                    >
                      Tentar novamente
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium text-foreground mb-2">Dicas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Use extratos completos de conta corrente</li>
              <li>- PDFs de apps bancarios funcionam melhor</li>
              <li>- Extratos de cartao de credito tambem sao aceitos</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
