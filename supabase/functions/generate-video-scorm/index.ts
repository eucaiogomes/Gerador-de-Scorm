import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VideoScene {
  imagePrompt: string;
  narration: string;
  duration: number;
  imageBase64?: string | null;
  audioBase64?: string;
}

interface VideoContent {
  title: string;
  scenes: VideoScene[];
  totalDuration: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, scormVersion = "1.2" } = await req.json();

    if (!content || !content.scenes) {
      return new Response(
        JSON.stringify({ error: "Video content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoContent: VideoContent = content;
    const zip = new JSZip();

    // Generate imsmanifest.xml
    const manifest = generateManifest(videoContent.title, scormVersion, videoContent);
    zip.file("imsmanifest.xml", manifest);

    // Generate HTML with video player
    const html = generateVideoHTML(videoContent, scormVersion);
    zip.file("index.html", html);

    // Generate SCORM API script
    const script = generateScormScript(scormVersion, videoContent.totalDuration);
    zip.file("script.js", script);

    // Generate CSS
    const css = generateCSS();
    zip.file("styles.css", css);

    // Add images to the package
    for (let i = 0; i < videoContent.scenes.length; i++) {
      const scene = videoContent.scenes[i];
      if (scene.imageBase64) {
        const base64Data = scene.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        zip.file(`scene_${i + 1}.png`, imageBytes);
      }
    }

    // Add audio if present
    const firstSceneWithAudio = videoContent.scenes.find((s) => s.audioBase64);
    if (firstSceneWithAudio?.audioBase64) {
      const audioBase64 = firstSceneWithAudio.audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
      zip.file("narration.mp3", audioBytes);
    }

    // Generate ZIP
    const zipContent = await zip.generateAsync({ type: "base64" });

    return new Response(
      JSON.stringify({ zip: zipContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating video SCORM:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


function generateManifest(title: string, version: string, content: VideoContent): string {
  const safeTitle = title.replace(/[<>&"']/g, "");

  // Generate resource file list
  let resourceFiles = `
      <file href="index.html"/>
      <file href="script.js"/>
      <file href="styles.css"/>`;

  // Add video scene images
  content.scenes.forEach((scene, index) => {
    if (scene.imageBase64) {
      resourceFiles += `\n      <file href="scene_${index + 1}.png"/>`;
    }
  });

  // Add audio
  if (content.scenes.some(s => s.audioBase64)) {
    resourceFiles += `\n      <file href="narration.mp3"/>`;
  }

  if (version === "2004") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="video_scorm" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${safeTitle}</title>
      <item identifier="item1" identifierref="res1">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormType="sco" href="index.html">
${resourceFiles}
    </resource>
  </resources>
</manifest>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="video_scorm" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${safeTitle}</title>
      <item identifier="item1" identifierref="res1">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${resourceFiles}
    </resource>
  </resources>
</manifest>`;
}


function generateVideoHTML(content: VideoContent, version: string): string {
  const scenes = content.scenes
    .map((scene, i) => {
      const hasImage = scene.imageBase64 !== null && scene.imageBase64 !== undefined;
      return `{
        image: ${hasImage ? `"scene_${i + 1}.png"` : "null"},
        narration: ${JSON.stringify(scene.narration)},
        duration: ${scene.duration * 1000}
      }`;
    })
    .join(",\n      ");

  const hasAudio = content.scenes.some((s) => s.audioBase64);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title.replace(/[<>&"']/g, "")}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="video-container">
    <h1 class="video-title">${content.title.replace(/[<>&"']/g, "")}</h1>
    
    <div class="player">
      <div class="scene-display">
        <img id="sceneImage" src="" alt="Cena atual" style="display: none;">
        <div id="scenePlaceholder" class="placeholder">
          <span>Clique em Play para iniciar</span>
        </div>
      </div>
      
      <div class="narration-bar">
        <p id="narrationText"></p>
      </div>
      
      <div class="progress-container">
        <div class="progress-bar">
          <div id="progressFill" class="progress-fill"></div>
        </div>
        <div class="time-display">
          <span id="currentTime">0:00</span>
          <span id="totalTime">${Math.floor(content.totalDuration / 60)}:${(content.totalDuration % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>
      
      <div class="controls">
        <button id="playBtn" class="control-btn">
          <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg id="pauseIcon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button id="restartBtn" class="control-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
        </button>
      </div>
    </div>
    
    ${hasAudio ? '<audio id="narrationAudio" src="narration.mp3"></audio>' : ""}
    <audio id="bgMusic" loop preload="auto">
      <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">
    </audio>
  </div>
  
  <script>
    const scenes = [
      ${scenes}
    ];
    const totalDuration = ${content.totalDuration * 1000};
  </script>
  <script src="script.js"></script>
</body>
</html>`;
}

function generateScormScript(version: string, totalDuration: number): string {
  const statusPath = version === "2004" ? "cmi.completion_status" : "cmi.core.lesson_status";
  const successPath = version === "2004" ? "cmi.success_status" : null;

  return `// SCORM API
let API = null;
let scormInitialized = false;
let scormFinished = false;

function findAPI(win) {
  let tries = 0;
  while (win && tries < 500) {
    if (win.API_1484_11) return win.API_1484_11;
    if (win.API) return win.API;
    if (win === win.parent) break;
    win = win.parent;
    tries++;
  }
  return null;
}

function initSCORM() {
  API = findAPI(window);
  if (!API) API = findAPI(window.opener);
  
  if (API) {
    const result = API.LMSInitialize ? API.LMSInitialize("") : API.Initialize("");
    scormInitialized = result === "true" || result === true;
    if (scormInitialized) {
      setStatus("incomplete");
    }
  }
}

function setStatus(status) {
  if (!API || !scormInitialized || scormFinished) return;
  
  const path = "${statusPath}";
  if (API.LMSSetValue) {
    API.LMSSetValue(path, status);
    API.LMSCommit("");
  } else {
    API.SetValue(path, status);
    API.Commit("");
  }
}

function finishSCORM() {
  if (!API || !scormInitialized || scormFinished) return;
  scormFinished = true;
  
  setStatus("completed");
  ${successPath ? `
  if (API.SetValue) {
    API.SetValue("${successPath}", "passed");
    API.Commit("");
  }` : ""}
  
  if (API.LMSCommit) API.LMSCommit("");
  else API.Commit("");
  
  if (API.LMSFinish) API.LMSFinish("");
  else API.Terminate("");
}

// Video Player
let isPlaying = false;
let currentTime = 0;
let currentSceneIndex = 0;
let interval = null;

const sceneImage = document.getElementById("sceneImage");
const scenePlaceholder = document.getElementById("scenePlaceholder");
const narrationText = document.getElementById("narrationText");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const restartBtn = document.getElementById("restartBtn");
const narrationAudio = document.getElementById("narrationAudio");
const bgMusic = document.getElementById("bgMusic");

function formatTime(ms) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return mins + ":" + remainingSecs.toString().padStart(2, "0");
}

function updateScene() {
  let elapsed = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTime >= elapsed && currentTime < elapsed + scenes[i].duration) {
      if (currentSceneIndex !== i) {
        currentSceneIndex = i;
        const scene = scenes[i];
        
        if (scene.image) {
          sceneImage.src = scene.image;
          sceneImage.style.display = "block";
          scenePlaceholder.style.display = "none";
        } else {
          sceneImage.style.display = "none";
          scenePlaceholder.style.display = "flex";
          scenePlaceholder.querySelector("span").textContent = "Cena " + (i + 1);
        }
        
        narrationText.textContent = scene.narration;
      }
      break;
    }
    elapsed += scenes[i].duration;
  }
  
  const progress = (currentTime / totalDuration) * 100;
  progressFill.style.width = progress + "%";
  currentTimeEl.textContent = formatTime(currentTime);
}

function togglePlay() {
  if (currentTime >= totalDuration) {
    currentTime = 0;
    currentSceneIndex = -1;
  }
  
  isPlaying = !isPlaying;
  
  if (isPlaying) {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    
    if (narrationAudio) {
      narrationAudio.currentTime = currentTime / 1000;
      narrationAudio.play();
    }
    
    if (bgMusic) {
      bgMusic.volume = 0.15;
      bgMusic.play().catch(e => console.log("BG music play blocked", e));
    }
    
    interval = setInterval(() => {
      currentTime += 100;
      updateScene();
      
      if (currentTime >= totalDuration) {
        clearInterval(interval);
        isPlaying = false;
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
        finishSCORM();
      }
    }, 100);
  } else {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
    
    if (narrationAudio) {
      narrationAudio.pause();
    }
    
    if (bgMusic) bgMusic.pause();
    
    clearInterval(interval);
  }
}

function restart() {
  if (interval) clearInterval(interval);
  isPlaying = false;
  currentTime = 0;
  currentSceneIndex = -1;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  progressFill.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  narrationText.textContent = "";
  sceneImage.style.display = "none";
  scenePlaceholder.style.display = "flex";
  scenePlaceholder.querySelector("span").textContent = "Clique em Play para iniciar";
  
  if (narrationAudio) {
    narrationAudio.pause();
    narrationAudio.currentTime = 0;
  }
  
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

playBtn.addEventListener("click", togglePlay);
restartBtn.addEventListener("click", restart);

// Initialize
initSCORM();
document.getElementById("totalTime").textContent = formatTime(totalDuration);

window.addEventListener("beforeunload", () => {
  if (!scormFinished && scormInitialized) {
    finishSCORM();
  }
});
`;
}

function generateCSS(): string {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f8f9fc;
  color: #1f2937;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.video-container {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.5);
  padding: 32px;
}

.video-title {
  color: #111827;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: -0.025em;
}

.player {
  background: black;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.scene-display {
  aspect-ratio: 16/9;
  background: #111827;
  position: relative;
}

.scene-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: zoomIn 20s ease-in-out infinite alternate;
}

@keyframes zoomIn {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.placeholder span {
  color: #6b7280;
  font-size: 1.2rem;
  font-weight: 500;
}

.narration-bar {
  padding: 24px 32px;
  background: white;
  min-height: 80px;
  border-top: 1px solid #f3f4f6;
}

.narration-bar p {
  color: #4b5563;
  font-size: 1.1rem;
  line-height: 1.6;
  text-align: center;
}

.progress-container {
  padding: 16px 32px;
  background: white;
}

.progress-bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #818cf8 0%, #6366f1 100%);
  width: 0%;
  transition: width 0.1s linear;
  border-radius: 999px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 32px 32px;
  background: white;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #6366f1;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

.control-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.4);
}

.control-btn:active {
  transform: translateY(0);
}

.control-btn svg {
  width: 28px;
  height: 28px;
}

#restartBtn {
  background: #f3f4f6;
  color: #4b5563;
  box-shadow: none;
}

#restartBtn:hover {
  background: #e5e7eb;
  color: #111827;
}
`;
}

