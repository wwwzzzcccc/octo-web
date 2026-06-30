// reactionMerge —— syncMessageReaction CMD 不带 message_id，所以 refreshReactions
// 重拉本频道最近一页消息后，按 messageID 把远端 reactions 合并进已渲染的本地消息。
// 这段「按 id 匹配 + 覆盖 reactions + 是否有变更」的逻辑抽成纯函数，便于单测：
// resolveLocal 注入本地查找（生产里是 ConversationVM.findMessageWithMessageID），
// 不在当前页的远端消息找不到本地对应项 → 跳过，不误建。

interface ReactionTarget {
    message: { reactions: unknown[] }
}

interface RemoteReactionSource {
    messageID: string
    reactions?: unknown[]
}

/**
 * 把 remoteMessages 的 reactions 合并进本地消息。
 * @returns 是否有任一本地消息被更新（决定要不要 notifyListener 重渲染）。
 */
export function applyRemoteReactions(
    remoteMessages: RemoteReactionSource[],
    resolveLocal: (messageID: string) => ReactionTarget | undefined,
): boolean {
    let changed = false
    for (const remote of remoteMessages) {
        const existing = resolveLocal(remote.messageID)
        if (existing) {
            // 覆盖式写入：远端是该消息 reactions 的权威全量（Convert.toReactions 已聚合）。
            existing.message.reactions = remote.reactions || []
            changed = true
        }
    }
    return changed
}
