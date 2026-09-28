from fastapi import FastAPI

app = FastAPI(title="StudyDocs AI API")


@app.get("/")
def root():
    return {"message": "StudyDocs AI API is running"}