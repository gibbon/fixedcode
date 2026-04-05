package io.pexa.gap.workspace.api.workspace

import io.pexa.gap.workspace.application.workspace.WorkspaceCommandService
import io.pexa.gap.workspace.application.workspace.WorkspaceQueryService
import io.pexa.gap.workspace.domain.workspace.commands.CreateWorkspaceCommand
import io.pexa.gap.workspace.domain.workspace.commands.UpdateWorkspaceStatusCommand
import io.pexa.gap.workspace.domain.workspace.commands.DeleteWorkspaceCommand
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class WorkspaceApiDelegateImpl(
    private val commandService: WorkspaceCommandService,
    private val queryService: WorkspaceQueryService
) {
    fun createWorkspace(transactionType: String, jurisdiction: String, completionDate: String?, ): ResponseEntity<Any> {
        val command = CreateWorkspaceCommand(transactionType, jurisdiction, completionDate)
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(201)).build()
    }

    fun updateWorkspaceStatus(workspaceId: UUID, status: String, ): ResponseEntity<Any> {
        val command = UpdateWorkspaceStatusCommand(workspaceId, status)
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(200)).build()
    }

    fun deleteWorkspace(workspaceId: UUID, ): ResponseEntity<Any> {
        val command = DeleteWorkspaceCommand(workspaceId, )
        commandService.handle(command)
        return ResponseEntity.status(HttpStatus.valueOf(204)).build()
    }

    fun getWorkspace(workspaceId: UUID): ResponseEntity<Any> {
        val result = queryService.getWorkspace(workspaceId)
        return ResponseEntity.ok(result)
    }

    fun searchWorkspace(): ResponseEntity<Any> {
        val result = queryService.searchWorkspace()
        return ResponseEntity.ok(result)
    }

    fun findWorkspacesByStatus(): ResponseEntity<Any> {
        val result = queryService.findWorkspacesByStatus()
        return ResponseEntity.ok(result)
    }

}
