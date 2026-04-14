import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const parseVoiceCommand = async (command: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    You are the brain of "Visionary Voice", an assistive app for the visually impaired.
    The user said: "${command}"
    
    Interpret this command and return a JSON object with the following structure:
    {
      "action": "NAVIGATE" | "LOCATION" | "LOGIN" | "SIGNUP" | "UNKNOWN",
      "params": object,
      "response": "A friendly voice response to tell the user what you are doing"
    }
    
    Examples:
    - "Where am I?" -> { "action": "LOCATION", "params": {}, "response": "Checking your current location now." }
    - "Take me to login" -> { "action": "LOGIN", "params": {}, "response": "Opening the login screen." }
    - "Go to the park" -> { "action": "NAVIGATE", "params": { "destination": "park" }, "response": "Starting navigation to the park." }
    
    Only return the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean up potential markdown formatting
    const jsonStr = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { action: "UNKNOWN", params: {}, response: "I'm sorry, I didn't catch that. Could you repeat?" };
  }
};
