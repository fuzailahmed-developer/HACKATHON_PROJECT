/**
 * Vercel Serverless Function: api/triage.js
 * Secure server-side proxy for the Anthropic Claude API.
 * Triages reporter complaints into structured diagnostic details.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const MODEL_NAME = "claude-3-5-haiku-20241022" // Fast and accurate for classification

export default async function handler(req, res) {
  // 1. Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const { complaint, assetType, assetCategory } = req.body

    if (!complaint || !complaint.trim()) {
      return res.status(400).json({ error: "Missing complaint description" })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY environment variable")
      return res.status(500).json({ error: "AI service configuration error" })
    }

    // 2. Define System Instructions
    const systemPrompt = `You are a professional maintenance dispatcher and risk assessment AI.
Your task is to analyze a physical asset malfunction complaint and return a strictly formatted JSON output.

Input details:
- Asset Type: "${assetType || "Unknown"}"
- Asset Category: "${assetCategory || "General Equipment"}"
- Malfunction Complaint: "${complaint}"

Output Schema:
You must output a single, raw JSON object with EXACTLY the following keys:
{
  "title": "A short, clear summary title of the issue (max 5-6 words)",
  "category": "Choose the most relevant category from: Mechanical Failure, Electrical Issue, Plumbing/Leak, HVAC/Climate, Safety Hazard, Noise/Vibration, Performance Degradation, Physical Damage, Cleaning/Hygiene, Software/Controls, General Maintenance, Other",
  "priority": "Choose one of: Low, Medium, High, Critical",
  "possibleCauses": ["List 2 to 3 potential causes for this malfunction"],
  "initialChecks": ["List 2 to 3 basic diagnostic steps a technician should perform"],
  "safetyWarning": "Provide a string warning IF there is a risk of shock, fire, flooding, toxic fumes, or structural danger. Otherwise, set this field to null."
}

Safety Constraint Rules:
- If you classify priority as 'Critical' or identify a serious safety risk (e.g. electrical wiring sparking, gas leak, fire hazard, structural elevator cable issue):
  - You MUST include a prominent 'safetyWarning' warning.
  - You MUST NEVER suggest DIY mechanical or electrical checks.
  - The 'initialChecks' must recommend securing the area and waiting for a qualified technician.
- Do NOT wrap your output in markdown formatting (like \`\`\`json). Do NOT add extra conversational text or explanations. Return ONLY the raw JSON object.`

    // 3. Make fetch call to Anthropic API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze the complaint: "${complaint}"`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Anthropic API request failed: ${response.status} - ${errorText}`)
      return res.status(500).json({ error: "Failed to communicate with AI model" })
    }

    const result = await response.json()
    const textContent = result.content?.[0]?.text || ""

    // 4. Parse JSON result
    try {
      // Find JSON block if Claude wrapped it in markdown code block despite instructions
      let cleanedText = textContent.trim()
      if (cleanedText.includes("```")) {
        const matches = cleanedText.match(/```(?:json)?([\s\S]*?)```/)
        if (matches && matches[1]) {
          cleanedText = matches[1].trim()
        }
      }
      
      const parsedData = JSON.parse(cleanedText)
      return res.status(200).json(parsedData)
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON:", textContent, parseError)
      return res.status(500).json({ error: "Failed to parse triage result" })
    }

  } catch (error) {
    console.error("Triage function internal error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
