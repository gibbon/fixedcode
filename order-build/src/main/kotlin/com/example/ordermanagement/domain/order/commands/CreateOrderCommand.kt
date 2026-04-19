package com.example.ordermanagement.domain.order.commands

import java.util.UUID

data class CreateOrderCommand(
    val customerId: String,
    val shippingAddress: String,
    val billingAddress: String
)
