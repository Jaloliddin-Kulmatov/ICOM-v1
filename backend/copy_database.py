"""Copy every ICOM table from one Postgres database to another (Neon → Supabase).

    SOURCE_DATABASE_URL=...  TARGET_DATABASE_URL=...  python copy_database.py [--replace]

* Builds the schema on the target with the app's own models and startup
  migrations, then copies rows table by table in foreign-key order.
* Refuses to touch a target that already has data, unless --replace is given
  (which empties the target's ICOM tables first).
* Resets id sequences, then compares row counts and exits 1 on any mismatch.
* Never prints the connection strings.
"""
import os
import sys

BATCH = 500


def _norm(url: str) -> str:
    for prefix in ("postgres://", "postgresql://", "postgresql+psycopg://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


def main() -> int:
    source_url = os.environ.get("SOURCE_DATABASE_URL", "").strip()
    target_url = os.environ.get("TARGET_DATABASE_URL", "").strip()
    if not source_url or not target_url:
        print("Set SOURCE_DATABASE_URL (Neon) and TARGET_DATABASE_URL (Supabase).")
        return 2
    if _norm(source_url) == _norm(target_url):
        print("Source and target are the same database. Nothing to do.")
        return 2
    replace = "--replace" in sys.argv

    # Importing the app against the target creates every table and runs the
    # startup migrations there. No seeding, no scheduler.
    os.environ.update({"DATABASE_URL": target_url, "STARTUP_TASKS": "0", "DISABLE_SCHEDULER": "1"})
    os.environ.pop("FLASK_ENV", None)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from sqlalchemy import create_engine, inspect, select, text, func
    import app as app_module
    from app import db

    src = create_engine(_norm(source_url), pool_pre_ping=True)
    with app_module.app.app_context():
        tgt = db.engine
        tables = list(db.metadata.sorted_tables)   # parents before children
        src_tables = set(inspect(src).get_table_names())

        with tgt.connect() as conn:
            filled = [t.name for t in tables if conn.execute(select(func.count()).select_from(t)).scalar()]
        if filled and not replace:
            print(f"The target already has data in: {', '.join(filled)}.")
            print("Nothing was copied. Run again with --replace to empty the target first.")
            return 1
        if filled:
            with tgt.begin() as conn:
                names = ", ".join(f'"{t.name}"' for t in tables)
                conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
            print(f"Emptied {len(filled)} target table(s).")

        report, ok = [], True
        for table in tables:
            if table.name not in src_tables:
                report.append((table.name, 0, 0, "not in source"))
                continue
            src_cols = {c["name"] for c in inspect(src).get_columns(table.name)}
            cols = [c for c in table.columns if c.name in src_cols]
            order = [c for c in table.primary_key.columns] or cols[:1]
            copied = 0
            with src.connect() as s, tgt.begin() as t:
                result = s.execution_options(stream_results=True).execute(
                    select(*[text(f'"{c.name}"') for c in cols]).select_from(text(f'"{table.name}"'))
                    .order_by(*[text(f'"{c.name}"') for c in order]))
                while True:
                    rows = result.fetchmany(BATCH)
                    if not rows:
                        break
                    t.execute(table.insert(), [dict(zip((c.name for c in cols), r)) for r in rows])
                    copied += len(rows)
                # Next new row gets max(id) + 1.
                if "id" in table.c and table.c.id.autoincrement in (True, "auto"):
                    t.execute(text(
                        f"SELECT setval(pg_get_serial_sequence('\"{table.name}\"', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM \"{table.name}\"), 1), "
                        f"(SELECT MAX(id) FROM \"{table.name}\") IS NOT NULL)"))
            with src.connect() as s, tgt.connect() as t:
                n_src = s.execute(text(f'SELECT COUNT(*) FROM "{table.name}"')).scalar()
                n_tgt = t.execute(text(f'SELECT COUNT(*) FROM "{table.name}"')).scalar()
            status = "ok" if n_src == n_tgt else "MISMATCH"
            ok &= n_src == n_tgt
            report.append((table.name, n_src, n_tgt, status))

        extra = sorted(src_tables - {t.name for t in tables})
        app_module._lock_supabase_data_api()

    width = max(len(r[0]) for r in report)
    print(f"{'table'.ljust(width)}  {'source':>7}  {'target':>7}  status")
    for name, a, b, status in report:
        print(f"{name.ljust(width)}  {a:>7}  {b:>7}  {status}")
    if extra:
        print(f"Not copied (the app doesn't use them): {', '.join(extra)}")
    print("All row counts match." if ok else "Some row counts differ. Don't switch DATABASE_URL yet.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
