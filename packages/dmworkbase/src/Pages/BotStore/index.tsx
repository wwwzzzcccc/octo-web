import React, { Component } from "react"
import { Channel, ChannelTypePerson } from "wukongimjssdk"
import WKApp from "../../App"
import BotDetailModal from "../../Components/BotDetailModal"
import "./index.css"

interface BotInfo {
    uid: string
    name: string
    description: string
    creator_uid: string
    creator_name: string
    bot_commands: string
    auto_approve?: number
    status?: string // not_added | pending | added
}

interface AppBotInfo {
    id: string
    uid: string
    display_name: string
    description: string
    avatar: string
    scope: "platform" | "space"
}

interface BotStoreState {
    myBots: BotInfo[]
    spaceBots: BotInfo[]
    appBots: AppBotInfo[]
    loading: boolean
    activeTab: "my" | "store" | "apps"
    applyingUid: string
    botDetailUid: string
    botDetailVisible: boolean
}

export default class BotStore extends Component<{}, BotStoreState> {
    state: BotStoreState = {
        myBots: [],
        spaceBots: [],
        appBots: [],
        loading: true,
        activeTab: "apps",
        botDetailUid: "",
        botDetailVisible: false,
        applyingUid: "",
    }

    private handleSpaceChanged = () => {
        this.loadData()
    }

    componentDidMount() {
        this.loadData()
        WKApp.mittBus.on('space-changed', this.handleSpaceChanged)
    }

    componentWillUnmount() {
        WKApp.mittBus.off('space-changed', this.handleSpaceChanged)
    }

    async loadData() {
        this.setState({ loading: true })
        try {
            const spaceId = WKApp.shared.currentSpaceId
            const [myRes, spaceRes, appRes] = await Promise.all([
                WKApp.apiClient.get("/robot/my_bots", spaceId ? { param: { space_id: spaceId } } : undefined),
                spaceId ? WKApp.apiClient.get(`/robot/space_bots`, { param: { space_id: spaceId } }) : Promise.resolve([]),
                WKApp.apiClient.get("/app_bot/available", spaceId ? { param: { space_id: spaceId } } : undefined).catch(() => []),
            ])
            this.setState({
                myBots: myRes || [],
                spaceBots: spaceRes || [],
                appBots: appRes || [],
                loading: false,
            })
        } catch {
            this.setState({ loading: false })
        }
    }

    handleChat = (uid: string) => {
        WKApp.endpoints.showConversation(new Channel(uid, ChannelTypePerson))
    }

    handleAddFriend = (uid: string) => {
        // 打开 BotDetailModal，走好友审核流程
        this.setState({ botDetailUid: uid, botDetailVisible: true })
    }

    handleBotFatherChat = () => {
        WKApp.endpoints.showConversation(new Channel("botfather", ChannelTypePerson))
    }

