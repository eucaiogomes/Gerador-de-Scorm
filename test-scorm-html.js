
const fs = require('fs');

// Mock data
const course = {
    title: "Test Course",
    slides: [],
    video: {
        title: "Video Title",
        scenes: [],
        totalDuration: 60,
        audioBase64: "data:audio/mp3;base64,testdata"
    },
    questions: []
};
const scenesDataJSON = JSON.stringify([]);

// ESCAPE HTML FUNCTION (from source)
function escapeHtml(text) {
    return text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
}

// THE FIXED HTML GENERATION SNIPPET
// I am pasting the critical section here to test if it runs without syntax errors and interpolates correctly
const htmlSnippet = `
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

console.log("GENERATION SUCCESSFUL");
console.log("Check below for audio element:");
console.log(htmlSnippet);
