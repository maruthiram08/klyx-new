import json
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

try:
    from .agent import get_ai_agent
    from .tracer import AITracer
except ImportError:
    from ai.agent import get_ai_agent
    from ai.tracer import AITracer

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
async def chat_endpoint(request: ChatRequest, req_raw: Request):
    # 1. Verify Authentication (dev bypass enabled)
    auth_header = req_raw.headers.get("Authorization")
    
    from ai.db_utils import get_user_id_from_token, ensure_thread_exists, save_message, auto_title_thread
    user_id = None
    if auth_header:
        user_id = get_user_id_from_token(auth_header)
    
    # DEV BYPASS: Use a default user if auth fails
    if not user_id:
        user_id = "dev-user-bypass"
        print("WARNING: Using dev bypass user_id")

    # 2. Ensure Thread and Save User Message
    ensure_thread_exists(request.threadId, user_id)
    save_message(request.threadId, "user", request.prompt.content)
    auto_title_thread(request.threadId, request.prompt.content)

    agent = get_ai_agent()
    tracer = AITracer(request.threadId)
    
    config = {"configurable": {"thread_id": request.threadId}}
    
    # Log initial input
    tracer.log_input(request.prompt.content)
    
    async def event_generator():
        full_response = ""
        try:
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
                        full_response += content
                        tracer.log_chunk(content)
                        yield f"data: {json.dumps({'content': content})}\n\n"
                
                elif kind == "on_tool_start":
                    tool_name = event["name"]
                    input_data = event["data"].get("input")
                    tracer.log_tool_start(tool_name, input_data)
                    yield f"data: {json.dumps({'tool': tool_name, 'status': 'starting'})}\n\n"
                
                elif kind == "on_tool_end":
                    tool_name = event["name"]
                    output = event["data"].get("output")
                    tracer.log_tool_end(tool_name, str(output))
                    yield f"data: {json.dumps({'tool': tool_name, 'status': 'completed', 'output': str(output)})}\n\n"
            
            # Finalize trace and save assistant message
            tracer.finalize()
            if full_response:
                save_message(request.threadId, "assistant", full_response)
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            tracer.log_event("error", {"message": str(e)})
            tracer.finalize()
            if full_response:
                save_message(request.threadId, "assistant", full_response)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
