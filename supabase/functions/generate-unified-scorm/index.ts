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
}

interface VideoScene {
  narration: string;
  duration: number;
  imageBase64?: string | null;
  audioBase64?: string;
}

interface CourseQuestion {
  text: string;
  alternatives: string[];
  correctIndex: number;
}

interface UnifiedCourse {
  title: string;
  slides: CourseSlide[];
  video: {
    title: string;
    scenes: VideoScene[];
    totalDuration: number;
    audioBase64?: string;
  };
  questions: CourseQuestion[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course, scormVersion, completionStatus } = await req.json() as {
      course: UnifiedCourse;
      scormVersion: "1.2" | "2004";
      completionStatus: "completed" | "passed-failed";
    };

    if (!course || !course.slides || !course.video || !course.questions) {
      return new Response(
        JSON.stringify({ error: "Invalid course data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating unified SCORM ${scormVersion} for: ${course.title}`);

    const zip = new JSZip();
    const identifier = course.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);

    // Generate manifest
    const manifest = generateManifest(course.title, identifier, scormVersion, course);
    zip.file("imsmanifest.xml", manifest);

    // Extract and save slide images
    course.slides.forEach((slide, index) => {
      if (slide.imageBase64) {
        const base64Data = slide.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        zip.file(`images/slide_${index + 1}.png`, base64Data, { base64: true });
      }
    });

    // Extract and save video scene images
    course.video.scenes.forEach((scene, index) => {
      if (scene.imageBase64) {
        const base64Data = scene.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        zip.file(`video/scene_${index + 1}.png`, base64Data, { base64: true });
      }
    });

    // Save video audio if available
    if (course.video.audioBase64) {
      const audioData = course.video.audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      zip.file("video/narration.mp3", audioData, { base64: true });
    }

    // Generate HTML
    const html = generateHTML(course, scormVersion);
    zip.file("index.html", html);

    // Generate script
    const script = generateScript(course, scormVersion, completionStatus);
    zip.file("script.js", script);

    // Generate styles
    const styles = generateStyles();
    zip.file("styles.css", styles);

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: "base64" });

    console.log("Unified SCORM package generated successfully");

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


function generateManifest(title: string, identifier: string, version: "1.2" | "2004", course: UnifiedCourse): string {
  const escapedTitle = title.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c] || c));

  // Generate resource file list
  let resourceFiles = `
      <file href="index.html"/>
      <file href="script.js"/>
      <file href="styles.css"/>`;

  // Add slide images
  course.slides.forEach((slide, index) => {
    if (slide.imageBase64) {
      resourceFiles += `\n      <file href="images/slide_${index + 1}.png"/>`;
    }
  });

  // Add video scene images
  course.video.scenes.forEach((scene, index) => {
    if (scene.imageBase64) {
      resourceFiles += `\n      <file href="video/scene_${index + 1}.png"/>`;
    }
  });

  // Add video audio
  if (course.video.audioBase64) {
    resourceFiles += `\n      <file href="video/narration.mp3"/>`;
  }

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
${resourceFiles}
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
${resourceFiles}
    </resource>
  </resources>
