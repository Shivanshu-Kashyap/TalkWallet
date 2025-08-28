const vision = require('@google-cloud/vision');

class OCRAgent {
  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }

  async extractTextFromImage(imageUrl) {
    try {
      console.log('Starting OCR for image:', imageUrl);
      
      const [result] = await this.client.textDetection(imageUrl);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        return {
          success: false,
          message: 'No text found in image',
          rawText: '',
          parsedLines: []
        };
      }

      // First annotation contains the full text
      const rawText = detections[0].description;
      
      // Parse individual lines with potential prices
      const parsedLines = this.parseReceiptLines(rawText);
      
      console.log('OCR completed successfully');
      console.log('Parsed lines:', parsedLines.length);
      
      return {
        success: true,
        rawText,
        parsedLines
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        message: error.message,
        rawText: '',
        parsedLines: []
      };
    }
  }

  parseReceiptLines(rawText) {
    const lines = rawText.split('\n').filter(line => line.trim());
    const parsedLines = [];
    
    // Regex patterns to identify price lines
    const pricePatterns = [
      /(\d+(?:\.\d{2})?)\s*$/, // Price at end of line
      /₹\s*(\d+(?:\.\d{2})?)/,  // Rupee symbol
      /Rs\.?\s*(\d+(?:\.\d{2})?)/i, // Rs format
      /(\d+(?:\.\d{2})?)\s*INR/i // INR format
    ];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      let extractedPrice = null;
      let confidence = 0;

      // Try to extract price using different patterns
      for (const pattern of pricePatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const price = parseFloat(match[1]);
          if (price > 0 && price < 10000) { // Reasonable price range
            extractedPrice = price;
            confidence = 0.8;
            break;
          }
        }
      }

      // Include lines that likely contain items (even without prices)
      if (extractedPrice || this.looksLikeItem(trimmedLine)) {
        parsedLines.push({
          text: trimmedLine,
          price: extractedPrice,
          confidence: extractedPrice ? confidence : 0.3
        });
      }
    });

    return parsedLines.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  looksLikeItem(line) {
    // Heuristics to identify item lines
    const itemIndicators = [
      /^[A-Za-z]/, // Starts with letter
      /\b(sandwich|pizza|burger|chai|coffee|biryani|dosa|momos|lassi)\b/i,
      /\bx\d+\b/i, // Contains quantity like x2
      /\d+\s*(pcs?|pieces?|plate|glass|cup)/i
    ];

    return itemIndicators.some(pattern => pattern.test(line)) && 
           line.length > 3 && 
           line.length < 100;
  }
}

module.exports = new OCRAgent();
