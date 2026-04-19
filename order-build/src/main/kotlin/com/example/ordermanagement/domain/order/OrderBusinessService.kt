package com.example.ordermanagement.domain.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand

/**
 * Business service interface for Order.
 * Defines the contract for domain business operations.
 * Generated — safe to regenerate.
 */
interface OrderBusinessService {
    fun createOrder(command: CreateOrderCommand)
    fun updateOrderStatus(command: UpdateOrderStatusCommand)
    fun cancelOrder(command: CancelOrderCommand)
}
