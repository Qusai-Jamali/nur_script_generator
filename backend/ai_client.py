import json
import re
import google.generativeai as genai
from config import get_settings

settings = get_settings()


async def call_ai(system_prompt: str, user_prompt: str) -> dict:
    if settings.AI_PROVIDER == "gemini":
        return await _call_gemini(system_prompt, user_prompt)
    elif settings.AI_PROVIDER == "openai":
        return await _call_openai(system_prompt, user_prompt)
    raise ValueError(f"Unknown AI_PROVIDER: {settings.AI_PROVIDER}")


async def _call_gemini(system_prompt: str, user_prompt: str) -> dict:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.85,
            max_output_tokens=4096,
            response_mime_type="application/json",
        ),
    )
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            prompt = user_prompt
            if attempt > 0:
                prompt += (
                    "\n\nIMPORTANT: Return only valid JSON that exactly matches the required schema. "
                    "No markdown fences, no comments, no trailing commas, and no extra text."
                )
            response = model.generate_content(prompt)
            return _safe_parse(getattr(response, "text", ""))
        except ValueError as err:
            last_error = err
            continue

    raise ValueError(
        "AI returned malformed JSON multiple times. Please retry generation."
    ) from last_error


async def _call_openai(system_prompt: str, user_prompt: str) -> dict:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            prompt = user_prompt
            if attempt > 0:
                prompt += (
                    "\n\nIMPORTANT: Return only valid JSON. No markdown fences, "
                    "no comments, and no extra text."
                )
            resp = await client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": prompt},
                ],
            )
            raw = resp.choices[0].message.content
            return _safe_parse(raw)
        except ValueError as err:
            last_error = err
            continue

    raise ValueError(
        "AI returned malformed JSON multiple times. Please retry generation."
    ) from last_error


def _safe_parse(raw: str) -> dict:
    if not raw:
        raise ValueError("AI returned empty output. Please retry generation.")

    candidates = [raw]
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    if cleaned and cleaned not in candidates:
        candidates.append(cleaned)

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        extracted = match.group().strip()
        if extracted and extracted not in candidates:
            candidates.append(extracted)

    repaired = re.sub(r",\s*([}\]])", r"\1", cleaned)
    if repaired and repaired not in candidates:
        candidates.append(repaired)

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    raise ValueError("AI returned non-parseable output. Please try again.")
