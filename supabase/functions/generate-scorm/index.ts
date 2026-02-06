// SCORM Package Generator Edge Function
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScormRequest {
  title: string;
  scormVersion: "1.2" | "2004";
  completionStatus: "completed" | "passed-failed";
  questions: {
    text: string;
    alternatives: string[];
    correctIndex: number;
  }[];
}

// Generate a valid SCORM identifier (alphanumeric, no spaces)
function generateIdentifier(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50);
  return `quiz_${sanitized}_${Date.now()}`;
}

// Generate imsmanifest.xml for SCORM 1.2
function generateManifest12(title: string, identifier: string): string {
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
  <organizations default="org_${identifier}">
    <organization identifier="org_${identifier}">
      <title>${escapeXml(title)}</title>
      <item identifier="item_${identifier}" identifierref="res_${identifier}">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_${identifier}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="script.js"/>
    </resource>
  </resources>
</manifest>`;
}

// Generate imsmanifest.xml for SCORM 2004
function generateManifest2004(title: string, identifier: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1"
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
  <organizations default="org_${identifier}">
    <organization identifier="org_${identifier}">
      <title>${escapeXml(title)}</title>
      <item identifier="item_${identifier}" identifierref="res_${identifier}">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_${identifier}" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="script.js"/>
    </resource>
  </resources>
</manifest>`;
}

