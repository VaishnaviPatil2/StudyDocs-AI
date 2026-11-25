"""Quick test of all 7 previously failing questions."""
import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.services.rag_service import answer_question

QUESTIONS = [
    "Who created Python?",
    "What are the file modes and what does each do?",
    "Does // return a float?",
    "Python uses curly braces for blocks right?",
    "Is a tuple mutable?",
    "whos made pyton",
    "Which keyword exits a loop?",
]

db = SessionLocal()
print("=" * 60)
for i, q in enumerate(QUESTIONS, 1):
    print(f"\nQ{i}: {q}")
    r = answer_question(q, db, course_id=2)
    print(f"A: {r.answer[:200]}")
    print(f"   sources={len(r.sources)}")
db.close()
print("\n" + "=" * 60)
print("DONE")
