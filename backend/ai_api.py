import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

try:
    from .agent import get_ai_agent
except ImportError:
    from ai.agent import get_ai_agent

app = FastAPI(title="Aura Finance AI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: ChatMessage
    threadId: str
    responseId: Optional[str] = None

@app.get("/api/ai/health")
async def health_check():
    return {"status": "ok", "service": "AI Agent"}

@app.post("/api/ai/chat")
async def chat_endpoint(request: ChatRequest):
    agent = get_ai_agent()
    
    config = {"configurable": {"thread_id": request.threadId}}
    
    async def event_generator():
        # Using stream to get tokens/events
        async for event in agent.astream_events(
            {"messages": [("user", request.prompt.content)]},
            config,
            version="v2"
        ):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            elif kind == "on_tool_start":
                yield f"data: {json.dumps({'tool': event['name'], 'status': 'starting'})}\n\n"
            elif kind == "on_tool_end":
                yield f"data: {json.dumps({'tool': event['name'], 'status': 'completed', 'output': str(event['data'].get('output'))})}\n\n"
        
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
