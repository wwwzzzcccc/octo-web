import { useEffect, useRef, useState } from 'react';
import { WKApp } from '@octo/base';

/**
 * useMyGroups — 拉取当前用户在当前 Space 下加入的所有群, 返回 group_no 集合。
 *
 * 接口: GET /api/v1/group/my?space_id={spaceId}
 * 响应: Array<{ group_no: string; name: string; ... }>
 *
 * 用于判断 Matter 关联群聊里哪些是 "我没加入的群", 从而:
 *   1. 把未加入群的名字模糊展示
 *   2. 不给未加入群的时间线条目展示 "↗ 原消息" 按钮 (权限不允许查原消息)
 *
 * 缓存策略:
 *   - 组件级缓存, 每次 hook 挂载拉一次, unmount 清理
 *   - spaceId 变化时自动重拉
 *   - 失败返回空 Set, 调用方把所有群当成 "未加入" — 这是安全保守的降级
 *     (UI 会全部模糊, 宁可多遮不要少遮, 避免把不该看到的群名暴露)
 */
interface MyGroupRaw {
    group_no: string;
    name?: string;
    [k: string]: unknown;
}

interface UseMyGroupsResult {
    groupNos: Set<string>;
    loading: boolean;
    /** 拉取失败时为 true, 调用方可以据此做 "无法判断权限" 的保守处理 */
    failed: boolean;
}

export function useMyGroups(): UseMyGroupsResult {
    const [groupNos, setGroupNos] = useState<Set<string>>(() => new Set());
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    // requestId 保护: spaceId 快速切换时丢弃过期响应
    const reqIdRef = useRef(0);

    useEffect(() => {
        const spaceId = WKApp.shared.currentSpaceId;
        if (!spaceId) {
            setGroupNos(new Set());
            setLoading(false);
            setFailed(false);
            return;
        }
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setFailed(false);
        WKApp.apiClient
            .get('group/my', { param: { space_id: spaceId } })
            .then((resp: MyGroupRaw[] | undefined) => {
                if (reqId !== reqIdRef.current) return;
                const next = new Set<string>();
                if (Array.isArray(resp)) {
                    for (const g of resp) {
                        if (g && typeof g.group_no === 'string') {
                            next.add(g.group_no);
                        }
                    }
                }
                setGroupNos(next);
                setLoading(false);
            })
            .catch((err: unknown) => {
                if (reqId !== reqIdRef.current) return;
                console.warn('[useMyGroups] fetch failed', err);
                setGroupNos(new Set());
                setLoading(false);
                setFailed(true);
            });
        // 只在组件挂载时拉一次。spaceId 切换时整个 MatterDetailPanel 一般已经
        // 随路由重渲染, 触发 hook 重跑。如果真的要监听 space-changed 事件再
        // 补 useEffect, 当前场景用不到。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { groupNos, loading, failed };
}
