from fastapi import WebSocket
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, user_id, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def send_personal_message_sync(self, message: dict, receiver_id: str):
        if receiver_id in self.active_connections:
            websocket = self.active_connections[receiver_id]
            import asyncio
            asyncio.create_task(websocket.send_json(message))


    def disconnect(self, user_id, websocket: WebSocket):
        conns = self.active_connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message, receiver_id):
        conns = self.active_connections.get(receiver_id)
        if not conns:
            return
        await asyncio.gather(*(ws.send_json(message) for ws in conns))

manager = ConnectionManager()
