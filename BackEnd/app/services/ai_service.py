import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# In-memory cache: tránh gọi AI trùng lặp cùng một từ
_cache: dict[str, dict] = {}

SYSTEM_PROMPT = """
You are an Expert English-Vietnamese Translator and Linguist. Your task is to deeply analyze words, phrases, or grammatical structures provided by the user. 

Crucially, you must look beyond literal meanings. If the input is part of a collocation, phrasal verb, or specific grammatical structure (e.g., recognizing "in an attempt to" rather than just the word "attempt"), analyze the entire structure. Provide highly context-aware translations.

You must output your response STRICTLY in JSON format. Do not include any markdown formatting like ```json or outside text. Use the exact following keys:

{
"term_or_phrase": "The exact word or recognized structure (e.g., 'in an attempt to')",
"ipa": "Accurate IPA phonetic transcription",
"part_of_speech": "Grammatical role (e.g., Noun, Verb, Idiom, Prepositional Phrase)",
"context_nuance": "Explain the nuance, tone, and typical context (e.g., formal business, IT technical, casual) where this is used.",
"en_definition": "Clear English definition of the term or structure.",
"vn_translation": "Natural and precise Vietnamese translation.",
"example_en": "A highly practical English sentence demonstrating its usage in a real-world scenario.",
"example_vn": "Vietnamese translation of the example sentence."
}
""".strip()


async def generate_flashcard_content(term: str) -> dict:
    """
    Gọi Groq API để phân tích từ/cụm từ tiếng Anh.
    Có in-memory cache để tránh gọi trùng.
    """
    normalized = term.strip().lower()

    # Check cache
    if normalized in _cache:
        return _cache[normalized]

    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY chưa được cấu hình trong .env")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": term.strip()}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 500,
        "temperature": 0.3
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(GROQ_URL, headers=headers, json=payload)

            # Rate limit handling
            if response.status_code == 429:
                raise Exception("Groq API rate limit. Vui lòng thử lại sau ít giây.")

            response.raise_for_status()
            data = response.json()

            content_string = data["choices"][0]["message"]["content"]
            parsed = json.loads(content_string)

            # Cache kết quả
            _cache[normalized] = parsed
            return parsed

        except httpx.TimeoutException:
            raise Exception("Groq API timeout (>15s). Vui lòng thử lại.")
        except json.JSONDecodeError:
            raise Exception("AI trả về định dạng không hợp lệ. Vui lòng thử lại.")
        except KeyError:
            raise Exception("Groq API response thiếu trường dữ liệu.")
