package com.example.ordermanagement.domain.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand
import com.example.ordermanagement.infrastructure.order.OrderWriteRepositoryImpl
import com.example.ordermanagement.domain.shared.ValidationResult
import java.time.LocalDate
import java.util.UUID

/**
 * Default business service implementation for Order.
 *
 * THIS IS AN EXTENSION POINT — generated once, then owned by you.
 * Add your business logic, validation rules, and domain operations here.
 * This file will NOT be overwritten on regeneration.
 */
@org.springframework.stereotype.Service
@org.springframework.transaction.annotation.Transactional
class DefaultOrderBusinessService(
    private val repository: OrderWriteRepositoryImpl
) : OrderBusinessService {

    override fun createOrder(command: CreateOrderCommand) {
        val orderId = UUID.randomUUID()
        val order = Order(
            orderId = orderId,
            customerId = command.customerId,
            orderDate = LocalDate.now(),
            status = OrderStatus.PENDING.name,
            totalAmount = 0.0, // Initial total amount
            shippingAddress = command.shippingAddress,
            billingAddress = command.billingAddress
        )
        repository.save(order)
    }

    override fun updateOrderStatus(command: UpdateOrderStatusCommand) {
        val order = repository.findById(command.orderId) ?: throw NoSuchElementException("Order not found with ID: ${command.orderId}")
        val updatedOrder = order.copy(status = command.status)
        repository.save(updatedOrder)
    }

    override fun cancelOrder(command: CancelOrderCommand) {
        val order = repository.findById(command.orderId) ?: throw NoSuchElementException("Order not found with ID: ${command.orderId}")
        if (order.status == OrderStatus.DELIVERED.name || order.status == OrderStatus.CANCELLED.name) {
            throw IllegalStateException("Cannot cancel an order that is already ${order.status}")
        }
        val cancelledOrder = order.copy(status = OrderStatus.CANCELLED.name)
        repository.save(cancelledOrder)
    }

    enum class OrderStatus {
        PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    }
}