</manifest>`;
}


function escapeHtml(text: string): string {
  return text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
}

function generateHTML(course: UnifiedCourse, version: "1.2" | "2004"): string {
  const escapedTitle = escapeHtml(course.title);

  // Generate slides HTML
  const slidesHTML = course.slides.map((slide, index) => `
    <div class="slide" data-slide="${index}">
      <h2>${escapeHtml(slide.title)}</h2>
      ${slide.imageBase64 ? `<img src="images/slide_${index + 1}.png" alt="${escapeHtml(slide.title)}" class="slide-image">` : ""}
      <div class="content">${escapeHtml(slide.content).replace(/\n/g, "<br>")}</div>
    </div>`).join("\n");

  // Generate video player HTML
  const scenesDataJSON = JSON.stringify(course.video.scenes.map((scene, index) => ({
    narration: scene.narration,
    duration: scene.duration,
    image: scene.imageBase64 ? `video/scene_${index + 1}.png` : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjgwIDcyMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICMyZTM3NDg7Ij48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iNDAiPkNlbmEgc2VtIGltYWdlbTwvdGV4dD48L3N2Zz4=",
  })));

  const videoHTML = `
    <div id="video-section" style="display: none;">
      <h2>🎬 ${escapeHtml(course.video.title)}</h2>
      <div class="video-player">
        <div class="video-screen">
          <img id="video-image" src="" alt="Cena do vídeo" class="video-frame">
          <div id="video-narration" class="video-narration"></div>
          <div id="scene-indicator" class="scene-indicator"></div>
        </div>
        <div class="video-progress">
          <div class="video-progress-bar">
            <div id="video-progress-fill" class="video-progress-fill"></div>
          </div>
          <div class="video-time">
            <span id="current-time">0:00</span> / <span id="total-time">1:00</span>
          </div>
        </div>
        <div class="video-controls">
          <button id="btn-restart-video" class="video-btn">⏮ Reiniciar</button>
          <button id="btn-play-video" class="video-btn primary">▶ Reproduzir</button>
        </div>
      </div>
      <script>window.videoScenes = ${scenesDataJSON};</script>
      ${course.video.audioBase64 ? '<audio id="narration-audio" src="video/narration.mp3" preload="auto"></audio>' : ''}
      <audio id="bg-music" loop preload="auto">
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">
      </audio>
    </div>`;

  // Generate quiz HTML
  const questionsHTML = course.questions.map((q, index) => {
    const altsHTML = q.alternatives.map((alt, altIdx) => `
        <label class="alternative">
          <input type="radio" name="q${index}" value="${altIdx}">
          <span>${escapeHtml(alt)}</span>
        </label>`).join("\n");

    return `
      <div class="question" data-question="${index}" data-correct="${q.correctIndex}">
        <p class="question-text">${index + 1}. ${escapeHtml(q.text)}</p>
        <div class="alternatives">${altsHTML}</div>
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
      <div class="section-tabs">
        <button class="tab active" data-section="slides">📚 Conteúdo</button>
        <button class="tab" data-section="video">🎬 Vídeo</button>
        <button class="tab" data-section="quiz">❓ Quiz</button>
      </div>
    </header>

    <main>
      <!-- Slides Section -->
      <div id="slides-container">
        ${slidesHTML}
      </div>

      <!-- Video Section -->
      ${videoHTML}

      <!-- Quiz Section -->
      <div id="quiz-container" style="display: none;">
        <h2>📝 Quiz Final</h2>
        ${questionsHTML}
      </div>

      <!-- Completion -->
      <div id="completion-container" style="display: none;">
        <div class="completion-message">
          <h2>🎉 Parabéns!</h2>
          <p>Você concluiu o curso completo.</p>
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

