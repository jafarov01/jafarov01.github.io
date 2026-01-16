import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { AIAction } from "./aiActions";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key_for_build");
const model = genAI.getGenerativeModel({
	model: "gemini-2.0-flash-lite-preview-02-05",
	systemInstruction: `You are the MEX OS Personal Coach. Your role is to help the user manage their life, career, and studies.
	
	You have access to the following capabilities (Tools) via JSON Action Blocks:
	1. SUGGEST_CAMPAIGN: Propose a new strategic campaign (e.g. "Winter Grind", "Exam Prep").
	2. SUGGEST_EXAM: Propose adding a new exam/course to their academic plan.
	3. SUGGEST_SKILL: Propose a new skill to learn.
	4. SUGGEST_HABIT: Propose a new daily or weekly habit.

	When you want to perform an action, you MUST output a JSON block at the END of your message in this exact format:
	
	\`\`\`json
	{
		"type": "SUGGEST_CAMPAIGN",
		"reason": "You need to focus on these exams before the deadline.",
		"data": {
			"name": "Winter Exam Session",
			"focus_areas": ["Math", "Physics"],
			"duration_weeks": 4
		}
	}
	\`\`\`

	Rules:
	- Be concise, professional, but friendly ("Coach" persona).
	- Use "Cyberpunk/Professional" tone suitable for MEX OS.
	- ONLY output the JSON block if you are explicitly suggesting a concrete action for the user to commit to their database.
	- Do NOT use JSON for general advice, only for actionable database commits.
	- Do NOT hallucinate data.
	`
});

export interface ChatMessage {
	role: 'user' | 'model';
	text: string;
	timestamp: number;
}

export interface AIResponse {
	text: string;
	action?: AIAction;
}

export async function sendMessage(history: ChatMessage[], newMessage: string): Promise<AIResponse> {
	if (!API_KEY) {
		return { text: "⚠️ API Key missing. Please set VITE_GEMINI_API_KEY in your .env file." };
	}

	try {
		// Convert history to Gemini format
		const chat = model.startChat({
			history: history.map(msg => ({
				role: msg.role === 'user' ? 'user' : 'model',
				parts: [{ text: msg.text }],
			})),
			generationConfig: {
				maxOutputTokens: 500,
				temperature: 0.7,
			},
			safetySettings: [
				{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
				{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
			]
		});

		const result = await chat.sendMessage(newMessage);
		const responseText = result.response.text();

		// Parse for Action Block
		const actionBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
		const match = responseText.match(actionBlockRegex);

		let finalAction: AIAction | undefined;
		let finalText = responseText;

		if (match && match[1]) {
			try {
				const jsonStr = match[1];
				finalAction = JSON.parse(jsonStr) as AIAction;
				// Remove the JSON block from the display text to keep UI clean
				finalText = responseText.replace(match[0], '').trim();
			} catch (e) {
				console.error("Failed to parse AI action JSON", e);
			}
		}

		return {
			text: finalText,
			action: finalAction
		};

	} catch (error) {
		console.error("Gemini API Error:", error);
		return { text: "Connection error. I'm having trouble reaching the neural net." };
	}
}
