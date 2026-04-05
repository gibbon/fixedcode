package io.pexa.gap.workspace.infrastructure.workspace

import io.pexa.gap.workspace.domain.workspace.Workspace
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class WorkspaceReadRepositoryImpl {
    fun getWorkspace(workspaceId: UUID): Workspace {
        TODO("Implement getWorkspace")
    }

    fun searchWorkspace(): PagedWorkspaceList {
        TODO("Implement searchWorkspace")
    }

    fun findWorkspacesByStatus(): Workspace {
        TODO("Implement findWorkspacesByStatus")
    }

}
