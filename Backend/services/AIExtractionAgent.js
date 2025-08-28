const axios = require('axios');

const systemPrompt = `You are an expert order-taking assistant for a group chat application. Your task is to extract food and drink orders from user messages.

Rules:
- Analyze the message to identify food/drink items, quantities, and any specific options/preferences
- If quantity is not mentioned, assume it is 1
- Handle informal language, typos, and Hinglish (e.g., "mera ek plate momos," "2 chai," "sandwich karde", "pizza mangwao")
- Extract specific options like size (small, medium, large), spice level, customizations
- If the message is NOT an order (e.g., "hello," "how are you?", "what's up"), you MUST return an empty array
- Your response MUST be a valid JSON object with a single key "items" which is an array

Response format:
{
  "items": [
    {
      "label": "item name",
      "quantity": number,
      "options": ["option1", "option2"]
    }
  ]
}

Examples:
- "2 cheese sandwich medium spice" → {"items": [{"label": "cheese sandwich", "quantity": 2, "options": ["medium spice"]}]}
- "mera ek pizza large" → {"items": [{"label": "pizza", "quantity": 1, "options": ["large"]}]}
- "hello everyone" → {"items": []}
- "biryani order karde" → {"items": [{"label": "biryani", "quantity": 1, "options": []}]}`;


class AIExtractionAgent {
  async extractOrders(messageText, userId) {
    try {
      if (!messageText || messageText.trim().length === 0) {
        return [];
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser message: "${messageText}"`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      let content = response.data.candidates[0].content.parts[0].text;
      console.log('AI Response:', content);

      // Clean the response to extract JSON
      let jsonStr = content.trim();

      // Remove code block formatting if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```$/, '').trim();
      }

      const parsedJson = JSON.parse(jsonStr);
      return parsedJson.items || [];

    } catch (error) {
      console.error("Error calling Gemini API:", error.response?.data || error.message);
      return [];
    }
  }
}

module.exports = new AIExtractionAgent();
