import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CourseSlide {
  title: string;
  content: string;
  imagePrompt?: string;
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

    console.log(`Generating course for topic: ${topic}`);

    // Step 1: Generate course content (slides + questions)
    const coursePrompt = `Você é um especialista em criação de cursos educacionais.

Crie um curso completo sobre o tema: "${topic}"

Responda APENAS com um JSON válido (sem markdown, sem explicações) no seguinte formato:
{
  "title": "Título do Curso",
  "slides": [
    {
      "title": "Título do Slide",
      "content": "Conteúdo explicativo do slide (2-3 parágrafos)",
      "imagePrompt": "Descrição em inglês para gerar uma imagem relacionada",
      "videoUrl": "URL de um vídeo do YouTube relacionado (opcional, pode ser null)"
    }
  ],
  "questions": [
    {
      "text": "Pergunta sobre o conteúdo",
      "alternatives": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctIndex": 0
    }
  ]
}

Regras:
- Crie exatamente 4 slides com conteúdo educativo
- Crie exatamente 3 perguntas de múltipla escolha
- O conteúdo deve ser informativo e bem estruturado
- As imagens devem ser descritas em inglês de forma clara
- Os vídeos do YouTube devem ser reais e relevantes (ou null se não souber)
- As perguntas devem testar a compreensão do conteúdo`;

    const courseResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: coursePrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!courseResponse.ok) {
      if (courseResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (courseResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await courseResponse.text();
      console.error("AI gateway error:", courseResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate course content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const courseData = await courseResponse.json();
    const courseContentRaw = courseData.choices?.[0]?.message?.content;

    if (!courseContentRaw) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Raw course content:", courseContentRaw);

    // Parse the JSON from the response
    let course: GeneratedCourse;
    try {
      // Remove markdown code blocks if present
      let jsonStr = courseContentRaw.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      course = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse course JSON:", parseError, courseContentRaw);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Generate images for each slide
    console.log("Generating images for slides...");
    const slidesWithImages = await Promise.all(
      course.slides.map(async (slide, index) => {
        if (!slide.imagePrompt) {
          return slide;
        }

        try {
          console.log(`Generating image ${index + 1}: ${slide.imagePrompt}`);

          let base64Image = null;

          // 1. Try Pollinations (Primary - with Key)
          if (!base64Image) {
            console.log(`Using Pollinations (Primary) for slide ${index + 1}...`);
            let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
              `Professional educational illustration: ${slide.imagePrompt}. Clean, modern, suitable for e-learning. High quality, detailed.`
            )}.jpg?width=1280&height=720&model=turbo&seed=${Date.now() + index}&nologo=true`;

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
              console.log(`Using Pexels API for slide ${index + 1}...`);
              const pexelsQuery = slide.imagePrompt.split(" ").slice(0, 5).join(" ");
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
                  console.log(`Slide ${index + 1} generated with Pexels API`);
                }
              } else {
                console.warn(`Pexels API failed for slide ${index + 1}:`, response.status);
              }
            } catch (peErr) {
              console.warn(`Pexels API error for slide ${index + 1}:`, peErr);
            }
          }

          // 4. Final fallback to Unsplash
          if (!base64Image && UNSPLASH_ACCESS_KEY) {
            try {
              console.log(`Using Unsplash API for slide ${index + 1}...`);
              const unsplashQuery = slide.imagePrompt?.split(" ").slice(0, 3).join(",") || "education";
              const uniqueSeed = `slide-${index}-${Date.now()}`;
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
                  console.log(`Slide ${index + 1} generated with Unsplash API`);
                }
              } else {
                console.warn(`Unsplash API failed for slide ${index + 1}:`, response.status);
              }
            } catch (unErr) {
              console.warn(`Unsplash API error for slide ${index + 1}:`, unErr);
            }
          }

          if (base64Image) {
            return { ...slide, imageBase64: `data:image/jpeg;base64,${base64Image}` };
          }

          return slide;
        } catch (err) {
          console.error(`Error generating image ${index + 1}:`, err);
          return slide;
        }
      })
    );

    course.slides = slidesWithImages;

    console.log("Course generation complete");

    return new Response(
      JSON.stringify({ course }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-course-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
