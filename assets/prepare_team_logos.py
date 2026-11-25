"""Keep provided originals; give PNG bytes an accurate extension without editing pixels."""
from pathlib import Path
import hashlib
import json
import struct
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[1]


def png_info(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "Expected the supplied PNG content"
    offset = 8
    info = None
    while offset < len(data):
        length = struct.unpack_from(">I", data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + length]
        crc = struct.unpack_from(">I", data, offset + 8 + length)[0]
        assert zlib.crc32(kind + payload) & 0xFFFFFFFF == crc, "Corrupt PNG chunk"
        if kind == b"IHDR":
            width, height, depth, color, *_ = struct.unpack(">IIBBBBB", payload)
            assert width > 0 and height > 0 and depth == 8 and color == 6, "Expected RGBA PNG"
            info = {"width": width, "height": height, "format": "PNG", "alpha": True}
        offset += length + 12
        if kind == b"IEND":
            assert offset == len(data), "Unexpected trailing bytes"
            return info
    raise ValueError("Incomplete PNG")


def main():
    teams = json.loads(subprocess.check_output(
        ["node", "-e", "process.stdout.write(JSON.stringify(require('./assets/island-core.js').TEAMS))"],
        cwd=ROOT, encoding="utf-8"))
    target = ROOT / "assets/team/logos"
    target.mkdir(exist_ok=True)
    entries = []
    for team in teams:
        source = ROOT / team["logoSource"]
        data = source.read_bytes()
        info = png_info(data)
        (ROOT / team["logo"]).write_bytes(data)
        entries.append({"teamId": team["id"], "abbr": team["abbr"],
                        "source": team["logoSource"], "path": team["logo"],
                        **info, "sha256": hashlib.sha256(data).hexdigest()})
    (ROOT / "assets/team/logo-manifest.json").write_text(
        json.dumps({"note": "Original PNG bytes copied unchanged; supplied .webp files retained.",
                    "logos": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Prepared {len(entries)} exact PNG copies; originals and alpha retained.")


if __name__ == "__main__":
    main()
