package com.example.ordermanagement.domain.shared

import java.time.Instant
import java.util.UUID

/**
 * Base interface for all domain events in the OrderManagement domain.
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
