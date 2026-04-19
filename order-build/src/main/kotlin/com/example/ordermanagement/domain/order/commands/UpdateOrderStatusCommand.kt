package com.example.ordermanagement.domain.order.commands

import java.util.UUID

data class UpdateOrderStatusCommand(
    val orderId: UUID,
    val status: String
)