function generateScript(course: UnifiedCourse, version: "1.2" | "2004", completionStatus: "completed" | "passed-failed"): string {
  const totalSlides = course.slides.length;
  const totalQuestions = course.questions.length;

  return `// Unified SCORM ${version} Script
(function() {
  var API = null;
  var finished = false;
  
  // Navigation state
  var currentSection = 'slides'; // 'slides', 'video', 'quiz'
  var currentSlide = 0;
  var currentQuestion = 0;
  var correctAnswers = 0;
  
  var totalSlides = ${totalSlides};
  var totalQuestions = ${totalQuestions};
  
  // Video state
  var videoPlaying = false;
  var videoCompleted = false;
  var currentSceneIndex = 0;
  var videoTimer = null;
  var sceneStartTime = 0;

  // Find SCORM API
  function findAPI(win) {
    var attempts = 0;
    while (win && attempts < 500) {
      ${version === "1.2" ? `if (win.API) return win.API;` : `if (win.API_1484_11) return win.API_1484_11;`}
      if (win === win.parent) break;
      win = win.parent;
      attempts++;
    }
    return null;
  }

  function initSCORM() {
    try {
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
    } catch (e) {
      console.warn("SCORM init failed (continuing standalone):", e);
    }
  }

  function finishSCORM(passed) {
    if (finished || !API) return;
    finished = true;

    try {
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
    } catch (e) {
      console.warn("SCORM finish failed:", e);
    }
  }

  function updateProgress() {
    var total = totalSlides + 1 + totalQuestions + 1; // slides + video + questions + completion
    var current = 0;
    
    if (currentSection === 'slides') {
      current = currentSlide;
    } else if (currentSection === 'video') {
      current = totalSlides;
    } else if (currentSection === 'quiz') {
      current = totalSlides + 1 + currentQuestion;
    }
    
    var pct = ((current + 1) / total) * 100;
    document.querySelector(".progress-fill").style.width = pct + "%";
    document.getElementById("page-info").textContent = (current + 1) + " / " + total;
  }

  function updateTabs() {
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.classList.remove('active');
      if (tab.dataset.section === currentSection) {
        tab.classList.add('active');
      }
    });
  }

  function showSection(section) {
    currentSection = section;
    document.getElementById("slides-container").style.display = section === 'slides' ? 'block' : 'none';
    document.getElementById("video-section").style.display = section === 'video' ? 'block' : 'none';
    document.getElementById("quiz-container").style.display = section === 'quiz' ? 'block' : 'none';
    document.getElementById("completion-container").style.display = 'none';
    
    if (section === 'slides') {
      showSlide(currentSlide);
    } else if (section === 'video') {
      initVideo();
      document.getElementById("btn-prev").disabled = false;
      document.getElementById("btn-next").disabled = !videoCompleted;
    } else if (section === 'quiz') {
      showQuestion(currentQuestion);
    }
    
    updateTabs();
    updateProgress();
  }

  function showSlide(index) {
    document.querySelectorAll(".slide").forEach(function(s, i) {
      s.style.display = i === index ? "block" : "none";
    });
    document.getElementById("btn-prev").disabled = index === 0;
    document.getElementById("btn-next").disabled = false;
    updateProgress();
  }

  function showQuestion(index) {
    document.querySelectorAll(".question").forEach(function(q, i) {
      q.style.display = i === index ? "block" : "none";
    });
    document.getElementById("btn-prev").disabled = false;
    
    // Check if this question was already answered
    var questionEl = document.querySelector('.question[data-question="' + index + '"]');
    var selected = questionEl.querySelector('input[type="radio"]:checked');
    var isCorrect = selected && parseInt(selected.value) === parseInt(questionEl.dataset.correct);
    document.getElementById("btn-next").disabled = !isCorrect;
    
    updateProgress();
  }

  function showCompletion() {
    document.getElementById("slides-container").style.display = "none";
    document.getElementById("video-section").style.display = "none";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("completion-container").style.display = "block";
    document.querySelector(".score").textContent = "Pontuação: " + correctAnswers + "/" + totalQuestions;
    document.getElementById("btn-next").disabled = true;
    document.getElementById("btn-prev").disabled = true;
    
    var passed = correctAnswers >= Math.ceil(totalQuestions * 0.7);
    finishSCORM(passed);
  }

  // Video functions
  function initVideo() {
    var scenes = window.videoScenes || [];
    if (scenes.length > 0 && scenes[0].image) {
      document.getElementById("video-image").src = scenes[0].image;
      document.getElementById("video-narration").textContent = scenes[0].narration;
      document.getElementById("scene-indicator").textContent = "Cena 1 / " + scenes.length;
    }
    
    var totalDuration = scenes.reduce(function(acc, s) { return acc + s.duration; }, 0);
    document.getElementById("total-time").textContent = formatTime(totalDuration);
  }

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  function playVideo() {
    if (videoPlaying) {
      pauseVideo();
      return;
    }
    
    var scenes = window.videoScenes || [];
    if (scenes.length === 0) return;
    
    videoPlaying = true;
    document.getElementById("btn-play-video").textContent = "⏸ Pausar";
    
    var audio = document.getElementById("narration-audio");
    if (audio) audio.play();
    
    var bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 0.15; // 15% volume
      bgMusic.play().catch(function(e) { console.log("BG music play blocked", e); });
    }
    
    sceneStartTime = Date.now();
    runVideoFrame();
  }

  function pauseVideo() {
    videoPlaying = false;
    document.getElementById("btn-play-video").textContent = "▶ Reproduzir";
    if (videoTimer) clearTimeout(videoTimer);
    
    var audio = document.getElementById("narration-audio");
    if (audio) audio.pause();
    
    var bgMusic = document.getElementById("bg-music");
    if (bgMusic) bgMusic.pause();
  }

  function runVideoFrame() {
    if (!videoPlaying) return;
    
    var scenes = window.videoScenes || [];
    var currentScene = scenes[currentSceneIndex];
    var elapsed = (Date.now() - sceneStartTime) / 1000;
    
    // Calculate total elapsed time
    var totalElapsed = 0;
    for (var i = 0; i < currentSceneIndex; i++) {
      totalElapsed += scenes[i].duration;
    }
    totalElapsed += elapsed;
    
    var totalDuration = scenes.reduce(function(acc, s) { return acc + s.duration; }, 0);
    var progress = (totalElapsed / totalDuration) * 100;
    document.getElementById("video-progress-fill").style.width = progress + "%";
    document.getElementById("current-time").textContent = formatTime(totalElapsed);
    
    // Check if scene is complete
    if (elapsed >= currentScene.duration) {
      currentSceneIndex++;
      if (currentSceneIndex >= scenes.length) {
        // Video complete
        videoCompleted = true;
        videoPlaying = false;
        document.getElementById("btn-play-video").textContent = "✓ Concluído";
        document.getElementById("btn-play-video").disabled = true;
        document.getElementById("btn-next").disabled = false;
        document.getElementById("video-progress-fill").style.width = "100%";
        return;
      }
      
      // Show next scene
      var nextScene = scenes[currentSceneIndex];
      if (nextScene.image) {
        document.getElementById("video-image").src = nextScene.image;
      }
      document.getElementById("video-narration").textContent = nextScene.narration;
      document.getElementById("scene-indicator").textContent = "Cena " + (currentSceneIndex + 1) + " / " + scenes.length;
      sceneStartTime = Date.now();
    }
    
    videoTimer = setTimeout(runVideoFrame, 100);
  }

  function restartVideo() {
    pauseVideo();
    currentSceneIndex = 0;
    videoCompleted = false;
    document.getElementById("btn-play-video").textContent = "▶ Reproduzir";
    document.getElementById("btn-play-video").disabled = false;
    document.getElementById("btn-next").disabled = true;
    document.getElementById("video-progress-fill").style.width = "0%";
    document.getElementById("current-time").textContent = "0:00";
    
    var audio = document.getElementById("narration-audio");
    if (audio) {
      audio.currentTime = 0;
    }
    
    initVideo();
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
      questionEl.querySelectorAll('input').forEach(function(i) { i.disabled = true; });
    } else {
      feedback.textContent = "✗ Tente novamente";
      feedback.className = "feedback incorrect";
      selected.checked = false;
    }
  }

  function handleNext() {
    if (currentSection === 'slides') {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
      } else {
        showSection('video');
      }
    } else if (currentSection === 'video') {
      if (videoCompleted) {
        showSection('quiz');
      }
    } else if (currentSection === 'quiz') {
      if (currentQuestion < totalQuestions - 1) {
        currentQuestion++;
        showQuestion(currentQuestion);
      } else {
        showCompletion();
      }
    }
  }

  function handlePrev() {
    if (currentSection === 'slides') {
      if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      }
    } else if (currentSection === 'video') {
      currentSlide = totalSlides - 1;
      showSection('slides');
    } else if (currentSection === 'quiz') {
      if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
        document.getElementById("btn-next").disabled = false;
      } else {
        showSection('video');
      }
    }
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function() {
    initSCORM();
    showSection('slides');

    document.getElementById("btn-next").addEventListener("click", handleNext);
    document.getElementById("btn-prev").addEventListener("click", handlePrev);
    
    // Video controls
    document.getElementById("btn-play-video").addEventListener("click", playVideo);
    document.getElementById("btn-restart-video").addEventListener("click", restartVideo);

    // Tab navigation
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var section = this.dataset.section;
        if (section === 'quiz' && !videoCompleted) {
          alert('Assista ao vídeo primeiro para acessar o quiz.');
          return;
        }
        showSection(section);
      });
    });

    // Quiz answer handling
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
      try {
        ${version === "1.2" ? `API.LMSCommit("");` : `API.Commit("");`}
      } catch (e) { console.warn("SCORM commit failed:", e); }
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
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8f9fc;
  color: #1f2937;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.5);
}

header {
  background: white;
  padding: 32px 32px 24px;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: #111827;
  letter-spacing: -0.025em;
}

.progress-container {
   width: 100%;
   max-width: 300px;
   margin: 0 auto 24px;
}

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #818cf8 0%, #6366f1 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  width: 0%;
  border-radius: 999px;
}

.section-tabs {
  display: inline-flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 12px;
}

.tab {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

main {
  padding: 40px 32px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Slides */
.slide h2 {
  font-size: 1.5rem;
  margin-bottom: 24px;
  color: #111827;
}

.slide-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.content {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #4b5563;
}

/* Video Player */
.video-player {
  background: black;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.video-screen {
  position: relative;
  aspect-ratio: 16/9;
  background: #111827;
}

.video-frame {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-narration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 32px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  color: white;
  text-align: center;
  font-size: 1.1rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  pointer-events: none;
}

.video-progress {
  padding: 16px 20px;
  background: #1f2937;
}

.video-progress-bar {
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
}

.video-progress-fill {
  height: 100%;
  background: #818cf8;
  width: 0%;
  border-radius: 4px;
}

.video-time {
  text-align: right;
  color: #9ca3af;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.video-controls {
  padding: 12px 20px 20px;
  background: #1f2937;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.video-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.video-btn:hover {
  background: rgba(255,255,255,0.1);
}

.video-btn.primary {
  background: #6366f1;
  border-color: #6366f1;
}

.video-btn.primary:hover {
  background: #4f46e5;
}

/* Quiz */
.question {
  animation: fadeIn 0.4s ease;
}

.question-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #111827;
}

.alternative {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alternative:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.alternative input {
  margin-right: 16px;
  accent-color: #6366f1;
  width: 20px;
  height: 20px;
}

.feedback {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  display: none;
}

.feedback.correct {
  display: block;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.feedback.incorrect {
  display: block;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Footer */
footer {
  padding: 24px 32px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

footer button {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

#btn-prev {
  background: transparent;
  color: #6b7280;
}

#btn-prev:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

#btn-next {
  background: #111827;
  color: white;
}

#btn-next:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Completion */
.completion-message {
  text-align: center;
  padding: 40px 0;
}

.completion-message h2 {
  font-size: 2rem;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score {
  font-size: 1.5rem;
  color: #4b5563;
  font-weight: 500;
}


.slide, .question {
  display: none;
}

.slide h2, #video - section h2, #quiz - container h2 {
  color: #333;
  font - size: 1.4rem;
  margin - bottom: 20px;
}

.slide - image {
  width: 100 %;
  max - height: 350px;
  object - fit: cover;
  border - radius: 12px;
  margin - bottom: 24px;
  box - shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  animation: fadeIn 1.2s ease -in, zoomIn 15s ease -in -out infinite alternate;
}

.content {
  line - height: 1.7;
  color: #444;
}

/* Video Player */
.video - player {
  background: #000;
  border - radius: 12px;
  overflow: hidden;
}

.video - screen {
  position: relative;
  aspect - ratio: 16 / 9;
  background: #111;
}

.video - frame {
  width: 100 %;
  height: 100 %;
  object - fit: cover;
  animation: zoomIn 20s ease -in -out infinite alternate;
}

.video - narration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear - gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  font - size: 1rem;
  text - align: center;
}

.scene - indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border - radius: 12px;
  font - size: 0.8rem;
}

.video - progress {
  padding: 12px 16px;
  background: #222;
}

.video - progress - bar {
  height: 4px;
  background: #444;
  border - radius: 2px;
  overflow: hidden;
  margin - bottom: 8px;
}

.video - progress - fill {
  height: 100 %;
  background: #667eea;
  width: 0 %;
  transition: width 0.1s linear;
}

.video - time {
  display: flex;
  justify - content: space - between;
  color: #aaa;
  font - size: 0.8rem;
}

.video - controls {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #1a1a1a;
  justify - content: center;
}

.video - btn {
  padding: 10px 20px;
  border: none;
  border - radius: 8px;
  cursor: pointer;
  font - size: 0.9rem;
  background: #333;
  color: white;
  transition: background 0.2s;
}

.video - btn:hover {
  background: #444;
}

.video - btn.primary {
  background: #667eea;
}

.video - btn.primary:hover {
  background: #5a6fd6;
}

.video - btn:disabled {
  opacity: 0.5;
  cursor: not - allowed;
}

/* Quiz */
.question - text {
  font - size: 1.1rem;
  font - weight: 600;
  color: #333;
  margin - bottom: 16px;
}

.alternatives {
  display: flex;
  flex - direction: column;
  gap: 10px;
}

.alternative {
  display: flex;
  align - items: center;
  padding: 14px 16px;
  background: #f5f5f5;
  border - radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.alternative:hover {
  background: #e8e8ff;
}

.alternative input {
  margin - right: 12px;
  width: 18px;
  height: 18px;
}

.alternative span {
  color: #333;
}

.feedback {
  margin - top: 16px;
  padding: 12px;
  border - radius: 8px;
  font - weight: 600;
  text - align: center;
}

.feedback.correct {
  background: #d4edda;
  color: #155724;
}

.feedback.incorrect {
  background: #f8d7da;
  color: #721c24;
}

/* Completion */
.completion - message {
  text - align: center;
  padding: 40px;
}

.completion - message h2 {
  font - size: 2rem;
  margin - bottom: 16px;
}

.score {
  font - size: 1.2rem;
  color: #667eea;
  font - weight: 600;
  margin - top: 16px;
}

footer {
  display: flex;
  justify - content: space - between;
  align - items: center;
  padding: 20px 32px;
  background: #f5f5f5;
  border - top: 1px solid #eee;
}

footer button {
  padding: 12px 24px;
  border: none;
  border - radius: 8px;
  font - size: 1rem;
  cursor: pointer;
  background: #667eea;
  color: white;
  transition: all 0.2s;
}

footer button: hover: not(: disabled) {
  background: #5a6fd6;
}

footer button:disabled {
  background: #ccc;
  cursor: not - allowed;
}

#page - info {
  color: #666;
  font - size: 0.9rem;
}

@media(max - width: 600px) {
  header h1 { font - size: 1.2rem; }
  main { padding: 20px; }
  footer { padding: 16px; }
  footer button { padding: 10px 16px; font - size: 0.9rem; }
  .section - tabs { flex - wrap: wrap; }
  .tab { font - size: 0.8rem; padding: 6px 12px; }
}

@keyframes fadeIn {
  from { opacity: 0; filter: blur(5px); }
  to { opacity: 1; filter: blur(0); }
}

@keyframes zoomIn {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
} `;
}
