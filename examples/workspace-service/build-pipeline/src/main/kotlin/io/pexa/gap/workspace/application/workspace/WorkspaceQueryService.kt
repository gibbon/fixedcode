package io.pexa.gap.workspace.application.workspace

import java.util.UUID

interface WorkspaceQueryService {
    fun getWorkspace(workspaceId: UUID): Workspace
    fun searchWorkspace(): PagedWorkspaceList
    fun findWorkspacesByStatus(): Workspace
}
