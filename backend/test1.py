import sys; sys.path.insert(0,'.')
from app.core.database import SessionLocal
from app.services.rag_service import answer_question
db = SessionLocal()
r = answer_question("Who created Python?", db, course_id=2)
print("ANSWER:", r.answer)
print("SOURCES:", len(r.sources))
print("REWRITTEN:", r.rewritten_query)
db.close()
