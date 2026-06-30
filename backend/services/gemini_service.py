"""
Gemini AI Service — Handles all Google Generative AI calls
"""
import google.generativeai as genai
import json
import logging
from typing import AsyncGenerator
from backend.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

GEMINI_MODEL = "gemini-3.1-flash-lite"


def _get_model():
    """Return configured Gemini model."""
    return genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        generation_config={
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        },
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
    )


async def generate_text(prompt: str) -> str:
    """Generate text response from Gemini."""
    try:
        model = _get_model()
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        raise ValueError(f"AI generation failed: {str(e)}")


async def generate_json(prompt: str) -> dict:
    """Generate and parse a JSON response from Gemini."""
    try:
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config={
                "temperature": 0.5,
                "top_p": 0.9,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
            }
        )
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        # Clean up code blocks if returned
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise ValueError("AI returned invalid JSON response")
    except Exception as e:
        logger.error(f"Gemini JSON generation error: {e}")
        raise ValueError(f"AI generation failed: {str(e)}")


async def stream_text(prompt: str) -> AsyncGenerator[str, None]:
    """Stream text response from Gemini (for real-time output)."""
    try:
        model = _get_model()
        async for chunk in await model.generate_content_async(prompt, stream=True):
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"Gemini stream error: {e}")
        yield f"\n\n❌ Error: {str(e)}"
