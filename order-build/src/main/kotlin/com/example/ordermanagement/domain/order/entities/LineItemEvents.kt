package com.example.ordermanagement.domain.order.entities

import java.time.Instant
import java.util.UUID
import com.example.ordermanagement.domain.shared.DomainEvent

data class LineItemAdded(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "line_item_added",
    val orderId: UUID,
    val lineItemId: UUID,
    val productId: UUID,
    val quantity: UUID,
    val unitPrice: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = ""
}

data class LineItemQuantityUpdated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "line_item_quantity_updated",
    val orderId: UUID,
    val lineItemId: UUID,
    val quantity: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = ""
}

data class LineItemRemoved(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "line_item_removed",
    val orderId: UUID,
    val lineItemId: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = ""
}

