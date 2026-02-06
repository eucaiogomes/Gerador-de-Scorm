
// Mock data
const content = {
    title: "Test Video Course",
    scenes: [
        {
            imageBase64: "data:image/png;base64,test",
            narration: "Scene 1 narration",
            duration: 5,
            audioBase64: "data:audio/mp3;base64,audio1"
        }
    ],
    totalDuration: 60
};

// Function copied from generate-video-scorm/index.ts (simplified for JS)
function generateVideoHTML(content, version) {
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

// Run test
const output = generateVideoHTML(content, "2004");
console.log(output);

// Check for literal bugs
if (output.includes("${")) {
    console.error("FAIL: Found literal ${");
    process.exit(1);
} else {
    console.log("PASS: No literal ${ found");
}
