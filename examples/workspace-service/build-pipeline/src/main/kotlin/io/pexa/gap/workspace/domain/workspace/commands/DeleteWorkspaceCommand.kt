package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class DeleteWorkspaceCommand(
    val workspaceId: UUID,
)
