package com.example.order.domain

import java.math.BigDecimal
import java.util.UUID

data class Order(
    val orderId: UUID,
    val customerId: UUID,
    val status: String? &#x3D; &quot;CREATED&quot;,
    val totalAmount: BigDecimal?
)