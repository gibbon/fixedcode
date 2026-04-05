package io.pexa.gap.workspace.domain.shared

import java.time.Instant
import java.util.UUID

/**
 * Base interface for all domain events in the Workspace domain.
 */
interface DomainEvent {
    val eventId: UUID
    val occurredAt: Instant
    val eventVersion: Int
    val version: Long?
    val eventType: String
    fun getRootAggregateId(): UUID
    fun getTopicName(): String
}
