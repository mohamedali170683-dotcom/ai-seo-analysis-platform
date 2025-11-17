# API Documentation

Complete API reference for the AI SEO Analysis Platform.

## Base URL

Development: http://localhost:3000/api Production: https://your-app.vercel.app/api


---

## 🔐 Authentication

Most endpoints require authentication. Include API keys or OAuth tokens in requests.

---

## 📊 Google Search Console API

### Get Query Data

**Endpoint:** `POST /api/gsc/data`

**Description:** Fetch search analytics data from Google Search Console.

**Request Body:**
```json
{
  "accessToken": "string (required)",
  "siteUrl": "string (required)",
  "startDate": "YYYY-MM-DD (required)",
  "endDate": "YYYY-MM-DD (required)"
}
Response:

{
  "success": true,
  "data": {
    "queries": [
      {
        "query": "seo tools",
        "clicks": 150,
        "impressions": 2500,
        "ctr": 0.06,
        "position": 8.5
      }
    ]
  }
}
Example:

curl -X POST https://your-app.vercel.app/api/gsc/data \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "ya29.xxx",
    "siteUrl": "https://example.com",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
📈 Traffic Impact Analysis
Analyze Traffic Impact
Endpoint: POST /api/analysis/traffic-impact

Description: Analyze how AI Overviews affect traffic for specific keywords.

Request Body:

{
  "projectId": "string (required)",
  "analysisDate": "YYYY-MM-DD (required)",
  "beforeDays": 30,
  "afterDays": 30
}
Response:

{
  "success": true,
  "data": {
    "totalKeywords": 150,
    "keywordsWithAiOverview": 45,
    "overallImpact": {
      "totalClicksChange": -1250,
      "totalClicksChangePercent": -12.5,
      "totalImpressionsChange": -3400,
      "totalImpressionsChangePercent": -8.2,
      "avgCtrChange": -0.012,
      "avgPositionChange": 1.3
    },
    "topAffectedKeywords": [
      {
        "keyword": "seo tools",
        "clicksChange": -45,
        "changePercent": -30.0
      }
    ]
  }
}
Example:

curl -X POST https://your-app.vercel.app/api/analysis/traffic-impact \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_123",
    "analysisDate": "2024-01-15",
    "beforeDays": 30,
    "afterDays": 30
  }'
Get Aggregated Impact
Endpoint: GET /api/analysis/traffic-impact?projectId=xxx&startDate=xxx&endDate=xxx

Description: Get aggregated traffic impact summary.

Query Parameters:

projectId (required): Project ID
startDate (required): Start date (YYYY-MM-DD)
endDate (required): End date (YYYY-MM-DD)
Response:

{
  "success": true,
  "data": {
    "projectId": "proj_123",
    "summary": "Traffic impact summary",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
🤖 Chatbot Visibility Analysis
Analyze Chatbot Responses
Endpoint: POST /api/chatbot/analyze

Description: Analyze brand visibility in ChatGPT or Gemini responses.

Request Body:

{
  "question": "string (required)",
  "platform": "chatgpt | gemini (required)",
  "repetitions": 5,
  "brandName": "string (required)",
  "domain": "string (required)",
  "competitors": ["string"],
  "projectId": "string (optional)"
}
Response:

{
  "success": true,
  "data": {
    "question": "What are the best SEO tools?",
    "platform": "chatgpt",
    "aggregated": {
      "mentionRate": 80.0,
      "avgPosition": 2,
      "citationRate": 60.0,
      "competitorMentions": {
        "Competitor A": 3,
        "Competitor B": 2
      }
    },
    "responses": [
      {
        "text": "YourBrand is a leading solution...",
        "hasBrandMention": true,
        "brandPosition": 1,
        "citedUrls": ["https://yourdomain.com"],
        "competitors": ["Competitor A"],
        "sentiment": "positive"
      }
    ]
  }
}
Example:

curl -X POST https://your-app.vercel.app/api/chatbot/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the best SEO tools?",
    "platform": "chatgpt",
    "repetitions": 5,
    "brandName": "YourBrand",
    "domain": "yourdomain.com",
    "competitors": ["Competitor A", "Competitor B"],
    "projectId": "proj_123"
  }'
🔄 Response Format
All API responses follow this structure:

Success Response
{
  "success": true,
  "data": { ... }
}
Error Response
{
  "success": false,
  "error": "Error message",
  "message": "Additional details"
}
📝 HTTP Status Codes
200 - Success
400 - Bad Request (missing parameters)
401 - Unauthorized (invalid credentials)
403 - Forbidden (insufficient permissions)
404 - Not Found
429 - Too Many Requests (rate limit)
500 - Internal Server Error
⚡ Rate Limits
Development: No limits
Production:
100 requests per minute per IP
1000 requests per hour per API key
🔒 Authentication Methods
OAuth 2.0 (Google)
Used for Google Search Console access.

API Key
Include in request headers:

Authorization: Bearer your-api-key
Session-based
For dashboard access (cookies).

📊 Data Models
TrafficMetrics
{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}
ChatbotVisibilityMetrics
{
  platform: "chatgpt" | "gemini";
  overallScore: number;
  mentionRate: number;
  avgPosition?: number;
  citationRate: number;
  shareOfVoice?: number;
}
🧪 Testing
Test Endpoints
Use these test credentials in development:

# Test GSC endpoint
curl -X POST http://localhost:3000/api/gsc/data \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "test_token",
    "siteUrl": "https://example.com",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
💡 Best Practices
Cache responses when possible
Handle rate limits with exponential backoff
Validate input before sending requests
Use webhooks for long-running operations
Monitor API usage and quotas
🆘 Error Handling
try {
  const response = await fetch('/api/gsc/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    console.error('API Error:', result.error);
    // Handle error
  }
  
  // Use result.data
} catch (error) {
  console.error('Network Error:', error);
  // Handle network error
}
📚 Additional Resources
Google Search Console API Docs
Ahrefs API Docs
OpenAI API Docs
Questions? Open an issue on GitHub! 🙋‍♂️

