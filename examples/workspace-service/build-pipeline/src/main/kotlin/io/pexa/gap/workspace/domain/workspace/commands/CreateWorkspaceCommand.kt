package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class CreateWorkspaceCommand(
    val transactionType: String,
    val jurisdiction: String,
    val completionDate: String?
)
