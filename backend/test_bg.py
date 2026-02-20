from fastapi import FastAPI, BackgroundTasks
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/test1")
def test1(bg: BackgroundTasks = None):
    return "ok"

client = TestClient(app)
res = client.post("/test1")
print(res.status_code, res.json())
