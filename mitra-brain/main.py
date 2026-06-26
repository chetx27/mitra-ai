from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from pipeline import run_pipeline
from ingest import ingest_profile, ingest_file
from report import generate_daily_report
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Mitra brain starting...")
    yield
    print("Mitra brain stopping.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConversationRequest(BaseModel):
    profile_id: str
    transcript: str


class IngestProfileRequest(BaseModel):
    profile_id: str


class IngestFileRequest(BaseModel):
    profile_id: str
    file_url: str
    source_type: str


class ReportRequest(BaseModel):
    profile_id: str
    date: str


@app.post("/conversation")
async def conversation_endpoint(req: ConversationRequest):
    try:
        result = await run_pipeline(req.profile_id, req.transcript)
        return {
            "response": result["response"],
            "safety_flag": result["safety_flag"],
            "emotion_label": result["emotion_label"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/profile")
async def ingest_profile_endpoint(req: IngestProfileRequest):
    try:
        await ingest_profile(req.profile_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/file")
async def ingest_file_endpoint(req: IngestFileRequest):
    try:
        await ingest_file(req.profile_id, req.file_url, req.source_type)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report/daily")
async def daily_report_endpoint(req: ReportRequest):
    try:
        summary = await generate_daily_report(req.profile_id, req.date)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
