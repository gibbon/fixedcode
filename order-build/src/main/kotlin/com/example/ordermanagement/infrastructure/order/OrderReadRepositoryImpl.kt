package com.example.ordermanagement.infrastructure.order

import com.example.ordermanagement.domain.order.Order
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class OrderReadRepositoryImpl {
    fun getOrder(orderId: UUID): Order {
        TODO("Implement getOrder")
    }

    fun searchOrders(): PagedOrderList {
        TODO("Implement searchOrders")
    }

    fun findOrdersByCustomerId(): Order {
        TODO("Implement findOrdersByCustomerId")
    }

}
