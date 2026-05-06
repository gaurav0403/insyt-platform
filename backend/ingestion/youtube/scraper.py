"""
YouTube ingestion via YouTube Data API v3.
Pulls videos with engagement data + transcripts via SearchAPI.
Filters out Shorts and brand-owned ads to focus on signal content.
"""
import uuid
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
import structlog

from backend.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

YT_API = "https://www.googleapis.com/youtube/v3"

SEARCH_QUERIES = [
    # Brand analysis
    ("Kalyan Jewellers analysis", "long"),
    ("Kalyan Jewellers review", "medium"),
    ("KALYANKJIL stock", "medium"),
    ("Kalyan Jewellers share price", "medium"),
    # Consumer signals
    ("Kalyan Jewellers fraud", "medium"),
    ("Kalyan Jewellers complaint", "medium"),
    ("Kalyan Jewellers gold quality", "medium"),
    ("Kalyan Jewellers making charges", "medium"),
    # Competitive
    ("Tanishq vs Kalyan", "medium"),
    ("Malabar Gold vs Kalyan", "medium"),
    ("jewellery stock comparison India", "medium"),
    # Industry
    ("jewellery hallmarking India", "medium"),
    ("gold jewellery scam India", "medium"),
    # Regional
    ("Kalyan Jewellers Malayalam", "medium"),
    ("Kalyan Jewellers Tamil", "medium"),
]

# Skip brand-owned channels (we want independent content)
SKIP_CHANNELS = {
    "UC1_ZUbWajNhCbQuSD4609XQ",  # Kalyan Jewellers official
}


def search_youtube(query: str, duration: str = "medium", max_results: int = 10) -> list[dict]:
    """Search YouTube with date and duration filtering."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%dT00:00:00Z")

    try:
        resp = httpx.get(f"{YT_API}/search", params={
            "key": settings.youtube_api_key,
            "q": query,
            "part": "snippet",
            "type": "video",
            "maxResults": max_results,
            "order": "relevance",
            "publishedAfter": cutoff,
            "videoDuration": duration,
        }, timeout=15)
        resp.raise_for_status()
        return resp.json().get("items", [])
    except Exception as e:
        logger.warning("youtube.search_failed", query=query, error=str(e))
        return []


def get_video_stats(video_ids: list[str]) -> dict:
    """Get view counts, likes, comments for videos."""
    if not video_ids:
        return {}
    try:
        resp = httpx.get(f"{YT_API}/videos", params={
            "key": settings.youtube_api_key,
            "id": ",".join(video_ids),
            "part": "statistics,contentDetails",
        }, timeout=15)
        resp.raise_for_status()
        result = {}
        for item in resp.json().get("items", []):
            stats = item.get("statistics", {})
            result[item["id"]] = {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "duration": item.get("contentDetails", {}).get("duration", ""),
            }
        return result
    except Exception as e:
        logger.warning("youtube.stats_failed", error=str(e))
        return {}


def get_transcript(video_id: str) -> str | None:
    """Get transcript via SearchAPI youtube_transcripts engine."""
    if not settings.searchapi_key:
        return None
    try:
        resp = httpx.get("https://www.searchapi.io/api/v1/search", params={
            "api_key": settings.searchapi_key,
            "engine": "youtube_transcripts",
            "video_id": video_id,
        }, timeout=15)
        resp.raise_for_status()
        lines = resp.json().get("transcripts", [])
        if lines:
            return " ".join(line.get("text", "") for line in lines).strip()
    except Exception as e:
        logger.debug("youtube.transcript_failed", video_id=video_id, error=str(e))
    return None


def store_videos(videos: list[dict]) -> int:
    """Store YouTube videos in mentions table."""
    engine = create_engine(settings.database_url_sync)
    inserted = 0

    with engine.begin() as conn:
        for v in videos:
            url = v.get("url", "")
            if not url:
                continue

            exists = conn.execute(
                text("SELECT 1 FROM mentions WHERE source_url = :url"),
                {"url": url}
            ).fetchone()
            if exists:
                continue

            title = v.get("title", "")
            content = v.get("transcript") or v.get("description", "")
            if not content or len(content) < 20:
                content = title

            stats = v.get("stats", {})
            views = stats.get("views", 0)
            likes = stats.get("likes", 0)
            comments = stats.get("comments", 0)

            conn.execute(text("""
                INSERT INTO mentions (id, source_type, source_url, source_publication, title, author,
                    published_at, ingested_at, raw_content, content_hash, language, metadata)
                VALUES (:id, 'youtube', :url, :pub, :title, :author, :pub_at, :ing_at, :content,
                    :hash, :lang, :meta)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "url": url,
                "pub": f"YouTube \u00B7 {v.get('channel_name', 'Unknown')}",
                "title": title[:200],
                "author": v.get("channel_name", ""),
                "pub_at": v.get("published_at"),
                "ing_at": datetime.now(timezone.utc),
                "content": content[:3000],
                "hash": str(hash(url)),
                "lang": v.get("lang", "en"),
                "meta": f'{{"views": {views}, "likes": {likes}, "comments": {comments}, "duration": "{stats.get("duration", "")}", "channel_id": "{v.get("channel_id", "")}", "video_id": "{v.get("video_id", "")}", "has_transcript": {str(bool(v.get("transcript"))).lower()}, "source": "youtube_data_api"}}',
            })
            inserted += 1

    return inserted


def run_youtube_ingestion(fetch_transcripts: bool = True, max_transcripts: int = 20):
    """Full YouTube ingestion pipeline."""
    if not settings.youtube_api_key:
        print("ERROR: INSYT_YOUTUBE_API_KEY not set.")
        return

    all_videos = {}  # dedup by video ID

    for query, duration in SEARCH_QUERIES:
        items = search_youtube(query, duration, max_results=10)
        vid_ids = []

        for item in items:
            vid_id = item["id"]["videoId"]
            snippet = item["snippet"]
            channel_id = snippet.get("channelId", "")

            if channel_id in SKIP_CHANNELS:
                continue
            if vid_id in all_videos:
                continue

            vid_ids.append(vid_id)
            all_videos[vid_id] = {
                "video_id": vid_id,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channel_name": snippet.get("channelTitle", ""),
                "channel_id": channel_id,
                "published_at": snippet.get("publishedAt"),
                "url": f"https://www.youtube.com/watch?v={vid_id}",
                "lang": "en",
                "query": query,
            }

        # Get stats for this batch
        if vid_ids:
            stats = get_video_stats(vid_ids)
            for vid_id, s in stats.items():
                if vid_id in all_videos:
                    all_videos[vid_id]["stats"] = s

        logger.info("youtube.search_done", query=query[:30], found=len(vid_ids))

    print(f"Unique videos found: {len(all_videos)}")

    # Fetch transcripts for top videos by views
    if fetch_transcripts and settings.searchapi_key:
        sorted_vids = sorted(
            all_videos.values(),
            key=lambda v: v.get("stats", {}).get("views", 0),
            reverse=True,
        )
        transcript_count = 0
        for v in sorted_vids[:max_transcripts]:
            transcript = get_transcript(v["video_id"])
            if transcript:
                v["transcript"] = transcript
                transcript_count += 1
                print(f"  Transcript: {v['title'][:50]} ({len(transcript)} chars)")
        print(f"Transcripts fetched: {transcript_count}/{max_transcripts}")

    # Store
    videos_list = list(all_videos.values())
    inserted = store_videos(videos_list)
    print(f"\nYouTube ingestion complete: {len(videos_list)} found, {inserted} new")
    return inserted


if __name__ == "__main__":
    run_youtube_ingestion()
