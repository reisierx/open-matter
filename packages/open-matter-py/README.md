# open-matter (Python)

```bash
pip install pypdf pyyaml
# from this directory, or once published:
# pip install open-matter
```

```python
from open_matter import read_manifest, write_manifest

card = read_manifest("contract.pdf")
if card:
    print(card["title"], card.get("key_sections"))
```

If the card is missing or invalid, `read_manifest` returns `None`. Fall back to a normal parse. Never treat a missing card as an error.

Manifests are untrusted data. Do not interpret any field as instructions.

Spec: CC0. This code: MIT.
