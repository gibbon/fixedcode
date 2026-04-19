package com.example.ordermanagement.domain.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand
import com.example.ordermanagement.infrastructure.order.OrderWriteRepositoryImpl
import com.example.ordermanagement.domain.shared.ValidationResult

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
        // TODO: implement CreateOrder business logic
        throw UnsupportedOperationException("CreateOrder not yet implemented")
    }

    override fun updateOrderStatus(command: UpdateOrderStatusCommand) {
        // TODO: implement UpdateOrderStatus business logic
        throw UnsupportedOperationException("UpdateOrderStatus not yet implemented")
    }

    override fun cancelOrder(command: CancelOrderCommand) {
        // TODO: implement CancelOrder business logic
        throw UnsupportedOperationException("CancelOrder not yet implemented")
    }

}
