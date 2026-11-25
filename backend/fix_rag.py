"""
Fix RAG issues:
1. Delete duplicate document (keep the one with more chunks)
2. Verify what remains
"""
import psycopg

conn = psycopg.connect(
    host='localhost', port=5433, dbname='studydocs',
    user='studydocs_user', password='StudyDocs@26',
    connect_timeout=5
)

cur = conn.cursor()

# Show all documents
cur.execute("""
    SELECT d.id, d.course_id, d.title, d.status,
           COUNT(dc.id) as chunk_count
    FROM documents d
    LEFT JOIN document_chunks dc ON dc.document_id = d.id
    GROUP BY d.id
    ORDER BY d.id
""")
rows = cur.fetchall()
print("id | course | title | status | chunks")
print("-" * 60)
for r in rows:
    print(f"{r[0]} | {r[1]} | {r[2][:40]} | {r[3]} | {r[4]}")

# Find duplicates (same title in same course)
cur.execute("""
    SELECT title, course_id, COUNT(*) as cnt, array_agg(id ORDER BY id) as ids
    FROM documents
    GROUP BY title, course_id
    HAVING COUNT(*) > 1
""")
dupes = cur.fetchall()
print(f"\nDuplicate groups: {len(dupes)}")

for title, course_id, cnt, ids in dupes:
    print(f"\nDuplicate: '{title}' in course {course_id} — IDs: {ids}")
    # Keep the one with most chunks, delete others
    best_id = None
    best_chunks = -1
    for doc_id in ids:
        cur.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id = %s", (doc_id,))
        c = cur.fetchone()[0]
        print(f"  Doc {doc_id}: {c} chunks")
        if c > best_chunks:
            best_chunks = c
            best_id = doc_id

    to_delete = [i for i in ids if i != best_id]
    print(f"  Keeping: {best_id} ({best_chunks} chunks)")
    print(f"  Deleting: {to_delete}")

    for del_id in to_delete:
        cur.execute("DELETE FROM document_chunks WHERE document_id = %s", (del_id,))
        cur.execute("DELETE FROM documents WHERE id = %s", (del_id,))
        print(f"  Deleted doc {del_id}")

conn.commit()

# Final state
cur.execute("""
    SELECT d.id, d.title, d.status, COUNT(dc.id) as chunks
    FROM documents d
    LEFT JOIN document_chunks dc ON dc.document_id = d.id
    GROUP BY d.id ORDER BY d.id
""")
print("\nFinal document state:")
for r in cur.fetchall():
    print(f"  [{r[0]}] {r[1]} | {r[2]} | {r[3]} chunks")

cur.execute("SELECT COUNT(*) FROM document_chunks")
print(f"\nTotal chunks in DB: {cur.fetchone()[0]}")

conn.close()
print("\nDone.")
