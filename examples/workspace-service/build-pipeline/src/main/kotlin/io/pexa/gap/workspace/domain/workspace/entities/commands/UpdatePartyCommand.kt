package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class UpdatePartyCommand(
    val partyId: UUID,
    val partyDetails: String?,
    val representationDetails: String?
)
