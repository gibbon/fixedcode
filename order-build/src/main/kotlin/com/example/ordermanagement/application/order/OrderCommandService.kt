package com.example.ordermanagement.application.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand

interface OrderCommandService {
    fun handle(command: CreateOrderCommand)
    fun handle(command: UpdateOrderStatusCommand)
    fun handle(command: CancelOrderCommand)
}
