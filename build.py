"""Builds the single-file demo: inlines the Tech Mahindra logo into src.html."""
import base64
from pathlib import Path

here = Path(__file__).parent
logo = base64.b64encode((here / "assets" / "techm-logo.png").read_bytes()).decode()
html = (here / "src.html").read_text(encoding="utf-8")
out = html.replace("{{LOGO}}", "data:image/png;base64," + logo)
(here / "sourcing-decision-desk.html").write_text(out, encoding="utf-8")
# index.html is the page a static host (GitHub Pages, Vercel) serves at the root URL.
(here / "index.html").write_text(out, encoding="utf-8")
print("Built sourcing-decision-desk.html and index.html", len(out), "bytes")
