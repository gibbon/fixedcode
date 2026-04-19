package com.example.ordermanagement.application.order

import java.util.UUID

interface OrderQueryService {
    fun getOrder(orderId: UUID): Order
    fun searchOrders(): PagedOrderList
    fun findOrdersByCustomerId(): Order
}
