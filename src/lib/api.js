/**
 * AI Triage API client
 * Calls the Vercel serverless function — NEVER calls Anthropic directly from the browser.
 */

const TRIAGE_ENDPOINT = "/api/triage"
const TIMEOUT_MS = 20000 // 20 seconds

/**
 * Call the AI triage endpoint to analyze an issue complaint
 * 
 * @param {object} params
 * @param {string} params.complaint - Free-text complaint from the reporter
 * @param {string} params.assetType - The type/name of the asset
 * @param {string} params.assetCategory - Category of the asset (e.g., "HVAC", "Electrical")
 * @returns {Promise<object|null>} AI triage result or null on failure
 * 
 * Returns: {
 *   title: string,
 *   category: string,
 *   priority: "Low" | "Medium" | "High" | "Critical",
 *   possibleCauses: string[],
 *   initialChecks: string[],
 *   safetyWarning: string | null
 * }
 */
export async function triageIssue({ complaint, assetType, assetCategory }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(TRIAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ complaint, assetType, assetCategory }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("Triage API error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      console.error("Triage API timed out after", TIMEOUT_MS, "ms")
    } else {
      console.error("Triage API error:", error)
    }

    return null
  }
}
