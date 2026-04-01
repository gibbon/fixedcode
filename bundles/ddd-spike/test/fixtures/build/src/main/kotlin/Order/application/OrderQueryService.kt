package com.example.order.application

import java.math.BigDecimal
import java.util.UUID
import com.example.order.domain.Order
import com.example.order.infrastructure.OrderRepository
import org.springframework.stereotype.Service

@Service
class OrderQueryService(
    private val orderRepository: OrderRepository,
) {

    fun getOrder(orderId: UUID): Order {
        return orderRepository.findById(orderId)
            ?: throw NoSuchElementException("Order not found: $orderId")
    }

    fun searchOrders(status: String?): List<Order> {
        return orderRepository.findAll()
    }
}