"""
Generates data/champions.json by downloading the champion list from
Riot's public Data Dragon CDN. No API key required.

Usage:
    python data/generate_champions.py
"""

import json
import urllib.request
from pathlib import Path

OUTPUT = Path("data/champions.json")

#Step 1: Get the latest patch version
print("Fetching latest patch version...")
with urllib.request.urlopen("https://ddragon.leagueoflegends.com/api/versions.json") as r:
    versions = json.loads(r.read())
latest = versions[0]
print(f"Latest patch: {latest}")

#Step 2: Download champion data
url = f"https://ddragon.leagueoflegends.com/cdn/{latest}/data/en_US/champion.json"
print(f"Downloading champion list from {url}...")
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())

#Step 3: Extract champion names and sort alphabetically for consistency
champion_names = sorted(data["data"].keys())
print(f"Found {len(champion_names)} champions.")

#Step 4: Save to file
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT, "w") as f:
    json.dump(champion_names, f, indent=2)

print(f"✅ Saved {len(champion_names)} champions to {OUTPUT}")
print(f"   First few: {champion_names[:5]}")
print(f"   Last few:  {champion_names[-5:]}")
