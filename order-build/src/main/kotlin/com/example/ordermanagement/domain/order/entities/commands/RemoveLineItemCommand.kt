package com.example.ordermanagement.domain.order.commands

import java.util.UUID

data class RemoveLineItemCommand(
    val lineItemId: UUID,
)
