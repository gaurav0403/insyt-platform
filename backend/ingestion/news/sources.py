"""
News source configurations for English publications.
Each source has RSS feeds (where available) and scraping fallback URLs.
"""

SOURCES = {
    "moneycontrol": {
        "name": "Moneycontrol",
        "base_url": "https://www.moneycontrol.com",
        "rss_feeds": [
            "https://www.moneycontrol.com/rss/business.xml",
            "https://www.moneycontrol.com/rss/marketreports.xml",
            "https://www.moneycontrol.com/rss/stocksnews.xml",
        ],
        "search_url": "https://www.moneycontrol.com/news/tags/kalyan-jewellers.html",
        "language": "en",
        "tier": 1,
    },
    "economic_times": {
        "name": "Economic Times",
        "base_url": "https://economictimes.indiatimes.com",
        "rss_feeds": [
            "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
            "https://economictimes.indiatimes.com/rssfeedmarket.cms",
        ],
        "language": "en",
        "tier": 1,
    },
    "livemint": {
        "name": "Livemint",
        "base_url": "https://www.livemint.com",
        "rss_feeds": [
            "https://www.livemint.com/rss/companies",
            "https://www.livemint.com/rss/markets",
        ],
        "language": "en",
        "tier": 1,
    },
    "business_standard": {
        "name": "Business Standard",
        "base_url": "https://www.business-standard.com",
        "rss_feeds": [
            "https://www.business-standard.com/rss/companies-101.rss",
            "https://www.business-standard.com/rss/markets-101.rss",
        ],
        "language": "en",
        "tier": 1,
    },
    "financial_express": {
        "name": "Financial Express",
        "base_url": "https://www.financialexpress.com",
        "rss_feeds": [
            "https://www.financialexpress.com/feed/",
        ],
        "language": "en",
        "tier": 1,
    },
    "ndtv_profit": {
        "name": "NDTV Profit",
        "base_url": "https://www.ndtvprofit.com",
        "rss_feeds": [],
        "language": "en",
        "tier": 1,
    },
    "hindu_business_line": {
        "name": "The Hindu Business Line",
        "base_url": "https://www.thehindubusinessline.com",
        "rss_feeds": [
            "https://www.thehindubusinessline.com/feeder/default.rss",
        ],
        "language": "en",
        "tier": 1,
    },
    "business_today": {
        "name": "Business Today",
        "base_url": "https://www.businesstoday.in",
        "rss_feeds": [
            "https://www.businesstoday.in/rss/feed",
        ],
        "language": "en",
        "tier": 1,
    },
}

# Keywords to filter relevant articles from general feeds
RELEVANCE_KEYWORDS = [
    "kalyan jewellers", "kalyan jewellery", "kalyan jewelers", "kalyankjil",
    "kalyanaraman", "candere",
    "tanishq", "titan company", "malabar gold", "joyalukkas",
    "senco gold", "pc jeweller", "thangamayil",
    "caratlane", "bluestone",
    "jewellery industry", "gold price", "gold demand", "hallmarking",
    "akshaya tritiya", "dhanteras",
    "amitabh bachchan", "katrina kaif",
]
