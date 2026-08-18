import os
import json
from google import genai
from google.genai import types

def explain_finding(title: str, desc: str, code_snippet: str = "") -> dict:
    """
    Calls the Gemini API to explain a security finding and provide a remediation scenario.
    Includes a robust failsafe in case of API unavailability, rate limits, or token exhaustion.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Failsafe if API key is not configured
    if not api_key:
        return _get_fallback_response(title, "API Key is not configured for the AI engine.")

    try:
        # We use a short timeout and specific client config to ensure it doesn't block forever
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are a senior security engineer. Analyze the following security finding from a static analysis tool:
        
        Title: {title}
        Description: {desc}
        Code snippet context: {code_snippet}
        
        Provide a structured response explaining the risk and how to fix it. 
        You MUST return ONLY valid JSON matching this schema:
        {{
            "summary": "1-2 sentence summary of the issue.",
            "attack_scenario": "How an attacker could exploit this in practice.",
            "verification_steps": "How a developer can verify the fix."
        }}
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        
        try:
            parsed = json.loads(response.text)
            return parsed
        except json.JSONDecodeError:
            # Fallback if the model returns invalid JSON
            return _get_fallback_response(title, "AI generated an invalid response format.")
            
    except Exception as e:
        # Catch ResourceExhausted, DeadlineExceeded, APIConnectionError, etc.
        print(f"AI Explanation failed: {str(e)}")
        return _get_fallback_response(title, "AI engine is currently unavailable (rate limit or capacity). Follow the scanner's recommended fix.")

def _get_fallback_response(title: str, reason: str) -> dict:
    """Provides a graceful downgrade experience instead of crashing."""
    return {
        "summary": f"Automated explanation unavailable: {reason}",
        "attack_scenario": f"The '{title}' vulnerability could allow unauthorized access, data leakage, or arbitrary code execution depending on the specific component. Review the scanner's raw output.",
        "verification_steps": "Review the affected code block, implement the suggested fix, and trigger a new RepoLens scan to verify."
    }
