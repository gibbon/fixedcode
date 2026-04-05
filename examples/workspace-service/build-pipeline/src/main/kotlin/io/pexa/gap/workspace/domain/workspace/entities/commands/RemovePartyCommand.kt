package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class RemovePartyCommand(
    val partyId: UUID,
)
