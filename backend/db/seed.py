"""
Seed script: loads Kalyan taxonomy into the database.
Creates the client record and all entities from taxonomy/kalyan_v1.yaml.

Usage:
    python -m backend.db.seed
"""
import uuid
import yaml
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import get_settings
from backend.db.session import Base
from backend.db.models import Client, Entity

settings = get_settings()


def load_taxonomy(path: str) -> dict:
    with open(path, "r") as f:
        return yaml.safe_load(f)


def seed_database():
    engine = create_engine(settings.database_url_sync)

    with Session(engine) as session:
        # Check if already seeded
        existing = session.execute(
            text("SELECT id FROM clients WHERE name = :name"),
            {"name": "Kalyan Jewellers India Limited"},
        ).fetchone()

        if existing:
            client_id = existing[0]
            print(f"Client already exists: {client_id}")
            # Clear existing entities for re-seed
            session.execute(
                text("DELETE FROM entities WHERE client_id = :cid"),
                {"cid": str(client_id)},
            )
            session.commit()
            print("Cleared existing entities for re-seed")
        else:
            client_id = uuid.uuid4()

        # Load taxonomy — check multiple locations (local dev vs Railway container)
        candidates = [
            Path(__file__).resolve().parent.parent.parent / "taxonomy" / "kalyan_v1.yaml",
            Path(__file__).resolve().parent.parent / "taxonomy_kalyan_v1.yaml",
        ]
        taxonomy_path = next((p for p in candidates if p.exists()), candidates[0])
        taxonomy = load_taxonomy(str(taxonomy_path))

        # Upsert client
        if not existing:
            client = Client(
                id=client_id,
                name=taxonomy["client"]["name"],
                taxonomy_path="taxonomy/kalyan_v1.yaml",
                config={"taxonomy_version": taxonomy["client"]["taxonomy_version"]},
            )
            session.add(client)
            session.commit()
            print(f"Created client: {client.name} ({client.id})")

        # Load entities
        count = 0
        for entry in taxonomy["entities"]:
            entity = Entity(
                id=uuid.uuid4(),
                type=entry["type"],
                canonical_name=entry["canonical_name"],
                aliases=entry.get("aliases", []),
                metadata_=entry.get("metadata", {}),
                client_id=client_id,
            )
            session.add(entity)
            count += 1

        session.commit()
        print(f"Loaded {count} entities for client {taxonomy['client']['name']}")

        # Summary by type
        result = session.execute(
            text("SELECT type, COUNT(*) FROM entities WHERE client_id = :cid GROUP BY type ORDER BY type"),
            {"cid": str(client_id)},
        )
        print("\nEntity breakdown:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")


if __name__ == "__main__":
    seed_database()
