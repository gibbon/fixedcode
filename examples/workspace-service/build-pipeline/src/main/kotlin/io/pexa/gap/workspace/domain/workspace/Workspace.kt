package io.pexa.gap.workspace.domain.workspace

import java.util.UUID
import io.pexa.gap.workspace.domain.shared.DomainEvent

data class Workspace(
    val workspaceId: UUID,
    val status: String,
    val transactionType: String,
    val jurisdiction: String,
    val completionDate: LocalDate?,
    val labels: Map<String, Any>?
) {
    private val domainEvents = mutableListOf<DomainEvent>()

    fun getDomainEvents(): List<DomainEvent> = domainEvents.toList()
    fun clearDomainEvents() = domainEvents.clear()
    protected fun registerEvent(event: DomainEvent) = domainEvents.add(event)
}
