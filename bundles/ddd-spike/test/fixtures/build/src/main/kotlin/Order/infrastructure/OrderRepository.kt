package com.example.order.infrastructure

import java.math.BigDecimal
import java.util.UUID
import com.example.order.domain.Order
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderRepository : CrudRepository<Order, UUID>