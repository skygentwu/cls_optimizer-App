#!/usr/bin/env python3
"""
cls_optimizer -> cls_optimizer-App sync script
Usage: python scripts/sync_from_source.py [--check-only]
"""

import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

SOURCE_ROOT = Path("D:/python/cls_optimizer")
TARGET_ROOT = Path("D:/python/cls_optimizer-App")
MAPPING_FILE = TARGET_ROOT / ".kimi" / "sync-mapping.json"


def load_mapping() -> dict[str, Any]:
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def check_file_changed(source: Path, target: Path) -> bool:
    if not target.exists():
        return True
    return source.stat().st_mtime > target.stat().st_mtime


def copy_file(source: Path, target: Path) -> bool:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return True


def check_git_diff(source_root: Path, pattern: str) -> list[str]:
    import subprocess
    try:
        result = subprocess.run(
            ["git", "-C", str(source_root), "status", "--short", pattern],
            capture_output=True,
            text=True,
            check=True,
        )
        lines = [line.strip() for line in result.stdout.strip().split("\n") if line.strip()]
        return lines
    except subprocess.CalledProcessError:
        return []


def sync_copy(mapping: dict, check_only: bool = False) -> list[str]:
    reports = []
    source_rel = mapping["source"]
    target_rel = mapping["target"]
    source = SOURCE_ROOT / source_rel
    target = TARGET_ROOT / target_rel

    if not source.exists():
        reports.append(f"  [WARN] Source not found: {source_rel}")
        return reports

    changed = check_file_changed(source, target)
    if changed:
        if check_only:
            reports.append(f"  [PENDING] {source_rel} -> {target_rel}")
        else:
            if copy_file(source, target):
                reports.append(f"  [SYNCED] {source_rel} -> {target_rel}")
    else:
        reports.append(f"  [OK] {source_rel} is up to date")

    return reports


def sync_reference(mapping: dict, check_only: bool = False) -> list[str]:
    reports = []
    source_rel = mapping["source"]
    target_rel = mapping["target"]
    note = mapping.get("note", "")

    source = SOURCE_ROOT / source_rel

    if source.is_dir():
        git_changes = check_git_diff(SOURCE_ROOT, source_rel + "/")
        if git_changes:
            reports.append(f"  [PENDING] {mapping['description']} has changes:")
            for change in git_changes[:10]:
                reports.append(f"      {change}")
            if len(git_changes) > 10:
                reports.append(f"      ... and {len(git_changes) - 10} more files")
            reports.append(f"      [ACTION] Manual update needed: {target_rel}")
            if note:
                reports.append(f"      [HINT] {note}")
        else:
            reports.append(f"  [OK] {mapping['description']} no changes")
    else:
        if not source.exists():
            reports.append(f"  [WARN] Source not found: {source_rel}")
            return reports

        target = TARGET_ROOT / target_rel
        changed = check_file_changed(source, target)
        if changed:
            reports.append(f"  [PENDING] {mapping['description']} changed: {source_rel}")
            reports.append(f"      [ACTION] Manual update needed: {target_rel}")
            if note:
                reports.append(f"      [HINT] {note}")
        else:
            reports.append(f"  [OK] {mapping['description']} is up to date")

    return reports


def scan_api_changes() -> list[str]:
    reports = []
    routers_dir = SOURCE_ROOT / "backend" / "app" / "routers"
    if not routers_dir.exists():
        return reports

    reports.append("")
    reports.append("[API ROUTERS SCAN]")
    for py_file in sorted(routers_dir.glob("*.py")):
        if py_file.name == "__init__.py":
            continue
        git_changes = check_git_diff(SOURCE_ROOT, str(py_file.relative_to(SOURCE_ROOT)))
        if git_changes:
            reports.append(f"  [PENDING] {py_file.name} has changes")

    return reports


def scan_schema_changes() -> list[str]:
    reports = []
    schemas_file = SOURCE_ROOT / "backend" / "app" / "schemas.py"
    if schemas_file.exists():
        git_changes = check_git_diff(SOURCE_ROOT, "backend/app/schemas.py")
        if git_changes:
            reports.append("")
            reports.append("[SCHEMA SCAN]")
            reports.append(f"  [PENDING] backend/app/schemas.py has changes")
            reports.append(f"      [ACTION] Update src/types/index.ts accordingly")

    return reports


def main():
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    check_only = "--check-only" in sys.argv

    print("=" * 60)
    print("SYNC: cls_optimizer -> cls_optimizer-App")
    print("=" * 60)

    mapping = load_mapping()
    all_reports = []

    for item in mapping["mappings"]:
        all_reports.append("")
        all_reports.append(f"[ {item['description']} ]")
        if item["type"] == "copy":
            all_reports.extend(sync_copy(item, check_only))
        elif item["type"] == "reference":
            all_reports.extend(sync_reference(item, check_only))

    all_reports.extend(scan_api_changes())
    all_reports.extend(scan_schema_changes())

    for line in all_reports:
        print(line)

    pending_count = sum(1 for line in all_reports if "[PENDING]" in line)
    synced_count = sum(1 for line in all_reports if "[SYNCED]" in line)

    print("")
    print("=" * 60)
    if check_only:
        print(f"SUMMARY: {pending_count} items pending sync")
        if pending_count > 0:
            print("   Run `python scripts/sync_from_source.py` to apply")
    else:
        print(f"SUMMARY: {synced_count} files auto-synced, {pending_count} need manual work")
    print("=" * 60)

    return 1 if pending_count > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
