"""工作區靜態檢查，不啟動瀏覽器或任何服務。"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import re
import xml.etree.ElementTree as ET
import wave

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.errors, self.tags = [], [], [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for name, value in attrs.items():
            if name.startswith("on"):
                self.errors.append(f"Inline event handler: {name}")
            if name in ("href", "src") and value:
                self.refs.append(value)

page = Page()
page.feed((ROOT / "index.html").read_text(encoding="utf-8-sig"))
assert len(page.ids) == len(set(page.ids)), "Duplicate HTML IDs"
assert not page.errors, page.errors
for ref in page.refs:
    if ref.startswith("data:"):
        continue
    if ref.startswith("#"):
        assert ref[1:] in page.ids, ref
    else:
        assert ref.startswith("./"), ref
        assert (ROOT / ref).is_file(), ref
        assert urlparse(urljoin("https://example.github.io/nba-policy-island/", ref)).path.startswith("/nba-policy-island/"), ref
svg = ET.parse(ROOT / "assets/island-map.svg").getroot()
assert svg.attrib["viewBox"] == "0 0 1200 800"
svg_ids = [node.attrib["id"] for node in svg.iter() if "id" in node.attrib]
assert len(svg_ids) == len(set(svg_ids)), "Duplicate SVG IDs"
for node in svg.iter():
    for attr in ("href", "{http://www.w3.org/1999/xlink}href"):
        if attr in node.attrib:
            assert node.attrib[attr].startswith("#") and node.attrib[attr][1:] in svg_ids
for file in (ROOT / "style.css", ROOT / "assets/policy.css"):
    css = file.read_text(encoding="utf-8-sig")
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*' ''', "", css, flags=re.X)
    balance = 0
    for char in css:
        if char == "{":
            balance += 1
        elif char == "}":
            balance -= 1
        assert balance >= 0, file.name
    assert balance == 0, file.name
    print(f"CSS braces balanced: {file.relative_to(ROOT)} (not a browser layout check)")
assert not list((ROOT / "assets").glob("*.tmp")), "Temporary files remain"
tags = {tag for tag, attrs in page.tags}
assert {"a", "dl", "ol", "figure", "img", "figcaption", "audio", "noscript", "form", "label", "fieldset", "legend", "select", "optgroup", "table", "caption", "th"} <= tags
assert len([1 for tag, attrs in page.tags if tag == "optgroup"]) == 3
for tag, attrs in page.tags:
    if tag == "img":
        assert attrs.get("alt"), "Missing image alternative text"
    if tag == "audio":
        assert "autoplay" not in attrs, "Audio must be opt-in"
        assert attrs.get("preload") == "none"
for name in ("shot-hit.wav", "round-end.wav"):
    with wave.open(str(ROOT / "assets" / name), "rb") as sound:
        assert sound.getnchannels() == 1 and sound.getsampwidth() == 2
        assert sound.getframerate() == 22050 and sound.getcomptype() == "NONE"
        duration = sound.getnframes() / sound.getframerate()
        assert 0.1 < duration < 1
        assert any(sound.readframes(sound.getnframes())), "Silent audio asset"
        print(f"Local WAV valid: {name}, {duration:.2f}s, PCM16 mono")
print(f"HTML: {len(page.ids)} unique IDs; all local assets and anchors resolve")
print("SVG: XML parsed, viewBox and local references valid")
print("Required classroom HTML structures exist; 3 court optgroups; audio has no autoplay")
print("No inline handlers, remote scripts or root-relative assets")
