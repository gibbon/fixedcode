package io.pexa.gap.shared.jsonfieldchange

import com.fasterxml.jackson.databind.ObjectMapper
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import java.util.UUID

class JsonFieldChangeDetectorTest : DescribeSpec({
    val objectMapper = ObjectMapper()
    val detector = JsonFieldChangeDetector(objectMapper)
    val aggregateId = UUID.randomUUID()

    describe("detect") {
        it("should detect root-level change") {
            val oldValue = mapOf("name" to "old")
            val newValue = mapOf("name" to "new")

            val changes = detector.detect(oldValue, newValue, listOf("name"), aggregateId, "Test", "data")

            changes shouldHaveSize 1
            changes[0].path shouldBe "name"
            changes[0].oldValue shouldBe "old"
            changes[0].newValue shouldBe "new"
        }

        it("should detect nested change") {
            val oldValue = mapOf("address" to mapOf("street" to "old street"))
            val newValue = mapOf("address" to mapOf("street" to "new street"))

            val changes = detector.detect(oldValue, newValue, listOf("address.street"), aggregateId, "Test", "data")

            changes shouldHaveSize 1
            changes[0].path shouldBe "address.street"
            changes[0].oldValue shouldBe "old street"
            changes[0].newValue shouldBe "new street"
        }

        it("should return empty list when no changes") {
            val value = mapOf("name" to "same")

            val changes = detector.detect(value, value, listOf("name"), aggregateId, "Test", "data")

            changes.shouldBeEmpty()
        }

        it("should detect addition (null to value)") {
            val oldValue: Map<String, Any?>? = null
            val newValue = mapOf("name" to "new")

            val changes = detector.detect(oldValue, newValue, listOf("name"), aggregateId, "Test", "data")

            changes shouldHaveSize 1
            changes[0].isAddition shouldBe true
        }

        it("should detect removal (value to null)") {
            val oldValue = mapOf("name" to "old")
            val newValue = mapOf<String, Any?>("name" to null)

            val changes = detector.detect(oldValue, newValue, listOf("name"), aggregateId, "Test", "data")

            changes shouldHaveSize 1
            changes[0].oldValue shouldBe "old"
            changes[0].newValue shouldBe null
        }

        it("should expand wildcard paths") {
            val oldValue = mapOf(
                "addresses" to mapOf(
                    "home" to mapOf("street" to "old home"),
                    "work" to mapOf("street" to "old work")
                )
            )
            val newValue = mapOf(
                "addresses" to mapOf(
                    "home" to mapOf("street" to "new home"),
                    "work" to mapOf("street" to "old work")
                )
            )

            val changes = detector.detect(oldValue, newValue, listOf("addresses.*"), aggregateId, "Test", "data")

            changes shouldHaveSize 1
            changes[0].path shouldBe "addresses.home"
        }
    }

    describe("extractValue") {
        it("should extract root value") {
            val obj = mapOf("name" to "test")
            detector.extractValue(obj, "name") shouldBe "test"
        }

        it("should extract nested value") {
            val obj = mapOf("address" to mapOf("street" to "123 Main"))
            detector.extractValue(obj, "address.street") shouldBe "123 Main"
        }

        it("should return null for missing path") {
            val obj = mapOf("name" to "test")
            detector.extractValue(obj, "missing") shouldBe null
        }

        it("should handle list index") {
            val obj = mapOf("items" to listOf("a", "b", "c"))
            detector.extractValue(obj, "items.1") shouldBe "b"
        }
    }
})
