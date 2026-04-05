package io.pexa.gap.shared.jsonfieldchange

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import java.util.UUID

class JsonFieldChangeRegistryTest : DescribeSpec({
    describe("matchesPattern") {
        val registry = JsonFieldChangeRegistry()

        it("should match exact path") {
            registry.matchesPattern("addresses", "addresses") shouldBe true
        }

        it("should not match different paths") {
            registry.matchesPattern("addresses", "contacts") shouldBe false
        }

        it("should match single wildcard") {
            registry.matchesPattern("addresses.*", "addresses.home") shouldBe true
            registry.matchesPattern("addresses.*", "addresses.work") shouldBe true
        }

        it("should not match wildcard with wrong depth") {
            registry.matchesPattern("addresses.*", "addresses") shouldBe false
            registry.matchesPattern("addresses.*", "addresses.home.street") shouldBe false
        }

        it("should match nested wildcard") {
            registry.matchesPattern("addresses.*.street", "addresses.home.street") shouldBe true
        }
    }

    describe("findHandlers") {
        it("should find handlers for exact path") {
            val registry = JsonFieldChangeRegistry()
            val handler = TestHandler("addresses")
            registry.register(handler)

            val found = registry.findHandlers("addresses")

            found shouldHaveSize 1
            found[0] shouldBe handler
        }

        it("should find handlers for wildcard path") {
            val registry = JsonFieldChangeRegistry()
            val handler = TestHandler("addresses.*")
            registry.register(handler)

            val found = registry.findHandlers("addresses.home")

            found shouldHaveSize 1
        }

        it("should return empty for non-matching path") {
            val registry = JsonFieldChangeRegistry()
            val handler = TestHandler("addresses")
            registry.register(handler)

            val found = registry.findHandlers("contacts")

            found.shouldBeEmpty()
        }

        it("should find multiple handlers for same path") {
            val registry = JsonFieldChangeRegistry()
            val handler1 = TestHandler("addresses.*")
            val handler2 = TestHandler("addresses.*")
            registry.register(handler1)
            registry.register(handler2)

            val found = registry.findHandlers("addresses.home")

            found shouldHaveSize 2
        }
    }

    describe("invokeHandlers") {
        it("should invoke matching handlers") {
            val registry = JsonFieldChangeRegistry()
            val handler = TestHandler("addresses")
            registry.register(handler)

            val change = JsonFieldChange(
                path = "addresses",
                oldValue = mapOf("street" to "old"),
                newValue = mapOf("street" to "new"),
                aggregateId = UUID.randomUUID(),
                aggregateType = "Test",
                fieldName = "data"
            )

            registry.invokeHandlers(listOf(change))

            handler.invocationCount shouldBe 1
        }
    }
})

private class TestHandler(override val watchPath: String) : JsonFieldChangeHandler<Any?> {
    var invocationCount = 0

    override fun handle(change: JsonFieldChange<Any?>) {
        invocationCount++
    }
}
