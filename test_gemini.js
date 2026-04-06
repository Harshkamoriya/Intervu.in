require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        // Can we pass TaskType or outputDimensionality here?
        const result = await model.embedContent({
            content: { parts: [{ text: "Hello" }], role: "user" },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: 768
        });
        console.log("Success with outputDimensionality:", result.embedding.values.length);
    } catch(e) {
        console.log("Error reducing dimension:", e.message);
    }
}
run();
