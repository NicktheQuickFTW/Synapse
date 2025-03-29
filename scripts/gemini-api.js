require('dotenv').config();
const axios = require('axios');

async function generateContent(prompt) {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Example usage
if (require.main === module) {
  const prompt = process.argv[2] || "Explain how AI works";
  generateContent(prompt)
    .then(response => {
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
}

module.exports = { generateContent }; 