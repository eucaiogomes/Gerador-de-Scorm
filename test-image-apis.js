// Test script to validate all image generation APIs
const POLLINATIONS_API_KEY = "pk_PJXwjWL1ubkKohKh";
const GOOGLE_API_KEY = "AIzaSyCJ-RQEQ3Mzuh1qDXwjTNhY6gF8PpqvO9w";
const PEXELS_API_KEY = "j0vW8IEKq35Bx6Mmvj6H9BmtTbbyYW8BFKUmL8y86itwvwGp1SkMZSaU";
const UNSPLASH_ACCESS_KEY = "CTCztPlpON-V0ioo8hQT3wFVlVD3YNbmkNGLg2KzcnE";

console.log("🧪 Testing Image Generation APIs...\n");

// Test 1: Pollinations
async function testPollinations() {
    console.log("1️⃣ Testing Pollinations...");
    try {
        const prompt = "Professional educational illustration of mathematics";
        let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}.jpg?width=800&height=600&model=turbo&nologo=true`;

        if (POLLINATIONS_API_KEY) {
            imageUrl += `&key=${POLLINATIONS_API_KEY}`;
        }

        const response = await fetch(imageUrl);

        if (response.ok) {
            const blob = await response.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
            console.log(`✅ Pollinations OK - Image size: ${blob.byteLength} bytes`);
            console.log(`   Preview: data:image/jpeg;base64,${base64.substring(0, 50)}...\n`);
            return true;
        } else {
            console.log(`❌ Pollinations failed: ${response.status} ${response.statusText}\n`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Pollinations error: ${error.message}\n`);
        return false;
    }
}

// Test 2: Google Imagen
async function testGoogle() {
    console.log("2️⃣ Testing Google Imagen...");
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "Professional educational illustration of science",
                    numberOfImages: 1,
                    aspectRatio: "4:3"
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.images && data.images[0] && data.images[0].image64) {
                const base64 = data.images[0].image64;
                console.log(`✅ Google OK - Base64 length: ${base64.length}`);
                console.log(`   Preview: data:image/jpeg;base64,${base64.substring(0, 50)}...\n`);
                return true;
            }
        }

        const errorText = await response.text();
        console.log(`❌ Google failed: ${response.status} - ${errorText}\n`);
        return false;
    } catch (error) {
        console.log(`❌ Google error: ${error.message}\n`);
        return false;
    }
}

// Test 3: Pexels
async function testPexels() {
    console.log("3️⃣ Testing Pexels...");
    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=education&per_page=1&orientation=landscape`,
            { headers: { Authorization: PEXELS_API_KEY } }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.photos && data.photos.length > 0) {
                const imageUrl = data.photos[0].src.large;
                console.log(`✅ Pexels OK - Found image: ${imageUrl.substring(0, 60)}...\n`);
                return true;
            }
        }

        console.log(`❌ Pexels failed: ${response.status}\n`);
        return false;
    } catch (error) {
        console.log(`❌ Pexels error: ${error.message}\n`);
        return false;
    }
}

// Test 4: Unsplash
async function testUnsplash() {
    console.log("4️⃣ Testing Unsplash...");
    try {
        const response = await fetch(
            `https://api.unsplash.com/photos/random?query=education&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`,
            { headers: { "Accept-Version": "v1" } }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.urls && data.urls.regular) {
                console.log(`✅ Unsplash OK - Found image: ${data.urls.regular.substring(0, 60)}...\n`);
                return true;
            }
        }

        const errorText = await response.text();
        console.log(`❌ Unsplash failed: ${response.status} - ${errorText}\n`);
        return false;
    } catch (error) {
        console.log(`❌ Unsplash error: ${error.message}\n`);
        return false;
    }
}

// Run all tests
(async () => {
    const results = {
        pollinations: await testPollinations(),
        google: await testGoogle(),
        pexels: await testPexels(),
        unsplash: await testUnsplash()
    };

    console.log("📊 SUMMARY:");
    console.log(`Pollinations: ${results.pollinations ? "✅ Working" : "❌ Failed"}`);
    console.log(`Google:       ${results.google ? "✅ Working" : "❌ Failed"}`);
    console.log(`Pexels:       ${results.pexels ? "✅ Working" : "❌ Failed"}`);
    console.log(`Unsplash:     ${results.unsplash ? "✅ Working" : "❌ Failed"}`);

    const workingAPIs = Object.values(results).filter(Boolean).length;
    console.log(`\n${workingAPIs}/4 APIs working`);
})();
