package com.example.ordermanagement.domain.order

import java.time.Instant
import java.util.UUID
import com.example.ordermanagement.domain.shared.DomainEvent

data class OrderCreated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "order_created",
    val orderId: UUID,
    val customerId: UUID,
    val orderDate: UUID,
    val status: UUID,
    val shippingAddress: UUID,
    val billingAddress: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = "order"
}

data class OrderStatusUpdated(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "order_status_updated",
    val orderId: UUID,
    val status: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = "order"
}

data class OrderCancelled(
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now(),
    override val eventVersion: Int = 1,
    override val version: Long? = null,
    override val eventType: String = "order_cancelled",
    val orderId: UUID
) : DomainEvent {
    override fun getRootAggregateId(): UUID = orderId
    override fun getTopicName(): String = "order"
}

