package com.example.order.application

import java.math.BigDecimal
import java.util.UUID
import com.example.order.domain.Order
import com.example.order.infrastructure.OrderRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class OrderCommandService(
    private val orderRepository: OrderRepository,
) {

    fun createOrder(customerId: UUID): Order {
        val order = Order(
            orderId = UUID.randomUUID(),
            customerId = customerId,
        )
        return orderRepository.save(order)
    }

    fun updateStatus(orderId: UUID, status: String): Unit {
        val order = orderRepository.findById(orderId)
            ?: throw NoSuchElementException("Order not found: $orderId")
        val updated = order.copy(status = status)
        orderRepository.save(updated)
    }
}