package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class UpdateWorkspaceStatusCommand(
    val workspaceId: UUID,
    val status: String
)
