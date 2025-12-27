from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChatThread, ChatMessage
import uuid
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat/threads', methods=['GET'])
@jwt_required(optional=True)
def get_threads():
    user_id = get_jwt_identity()
    
    # DEV BYPASS: Use default user if not authenticated
    if not user_id:
        user_id = "dev-user-bypass"
        
    # Include threads where is_archived is False OR NULL (SQLite compatibility)
    from sqlalchemy import or_
    threads = ChatThread.query.filter(
        ChatThread.user_id == user_id,
        or_(ChatThread.is_archived == False, ChatThread.is_archived == None)
    ).order_by(ChatThread.updated_at.desc()).all()
    return jsonify({
        "status": "success",
        "data": [t.to_dict() for t in threads]
    })

@chat_bp.route('/chat/threads', methods=['POST'])
@jwt_required()
def create_thread():
    user_id = get_jwt_identity()
    data = request.json or {}
    
    new_thread = ChatThread(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=data.get('title', 'New Analysis')
    )
    
    db.session.add(new_thread)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "data": new_thread.to_dict()
    }), 201

@chat_bp.route('/chat/threads/<thread_id>', methods=['GET'])
@jwt_required(optional=True)
def get_thread_messages(thread_id):
    user_id = get_jwt_identity()
    
    # DEV BYPASS
    if not user_id:
        user_id = "dev-user-bypass"
        
    thread = ChatThread.query.filter_by(id=thread_id, user_id=user_id).first()
    
    if not thread:
        return jsonify({"status": "error", "message": "Thread not found"}), 404
        
    messages = ChatMessage.query.filter_by(thread_id=thread_id).order_by(ChatMessage.created_at.asc()).all()
    
    return jsonify({
        "status": "success",
        "data": {
            "thread": thread.to_dict(),
            "messages": [m.to_dict() for m in messages]
        }
    })

@chat_bp.route('/chat/threads/<thread_id>', methods=['PATCH'])
@jwt_required()
def update_thread(thread_id):
    user_id = get_jwt_identity()
    thread = ChatThread.query.filter_by(id=thread_id, user_id=user_id).first()
    
    if not thread:
        return jsonify({"status": "error", "message": "Thread not found"}), 404
        
    data = request.json
    if 'title' in data:
        thread.title = data['title']
    if 'isArchived' in data:
        thread.is_archived = data['isArchived']
        
    thread.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "data": thread.to_dict()
    })

@chat_bp.route('/chat/threads/<thread_id>', methods=['DELETE'])
@jwt_required()
def delete_thread(thread_id):
    user_id = get_jwt_identity()
    thread = ChatThread.query.filter_by(id=thread_id, user_id=user_id).first()
    
    if not thread:
        return jsonify({"status": "error", "message": "Thread not found"}), 404
        
    db.session.delete(thread)
    db.session.commit()
    
    return jsonify({"status": "success", "message": "Thread deleted"})
