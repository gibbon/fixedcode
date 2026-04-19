package com.example.ordermanagement.domain.order.commands

import java.util.UUID

data class AddLineItemCommand(
    val productId: String,
    val quantity: String,
    val unitPrice: String
)
