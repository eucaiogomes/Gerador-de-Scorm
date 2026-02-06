
// Simple test runner for Node.js

// Mock interfaces
interface UnifiedCourse {
    title: string;
    slides: any[];
    video: {
        title: string;
        scenes: any[];
        totalDuration: number;
        audioBase64?: string;
    };
    questions: any[];
}

// Function with the NEW logic to test
function generateManifest(title: string, identifier: string, version: "1.2" | "2004", course: UnifiedCourse): string {
    const escapedTitle = title.replace(/[<>&'"]/g, "");

    // Generate resource file list
    let resourceFiles = `
      <file href="index.html"/>
      <file href="script.js"/>
      <file href="styles.css"/>`;

    // Add slide images
    course.slides.forEach((slide, index) => {
        if (slide.imageBase64) {
            resourceFiles += `\n      <file href="images/slide_${index + 1}.png"/>`;
        }
    });

    // Add video scene images
    course.video.scenes.forEach((scene, index) => {
        if (scene.imageBase64) {
            resourceFiles += `\n      <file href="video/scene_${index + 1}.png"/>`;
        }
    });

    // Add video audio
    if (course.video.audioBase64) {
        resourceFiles += `\n      <file href="video/narration.mp3"/>`;
    }

    return `<manifest>...<resources><resource>${resourceFiles}</resource></resources></manifest>`;
}

(function runTest() {
    console.log("Running Manifest Test...");
    const mockCourse: UnifiedCourse = {
        title: "Test Course",
        slides: [
            { title: "S1", content: "C1", imageBase64: "data:image/png;base64,..." },
            { title: "S2", content: "C2" } // No image
        ],
        video: {
            title: "Test Video",
            scenes: [
                { narration: "N1", duration: 5, imageBase64: "data:image/png;base64,..." },
                { narration: "N2", duration: 5 } // No image
            ],
            totalDuration: 10,
            audioBase64: "data:audio/mp3;base64,..."
        },
        questions: []
    };

    try {
        const manifest = generateManifest("Test Course", "test_id", "1.2", mockCourse);

        console.log("\nGenerated Resource List (Partial):");
        const resourceSection = manifest.match(/<resources>([\s\S]*?)<\/resources>/)?.[1] || "";
        console.log(resourceSection);

        // Assertions
        const hasSlideImg = manifest.includes('href="images/slide_1.png"');
        const hasVideoImg = manifest.includes('href="video/scene_1.png"');
        const hasAudio = manifest.includes('href="video/narration.mp3"');

        if (!hasSlideImg || !hasVideoImg || !hasAudio) {
            throw new Error("Missing resources in manifest!");
        } else {
            console.log("\nSUCCESS: All resources listed properly.");
        }
    } catch (e: any) {
        console.error("\nTEST FAILED:", e.message);
        process.exit(1);
    }
})();
