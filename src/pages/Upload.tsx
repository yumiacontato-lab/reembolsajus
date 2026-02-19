import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  UPLOAD_SESSION_STORAGE_KEY,
  buildInitialItemsFromUpload,
  type UploadSession,
} from "@/lib/report-session";
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      setFile(droppedFile);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie apenas arquivos PDF.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie apenas arquivos PDF.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(i);
    }

    setStatus("processing");

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setStatus("success");
    
    toast({
      title: "Upload concluído!",
      description: "Seu extrato foi processado com sucesso.",
    });

    const uploadId = crypto.randomUUID();
    const uploadSession: UploadSession = {
      uploadId,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      items: buildInitialItemsFromUpload(),
    };

    localStorage.setItem(UPLOAD_SESSION_STORAGE_KEY, JSON.stringify(uploadSession));

    // Navigate to review after a short delay
    setTimeout(() => {
      navigate(`/review/${uploadId}`);
    }, 1500);
  };

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Novo Upload
            </h1>
            <p className="text-muted-foreground">
              Envie seu extrato bancário em PDF para análise
            </p>
          </div>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Extrato Bancário</CardTitle>
              <CardDescription>
                Aceita arquivos PDF de até 10MB. Você tem 1 upload restante este mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                /* Dropzone */
                <div
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging 
                      ? "border-accent bg-accent/5 scale-[1.02]" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                    <Button variant="outline">
                      Selecionar arquivo
                    </Button>
                  </div>
                </div>
              ) : (
                /* File Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
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
                      >
                        <X className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}

                    {status === "success" && (
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(status === "uploading" || status === "processing") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {status === "uploading" ? "Enviando..." : "Processando com IA..."}
                        </span>
                        {status === "uploading" && (
                          <span className="text-foreground font-medium">{progress}%</span>
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        {status === "uploading" ? (
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        ) : (
                          <div className="h-full bg-accent animate-pulse" style={{ width: "100%" }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {status === "success" && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-success/50">
                      <CheckCircle2 className="h-5 w-5 text-success-foreground" />
                      <p className="text-success-foreground font-medium">
                        Extrato processado! Redirecionando...
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {status === "error" && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-destructive font-medium">
                        Erro ao processar. Tente novamente.
                      </p>
                    </div>
                  )}

                  {/* Upload Button */}
                  {status === "idle" && (
                    <Button 
                      variant="accent" 
                      size="lg" 
                      className="w-full"
                      onClick={handleUpload}
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium text-foreground mb-2">💡 Dicas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use extratos completos de conta corrente</li>
              <li>• PDFs de apps bancários funcionam melhor</li>
              <li>• Extratos de cartão de crédito também são aceitos</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;