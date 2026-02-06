import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CourseSlide {
  title: string;
  content: string;
  imageBase64?: string;
  videoUrl?: string;
}

interface CourseQuestion {
  text: string;
  alternatives: string[];
  correctIndex: number;
}

interface GeneratedCourse {
  title: string;
  slides: CourseSlide[];
  questions: CourseQuestion[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course, scormVersion, completionStatus } = await req.json() as {
      course: GeneratedCourse;
      scormVersion: "1.2" | "2004";
      completionStatus: "completed" | "passed-failed";
    };

    if (!course || !course.slides || !course.questions) {
      return new Response(
        JSON.stringify({ error: "Invalid course data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating SCORM ${scormVersion} for course: ${course.title}`);

    const zip = new JSZip();
    const identifier = course.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);

    // Generate manifest
    const manifest = generateManifest(course.title, identifier, scormVersion);
    zip.file("imsmanifest.xml", manifest);

    // Extract images and prepare references
    const imageFiles: { [key: string]: string } = {};
    course.slides.forEach((slide, index) => {
      if (slide.imageBase64) {
        const imageName = `slide_${index + 1}.png`;
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64Data = slide.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        imageFiles[imageName] = base64Data;
      }
    });

    // Add images to zip
    for (const [fileName, base64Data] of Object.entries(imageFiles)) {
      zip.file(`images/${fileName}`, base64Data, { base64: true });
    }

    // Generate HTML
    const html = generateHTML(course, imageFiles, scormVersion);
    zip.file("index.html", html);

    // Generate script
    const script = generateScript(course, scormVersion, completionStatus);
    zip.file("script.js", script);

    // Generate styles
    const styles = generateStyles();
    zip.file("styles.css", styles);

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: "base64" });

    console.log("SCORM package generated successfully");

    return new Response(
      JSON.stringify({ zip: zipData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating SCORM:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateManifest(title: string, identifier: string, version: "1.2" | "2004"): string {
  const escapedTitle = title.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[c] || c));

  if (version === "1.2") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${escapedTitle}</title>
      <item identifier="item_1" identifierref="res_1">
        <title>${escapedTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="script.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                      http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                      http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                      http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                      http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${escapedTitle}</title>
      <item identifier="item_1" identifierref="res_1">
        <title>${escapedTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="script.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`;
}

function generateHTML(course: GeneratedCourse, imageFiles: { [key: string]: string }, version: "1.2" | "2004"): string {
  const escapedTitle = course.title.replace(/[<>&]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
  }[c] || c));

  // Generate slide HTML
  const slidesHTML = course.slides.map((slide, index) => {
    const imageName = `slide_${index + 1}.png`;
    const hasImage = imageFiles[imageName];
    
    return `
    <div class="slide" data-slide="${index}">
      <h2>${slide.title.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c))}</h2>
      ${hasImage ? `<img src="images/${imageName}" alt="${slide.title}" class="slide-image">` : ""}
      <div class="content">${slide.content.replace(/\n/g, "<br>").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c)).replace(/&lt;br&gt;/g, "<br>")}</div>
      ${slide.videoUrl ? `<a href="${slide.videoUrl}" target="_blank" class="video-link">🎬 Assistir vídeo relacionado</a>` : ""}
    </div>`;
  }).join("\n");

  // Generate questions HTML
  const questionsHTML = course.questions.map((q, index) => {
    const altsHTML = q.alternatives.map((alt, altIdx) => `
        <label class="alternative">
          <input type="radio" name="q${index}" value="${altIdx}">
          <span>${alt.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c))}</span>
        </label>`).join("\n");

    return `
      <div class="question" data-question="${index}" data-correct="${q.correctIndex}">
        <p class="question-text">${index + 1}. ${q.text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c))}</p>
        <div class="alternatives">
          ${altsHTML}
        </div>
        <div class="feedback"></div>
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapedTitle}</h1>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </header>

    <main>
      <!-- Slides -->
      <div id="slides-container">
        ${slidesHTML}
      </div>

      <!-- Quiz -->
      <div id="quiz-container" style="display: none;">
        <h2>Quiz</h2>
        ${questionsHTML}
      </div>

      <!-- Completion -->
      <div id="completion-container" style="display: none;">
        <div class="completion-message">
          <h2>🎉 Parabéns!</h2>
          <p>Você concluiu o curso com sucesso.</p>
          <p class="score"></p>
        </div>
      </div>
    </main>

    <footer>
      <button id="btn-prev" disabled>← Anterior</button>
      <span id="page-info"></span>
      <button id="btn-next">Próximo →</button>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>`;
}

function generateScript(course: GeneratedCourse, version: "1.2" | "2004", completionStatus: "completed" | "passed-failed"): string {
  const totalSlides = course.slides.length;
  const totalQuestions = course.questions.length;

  return `// SCORM ${version} Quiz Script
(function() {
  var API = null;
  var finished = false;
  var currentSlide = 0;
  var inQuiz = false;
  var currentQuestion = 0;
  var correctAnswers = 0;
  var totalSlides = ${totalSlides};
  var totalQuestions = ${totalQuestions};

  // Find SCORM API
  function findAPI(win) {
    var attempts = 0;
    while (win && attempts < 500) {
      ${version === "1.2" ? `
      if (win.API) return win.API;
      ` : `
      if (win.API_1484_11) return win.API_1484_11;
      `}
      if (win === win.parent) break;
      win = win.parent;
      attempts++;
    }
    return null;
  }

  function initSCORM() {
    API = findAPI(window);
    if (!API) API = findAPI(window.opener);
    
    if (API) {
      ${version === "1.2" ? `
      API.LMSInitialize("");
      API.LMSSetValue("cmi.core.lesson_status", "incomplete");
      API.LMSCommit("");
      ` : `
      API.Initialize("");
      API.SetValue("cmi.completion_status", "incomplete");
      API.Commit("");
      `}
      console.log("SCORM initialized");
    } else {
      console.warn("SCORM API not found - running in standalone mode");
    }
  }

  function finishSCORM(passed) {
    if (finished || !API) return;
    finished = true;

    ${version === "1.2" ? `
    if ("${completionStatus}" === "passed-failed") {
      API.LMSSetValue("cmi.core.lesson_status", passed ? "passed" : "failed");
    } else {
      API.LMSSetValue("cmi.core.lesson_status", "completed");
    }
    API.LMSSetValue("cmi.core.score.raw", Math.round((correctAnswers / totalQuestions) * 100));
    API.LMSCommit("");
    API.LMSFinish("");
    ` : `
    API.SetValue("cmi.completion_status", "completed");
    if ("${completionStatus}" === "passed-failed") {
      API.SetValue("cmi.success_status", passed ? "passed" : "failed");
    }
    API.SetValue("cmi.score.raw", Math.round((correctAnswers / totalQuestions) * 100));
    API.SetValue("cmi.score.min", "0");
    API.SetValue("cmi.score.max", "100");
    API.Commit("");
    API.Terminate("");
    `}
    console.log("SCORM finished - passed:", passed);
  }

  function updateProgress() {
    var total = totalSlides + totalQuestions + 1;
    var current = inQuiz ? totalSlides + currentQuestion : currentSlide;
    var pct = ((current + 1) / total) * 100;
    document.querySelector(".progress-fill").style.width = pct + "%";
    document.getElementById("page-info").textContent = (current + 1) + " / " + total;
  }

  function showSlide(index) {
    document.querySelectorAll(".slide").forEach(function(s, i) {
      s.style.display = i === index ? "block" : "none";
    });
    document.getElementById("slides-container").style.display = "block";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("completion-container").style.display = "none";
    document.getElementById("btn-prev").disabled = index === 0;
    updateProgress();
  }

  function showQuestion(index) {
    document.querySelectorAll(".question").forEach(function(q, i) {
      q.style.display = i === index ? "block" : "none";
    });
    document.getElementById("slides-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("completion-container").style.display = "none";
    document.getElementById("btn-prev").disabled = false;
    document.getElementById("btn-next").disabled = true;
    updateProgress();
  }

  function showCompletion() {
    document.getElementById("slides-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("completion-container").style.display = "block";
    document.querySelector(".score").textContent = "Pontuação: " + correctAnswers + "/" + totalQuestions;
    document.getElementById("btn-next").disabled = true;
    document.getElementById("btn-prev").disabled = true;
    
    var passed = correctAnswers >= Math.ceil(totalQuestions * 0.7);
    finishSCORM(passed);
  }

  function checkAnswer(questionEl) {
    var selected = questionEl.querySelector('input[type="radio"]:checked');
    if (!selected) return;

    var correct = parseInt(questionEl.dataset.correct);
    var answer = parseInt(selected.value);
    var feedback = questionEl.querySelector(".feedback");

    if (answer === correct) {
      feedback.textContent = "✓ Correto!";
      feedback.className = "feedback correct";
      correctAnswers++;
      document.getElementById("btn-next").disabled = false;
      // Disable further changes
      questionEl.querySelectorAll('input').forEach(function(i) { i.disabled = true; });
    } else {
      feedback.textContent = "✗ Tente novamente";
      feedback.className = "feedback incorrect";
      selected.checked = false;
    }
  }

  function handleNext() {
    if (!inQuiz) {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
      } else {
        inQuiz = true;
        currentQuestion = 0;
        showQuestion(currentQuestion);
      }
    } else {
      if (currentQuestion < totalQuestions - 1) {
        currentQuestion++;
        showQuestion(currentQuestion);
      } else {
        showCompletion();
      }
    }
  }

  function handlePrev() {
    if (inQuiz) {
      if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
        document.getElementById("btn-next").disabled = false;
      } else {
        inQuiz = false;
        currentSlide = totalSlides - 1;
        showSlide(currentSlide);
      }
    } else {
      if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      }
    }
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function() {
    initSCORM();
    showSlide(0);

    document.getElementById("btn-next").addEventListener("click", handleNext);
    document.getElementById("btn-prev").addEventListener("click", handlePrev);

    document.querySelectorAll(".question").forEach(function(q) {
      q.querySelectorAll('input[type="radio"]').forEach(function(radio) {
        radio.addEventListener("change", function() {
          checkAnswer(q);
        });
      });
    });
  });

  // Handle page unload
  window.addEventListener("beforeunload", function() {
    if (!finished && API) {
      ${version === "1.2" ? `
      API.LMSCommit("");
      ` : `
      API.Commit("");
      `}
    }
  });
})();`;
}

function generateStyles(): string {
  return `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

header h1 {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  width: 0%;
  transition: width 0.3s ease;
}

main {
  padding: 32px;
  min-height: 400px;
}

.slide h2, #quiz-container h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.slide-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}

.content {
  color: #555;
  line-height: 1.7;
  font-size: 1rem;
}

.video-link {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s;
}

.video-link:hover {
  background: #5a67d8;
}

.question {
  margin-bottom: 24px;
}

.question-text {
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.alternatives {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alternative {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f7f7f7;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.alternative:hover {
  background: #eee;
}

.alternative input {
  width: 20px;
  height: 20px;
}

.alternative span {
  color: #444;
}

.feedback {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}

.feedback.correct {
  background: #d4edda;
  color: #155724;
}

.feedback.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.feedback:empty {
  display: none;
}

.completion-message {
  text-align: center;
  padding: 40px;
}

.completion-message h2 {
  font-size: 2rem;
  margin-bottom: 16px;
}

.completion-message p {
  color: #666;
  font-size: 1.1rem;
}

.completion-message .score {
  margin-top: 16px;
  font-weight: 600;
  color: #667eea;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
}

footer button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

footer button:hover:not(:disabled) {
  background: #5a67d8;
}

footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#page-info {
  color: #888;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  body { padding: 10px; }
  main { padding: 20px; }
  footer { padding: 16px 20px; }
  footer button { padding: 10px 16px; font-size: 0.9rem; }
}`;
}
