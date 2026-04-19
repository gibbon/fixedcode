package com.example.ordermanagement.domain.order.commands

import java.util.UUID

data class UpdateLineItemQuantityCommand(
    val lineItemId: UUID,
    val quantity: String
)
