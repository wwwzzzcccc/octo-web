import React, { Component } from "react"
import { Channel, ChannelTypePerson } from "wukongimjssdk"
import WKApp from "../../App"
import "./index.css"

interface AppBotInfo {
    id: string
    uid: string
    display_name: string
    description: string
    avatar: string
    scope: "platform" | "space"
}

interface AppBotDiscoverState {
    bots: AppBotInfo[]
    loading: boolean
}

export default class AppBotDiscover extends Component<{}, AppBotDiscoverState> {
    state: AppBotDiscoverState = {
        bots: [],
        loading: true,
    }

    private handleSpaceChanged = () => {
        this.loadData()
    }

    componentDidMount() {
        this.loadData()
        WKApp.mittBus.on("space-changed", this.handleSpaceChanged)
    }

    componentWillUnmount() {
        WKApp.mittBus.off("space-changed", this.handleSpaceChanged)
    }

    async loadData() {
        this.setState({ loading: true })
        try {
            const spaceId = WKApp.shared.currentSpaceId
            const params = spaceId ? { param: { space_id: spaceId } } : undefined
            const res = await WKApp.apiClient.get("/app_bot/available", params)
            this.setState({ bots: res || [], loading: false })
        } catch {
            this.setState({ bots: [], loading: false })
        }
    }

    handleOpenChat = (bot: AppBotInfo) => {
        // §7.3: Open DM channel directly, no friend add needed
        WKApp.endpoints.showConversation(new Channel(bot.uid, ChannelTypePerson))
    }

    renderBotCard(bot: AppBotInfo) {
        return (
            <div className="wk-appbot-card" key={bot.id} onClick={() => this.handleOpenChat(bot)}>
                <div className="wk-appbot-card-avatar">
                    {bot.avatar ? (
                        <img src={bot.avatar} alt={bot.display_name} />
                    ) : (
                        <span>{bot.display_name?.charAt(0)?.toUpperCase() || "A"}</span>
                    )}
                </div>
                <div className="wk-appbot-card-info">
                    <div className="wk-appbot-card-name">{bot.display_name}</div>
                    <div className="wk-appbot-card-desc">
                        {bot.description || "暂无简介"}
                    </div>
                </div>
                <div className="wk-appbot-card-action">
                    <button
                        className="wk-appbot-btn-chat"
                        onClick={(e) => {
                            e.stopPropagation()
                            this.handleOpenChat(bot)
                        }}
                    >
                        发消息
                    </button>
                </div>
            </div>
        )
    }

    render() {
        const { bots, loading } = this.state

        return (
            <div className="wk-appbot-discover">
                <div className="wk-appbot-header">
                    <h3 className="wk-appbot-title">应用</h3>
                    <span className="wk-appbot-subtitle">
                        发现和使用 AI 应用
                    </span>
                </div>

                <div className="wk-appbot-list">
                    {loading && (
                        <div className="wk-appbot-loading">加载中...</div>
                    )}
                    {!loading && bots.length === 0 && (
                        <div className="wk-appbot-empty">
                            <div className="wk-appbot-empty-icon">📦</div>
                            <div className="wk-appbot-empty-text">暂无可用应用</div>
                            <div className="wk-appbot-empty-hint">
                                管理员可在后台创建并上架应用 Bot
                            </div>
                        </div>
                    )}
                    {!loading && bots.map((bot) => this.renderBotCard(bot))}
                </div>
            </div>
        )
    }
}
