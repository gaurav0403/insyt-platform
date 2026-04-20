from backend.workers.celery_app import celery_app
import structlog

logger = structlog.get_logger()


@celery_app.task(name="ingest.news")
def ingest_news(publication: str = "moneycontrol"):
    """Trigger news ingestion for a publication."""
    from backend.ingestion.news.runner import run_news_ingestion
    logger.info("task.ingest_news.start", publication=publication)
    count = run_news_ingestion(publication)
    logger.info("task.ingest_news.done", publication=publication, count=count)
    return {"publication": publication, "ingested": count}


@celery_app.task(name="ingest.all_news")
def ingest_all_news():
    """Trigger ingestion across all configured news sources."""
    publications = [
        "moneycontrol", "economic_times", "livemint", "business_standard",
        "financial_express", "ndtv_profit", "hindu_business_line", "business_today",
    ]
    results = {}
    for pub in publications:
        try:
            from backend.ingestion.news.runner import run_news_ingestion
            results[pub] = run_news_ingestion(pub)
        except Exception as e:
            logger.error("task.ingest_news.failed", publication=pub, error=str(e))
            results[pub] = {"error": str(e)}
    return results
