package io.pexa.gap.workspace.domain.workspace.entities

import java.time.Instant
import java.util.UUID
import io.pexa.gap.workspace.domain.shared.DomainEvent

data class PartyAdded(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "party_added",
    val workspaceId: UUID,
    val partyId: UUID,
    val partyType: UUID,
    val role: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = ""
}

data class PartyUpdated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "party_updated",
    val workspaceId: UUID,
    val partyId: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = ""
}

data class PartyRemoved(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "party_removed",
    val workspaceId: UUID,
    val partyId: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = ""
}

