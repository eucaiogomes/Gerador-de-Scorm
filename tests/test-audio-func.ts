
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env loading
try {
    const envConfig = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Error loading .env manually:", e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE env vars. Keys found:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Testing generate-video-audio function...");

const { data, error } = await supabase.functions.invoke("generate-video-audio", {
    body: { script: "Olá, este é um teste de geração de áudio para verificar se o sistema está funcionando corretamente." },
});

if (error) {
    console.error("Function Error:", error);
} else {
    console.log("Success!");
    console.log("Service used:", data.service);
    console.log("Duration:", data.duration);
    console.log("Narration present:", !!data.narration);
    if (data.narration) {
        console.log("Narration start:", data.narration.substring(0, 50));
        console.log("Narration length:", data.narration.length);
    }
}
