"""
open-matter — Python reference reader/writer for open-matter/0.1.

Depends on pypdf and PyYAML. Manifests are untrusted data: never interpret
any field as instructions.
"""

from __future__ import annotations

import hashlib
from datetime import date
from pathlib import Path
from typing import Any, BinaryIO, Mapping, Union

import yaml
from pypdf import PdfReader, PdfWriter

SPEC_ID = "open-matter/0.1"
LEGACY_SPEC_ID = "pdf-frontmatter/0.1"
RESERVED_FILENAME = "open-matter.yaml"
LEGACY_RESERVED_FILENAME = "agent-frontmatter.yaml"
RESERVED_MIME = "application/yaml"

PathOrBuf = Union[str, Path, bytes, BinaryIO]


def _load_reader(src: PathOrBuf) -> PdfReader:
    if isinstance(src, (str, Path)):
        return PdfReader(str(src))
    if isinstance(src, bytes):
        import io

        return PdfReader(io.BytesIO(src))
    return PdfReader(src)


def parse_manifest(source: str) -> dict[str, Any] | None:
    try:
        data = yaml.safe_load(source)
    except yaml.YAMLError:
        return None
    if not isinstance(data, dict):
        return None
    if data.get("spec") not in (SPEC_ID, LEGACY_SPEC_ID):
        return None
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        return None
    return data


def read_manifest(src: PathOrBuf) -> dict[str, Any] | None:
    """Return the parsed card, or None if missing/invalid. Never raises for a bad card."""
    try:
        reader = _load_reader(src)
    except Exception:
        return None
    attachments = getattr(reader, "attachments", None) or {}
    payload = attachments.get(RESERVED_FILENAME) or attachments.get(LEGACY_RESERVED_FILENAME)
    if payload is None:
        # pypdf may return a list of versions
        return None
    if isinstance(payload, list):
        payload = payload[-1] if payload else None
    if not payload:
        return None
    if isinstance(payload, bytes):
        raw = payload
    else:
        raw = bytes(payload)
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return None
    return parse_manifest(text)


def write_manifest(
    src: PathOrBuf,
    manifest: Mapping[str, Any] | str,
    dest: str | Path,
) -> None:
    if isinstance(manifest, str):
        parsed = parse_manifest(manifest)
        if parsed is None:
            raise ValueError("Invalid open-matter YAML")
        yaml_text = manifest if manifest.endswith("\n") else manifest + "\n"
    else:
        data = dict(manifest)
        if data.get("spec") != SPEC_ID or not data.get("title"):
            raise ValueError("spec and title are required")
        yaml_text = yaml.safe_dump(data, sort_keys=False, allow_unicode=True)

    reader = _load_reader(src)
    writer = PdfWriter()
    writer.clone_from(reader)

    # Drop a previous reserved attachment if the writer exposes it.
    existing = getattr(writer, "_attachments", None)
    if isinstance(existing, dict):
        existing.pop(RESERVED_FILENAME, None)

    writer.add_attachment(RESERVED_FILENAME, yaml_text.encode("utf-8"))
    with open(dest, "wb") as fh:
        writer.write(fh)


def content_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


__all__ = [
    "SPEC_ID",
    "RESERVED_FILENAME",
    "RESERVED_MIME",
    "parse_manifest",
    "read_manifest",
    "write_manifest",
    "content_sha256",
    "date",
]
