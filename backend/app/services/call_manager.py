import logging
import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from datetime import datetime

logger = logging.getLogger("vera.signaling")

class CallSession:
    def __init__(self, call_id: str, caller_id: str, callee_id: str):
        self.call_id = call_id
        self.caller_id = caller_id
        self.callee_id = callee_id
        self.state = "ringing"  # ringing, connected, ended
        self.created_at = datetime.utcnow()

class CallManager:
    def __init__(self):
        # Maps user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Maps call_id -> CallSession
        self.active_calls: Dict[str, CallSession] = {}

    async def register_user(self, user_id: str, websocket: WebSocket):
        self.active_connections[user_id] = websocket
        logger.info(f"User connected to signaling: {user_id} (Total: {len(self.active_connections)})")
        await self.broadcast_user_list()

    async def unregister_user(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User disconnected from signaling: {user_id} (Total: {len(self.active_connections)})")

        # Terminate any ongoing calls for this user
        calls_to_end = []
        for call_id, call in self.active_calls.items():
            if call.caller_id == user_id or call.callee_id == user_id:
                calls_to_end.append((call_id, call.caller_id if call.callee_id == user_id else call.callee_id))

        for call_id, peer_id in calls_to_end:
            if call_id in self.active_calls:
                del self.active_calls[call_id]
            await self.send_to_user(peer_id, {
                "type": "call:end",
                "call_id": call_id,
                "reason": "peer_disconnected"
            })

        await self.broadcast_user_list()

    def get_online_users(self) -> List[str]:
        return list(self.active_connections.keys())

    def is_user_in_call(self, user_id: str) -> bool:
        for call in self.active_calls.values():
            if call.state == "connected" and (call.caller_id == user_id or call.callee_id == user_id):
                return True
        return False

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error(f"Error sending signaling message to {user_id}: {e}")
                return False
        return False

    async def broadcast_user_list(self):
        users = self.get_online_users()
        msg = {
            "type": "users:list",
            "users": users
        }
        for uid in list(self.active_connections.keys()):
            await self.send_to_user(uid, msg)

    async def handle_message(self, user_id: str, data: dict):
        msg_type = data.get("type")
        call_id = data.get("call_id")
        target_id = data.get("target_id") or data.get("callee_id") or data.get("caller_id")

        if msg_type == "call:invite":
            callee_id = data.get("callee_id")
            if not callee_id or callee_id not in self.active_connections:
                await self.send_to_user(user_id, {
                    "type": "call:reject",
                    "call_id": call_id,
                    "reason": "user_offline"
                })
                return

            if self.is_user_in_call(callee_id):
                await self.send_to_user(user_id, {
                    "type": "call:reject",
                    "call_id": call_id,
                    "reason": "user_busy"
                })
                return

            # Register call session
            self.active_calls[call_id] = CallSession(call_id, user_id, callee_id)

            # Send invite to callee
            await self.send_to_user(callee_id, {
                "type": "call:invite",
                "call_id": call_id,
                "caller_id": user_id,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })

        elif msg_type == "call:ringing":
            caller_id = data.get("caller_id")
            await self.send_to_user(caller_id, {
                "type": "call:ringing",
                "call_id": call_id,
                "callee_id": user_id
            })

        elif msg_type == "call:accept":
            caller_id = data.get("caller_id")
            if call_id in self.active_calls:
                self.active_calls[call_id].state = "connected"

            await self.send_to_user(caller_id, {
                "type": "call:accept",
                "call_id": call_id,
                "callee_id": user_id
            })

        elif msg_type == "call:reject":
            caller_id = data.get("caller_id")
            reason = data.get("reason", "declined")
            if call_id in self.active_calls:
                del self.active_calls[call_id]

            await self.send_to_user(caller_id, {
                "type": "call:reject",
                "call_id": call_id,
                "callee_id": user_id,
                "reason": reason
            })

        elif msg_type == "call:end":
            call = self.active_calls.get(call_id)
            if call:
                peer_id = call.callee_id if call.caller_id == user_id else call.caller_id
                del self.active_calls[call_id]
                await self.send_to_user(peer_id, {
                    "type": "call:end",
                    "call_id": call_id,
                    "reason": data.get("reason", "hangup")
                })

        # Milestone 2 WebRTC Signaling passthrough:
        elif msg_type in ["webrtc:offer", "webrtc:answer", "webrtc:ice"]:
            if not target_id and call_id in self.active_calls:
                call = self.active_calls[call_id]
                target_id = call.callee_id if call.caller_id == user_id else call.caller_id
            if target_id:
                data["sender_id"] = user_id
                await self.send_to_user(target_id, data)

call_manager = CallManager()
