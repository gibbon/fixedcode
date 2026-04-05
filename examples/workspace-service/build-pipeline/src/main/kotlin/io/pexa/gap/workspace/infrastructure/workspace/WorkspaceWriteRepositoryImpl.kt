package io.pexa.gap.workspace.infrastructure.workspace

import io.pexa.gap.workspace.domain.workspace.Workspace
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class WorkspaceWriteRepositoryImpl {
    fun save(entity: Workspace): Workspace {
        TODO("Implement save")
    }

    fun findById(id: UUID): Workspace? {
        TODO("Implement findById")
    }

    fun delete(id: UUID) {
        TODO("Implement delete")
    }
}
