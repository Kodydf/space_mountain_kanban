import httpx

from app import config


def chat_completion(messages: list[dict], response_format: dict | None = None) -> dict:
    """Calls OpenRouter's chat completions endpoint and returns the parsed JSON response."""
    payload: dict = {"model": config.OPENROUTER_MODEL, "messages": messages}
    if response_format is not None:
        payload["response_format"] = response_format

    response = httpx.post(
        config.OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()
