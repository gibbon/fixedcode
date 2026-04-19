package com.example.ordermanagement.infrastructure.order

import com.example.ordermanagement.domain.order.Order
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class OrderWriteRepositoryImpl {
    fun save(entity: Order): Order {
        TODO("Implement save")
    }

    fun findById(id: UUID): Order? {
        TODO("Implement findById")
    }

    fun delete(id: UUID) {
        TODO("Implement delete")
    }
}
