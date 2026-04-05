package io.pexa.gap.workspace.application.workspace

import io.pexa.gap.workspace.domain.workspace.commands.CreateWorkspaceCommand
import io.pexa.gap.workspace.domain.workspace.commands.UpdateWorkspaceStatusCommand
import io.pexa.gap.workspace.domain.workspace.commands.DeleteWorkspaceCommand

interface WorkspaceCommandService {
    fun handle(command: CreateWorkspaceCommand)
    fun handle(command: UpdateWorkspaceStatusCommand)
    fun handle(command: DeleteWorkspaceCommand)
}
