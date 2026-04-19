package com.example.ordermanagement.domain.order

import com.example.ordermanagement.domain.order.commands.CreateOrderCommand
import com.example.ordermanagement.domain.order.commands.UpdateOrderStatusCommand
import com.example.ordermanagement.domain.order.commands.CancelOrderCommand
import com.example.ordermanagement.domain.shared.ValidationResult
import com.example.ordermanagement.domain.shared.ValidationError

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
        val errors = mutableListOf<ValidationError>()

        if (command.customerId == null) {
            errors.add(ValidationError("customerId", "Customer ID cannot be null"))
        }
        if (command.shippingAddress.isNullOrEmpty()) {
            errors.add(ValidationError("shippingAddress", "Shipping address cannot be empty"))
        }
        if (command.billingAddress.isNullOrEmpty()) {
            errors.add(ValidationError("billingAddress", "Billing address cannot be empty"))
        }

        return if (errors.isEmpty()) ValidationResult.valid() else ValidationResult.invalid(errors)
    }

    fun validate(command: UpdateOrderStatusCommand): ValidationResult {
        val errors = mutableListOf<ValidationError>()

        if (command.orderId == null) {
            errors.add(ValidationError("orderId", "Order ID cannot be null"))
        }
        if (command.status == null) {
            errors.add(ValidationError("status", "Status cannot be null"))
        } else if (!OrderStatus.values().any { it.name == command.status }) {
            errors.add(ValidationError("status", "Invalid order status: ${command.status}"))
        }

        return if (errors.isEmpty()) ValidationResult.valid() else ValidationResult.invalid(errors)
    }

    fun validate(command: CancelOrderCommand): ValidationResult {
        val errors = mutableListOf<ValidationError>()

        if (command.orderId == null) {
            errors.add(ValidationError("orderId", "Order ID cannot be null"))
        }

        return if (errors.isEmpty()) ValidationResult.valid() else ValidationResult.invalid(errors)
    }

}