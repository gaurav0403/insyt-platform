"""
News source configurations and relevance definitions.
"""

# Publications we scrape — used for attribution and source tracking
PUBLICATIONS = {
    "moneycontrol": {"name": "Moneycontrol", "domain": "moneycontrol.com"},
    "economic_times": {"name": "Economic Times", "domain": "economictimes.indiatimes.com"},
    "livemint": {"name": "Livemint", "domain": "livemint.com"},
    "business_standard": {"name": "Business Standard", "domain": "business-standard.com"},
    "financial_express": {"name": "Financial Express", "domain": "financialexpress.com"},
    "ndtv_profit": {"name": "NDTV Profit", "domain": "ndtvprofit.com"},
    "hindu_business_line": {"name": "The Hindu Business Line", "domain": "thehindubusinessline.com"},
    "business_today": {"name": "Business Today", "domain": "businesstoday.in"},
    "times_of_india": {"name": "Times of India", "domain": "timesofindia.indiatimes.com"},
    "hindustan_times": {"name": "Hindustan Times", "domain": "hindustantimes.com"},
    "the_hindu": {"name": "The Hindu", "domain": "thehindu.com"},
    "indian_express": {"name": "Indian Express", "domain": "indianexpress.com"},
    "forbes_india": {"name": "Forbes India", "domain": "forbesindia.com"},
    "retail_jeweller": {"name": "Retail Jeweller India", "domain": "retailjewellerindia.com"},
}

# RSS feeds that actually work (tested 2026-04-21)
WORKING_RSS = {
    "economic_times": [
        "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
    ],
    "livemint": [
        "https://www.livemint.com/rss/companies",
        "https://www.livemint.com/rss/markets",
    ],
    "hindu_business_line": [
        "https://www.thehindubusinessline.com/feeder/default.rss",
    ],
    "business_today": [
        "https://www.businesstoday.in/rss/feed",
    ],
}

# ============================================================
# SEARCH QUERIES for targeted discovery via Serper / Google News
# These produce high-signal results vs generic RSS skimming
# ============================================================

SEARCH_QUERIES = {
    # Kalyan-specific
    "kalyan_core": [
        "Kalyan Jewellers",
        "Kalyan Jewellers news",
        "KALYANKJIL stock",
        "Kalyan Jewellers quarterly results",
        "Kalyanaraman jewellers",
        "Candere jewellery",
    ],
    # Competitor-specific
    "competitors": [
        "Tanishq jewellery news",
        "Malabar Gold news",
        "Joyalukkas news",
        "Senco Gold news",
        "Titan Company jewellery",
    ],
    # Industry narratives
    "industry": [
        "India jewellery industry",
        "gold jewellery demand India",
        "hallmarking India jewellery",
        "Akshaya Tritiya jewellery sales",
    ],
    # Regulatory / financial
    "regulatory": [
        "SEBI jewellery company India",
        "gold import duty India",
        "BIS hallmarking enforcement",
    ],
    # Ambassador mentions
    "ambassadors": [
        "Amitabh Bachchan brand ambassador jewellery",
        "Katrina Kaif Kalyan",
        "Manju Warrier Kalyan",
    ],
}

# ============================================================
# RELEVANCE SCORING — multi-tier keyword matching
# ============================================================

# STRONG: if any of these appear, the article is definitely relevant
STRONG_KEYWORDS = [
    "kalyan jewellers", "kalyan jewellery", "kalyan jewelers",
    "kalyankjil", "kalyanaraman", "candere",
    "kalyan gold", "kalyan store",
]

# SECTOR: jewellery industry content — relevant as context
SECTOR_KEYWORDS = [
    "tanishq", "malabar gold", "joyalukkas", "senco gold", "pc jeweller",
    "thangamayil", "caratlane", "bluestone", "titan company jewel",
    "jewellery industry india", "jewellery market india",
    "hallmarking", "akshaya tritiya", "dhanteras jewel",
    "gold jewellery demand", "gold jewellery sales",
    "retail jeweller", "organised jewellery",
    "amitabh bachchan jewel", "katrina kaif jewel",
    "manju warrier kalyan", "nagarjuna kalyan",
]

# WEAK: gold price articles are noise unless combined with sector keywords
NOISE_PATTERNS = [
    "gold rate today", "gold rates today", "silver rate today", "silver rates today",
    "gold price today", "gold price prediction",
    "22k gold rate", "24k gold rate", "18k gold rate",
]


def score_relevance(title: str, content: str) -> tuple[str, float]:
    """
    Score an article's relevance to the Kalyan/jewellery intelligence mission.
    Returns (tier, score) where tier is 'strong', 'sector', 'noise', or 'irrelevant'.
    """
    combined = (title + " " + content).lower()

    # Check noise patterns first — if it's ONLY a gold rate table, skip
    if any(p in title.lower() for p in NOISE_PATTERNS):
        # Unless it also mentions a brand specifically
        if any(k in combined for k in STRONG_KEYWORDS):
            return ("strong", 1.0)
        return ("noise", 0.1)

    # Strong match — definitely about Kalyan
    if any(k in combined for k in STRONG_KEYWORDS):
        return ("strong", 1.0)

    # Sector match — jewellery industry content
    sector_hits = sum(1 for k in SECTOR_KEYWORDS if k in combined)
    if sector_hits >= 2:
        return ("sector", 0.7)
    if sector_hits == 1:
        return ("sector", 0.5)

    return ("irrelevant", 0.0)