    renderAppBotCard(bot: AppBotInfo) {
        return (
            <div className="wk-bot-card" key={bot.id} onClick={() => this.handleChat(bot.uid)}>
                <div className="wk-bot-card-avatar" style={{ background: "#6366f1" }}>
                    {bot.avatar ? (
                        <img src={bot.avatar} alt={bot.display_name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                    ) : (
                        bot.display_name?.charAt(0)?.toUpperCase() || "A"
                    )}
                </div>
                <div className="wk-bot-card-info">
                    <div className="wk-bot-card-name">
                        {bot.display_name}
                        <span className="wk-bot-card-badge">应用</span>
                    </div>
                    <div className="wk-bot-card-desc">{bot.description || "暂无简介"}</div>
                </div>
                <div className="wk-bot-card-action">
                    <button className="wk-bot-btn wk-bot-btn-chat" onClick={(e) => { e.stopPropagation(); this.handleChat(bot.uid) }}>
                        发消息
                    </button>
                </div>
            </div>
        )
    }

    renderBotCard(bot: BotInfo, showAction: boolean) {
        const { applyingUid } = this.state
        const isAdded = bot.status === "added"
        const isPending = bot.status === "pending"
        const isApplying = applyingUid === bot.uid

        return (
            <div className="wk-bot-card" key={bot.uid}>
                <div className="wk-bot-card-avatar">
                    {bot.name?.charAt(0)?.toUpperCase() || "B"}
                </div>
                <div className="wk-bot-card-info">
                    <div className="wk-bot-card-name">
                        {bot.name || bot.uid}
                        <span className="wk-bot-card-badge">AI</span>
                    </div>
                    <div className="wk-bot-card-desc">{bot.description || "暂无简介"}</div>
                    {bot.creator_name && (
                        <div className="wk-bot-card-creator">创建者: {bot.creator_name}</div>
                    )}
                </div>
                <div className="wk-bot-card-action">
                    {showAction && isAdded && (
                        <button className="wk-bot-btn wk-bot-btn-chat" onClick={() => this.handleChat(bot.uid)}>
                            发消息
                        </button>
                    )}
                    {showAction && isPending && (
                        <button className="wk-bot-btn wk-bot-btn-pending" disabled>
                            审批中
                        </button>
                    )}
                    {showAction && !isAdded && !isPending && (
                        <button
                            className="wk-bot-btn wk-bot-btn-add"
                            disabled={isApplying}
                            onClick={() => this.handleAddFriend(bot.uid)}
                        >
                            {isApplying ? "申请中..." : "添加"}
                        </button>
                    )}
                    {!showAction && (
                        <button className="wk-bot-btn wk-bot-btn-chat" onClick={() => this.handleChat(bot.uid)}>
                            发消息
                        </button>
                    )}
                </div>
            </div>
        )
    }

    render() {
        const { myBots, spaceBots, appBots, loading, activeTab } = this.state

        return (
            <div className="wk-bot-store">
                {/* BotFather 固定置顶 */}
                <div className="wk-bot-father" onClick={this.handleBotFatherChat}>
                    <div className="wk-bot-father-avatar">⚙️</div>
                    <div className="wk-bot-father-info">
                        <div className="wk-bot-father-name">BotFather</div>
                        <div className="wk-bot-father-desc">创建和管理你的 AI 机器人</div>
                    </div>
                    <div className="wk-bot-father-arrow">›</div>
                </div>

                {/* Tab 切换 */}
                <div className="wk-bot-tabs">
                    <div
                        className={`wk-bot-tab ${activeTab === "apps" ? "active" : ""}`}
                        onClick={() => this.setState({ activeTab: "apps" })}
                    >
                        应用 ({appBots.length})
                    </div>
                    <div
                        className={`wk-bot-tab ${activeTab === "my" ? "active" : ""}`}
                        onClick={() => this.setState({ activeTab: "my" })}
                    >
                        我的 AI ({myBots.length})
                    </div>
                    <div
                        className={`wk-bot-tab ${activeTab === "store" ? "active" : ""}`}
                        onClick={() => this.setState({ activeTab: "store" })}
                    >
                        AI 广场 ({spaceBots.length})
                    </div>
                </div>

                {/* 列表 */}
                <div className="wk-bot-list">
                    {loading && <div className="wk-bot-loading">加载中...</div>}
                    {!loading && activeTab === "apps" && appBots.length === 0 && (
                        <div className="wk-bot-empty">暂无可用应用<br/>管理员可在后台创建并上架应用 Bot</div>
                    )}
                    {!loading && activeTab === "apps" && appBots.map(bot => this.renderAppBotCard(bot))}
                    {!loading && activeTab === "my" && myBots.length === 0 && (
                        <div className="wk-bot-empty">还没有添加任何 AI<br/>去 AI 广场看看吧</div>
                    )}
                    {!loading && activeTab === "store" && spaceBots.length === 0 && (
                        <div className="wk-bot-empty">当前 Space 暂无可用 AI</div>
                    )}
                    {!loading && activeTab === "my" && myBots.map(bot => this.renderBotCard(bot, false))}
                    {!loading && activeTab === "store" && spaceBots.map(bot => this.renderBotCard(bot, true))}
                </div>
                <BotDetailModal
                    uid={this.state.botDetailUid || ""}
                    visible={this.state.botDetailVisible}
                    onClose={() => {
                        this.setState({ botDetailVisible: false })
                        setTimeout(() => this.loadData(), 500)
                    }}
                    onChat={(channel) => {
                        WKApp.endpoints.showConversation(channel)
                        this.setState({ botDetailVisible: false })
                    }}
                />
            </div>
        )
    }
}
