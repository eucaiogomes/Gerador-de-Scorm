import { UnifiedCourseGenerator } from "@/components/UnifiedCourseGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gerador de SCORM com IA
          </h1>
          <p className="text-muted-foreground">
            Crie cursos completos com conteúdo, vídeo e quiz. Baixe seu pacote SCORM pronto para qualquer LMS.
          </p>
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
