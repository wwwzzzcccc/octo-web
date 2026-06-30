import { describe, expect, it } from "vitest"
import { applyRemoteReactions } from "../reactionMerge"

// 模拟本地消息（只关心 message.reactions 这一结构面）
const local = (reactions: unknown[] = []) => ({ message: { reactions } })

describe("applyRemoteReactions", () => {
    it("returns false and touches nothing when remote is empty", () => {
        const resolve = () => { throw new Error("should not be called") }
        expect(applyRemoteReactions([], resolve)).toBe(false)
    })

    it("overwrites reactions on a matched local message and returns true", () => {
        const m1 = local([{ emoji: "old" }])
        const store: Record<string, ReturnType<typeof local>> = { msg1: m1 }
        const changed = applyRemoteReactions(
            [{ messageID: "msg1", reactions: [{ emoji: "👍", count: 1 }] }],
            (id) => store[id],
        )
        expect(changed).toBe(true)
        expect(m1.message.reactions).toEqual([{ emoji: "👍", count: 1 }])
    })

    it("normalizes missing remote reactions to [] (clears stale)", () => {
        const m1 = local([{ emoji: "stale" }])
        const changed = applyRemoteReactions(
            [{ messageID: "msg1" }],            // reactions undefined → 清空
            () => m1,
        )
        expect(changed).toBe(true)
        expect(m1.message.reactions).toEqual([])
    })

    it("skips remote messages not present in the current page (no false create)", () => {
        const changed = applyRemoteReactions(
            [{ messageID: "not-on-page", reactions: [{ emoji: "👍" }] }],
            () => undefined,                    // 本地找不到
        )
        expect(changed).toBe(false)
    })

    it("updates only matched messages in a mixed batch", () => {
        const m1 = local([])
        const store: Record<string, ReturnType<typeof local>> = { msg1: m1 }
        const changed = applyRemoteReactions(
            [
                { messageID: "msg1", reactions: [{ emoji: "❤️" }] },
                { messageID: "msg-absent", reactions: [{ emoji: "👍" }] },
            ],
            (id) => store[id],
        )
        expect(changed).toBe(true)
        expect(m1.message.reactions).toEqual([{ emoji: "❤️" }])
    })
})
