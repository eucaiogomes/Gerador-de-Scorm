import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateAudioRequest {
  script: string;
  voice?: string;
}

// Portuguese voices available in Edge TTS
const PORTUGUESE_VOICES = {
  female: "pt-BR-FranciscaNeural",  // Female, natural
  male: "pt-BR-AntonioNeural",      // Male, natural
  female2: "pt-BR-ThalitaNeural",   // Female alternative
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, voice = "female" }: GenerateAudioRequest = await req.json();

    if (!script || typeof script !== "string") {
      return new Response(
        JSON.stringify({ error: "Script is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // 1. Try ElevenLabs API (Priority with redundancy)
    const ELEVEN_LABS_KEYS = [
      Deno.env.get("ELEVEN_LABS_API_KEY"),
      Deno.env.get("ELEVENLABS_API_KEY"), // Alternative name
      Deno.env.get("ELEVEN_LABS_API_KEY_BACKUP")
    ].filter(Boolean) as string[];

    if (ELEVEN_LABS_KEYS.length > 0) {
      console.log(`Attempting generation with ${ELEVEN_LABS_KEYS.length} ElevenLabs keys...`);
      const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

      for (const [index, apiKey] of ELEVEN_LABS_KEYS.entries()) {
        try {
          console.log(`Using ElevenLabs Key #${index + 1}`);
          const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
              method: "POST",
              headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": apiKey,
              },
              body: JSON.stringify({
                text: script,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                },
              }),
            }
          );

          if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const base64Audio = btoa(
              new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );

            console.log(`SUCCESS: Narration generated using ElevenLabs Key #${index + 1}`);

            return new Response(
              JSON.stringify({
                narration: `data:audio/mpeg;base64,${base64Audio}`,
                duration: Math.ceil((audioBuffer.byteLength * 8) / 128000),
                service: "elevenlabs"
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            const errorText = await response.text();
            console.error(`ElevenLabs Key #${index + 1} failed with status ${response.status}:`, errorText);
            
            if (response.status === 401) {
              console.error("DEBUG: Invalid ElevenLabs API Key. Please check your Supabase secrets.");
            } else if (response.status === 429 || response.status === 403) {
              console.error("DEBUG: ElevenLabs quota exceeded or tier limit reached. Falling back...");
            }
          }
        } catch (e) {
          console.error(`Error with ElevenLabs Key #${index + 1}:`, e);
        }
      }
      console.warn("All ElevenLabs keys failed. Falling back to free TTS...");
    }



    // 2. Fallback to Free TTS (Edge TTS via public API)
    console.log(`Fallback: Generating narration using Edge TTS (Microsoft) for script length: ${script.length}`);

    const voiceCode = voice === "male" ? "Antonio" : "Francisca";

    try {
      // Using a reliable public Edge TTS proxy/API
      // This is the implementation mentioned in the README as "100% Free"
      const edgeTtsUrl = `https://edge-tts.vercel.app/api/tts?text=${encodeURIComponent(script)}&voice=pt-BR-${voiceCode}Neural`;

      const fallbackResponse = await fetch(edgeTtsUrl);

      if (fallbackResponse.ok) {
        const audioBuffer = await fallbackResponse.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        console.log("SUCCESS: Narration generated using Edge TTS (Microsoft)");

        return new Response(
          JSON.stringify({
            narration: `data:audio/mpeg;base64,${base64Audio}`,
            duration: Math.ceil((audioBuffer.byteLength * 8) / 48000), // Approx
            service: "edge-tts-free"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.warn("Edge TTS failed, trying StreamElements...");
      }
    } catch (e) {
      console.error("Edge TTS error:", e);
    }

    // 3. Fallback to StreamElements
    try {
      const voiceName = voice === "male" ? "Ricardo" : "Vitoria";
      const streamElementsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceName}&text=${encodeURIComponent(script)}`;

      const seResponse = await fetch(streamElementsUrl);

      if (seResponse.ok) {
        const audioBuffer = await seResponse.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        console.log("Narration generated using StreamElements (fallback)");

        return new Response(
          JSON.stringify({
            narration: `data:audio/mpeg;base64,${base64Audio}`,
            duration: Math.ceil((audioBuffer.byteLength * 8) / 48000),
            service: "streamelements-free"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.error("StreamElements fallback error:", e);
    }

    // 3. Last Resort: Google Translate TTS (Client-hack style)
    // Often blocked, but worth a try if valid user-agent.
    try {
      console.log("Attempting Google TTS as last resort...");
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(script)}`;
      const googleResponse = await fetch(googleTtsUrl);

      if (googleResponse.ok) {
        const audioBuffer = await googleResponse.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        return new Response(
          JSON.stringify({
            narration: `data:audio/mpeg;base64,${base64Audio}`,
            duration: Math.ceil((audioBuffer.byteLength * 8) / 48000), // Approx 48kbps for TTS
            service: "google-free"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.error("Google TTS error:", e);
    }

    // If all fail
    return new Response(
      JSON.stringify({ error: "All TTS services failed. Check ElevenLabs quota or script length." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-video-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

