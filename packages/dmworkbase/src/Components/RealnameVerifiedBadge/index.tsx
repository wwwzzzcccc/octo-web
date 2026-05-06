import React from "react";
import "./index.css";

interface RealnameVerifiedBadgeProps {
    /** "icon"：只展示蓝色 ✓ 勾；"tag"：展示 ✓ + 「已实名」文字；"full"（默认）：并排展示两者 */
    variant?: "icon" | "tag" | "full";
    className?: string;
}

/**
 * RealnameVerifiedBadge — OCTO 实名认证标识
 *
 * dmwork-web YUJ-359 / GH #1121:
 * 仅用于**个人资料页**（MeInfo / UserInfo 头部），展示 ✓ 蓝色勾 + 「已实名」tag。
 *
 * 范围约束（硬约束，见 GH #1121 "不在范围"）：
 * - 聊天气泡 / 群成员列表**不**使用此 badge（企业 IM 实名是默认状态，
 *   不是稀缺信号，加图标会噪音化 UI）。
 * - 任何新增的消费点应先在 issue 上确认是否在范围内。
 */
const RealnameVerifiedBadge: React.FC<RealnameVerifiedBadgeProps> = ({
    variant = "full",
    className,
}) => {
    const combined = className
        ? `wk-realname-badge wk-realname-badge--${variant} ${className}`
        : `wk-realname-badge wk-realname-badge--${variant}`;

    return (
        <span
            className={combined}
            title="已完成实名认证"
            aria-label="已实名"
            role="img"
        >
            <svg
                className="wk-realname-badge__icon"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="7" cy="7" r="7" fill="currentColor" />
                <path
                    d="M3.6 7.2l2.1 2.1 4.7-4.7"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </svg>
            {variant !== "icon" && (
                <span className="wk-realname-badge__text">已实名</span>
            )}
        </span>
    );
};

export default RealnameVerifiedBadge;
