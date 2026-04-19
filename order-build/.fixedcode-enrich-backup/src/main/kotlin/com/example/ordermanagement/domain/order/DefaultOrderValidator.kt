package com.example.ordermanagement.domain.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand
import com.example.ordermanagement.domain.shared.ValidationResult

/**
 * Default validator for Order commands.
 *
 * THIS IS AN EXTENSION POINT — generated once, then owned by you.
 * Add your validation rules here.
 * This file will NOT be overwritten on regeneration.
 */
@org.springframework.stereotype.Component
class DefaultOrderValidator {

    fun validate(command: CreateOrderCommand): ValidationResult {
        // TODO: add validation rules for CreateOrder
        return ValidationResult.valid()
    }

    fun validate(command: UpdateOrderStatusCommand): ValidationResult {
        // TODO: add validation rules for UpdateOrderStatus
        return ValidationResult.valid()
    }

    fun validate(command: CancelOrderCommand): ValidationResult {
        // TODO: add validation rules for CancelOrder
        return ValidationResult.valid()
    }

}
