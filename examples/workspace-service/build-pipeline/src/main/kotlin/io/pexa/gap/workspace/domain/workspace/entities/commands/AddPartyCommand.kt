package io.pexa.gap.workspace.domain.workspace.commands

import java.util.UUID

data class AddPartyCommand(
    val partyType: String,
    val role: String,
    val partyDetails: String,
    val representationDetails: String?
)
