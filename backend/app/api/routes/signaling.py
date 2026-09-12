import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.call_manager import call_manager

logger = logging.getLogger("vera.signaling")

router = APIRouter()

@router.get("/api/v1/signaling/users")
def get_online_users():
    """Returns list of currently connected VoIP user IDs."""
    return {"users": call_manager.get_online_users()}

@router.get("/api/v1/signaling/ice-config")
def get_ice_config():
    """
    Returns dynamically configured STUN/TURN server list.
    Decoupled from frontend codebase (Recommendation #6).
    """
    return {
        "iceServers": [
            {
                "urls": [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302"
                ]
            }
        ]
    }

@router.websocket("/api/v1/ws/signaling/{user_id}")
async def signaling_websocket(websocket: WebSocket, user_id: str):
    await websocket.accept()
    await call_manager.register_user(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            await call_manager.handle_message(user_id, data)
    except WebSocketDisconnect:
        await call_manager.unregister_user(user_id)
    except Exception as e:
        logger.error(f"Signaling error for user {user_id}: {e}")
        await call_manager.unregister_user(user_id)
