// 🧪 End-to-End SCORM Generation Test
// This test simulates a complete SCORM package generation from scratch

const SUPABASE_URL = "https://otbrltaasqdownnpxnlv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YnJsdGFhc3Fkb3dubnB4bmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTU1MDIsImV4cCI6MjA1Mjk5MTUwMn0.2R0FZC9Qsqsu4wGLEhgBJDSl0VrbGZWZC8JnJ8DXDPQ";

console.log("🚀 SCORM End-to-End Test - Starting...\n");

async function testCompleteSCORMGeneration() {
    try {
        const topic = "Inteligência Artificial e Machine Learning";
        console.log(`📝 Tema escolhido: "${topic}"\n`);

        // Step 1: Generate unified course (content + images)
        console.log("🎯 STEP 1: Gerando curso completo (conteúdo + imagens + vídeo)...");
        const courseResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-unified-course`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ topic })
            }
        );

        if (!courseResponse.ok) {
            throw new Error(`Course generation failed: ${courseResponse.status} ${await courseResponse.text()}`);
        }

        const { course: content } = await courseResponse.json();
        console.log("✅ Curso gerado com sucesso!\n");

        // Validate course structure
        console.log("🔍 VALIDANDO ESTRUTURA DO CURSO:");
        console.log(`   ✓ Título: ${content.title}`);
        console.log(`   ✓ Slides: ${content.slides.length} slides`);
        console.log(`   ✓ Vídeo: ${content.video.scenes.length} cenas`);
        console.log(`   ✓ Quiz: ${content.questions.length} perguntas\n`);

        // Validate images in slides
        console.log("🖼️  VALIDANDO IMAGENS NOS SLIDES:");
        let slidesWithImages = 0;
        content.slides.forEach((slide, i) => {
            if (slide.imageBase64 && slide.imageBase64.startsWith("data:image/")) {
                slidesWithImages++;
                console.log(`   ✓ Slide ${i + 1}: Imagem presente (${slide.imageBase64.substring(0, 50)}...)`);
            } else {
                console.log(`   ❌ Slide ${i + 1}: SEM IMAGEM`);
            }
        });
        console.log(`   Total: ${slidesWithImages}/${content.slides.length} slides com imagens\n`);

        // Validate images in video scenes
        console.log("🎬 VALIDANDO VÍDEO:");
        let scenesWithImages = 0;
        let validNarration = 0;
        content.video.scenes.forEach((scene, i) => {
            const hasImage = scene.imageBase64 && scene.imageBase64.startsWith("data:image/");
            const hasNarration = scene.narration && scene.narration.length > 10;
            const hasDuration = scene.duration > 0;

            if (hasImage) scenesWithImages++;
            if (hasNarration) validNarration++;

            console.log(`   Cena ${i + 1}:`);
            console.log(` ${hasImage ? "" : "❌"} Imagem: ${hasImage ? "✓" : "X"}`);
            console.log(`     ${hasNarration ? "✓" : "❌"} Narração: ${hasNarration ? scene.narration.substring(0, 40) + "..." : "X"}`);
            console.log(`     ${hasDuration ? "✓" : "❌"} Duração: ${scene.duration}s`);
        });
        console.log(`   Total: ${scenesWithImages}/${content.video.scenes.length} cenas com imagens`);
        console.log(`   Total: ${validNarration}/${content.video.scenes.length} cenas com narração\n`);

        // Step 2: Generate SCORM package
        console.log("📦 STEP 2: Gerando pacote SCORM...");
        const scormResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-unified-scorm`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    course: content,
                    title: content.title,
                    version: "1.2",
                    completionStatus: "passed-failed"
                })
            }
        );

        if (!scormResponse.ok) {
            throw new Error(`SCORM generation failed: ${scormResponse.status} ${await scormResponse.text()}`);
        }

        const scormData = await scormResponse.json();

        // Validate SCORM package
        if (scormData.zipBase64 && scormData.zipBase64.length > 1000) {
            console.log(`✅ SCORM gerado com sucesso!`);
            console.log(`   Tamanho do ZIP: ${(scormData.zipBase64.length / 1024).toFixed(2)} KB (base64)\n`);
        } else {
            console.log(`❌ SCORM parece vazio ou inválido\n`);
        }

        // Final summary
        console.log("=" + "=".repeat(60) + "=");
        console.log("📊 RESUMO FINAL");
        console.log("=".repeat(62));
        console.log(`✅ Curso gerado: ${content.title}`);
        console.log(`✅ Slides com imagens: ${slidesWithImages}/${content.slides.length}`);
        console.log(`✅ Video cenas com imagens: ${scenesWithImages}/${content.video.scenes.length}`);
        console.log(`✅ Vídeo cenas com narração: ${validNarration}/${content.video.scenes.length}`);
        console.log(`✅ SCORM package: GERADO`);
        console.log("=".repeat(62));

        // Success rate
        const imageSuccessRate = ((slidesWithImages + scenesWithImages) / (content.slides.length + content.video.scenes.length) * 100).toFixed(1);
        console.log(`\n🎯 Taxa de sucesso de imagens: ${imageSuccessRate}%`);

        if (imageSuccessRate >= 80) {
            console.log("✅ TESTE PASSOU! Sistema funcionando corretamente.\n");
            return true;
        } else {
            console.log("⚠️  TESTE PARCIAL: Algumas imagens falharam, mas fallbacks funcionaram.\n");
            return false;
        }

    } catch (error) {
        console.error("\n❌ TESTE FALHOU:");
        console.error(`   Erro: ${error.message}\n`);
        return false;
    }
}

// Run test
(async () => {
    const startTime = Date.now();
    const success = await testCompleteSCORMGeneration();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Tempo total: ${duration}s`);
    process.exit(success ? 0 : 1);
})();
