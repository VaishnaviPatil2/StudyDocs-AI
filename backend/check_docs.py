from app.core.database import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk

db = SessionLocal()
docs = db.query(Document).order_by(Document.id).all()
print("id,course,title,status,chunks")
for d in docs:
    c = db.query(DocumentChunk).filter(DocumentChunk.document_id == d.id).count()
    print(f"{d.id},{d.course_id},{d.title},{d.status.value},{c}")
db.close()
