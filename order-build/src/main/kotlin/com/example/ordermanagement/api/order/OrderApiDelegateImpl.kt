package com.example.ordermanagement.api.order

import com.example.ordermanagement.application.order.OrderCommandService
import com.example.ordermanagement.application.order.OrderQueryService
import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class OrderApiDelegateImpl(
    private val commandService: OrderCommandService,
    private val queryService: OrderQueryService
) {
    fun createOrder(customerId: String, shippingAddress: String, billingAddress: String, ): ResponseEntity<Any> {
        val command = CreateOrderCommand(customerId, shippingAddress, billingAddress)
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(201)).build()
    }

    fun updateOrderStatus(orderId: UUID, status: String, ): ResponseEntity<Any> {
        val command = UpdateOrderStatusCommand(orderId, status)
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(200)).build()
    }

    fun cancelOrder(orderId: UUID, ): ResponseEntity<Any> {
        val command = CancelOrderCommand(orderId, )
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(200)).build()
    }

    fun getOrder(orderId: UUID): ResponseEntity<Any> {
        val result = queryService.getOrder(orderId)
        return ResponseEntity.ok(result)
    }

    fun searchOrders(): ResponseEntity<Any> {
        val result = queryService.searchOrders()
        return ResponseEntity.ok(result)
    }

    fun findOrdersByCustomerId(): ResponseEntity<Any> {
        val result = queryService.findOrdersByCustomerId()
        return ResponseEntity.ok(result)
    }

}
