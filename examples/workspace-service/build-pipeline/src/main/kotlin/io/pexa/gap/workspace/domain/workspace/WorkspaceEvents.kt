package io.pexa.gap.workspace.domain.workspace

import java.time.Instant
import java.util.UUID
import io.pexa.gap.workspace.domain.shared.DomainEvent

data class WorkspaceCreated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "workspace_created",
    val workspaceId: UUID,
    val status: UUID,
    val transactionType: UUID,
    val jurisdiction: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = "workspace"
}

data class WorkspaceStatusUpdated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "workspace_status_updated",
    val workspaceId: UUID,
    val status: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = "workspace"
}

data class WorkspaceDeleted(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "workspace_deleted",
    val workspaceId: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = workspaceId
    override fun getTopicName(): String = "workspace"
}

