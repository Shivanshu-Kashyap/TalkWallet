const axios = require('axios');

class AIMappingAgent {
  async mapOrdersToReceipt(orderItems, receiptLines) {
    try {
      if (!orderItems || orderItems.length === 0) {
        return { success: true, mappings: [] };
      }

      const systemPrompt = `You are a receipt-mapping assistant. Your task is to intelligently match order items with receipt lines and extract accurate prices.

Rules:
- Match each order item to the most likely corresponding receipt line
- Consider fuzzy matching (e.g., "sandwich" could match "Veg Sandwich" or "Club Sandwich")
- Handle quantity differences (e.g., order "2x sandwich" should match receipt line with appropriate price)
- Extract the exact price from the receipt line
- Provide confidence scores (0-1) based on match quality
- If no good match exists, set confidenceScore to 0

Response format (JSON only):
{
  "mappings": [
    {
      "orderItemId": "item_id",
      "matchedReceiptLine": "exact text from receipt",
      "extractedPrice": number,
      "confidenceScore": 0.0-1.0
    }
  ]
}`;

      const userPrompt = `Order Items:
${orderItems.map(item => `- ID: ${item._id}, Label: "${item.label}", Quantity: ${item.quantity}, Options: [${item.options.join(', ')}]`).join('\n')}

Receipt Lines:
${receiptLines.map((line, index) => `${index + 1}. ${line.text}${line.price ? ` (Price: ₹${line.price})` : ''}`).join('\n')}

Map the order items to receipt lines and extract prices.`;

      console.log('Sending mapping request to AI...');

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      let content = response.data.candidates[0].content.parts[0].text.trim();

      // Clean JSON response if wrapped in ```json ... ```
      if (content.startsWith("```")) {
        content = content.replace(/```json\s*/, "").replace(/```$/, "").trim();
      }

      const result = JSON.parse(content);

      console.log('AI mapping completed:', result.mappings?.length || 0, 'mappings');

      return {
        success: true,
        mappings: result.mappings || []
      };

    } catch (error) {
      console.error('AI Mapping Error:', error.response?.data || error.message);
      return {
        success: false,
        mappings: [],
        error: error.message
      };
    }
  }
}

module.exports = new AIMappingAgent();
