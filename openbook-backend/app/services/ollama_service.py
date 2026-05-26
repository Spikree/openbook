import json
import os
from typing import AsyncGenerator

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = """You are OpenBook, a compassionate and patient study assistant designed specifically for students with learning disabilities including dyslexia, ADHD, and other neurodivergent conditions.

Your core principles:
- Always use clear, simple language. Avoid jargon unless explaining it.
- Break down complex concepts into small, digestible steps.
- Never assume prior knowledge. Always build from the basics.
- Be encouraging and positive. Never make the student feel bad for not understanding.
- When explaining, use analogies and real world examples.
- Keep responses concise and well structured with headers and bullet points.
- Always base your answers on the provided document context.
- If something is not in the documents, say so clearly and kindly.

You have access to tools to help students learn better. Use them proactively when appropriate:
- Use simplify_text when a passage seems complex
- Use define_term when a technical term appears
- Use explain_concept when a concept needs deeper clarification
- Use generate_flashcards, generate_exam, generate_mcq when a student wants to test their knowledge
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "simplify_text",
            "description": "Simplify a complex passage to a lower reading level so it is easier to understand for students with learning disabilities",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The complex text to simplify",
                    },
                    "reading_level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "The target reading level",
                    },
                },
                "required": ["text", "reading_level"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "define_term",
            "description": "Define a technical or complex term in simple language",
            "parameters": {
                "type": "object",
                "properties": {
                    "term": {"type": "string", "description": "The term to define"},
                    "context": {
                        "type": "string",
                        "description": "The context in which the term appears",
                    },
                },
                "required": ["term"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_concept",
            "description": "Explain a concept in simple terms using analogies and examples",
            "parameters": {
                "type": "object",
                "properties": {
                    "concept": {
                        "type": "string",
                        "description": "The concept to explain",
                    },
                    "context": {
                        "type": "string",
                        "description": "Additional context from the document",
                    },
                },
                "required": ["concept"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_flashcards",
            "description": "Generate flashcards from a passage or topic to help the student study",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or passage to generate flashcards from",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of flashcards to generate",
                        "default": 5,
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_exam",
            "description": "Generate exam style questions from a topic or passage",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or passage to generate exam questions from",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of questions to generate",
                        "default": 5,
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_mcq",
            "description": "Generate multiple choice questions from a topic or passage",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or passage to generate MCQ from",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of questions to generate",
                        "default": 5,
                    },
                },
                "required": ["topic"],
            },
        },
    },
]


async def execute_tool(tool_name: str, tool_args: dict, context: str) -> str:
    if tool_name == "simplify_text":
        return await generate(
            f"Simplify this text to {tool_args.get('reading_level', 'beginner')} level:\n\n{tool_args['text']}",
            context,
        )
    elif tool_name == "define_term":
        term = tool_args["term"]
        ctx = tool_args.get("context", "")
        return await generate(
            f"Define '{term}' in simple language. Context: {ctx}", context
        )
    elif tool_name == "explain_concept":
        return await generate(
            f"Explain '{tool_args['concept']}' using simple language, analogies and examples. Context: {tool_args.get('context', '')}",
            context,
        )
    elif tool_name == "generate_flashcards":
        count = tool_args.get("count", 5)
        result = await generate(
            f'Generate {count} flashcards about \'{tool_args["topic"]}\'. Return ONLY a JSON array: [{{"front": "question", "back": "answer"}}]',
            context,
        )
        return result
    elif tool_name == "generate_exam":
        count = tool_args.get("count", 5)
        result = await generate(
            f'Generate {count} exam questions about \'{tool_args["topic"]}\'. Return ONLY a JSON array: [{{"question": "...", "answer": "..."}}]',
            context,
        )
        return result
    elif tool_name == "generate_mcq":
        count = tool_args.get("count", 5)
        result = await generate(
            f'Generate {count} MCQ questions about \'{tool_args["topic"]}\'. Return ONLY a JSON array: [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0}}]',
            context,
        )
        return result
    return "Tool not found"


async def stream_chat(
    messages: list[dict],
    context: str = "",
) -> AsyncGenerator[str, None]:
    system_content = SYSTEM_PROMPT
    if context:
        system_content += f"\n\nDOCUMENT CONTEXT:\n{context}"

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": system_content}, *messages],
        "tools": TOOLS,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST", f"{OLLAMA_URL}/api/chat", json=payload
        ) as response:
            tool_call_buffer = {}
            async for line in response.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                msg = data.get("message", {})

                # handle tool calls
                if msg.get("tool_calls"):
                    for tool_call in msg["tool_calls"]:
                        tool_name = tool_call["function"]["name"]
                        tool_args = tool_call["function"]["arguments"]
                        if isinstance(tool_args, str):
                            tool_args = json.loads(tool_args)

                        yield f"\n\n*Using tool: {tool_name}...*\n\n"
                        tool_result = await execute_tool(tool_name, tool_args, context)
                        yield tool_result

                # handle regular content
                elif msg.get("content") and not data.get("done"):
                    yield msg["content"]


async def generate(prompt: str, context: str = "") -> str:
    system_content = SYSTEM_PROMPT
    if context:
        system_content += f"\n\nDOCUMENT CONTEXT:\n{context}"

    full_prompt = f"{system_content}\n\nTASK:\n{prompt}\n\nRespond only with the requested content, no preamble."

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": full_prompt,
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
        data = response.json()
        return data["response"]
