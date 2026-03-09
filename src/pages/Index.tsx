import { UnifiedCourseGenerator } from "@/components/UnifiedCourseGenerator";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gerador de SCORM com IA
          </h1>
          <p className="text-muted-foreground mb-6">
            Crie cursos completos com conteúdo, vídeo e quiz. Baixe seu pacote SCORM pronto para qualquer LMS.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/editor")}
            className="font-semibold px-8 shadow-sm"
          >
            <PenSquare className="mr-2 h-5 w-5" />
            Criar do Zero Manualmente
          </Button>
        </header>

        {/* Unified Course Generator */}
        <UnifiedCourseGenerator />

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Compatível com SCORM 1.2 e SCORM 2004 • Funciona com Moodle, SCORM Cloud, SAP SuccessFactors e outros
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
