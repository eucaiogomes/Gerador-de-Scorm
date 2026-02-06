// 🧪 Simple Debug Test - Check if APIs keys are available in Supabase
const SUPABASE_URL = "https://otbrltaasqdownnpxnlv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YnJsdGFhc3Fkb3dubnB4bmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTU1MDIsImV4cCI6MjA1Mjk5MTUwMn0.2R0FZC9Qsqsu4wGLEhgBJDSl0VrbGZWZC8JnJ8DXDPQ";

console.log("🔍 Checking API Keys in Supabase Environment...\n");

(async () => {
    try {
        // Create a simple edge function call that logs environment variables
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/generate-unified-course`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ topic: "Quick Test" })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.log("Response Status:", response.status);
            console.log("Error:", error.substring(0, 500));
        } else {
            const data = await response.json();
            console.log("✅ Function executed successfully");
            console.log("Course title:", data.course?.title);
            console.log("Slides generated:", data.course?.slides?.length);

            // Check if any slide has images
            const slidesWithImages = data.course?.slides?.filter(s => s.imageBase64)?.length || 0;
            console.log(`Images in slides: ${slidesWithImages}/${data.course?.slides?.length || 0}`);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
})();
