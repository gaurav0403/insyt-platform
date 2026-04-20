import uuid
from datetime import datetime, date
from sqlalchemy import (
    String, Text, Float, Integer, Boolean, Date, DateTime,
    ForeignKey, ARRAY, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

# Use DateTime(timezone=True) instead of TIMESTAMPTZ
TIMESTAMPTZ = DateTime(timezone=True)
from backend.db.session import Base


def new_uuid() -> uuid.UUID:
    return uuid.uuid4()


def utcnow() -> datetime:
    return datetime.utcnow()


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    taxonomy_path: Mapped[str | None] = mapped_column(String(500))
    config: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)

    entities: Mapped[list["Entity"]] = relationship(back_populates="client")
    briefs: Mapped[list["Brief"]] = relationship(back_populates="client")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="client")


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # company, person, collection, ambassador, competitor
    canonical_name: Mapped[str] = mapped_column(String(500), nullable=False)
    aliases: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)

    client: Mapped[Client | None] = relationship(back_populates="entities")
    mention_links: Mapped[list["MentionEntity"]] = relationship(back_populates="entity")
    narratives: Mapped[list["Narrative"]] = relationship(back_populates="entity")

    __table_args__ = (
        Index("ix_entities_type", "type"),
        Index("ix_entities_client_id", "client_id"),
    )


class Mention(Base):
    __tablename__ = "mentions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # news, twitter, youtube, review, filing
    source_url: Mapped[str | None] = mapped_column(Text)
    source_publication: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str | None] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)
    ingested_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)
    raw_content: Mapped[str | None] = mapped_column(Text)
    content_hash: Mapped[str | None] = mapped_column(String(64))  # SHA-256 for dedup
    language: Mapped[str | None] = mapped_column(String(10))
    region: Mapped[str | None] = mapped_column(String(100))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)

    entity_links: Mapped[list["MentionEntity"]] = relationship(back_populates="mention")
    analysis: Mapped["MentionAnalysis | None"] = relationship(back_populates="mention", uselist=False)
    narrative_links: Mapped[list["NarrativeMention"]] = relationship(back_populates="mention")

    __table_args__ = (
        Index("ix_mentions_source_type", "source_type"),
        Index("ix_mentions_published_at", "published_at"),
        Index("ix_mentions_ingested_at", "ingested_at"),
        Index("ix_mentions_content_hash", "content_hash"),
        Index("ix_mentions_source_publication", "source_publication"),
        UniqueConstraint("source_url", name="uq_mentions_source_url"),
    )


class MentionEntity(Base):
    __tablename__ = "mention_entities"

    mention_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentions.id"), primary_key=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"), primary_key=True)
    confidence: Mapped[float | None] = mapped_column(Float)
    context_snippet: Mapped[str | None] = mapped_column(Text)

    mention: Mapped[Mention] = relationship(back_populates="entity_links")
    entity: Mapped[Entity] = relationship(back_populates="mention_links")


class MentionAnalysis(Base):
    __tablename__ = "mention_analysis"

    mention_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentions.id"), primary_key=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float)  # -1 to 1
    sentiment_confidence: Mapped[float | None] = mapped_column(Float)
    relevance_score: Mapped[float | None] = mapped_column(Float)  # 0 to 1
    severity_score: Mapped[float | None] = mapped_column(Float)  # 0 to 1
    themes: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    key_claims: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    action_triggers: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    analyzed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)

    mention: Mapped[Mention] = relationship(back_populates="analysis")


class Narrative(Base):
    __tablename__ = "narratives"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("entities.id"))
    title: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    first_seen_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)
    last_seen_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)
    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    sentiment_trajectory: Mapped[list[float] | None] = mapped_column(ARRAY(Float))
    velocity_score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str | None] = mapped_column(String(50))  # emerging, active, declining, resolved
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)

    entity: Mapped[Entity | None] = relationship(back_populates="narratives")
    mention_links: Mapped[list["NarrativeMention"]] = relationship(back_populates="narrative")

    __table_args__ = (
        Index("ix_narratives_entity_id", "entity_id"),
        Index("ix_narratives_status", "status"),
    )


class NarrativeMention(Base):
    __tablename__ = "narrative_mentions"

    narrative_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("narratives.id"), primary_key=True)
    mention_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentions.id"), primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)

    narrative: Mapped[Narrative] = relationship(back_populates="mention_links")
    mention: Mapped[Mention] = relationship(back_populates="narrative_links")


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"))
    date: Mapped[date | None] = mapped_column(Date)
    headline: Mapped[str | None] = mapped_column(Text)
    subheadline: Mapped[str | None] = mapped_column(Text)
    opening_paragraph: Mapped[str | None] = mapped_column(Text)
    sections: Mapped[dict | None] = mapped_column(JSONB)
    metrics: Mapped[dict | None] = mapped_column(JSONB)
    generated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)

    client: Mapped[Client | None] = relationship(back_populates="briefs")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"))
    triggered_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)
    severity: Mapped[str | None] = mapped_column(String(20))  # low, medium, high, critical
    narrative_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("narratives.id"))
    mention_ids: Mapped[list[uuid.UUID] | None] = mapped_column(ARRAY(UUID(as_uuid=True)))
    summary: Mapped[str | None] = mapped_column(Text)
    recommended_actions: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str | None] = mapped_column(String(20), default="open")  # open, acknowledged, resolved

    client: Mapped[Client | None] = relationship(back_populates="alerts")
    action_drafts: Mapped[list["ActionDraft"]] = relationship(back_populates="alert")


class ActionDraft(Base):
    __tablename__ = "action_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    alert_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.id"))
    draft_type: Mapped[str | None] = mapped_column(String(50))  # social_mirror, sebi_disclosure, press_statement, internal_note, journalist_clarification
    content: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(10))
    generated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, default=utcnow)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)

    alert: Mapped[Alert | None] = relationship(back_populates="action_drafts")
