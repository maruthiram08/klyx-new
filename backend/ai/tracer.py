import json
import os
from datetime import datetime
from typing import Any, List, Dict

class AITracer:
    """
    Tracer for AI Assistant interactions.
    Captures: User message -> Tool calls -> Agent reasoning -> Final output.
    """
    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        self.start_time = datetime.now()
        self.logs: List[Dict[str, Any]] = []
        
        # Determine log directory (backend/logs/ai_traces)
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.log_dir = os.path.join(self.base_dir, "logs", "ai_traces")
        os.makedirs(self.log_dir, exist_ok=True)
        
        self.current_response_content = ""

    def log_input(self, content: str):
        self.log_event("user_input", {"content": content})

    def log_tool_start(self, tool_name: str, input_data: Any = None):
        self.log_event("tool_start", {"name": tool_name, "input": input_data})

    def log_tool_end(self, tool_name: str, output: Any):
        self.log_event("tool_end", {"name": tool_name, "output": output})

    def log_chunk(self, content: str):
        self.current_response_content += content

    def log_event(self, event_type: str, data: Any):
        self.logs.append({
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": data
        })

    def finalize(self):
        """Called at the end of a stream to log the final content and save to file."""
        if self.current_response_content:
            self.log_event("ai_response", {"content": self.current_response_content})
        
        timestamp_str = self.start_time.strftime("%Y%m%d_%H%M%S")
        filename = f"{self.thread_id}_{timestamp_str}.json"
        filepath = os.path.join(self.log_dir, filename)
        
        trace_data = {
            "thread_id": self.thread_id,
            "timestamp": self.start_time.isoformat(),
            "duration_seconds": (datetime.now() - self.start_time).total_seconds(),
            "events": self.logs
        }
        
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(trace_data, f, indent=2)
            print(f"✓ AI Trace saved: {filename}")
        except Exception as e:
            print(f"⚠ Failed to save AI trace: {e}")
