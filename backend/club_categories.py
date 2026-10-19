"""Club/community categories. Same keys as src/lib/club-categories.ts."""

CATEGORIES = [
    "academic", "sports & outdoor", "arts & culture", "social", "language", "tech",
    "business", "volunteer", "national community", "religion & culture", "support & community",
]
OLD_NAMES = {
    "sports": "sports & outdoor", "outdoor": "sports & outdoor", "health & wellness": "sports & outdoor",
    "arts": "arts & culture", "culture": "arts & culture", "food & culture": "arts & culture",
    "technology": "tech",
}


def normalize(raw, club_type: str = "club") -> str:
    k = (raw or "").strip().lower()
    if k in CATEGORIES:
        return k
    if k == "culture" and (club_type or "club") == "community":
        return "national community"   # the "culture" communities are national student associations
    return OLD_NAMES.get(k, "social")
