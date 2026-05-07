"""
Phase 0 - Data Collection Script
Pulls Platinum+ ranked match records from Riot Games API and stores them in MongoDB.
Run this from Day 1 and let it collect in the background for 1–2 weeks.

Usage:
    cd ml_service
    python -m venv venv
    venv\\Scripts\\activate          # Windows
    pip install -r requirements.txt
    python data/collect_matches.py

Target: 500,000+ matches (≈ 5,000,000 training samples after feature extraction)
Rate:   100 req / 2 min (dev key) → ~72,000 matches/day
"""

import os
import time
import json
import logging
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from riotwatcher import LolWatcher, ApiError
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

#Config

RIOT_API_KEY = os.getenv("RIOT_API_KEY", "")
MONGO_URI    = os.getenv("MONGO_URI", "")
REGION       = "sg2"         #Singapore
MATCH_REGION = "sea"         #South East Asia
MIN_TIER     = "PLATINUM"    #Platinum+ for quality data
QUEUE        = 420           #Ranked Solo/Duo queue ID
TARGET_COUNT = 500_000       #Target match records to collect
BATCH_SIZE   = 100           #Matches to fetch per summoner seed

#MongoDB Setup

client = MongoClient(MONGO_URI)
db     = client["draftsense"]
raw_matches_col = db["raw_matches"]
raw_matches_col.create_index("metadata.matchId", unique=True)

#Riot API Setup

watcher = LolWatcher(RIOT_API_KEY)


def get_seed_summoners(tier: str = MIN_TIER, division: str = "I") -> list[str]:
    """Fetch a page of summoner PUUIDs from a given tier/division ranked ladder."""
    try:
        entries = watcher.league.entries(REGION, "RANKED_SOLO_5x5", tier, division, page=1)
        if not entries:
            log.warning(f"No league entries returned for {tier} {division}")
            return []

        puuids = []
        for entry in entries[:50]:
            #Newer Riot servers (SG2, etc.) include puuid directly in the entry
            puuid = entry.get("puuid")
            if puuid:
                puuids.append(puuid)
                continue

            #Fallback: look up puuid via summonerId for older servers
            sid = entry.get("summonerId")
            if not sid:
                log.debug(f"Entry has neither puuid nor summonerId, skipping: {entry}")
                continue
            try:
                summoner = watcher.summoner.by_id(REGION, sid)
                puuids.append(summoner["puuid"])
                time.sleep(0.05)
            except ApiError as e:
                if e.response.status_code == 404:
                    continue
                raise e

        log.info(f"Found {len(puuids)} players in {tier} {division}")
        return puuids
    except ApiError as e:
        log.error(f"Failed to fetch summoner seeds: {e}")
        return []


def get_match_ids(puuid: str, count: int = BATCH_SIZE) -> list[str]:
    """Get the most recent ranked match IDs for a given summoner PUUID."""
    try:
        return watcher.match.matchlist_by_puuid(
            MATCH_REGION, puuid,
            queue=QUEUE, count=count
        )
    except ApiError as e:
        log.warning(f"Failed to get match list for {puuid[:8]}...: {e}")
        return []


def fetch_and_store_match(match_id: str) -> bool:
    """
    Fetch a single match, extract relevant fields, and store in MongoDB.
    Returns True if the match was new and stored, False if duplicate or error.
    """
    try:
        match = watcher.match.by_id(MATCH_REGION, match_id)
        info  = match["info"]

        #Filter: must be ranked solo/duo, game must have ended normally
        if info["queueId"] != QUEUE or info.get("endOfGameResult") == "Abort_Unexpected":
            return False

        #Extract pick/ban data + outcome per team
        picks: dict[str, list] = {"100": [], "200": []}   #blue / red team
        for participant in info["participants"]:
            picks[str(participant["teamId"])].append({
                "championId":   participant["championId"],
                "championName": participant["championName"],
                "individualPosition": participant.get("individualPosition", "NONE"),
                "teamPosition":       participant.get("teamPosition", "NONE"),
                "win":                participant["win"],
                "puuid":              participant["puuid"],
            })

        bans: list[dict] = []
        for team in info.get("teams", []):
            for ban in team.get("bans", []):
                if ban["championId"] != -1:  #-1 = no ban
                    bans.append({
                        "teamId":     team["teamId"],
                        "championId": ban["championId"],
                        "pickTurn":   ban["pickTurn"],
                    })

        document = {
            "metadata": match["metadata"],
            "patch":    info["gameVersion"].rsplit(".", 1)[0],  #e.g. "14.8"
            "duration": info["gameDuration"],
            "picks":    picks,
            "bans":     bans,
            "collectedAt": datetime.utcnow().isoformat(),
        }

        raw_matches_col.insert_one(document)
        return True

    except DuplicateKeyError:
        return False   #already collected
    except ApiError as e:
        if e.response.status_code == 429:
            log.warning("Rate limited - sleeping 120s")
            time.sleep(120)
        return False
    except Exception as e:
        log.error(f"Unexpected error for {match_id}: {e}")
        return False


def collect(target: int = TARGET_COUNT) -> None:
    """Main collection loop. Runs indefinitely until target is reached."""
    current_count = raw_matches_col.count_documents({})
    log.info(f"Starting collection. Already have {current_count:,} matches. Target: {target:,}")

    tiers = [
        ("PLATINUM", "I"), ("PLATINUM", "II"),
        ("EMERALD",  "I"), ("EMERALD",  "II"),
        ("DIAMOND",  "I"), ("DIAMOND",  "II"),
    ]

    while current_count < target:
        for tier, division in tiers:
            log.info(f"Seeding from {tier} {division}...")
            puuids = get_seed_summoners(tier, division)
            log.info(f"Found {len(puuids)} players. Checking match histories...")
            time.sleep(1.2)  #rate limit buffer

            for puuid in puuids:
                match_ids = get_match_ids(puuid)
                if not match_ids:
                    log.debug(f"No recent matches found for {puuid[:8]}...")
                    continue
                
                log.info(f"Found {len(match_ids)} matches for player {puuid[:8]}. Downloading...")
                for match_id in match_ids:
                    stored = fetch_and_store_match(match_id)
                    if stored:
                        current_count += 1
                        log.info(f"Saved match {match_id} (Total: {current_count})")
                        if current_count % 1000 == 0:
                            log.info(f"Progress: {current_count:,} / {target:,} matches collected")
                    time.sleep(0.65)  #~92 req/min - safely under 100/2min limit

                if current_count >= target:
                    break

            if current_count >= target:
                break

    log.info(f"✅ Collection complete. Total matches stored: {current_count:,}")


if __name__ == "__main__":
    collect()
