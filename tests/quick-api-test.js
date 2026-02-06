// 🧪 Simple Test - Check API Response Format
const SUPABASE_URL = "https://otbrltaasqdownnpxnlv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YnJsdGFhc3Fkb3dubnB4bmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTU1MDIsImV4cCI6MjA1Mjk5MTUwMn0.2R0FZC9Qsqsu4wGLEhgBJDSl0VrbGZWZC8JnJ8DXDPQ";

(async () => {
    console.log("Testing API response...\n");

    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-unified-course`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ topic: "Test Topic" })
        }
    );

    const data = await response.json();
    console.log("Response structure:");
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
})();
