package com.example.ordermanagement.domain.order.entities

import java.util.UUID

data class LineItem(
    val lineItemId: UUID,
    val orderId: UUID,
    val productId: UUID,
    val quantity: integer,
    val unitPrice: double,
    val subtotal: double
)
