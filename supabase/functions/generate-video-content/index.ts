import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VideoScene {
  imagePrompt: string;
  narration: string;
  duration: number;
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
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const POLLINATIONS_API_KEY = Deno.env.get("POLLINATIONS_API_KEY");
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");

    if (!GROQ_API_KEY) {
      console.error("No AI API KEY configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating video content for topic: ${topic}`);

    const contentPrompt = `Você é um roteirista de vídeos educativos.

Crie um roteiro de vídeo de 1 minuto sobre: "${topic}"

Responda APENAS com um JSON válido (sem markdown) no formato:
{
  "title": "Título do Vídeo",
  "scenes": [
    {
      "imagePrompt": "Descrição detalhada em inglês para gerar uma imagem ilustrativa da cena",
      "narration": "Texto de narração para esta cena (10-15 segundos de fala)",
      "duration": 12
    }
  ],
  "totalDuration": 60
}

Regras:
- Crie exatamente 5 cenas
- Cada cena deve ter ~12 segundos de duração
- A narração deve ser clara, envolvente e educativa
- Os prompts de imagem devem ser descritivos e em inglês
- Total de 60 segundos`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: contentPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate video content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const contentRaw = data.choices?.[0]?.message?.content;

    if (!contentRaw) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON
    let content: VideoContent;
    try {
      let jsonStr = contentRaw.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      content = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse content JSON:", parseError, contentRaw);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate images for each scene
    console.log("Generating images for scenes...");
    const scenesWithImages = await Promise.all(
      content.scenes.map(async (scene, index) => {
        try {
          console.log(`Generating image ${index + 1}: ${scene.imagePrompt.substring(0, 50)}...`);

          let base64Image = null;

          // 1. Try Pollinations (Primary - with Key)
          if (!base64Image) {
            console.log(`Using Pollinations (Primary) for scene ${index + 1}...`);
            let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
              `Cinematic 16:9 video frame: ${scene.imagePrompt}. Ultra high quality, professional, detailed, photorealistic.`
            )}.jpg?width=1280&height=720&model=turbo&seed=${Date.now() + index + 1000}&nologo=true`;

            if (POLLINATIONS_API_KEY) {
              imageUrl += `&key=${POLLINATIONS_API_KEY}`;
            }

            const imageResponse = await fetch(imageUrl);

            if (imageResponse.ok) {
              const imageBlob = await imageResponse.arrayBuffer();
              base64Image = btoa(
                new Uint8Array(imageBlob).reduce((data, byte) => data + String.fromCharCode(byte), "")
              );
            }
          }

          // 2. Fallback to Pexels API
          if (!base64Image && PEXELS_API_KEY) {
            try {
              console.log(`Using Pexels API for video scene ${index + 1}...`);
              const pexelsQuery = scene.imagePrompt.split(" ").slice(0, 5).join(" ");
              const randomPage = Math.floor(Math.random() * 10) + 1;
              const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(pexelsQuery)}&per_page=5&page=${randomPage}&orientation=landscape`,
                {
                  headers: { Authorization: PEXELS_API_KEY },
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.photos && data.photos.length > 0) {
                  const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                  const imageUrl = randomPhoto.src.large;
                  const imageResponse = await fetch(imageUrl);
                  const imageBlob = await imageResponse.arrayBuffer();
                  base64Image = btoa(
                    new Uint8Array(imageBlob).reduce((data, byte) => data + String.fromCharCode(byte), "")
                  );
                  console.log(`Video scene ${index + 1} generated with Pexels API`);
                }
              } else {
                console.warn(`Pexels API failed for scene ${index + 1}:`, response.status);
              }
            } catch (peErr) {
              console.warn(`Pexels API error for scene ${index + 1}:`, peErr);
            }
          }

          // 4. Final fallback to Unsplash
          if (!base64Image && UNSPLASH_ACCESS_KEY) {
            try {
              console.log(`Using Unsplash API for video scene ${index + 1}...`);
              const unsplashQuery = scene.imagePrompt.split(" ").slice(0, 3).join(",");
              const uniqueSeed = `video-${index}-${Date.now()}`;
              const response = await fetch(
                `https://api.unsplash.com/photos/random?query=${encodeURIComponent(unsplashQuery)}&orientation=landscape&seed=${uniqueSeed}&client_id=${UNSPLASH_ACCESS_KEY}`,
                { headers: { "Accept-Version": "v1" } }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.urls && data.urls.regular) {
                  const imageResponse = await fetch(data.urls.regular);
                  const imageBlob = await imageResponse.arrayBuffer();
                  base64Image = btoa(
                    new Uint8Array(imageBlob).reduce((data, byte) => data + String.fromCharCode(byte), "")
                  );
                  console.log(`Video scene ${index + 1} generated with Unsplash API`);
                }
              } else {
                console.warn(`Unsplash API failed for scene ${index + 1}:`, response.status);
              }
            } catch (unErr) {
              console.warn(`Unsplash API error for scene ${index + 1}:`, unErr);
            }
          }

          if (base64Image) {
            console.log(`Image ${index + 1} generated successfully`);
            return { ...scene, imageBase64: `data:image/jpeg;base64,${base64Image}` };
          }

          return { ...scene, imageBase64: null };
        } catch (err) {
          console.error(`Error generating image ${index + 1}:`, err);
          return { ...scene, imageBase64: null };
        }
      })
    );

    content.scenes = scenesWithImages;

    console.log("Video content generation complete");

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-video-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
