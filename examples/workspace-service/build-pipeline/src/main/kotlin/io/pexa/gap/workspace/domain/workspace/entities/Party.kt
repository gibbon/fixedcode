package io.pexa.gap.workspace.domain.workspace.entities

import java.util.UUID

data class Party(
    val partyId: UUID,
    val workspaceId: UUID,
    val partyType: String,
    val role: String,
    val partyDetails: Map<String, Any>,
    val representationDetails: Map<String, Any>?
)