// Generate the quiz HTML
function generateHtml(title: string, questions: ScormRequest["questions"]): string {
  const questionsJson = JSON.stringify(questions);
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .quiz-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    .quiz-title {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 30px;
      text-align: center;
    }
    .question-counter {
      text-align: center;
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .question-text {
      font-size: 18px;
      color: #333;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .alternatives {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .alternative {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .alternative:hover {
      border-color: #2196f3;
      background: #f8faff;
    }
    .alternative.selected {
      border-color: #2196f3;
      background: #e3f2fd;
    }
    .alternative.correct {
      border-color: #4caf50;
      background: #e8f5e9;
    }
    .alternative.incorrect {
      border-color: #f44336;
      background: #ffebee;
    }
    .alternative input {
      margin-right: 12px;
    }
    .alternative label {
      flex: 1;
      cursor: pointer;
    }
    .feedback {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }
    .feedback.correct {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .feedback.incorrect {
      background: #ffebee;
      color: #c62828;
    }
    .button-container {
      margin-top: 24px;
      display: flex;
      justify-content: center;
    }
    .btn {
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #2196f3;
      color: white;
    }
    .btn-primary:hover {
      background: #1976d2;
    }
    .btn-primary:disabled {
      background: #bdbdbd;
      cursor: not-allowed;
    }
    .completion-screen {
      text-align: center;
    }
    .completion-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .completion-title {
      font-size: 24px;
      color: #2e7d32;
      margin-bottom: 12px;
    }
    .completion-text {
      color: #666;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="quiz-container">
    <h1 class="quiz-title">${escapeXml(title)}</h1>
    
    <div id="quiz-content">
      <div class="question-counter" id="counter"></div>
      <div class="question-text" id="question-text"></div>
      <div class="alternatives" id="alternatives"></div>
      <div class="feedback hidden" id="feedback"></div>
      <div class="button-container">
        <button class="btn btn-primary hidden" id="next-btn">Avançar</button>
      </div>
    </div>
    
    <div id="completion-screen" class="completion-screen hidden">
      <div class="completion-icon">🎉</div>
      <div class="completion-title">Parabéns!</div>
      <div class="completion-text">Você completou o quiz com sucesso.</div>
    </div>
  </div>
  
  <script>
    window.quizQuestions = ${questionsJson};
  </script>
  <script src="script.js"></script>
</body>
</html>`;
}

// Generate the quiz JavaScript with SCORM API integration
function generateScript(scormVersion: "1.2" | "2004", completionStatus: "completed" | "passed-failed"): string {
  const is12 = scormVersion === "1.2";
  
  return `/**
 * SCORM Quiz Script
 * Version: ${scormVersion}
 * Completion Status: ${completionStatus}
 */

(function() {
  'use strict';

  // ============================================
  // SCORM API - Robust Implementation
  // ============================================

  var API = null;
  var apiVersion = '${scormVersion}';
  var isFinished = false;
  var isInitialized = false;

  /**
   * Find SCORM API by traversing window hierarchy
   * Tries up to 500 levels (SCORM standard recommendation)
   */
  function findAPI(win) {
    var attempts = 0;
    var maxAttempts = 500;

    while (win && attempts < maxAttempts) {
      attempts++;
      
      // Check for SCORM 1.2 API
      if (win.API) {
        console.log('[SCORM] Found API at level ' + attempts);
        return { api: win.API, version: '1.2' };
      }
      
      // Check for SCORM 2004 API
      if (win.API_1484_11) {
        console.log('[SCORM] Found API_1484_11 at level ' + attempts);
        return { api: win.API_1484_11, version: '2004' };
      }

      // Move up the window hierarchy
      if (win.parent === win) break;
      win = win.parent;
    }

    return null;
  }

  /**
   * Initialize SCORM connection
   */
  function initSCORM() {
    if (isInitialized) {
      console.log('[SCORM] Already initialized');
      return true;
    }

    // Try to find the API starting from current window
    var result = findAPI(window);
    
    // Also try opener if available
    if (!result && window.opener) {
      result = findAPI(window.opener);
    }

    if (!result) {
      console.warn('[SCORM] API not found - running in standalone mode');
      isInitialized = true;
      return false;
    }

    API = result.api;
    apiVersion = result.version;

    try {
      var initResult;
      if (apiVersion === '1.2') {
        initResult = API.LMSInitialize('');
      } else {
        initResult = API.Initialize('');
      }

      if (initResult === 'true' || initResult === true) {
        console.log('[SCORM] Initialized successfully');
        isInitialized = true;
        return true;
      } else {
        var errorCode = getLastError();
        console.error('[SCORM] Initialize failed with error: ' + errorCode);
        return false;
      }
    } catch (e) {
      console.error('[SCORM] Initialize exception:', e);
      return false;
    }
  }

  /**
   * Set a SCORM value
   */
  function setValue(element, value) {
    if (!API) {
      console.log('[SCORM] No API - would set ' + element + ' = ' + value);
      return true;
    }

    try {
      var result;
      if (apiVersion === '1.2') {
        result = API.LMSSetValue(element, value);
      } else {
        result = API.SetValue(element, value);
      }
      console.log('[SCORM] SetValue(' + element + ', ' + value + ') = ' + result);
      return result === 'true' || result === true;
    } catch (e) {
      console.error('[SCORM] SetValue exception:', e);
      return false;
    }
  }

  /**
   * Commit data to LMS
   */
  function commit() {
    if (!API) return true;

    try {
      var result;
      if (apiVersion === '1.2') {
        result = API.LMSCommit('');
      } else {
        result = API.Commit('');
      }
      console.log('[SCORM] Commit = ' + result);
      return result === 'true' || result === true;
    } catch (e) {
      console.error('[SCORM] Commit exception:', e);
      return false;
    }
  }

  /**
   * Finish SCORM session
   */
  function finish() {
    if (isFinished) {
      console.log('[SCORM] Already finished');
      return true;
    }

    if (!API) {
      console.log('[SCORM] No API - finish skipped');
      isFinished = true;
      return true;
    }

    // Always commit before finish
    commit();

    try {
      var result;
      if (apiVersion === '1.2') {
        result = API.LMSFinish('');
      } else {
        result = API.Terminate('');
      }
      console.log('[SCORM] Finish = ' + result);
      isFinished = true;
      return result === 'true' || result === true;
    } catch (e) {
      console.error('[SCORM] Finish exception:', e);
      isFinished = true;
      return false;
    }
  }

  /**
   * Get last error code
   */
  function getLastError() {
    if (!API) return '0';
    try {
      if (apiVersion === '1.2') {
        return API.LMSGetLastError();
      } else {
        return API.GetLastError();
      }
    } catch (e) {
      return '0';
    }
  }

  /**
   * Set completion status based on configuration
   */
  function setCompletionStatus(passed) {
    if (apiVersion === '1.2') {
      // SCORM 1.2
      ${completionStatus === 'completed' 
        ? `setValue('cmi.core.lesson_status', 'completed');` 
        : `setValue('cmi.core.lesson_status', passed ? 'passed' : 'failed');`}
    } else {
      // SCORM 2004
      ${completionStatus === 'completed'
        ? `setValue('cmi.completion_status', 'completed');
      setValue('cmi.success_status', 'passed');`
        : `setValue('cmi.completion_status', 'completed');
      setValue('cmi.success_status', passed ? 'passed' : 'failed');`}
    }
    commit();
  }

  // ============================================
  // Quiz Logic
  // ============================================

  var questions = window.quizQuestions || [];
  var currentQuestion = 0;
  var selectedAnswer = null;
  var hasAnsweredCorrectly = false;

  var counterEl = document.getElementById('counter');
  var questionTextEl = document.getElementById('question-text');
  var alternativesEl = document.getElementById('alternatives');
  var feedbackEl = document.getElementById('feedback');
  var nextBtnEl = document.getElementById('next-btn');
  var quizContentEl = document.getElementById('quiz-content');
  var completionScreenEl = document.getElementById('completion-screen');

  function renderQuestion() {
    if (currentQuestion >= questions.length) {
      showCompletion();
      return;
    }

    var q = questions[currentQuestion];
    counterEl.textContent = 'Pergunta ' + (currentQuestion + 1) + ' de ' + questions.length;
    questionTextEl.textContent = q.text;
    
    alternativesEl.innerHTML = '';
    q.alternatives.forEach(function(alt, index) {
      var div = document.createElement('div');
      div.className = 'alternative';
      div.innerHTML = '<input type="radio" name="answer" id="alt' + index + '" value="' + index + '">' +
                      '<label for="alt' + index + '">' + escapeHtml(alt) + '</label>';
      div.addEventListener('click', function() {
        selectAnswer(index);
      });
      alternativesEl.appendChild(div);
    });

    feedbackEl.className = 'feedback hidden';
    nextBtnEl.className = 'btn btn-primary hidden';
    selectedAnswer = null;
    hasAnsweredCorrectly = false;
  }

  function selectAnswer(index) {
    if (hasAnsweredCorrectly) return;

    selectedAnswer = index;
    var q = questions[currentQuestion];
    var isCorrect = index === q.correctIndex;

    // Update visual selection
    var alts = alternativesEl.querySelectorAll('.alternative');
    alts.forEach(function(alt, i) {
      alt.classList.remove('selected', 'correct', 'incorrect');
      if (i === index) {
        alt.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
    });

    // Show feedback
    feedbackEl.textContent = isCorrect ? 'Correto! 🎉' : 'Incorreto. Tente novamente.';
    feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      hasAnsweredCorrectly = true;
      nextBtnEl.className = 'btn btn-primary';
    }
  }

  function nextQuestion() {
    currentQuestion++;
    renderQuestion();
  }

  function showCompletion() {
    quizContentEl.className = 'hidden';
    completionScreenEl.className = 'completion-screen';
    
    // Set SCORM completion status
    setCompletionStatus(true);
    
    // Finish SCORM session
    setTimeout(function() {
      finish();
    }, 1000);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Initialization
  // ============================================

  nextBtnEl.addEventListener('click', nextQuestion);

  // Initialize SCORM and start quiz
  initSCORM();
  
  // Set initial status
  if (apiVersion === '1.2') {
    setValue('cmi.core.lesson_status', 'incomplete');
  } else {
    setValue('cmi.completion_status', 'incomplete');
  }
  commit();

  // Render first question
  renderQuestion();

  // Handle page unload
  window.addEventListener('beforeunload', function() {
    finish();
  });

})();
`;
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: ScormRequest = await req.json();
    console.log("[generate-scorm] Received request:", JSON.stringify(payload, null, 2));

    // Validate payload
    if (!payload.title || !payload.questions || payload.questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: title and questions are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each question
    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i];
      if (!q.text || !q.alternatives || q.alternatives.length < 2) {
        return new Response(
          JSON.stringify({ error: `Question ${i + 1} is invalid` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (q.correctIndex < 0 || q.correctIndex >= q.alternatives.length) {
        return new Response(
          JSON.stringify({ error: `Question ${i + 1} has invalid correct answer` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const identifier = generateIdentifier(payload.title);
    console.log("[generate-scorm] Generated identifier:", identifier);

    // Generate files
    const manifest = payload.scormVersion === "1.2"
      ? generateManifest12(payload.title, identifier)
      : generateManifest2004(payload.title, identifier);
    
    const html = generateHtml(payload.title, payload.questions);
    const script = generateScript(payload.scormVersion, payload.completionStatus);

    console.log("[generate-scorm] Files generated, creating ZIP...");

    // Create ZIP
    const zip = new JSZip();
    zip.addFile("imsmanifest.xml", new TextEncoder().encode(manifest));
    zip.addFile("index.html", new TextEncoder().encode(html));
    zip.addFile("script.js", new TextEncoder().encode(script));

    const zipData = await zip.generateAsync({ type: "uint8array" });
    console.log("[generate-scorm] ZIP created, size:", zipData.length);

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...zipData));

    return new Response(
      JSON.stringify({ zip: base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-scorm] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
