package com.example.ordermanagement.domain.order

import java.util.UUID
import com.example.ordermanagement.domain.shared.DomainEvent

data class Order(
    val orderId: UUID,
    val customerId: UUID,
    val orderDate: LocalDate,
    val status: String,
    val totalAmount: double,
    val shippingAddress: Map<String, Any>,
    val billingAddress: Map<String, Any>
) {
    private val domainEvents = mutableListOf<DomainEvent>()

    fun getDomainEvents(): List<DomainEvent> = domainEvents.toList()
    fun clearDomainEvents() = domainEvents.clear()
    protected fun registerEvent(event: DomainEvent) = domainEvents.add(event)
}
