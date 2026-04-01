package com.example.order.api

import java.math.BigDecimal
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/orders")
class OrderController(
    private val orderCommandService: OrderCommandService,
    private val orderQueryService: OrderQueryService,
) {

    @POSTMapping
    fun createOrder(
        @RequestBody customerId: UUID
    ): ResponseEntity<Order> {
        val result = orderCommandService.createOrder(customerId)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    @PUTMapping("/{orderId}")
    fun updateStatus(
        @PathVariable orderId: UUID,
        @RequestBody status: String
    ): ResponseEntity<Void> {
        orderCommandService.updateStatus(orderId, status)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{orderId}")
    fun getOrder(
        @PathVariable orderId: UUID
    ): ResponseEntity<Order> {
        return ResponseEntity.ok(orderQueryService.getOrder(orderId))
    }

    @GetMapping
    fun searchOrders(
        @RequestParam(required = false) status: String?
    ): ResponseEntity<List<Order>> {
        return ResponseEntity.ok(orderQueryService.searchOrders(status))
    }
}