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
  imageBase64?: string;
}

interface VideoScene {
  imagePrompt: string;
  narration: string;
  duration: number;
  imageBase64?: string | null;
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
  };
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
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add GROQ_API_KEY to environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating unified course for topic: ${topic}`);

    // Step 1: Generate course structure (slides, video scenes, quiz)
    const structurePrompt = `Você é um especialista em criação de cursos online.

Crie um curso completo sobre: "${topic}"

O curso DEVE ter:
1. 4 slides de conteúdo teórico
2. 5 cenas para um vídeo resumo de 1 minuto
3. 5 perguntas de quiz

Responda APENAS com um JSON válido (sem markdown) no formato:
{
  "title": "Título do Curso",
  "slides": [
    {
      "title": "Título do Slide",
      "content": "Conteúdo educativo detalhado (3-4 parágrafos)",
      "imagePrompt": "Descrição em inglês para gerar imagem ilustrativa"
    }
  ],
  "video": {
    "title": "Título do Vídeo Resumo",
    "scenes": [
      {
        "imagePrompt": "Descrição em inglês para imagem da cena",
        "narration": "Texto de narração (10-12 segundos de fala)",
        "duration": 12
      }
    ],
    "totalDuration": 60
  },
  "questions": [
    {
      "text": "Pergunta sobre o conteúdo?",
      "alternatives": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctIndex": 0
    }
  ]
}

Regras:
- Slides devem ser educativos e progressivos
- Cada cena do vídeo tem ~12 segundos
- Perguntas devem testar compreensão do conteúdo
- Prompts de imagem em inglês, descritivos e educacionais`;

    const structureResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você responde APENAS com JSON válido, sem markdown, sem explicações, sem ```json. Apenas o objeto JSON puro."
          },
          { role: "user", content: structurePrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!structureResponse.ok) {
      if (structureResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to generate course structure");
    }

    const structureData = await structureResponse.json();
    const rawContent = structureData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("AI returned empty response");
    }

    // Parse JSON
    let course: UnifiedCourse;
    try {
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      course = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse course JSON:", parseError, rawContent);
      throw new Error("Failed to parse AI response");
    }

    console.log("Course structure generated, generating images...");

    // Step 2: Generate images for slides
    const slideImagePromises = course.slides.map(async (slide, index) => {
      try {
        console.log(`Generating slide image ${index + 1}...`);

        let base64Image = null;

        // 1. Try Pollinations (Primary - with Key)
        if (!base64Image) {
          try {
            console.log(`Using Pollinations (Primary) for slide image ${index + 1}...`);
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
              if (base64Image && base64Image.length > 100) {
                console.log(`✅ Pollinations image ${index + 1} generated - size: ${base64Image.length}`);
              } else {
                console.warn(`⚠️ Pollinations returned empty/small image for ${index + 1}`);
                base64Image = null;
              }
            } else {
              console.warn(`❌ Pollinations failed for slide ${index + 1}: ${imageResponse.status}`);
            }
          } catch (pollErr: any) {
            console.warn(`❌ Pollinations error for slide ${index + 1}:`, pollErr?.message || pollErr);
          }
        }

        // 2. Fallback to Pexels API
        if (!base64Image && PEXELS_API_KEY) {
          try {
            console.log(`Using Pexels API for slide image ${index + 1}...`);
            const pexelsQuery = slide.imagePrompt.split(" ").slice(0, 5).join(" "); // Simple keyword usage
            const randomPage = Math.floor(Math.random() * 10) + 1; // Random page 1-10
            const response = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(pexelsQuery)}&per_page=5&page=${randomPage}&orientation=landscape`,
              {
                headers: { Authorization: PEXELS_API_KEY },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.photos && data.photos.length > 0) {
                // Randomly select from available photos for variety
                const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                const imageUrl = randomPhoto.src.large;
                const imageResponse = await fetch(imageUrl);
                const imageBlob = await imageResponse.arrayBuffer();
                base64Image = btoa(
                  new Uint8Array(imageBlob).reduce((data, byte) => data + String.fromCharCode(byte), "")
                );
                console.log(`Image ${index + 1} generated with Pexels API`);
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
            console.log(`Using Unsplash API for slide image ${index + 1}...`);
            const unsplashQuery = slide.imagePrompt?.split(" ").slice(0, 3).join(",") || "education";
            const uniqueSeed = `slide-${index}-${Date.now()}`; // Unique seed for variety
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
                console.log(`Image ${index + 1} generated with Unsplash API`);
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
        console.error(`Error generating slide image ${index + 1}:`, err);
        return slide;
      }
    });

    // Step 3: Generate images for video scenes
    const videoImagePromises = course.video.scenes.map(async (scene, index) => {
      try {
        console.log(`Generating video scene image ${index + 1}...`);

        let base64Image = null;

        // 1. Try Pollinations (Primary - with Key)
        if (!base64Image) {
          console.log(`Using Pollinations (Primary) for video image ${index + 1}...`);
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
            console.log(`Using Pexels API for video image ${index + 1}...`);
            const pexelsQuery = scene.imagePrompt.split(" ").slice(0, 5).join(" ");
            const randomPage = Math.floor(Math.random() * 10) + 1; // Random page 1-10
            const response = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(pexelsQuery)}&per_page=5&page=${randomPage}&orientation=landscape`,
              {
                headers: { Authorization: PEXELS_API_KEY },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.photos && data.photos.length > 0) {
                // Randomly select from available photos for variety
                const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                const imageUrl = randomPhoto.src.large;
                const imageResponse = await fetch(imageUrl);
                const imageBlob = await imageResponse.arrayBuffer();
                base64Image = btoa(
                  new Uint8Array(imageBlob).reduce((data, byte) => data + String.fromCharCode(byte), "")
                );
                console.log(`Video image ${index + 1} generated with Pexels API`);
              }
            } else {
              console.warn(`Pexels API failed for scene ${index + 1}:`, response.status);
            }
          } catch (peErr) {
            console.warn(`Pexels API error for video scene ${index + 1}:`, peErr);
          }
        }

        // 4. Final fallback to Unsplash
        if (!base64Image && UNSPLASH_ACCESS_KEY) {
          try {
            console.log(`Using Unsplash API for video image ${index + 1}...`);
            const unsplashQuery = scene.imagePrompt.split(" ").slice(0, 3).join(",");
            const uniqueSeed = `video-${index}-${Date.now()}`; // Unique seed for variety
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
                console.log(`Video image ${index + 1} generated with Unsplash API`);
              }
            } else {
              console.warn(`Unsplash API failed for scene ${index + 1}:`, response.status);
            }
          } catch (unErr) {
            console.warn(`Unsplash API error for video scene ${index + 1}:`, unErr);
          }
        }

        if (base64Image) {
          console.log(`Image ${index + 1} generated successfully`);
          return { ...scene, imageBase64: `data:image/jpeg;base64,${base64Image}` };
        }

        return { ...scene, imageBase64: null };
      } catch (err) {
        console.error(`Error generating video scene image ${index + 1}:`, err);
        return { ...scene, imageBase64: null };
      }
    });

    // Wait for all images
    const [slidesWithImages, scenesWithImages] = await Promise.all([
      Promise.all(slideImagePromises),
      Promise.all(videoImagePromises),
    ]);

    course.slides = slidesWithImages;
    course.video.scenes = scenesWithImages;

    console.log("Unified course generation complete");

    return new Response(
      JSON.stringify({ course }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-unified-course:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
