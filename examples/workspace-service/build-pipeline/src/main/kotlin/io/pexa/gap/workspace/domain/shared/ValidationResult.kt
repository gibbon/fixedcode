package io.pexa.gap.workspace.domain.shared

data class ValidationResult(
    val isValid: Boolean,
    val errors: List<String> = emptyList()
) {
    fun throwIfInvalid() {
        if (!isValid) {
            throw IllegalArgumentException(errors.joinToString(", "))
        }
    }

    companion object {
        fun valid() = ValidationResult(true)
        fun invalid(errors: List<String>) = ValidationResult(false, errors)
        fun invalid(vararg errors: String) = ValidationResult(false, errors.toList())
    }
}
