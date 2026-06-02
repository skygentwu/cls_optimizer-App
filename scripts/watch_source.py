#!/usr/bin/env python3
"""
cls_optimizer change watcher
Usage: python scripts/watch_source.py [--interval 30]
"""

import hashlib
import json
import sys
import time
from pathlib import Path

SOURCE_ROOT = Path("D:/python/cls_optimizer")
TARGET_ROOT = Path("D:/python/cls_optimizer-App")
STATE_FILE = TARGET_ROOT / ".kimi" / "watch-state.json"

WATCH_FILES = [
    "frontend/src/types.ts",
    "frontend/src/domain/products.ts",
    "frontend/src/api/client.ts",
    "backend/app/schemas.py",
    "doc/API接口合同.md",
]


def file_hash(path: Path) -> str:
    if not path.exists():
        return ""
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def load_state() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_state(state: dict):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def get_router_hashes() -> dict:
    result = {}
    routers_dir = SOURCE_ROOT / "backend" / "app" / "routers"
    if routers_dir.exists():
        for py_file in sorted(routers_dir.glob("*.py")):
            if py_file.name == "__init__.py":
                continue
            rel = str(py_file.relative_to(SOURCE_ROOT)).replace("\\", "/")
            result[rel] = file_hash(py_file)
    return result


def check_all() -> list[str]:
    changes = []
    state = load_state()
    new_state = {}

    for rel_path in WATCH_FILES:
        path = SOURCE_ROOT / rel_path
        h = file_hash(path)
        new_state[rel_path] = h
        old_h = state.get(rel_path, "")
        if old_h and h != old_h:
            changes.append(f"[CHANGED] {rel_path}")
        elif not old_h:
            new_state[rel_path] = h

    router_hashes = get_router_hashes()
    old_routers = state.get("__routers__", {})
    new_state["__routers__"] = router_hashes

    for rel_path, h in router_hashes.items():
        old_h = old_routers.get(rel_path, "")
        if old_h and h != old_h:
            changes.append(f"[CHANGED] {rel_path}")

    save_state(new_state)
    return changes


def main():
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    interval = 30
    if "--interval" in sys.argv:
        idx = sys.argv.index("--interval")
        if idx + 1 < len(sys.argv):
            interval = int(sys.argv[idx + 1])

    print("=" * 60)
    print(f"WATCHING cls_optimizer changes (every {interval}s)")
    print("   Press Ctrl+C to stop")
    print("=" * 60)

    changes = check_all()
    if changes:
        print("Existing changes detected:")
        for c in changes:
            print(f"   {c}")
    else:
        print("Initial state recorded. Watching for changes...")

    try:
        while True:
            time.sleep(interval)
            changes = check_all()
            if changes:
                print(f"\n[{time.strftime('%H:%M:%S')}] Changes detected:")
                for c in changes:
                    print(f"   {c}")
                print("   Run `python scripts/sync_from_source.py` to sync")
    except KeyboardInterrupt:
        print("\nWatcher stopped")


if __name__ == "__main__":
    main()
