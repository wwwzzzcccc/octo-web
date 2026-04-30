import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import type { CreateTodoReq } from '../../bridge/types';
import MemberPicker from '../MemberPicker';
import './index.css';

// ─── Props 接口 ───────────────────────────────────────────

export interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onDirtyClose: () => void;
  onConfirm: (req: CreateTodoReq) => Promise<void>;
  prefillTitle?: string;
  prefillAssigneeUids?: string[];
  channel?: { channelId: string; channelType: number; name?: string };
}

// ─── 快捷日期计算 ──────────────────────────────────────────

function getTodayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function getTomorrowEnd(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

// 返回「本周五」或「下周五」及对应日期
function getFridayInfo(): { label: string; date: Date } {
  const d = new Date();
  const day = d.getDay();
  // 中国习惯周一为周首，周五/周六/周日都视为"本周五已过"，跳下周五
  const isThisWeekFridayPast = day === 5 || day === 6 || day === 0;
  let daysUntilFriday: number;
  if (isThisWeekFridayPast) {
    daysUntilFriday = (5 - day + 7) % 7 || 7;
  } else {
    daysUntilFriday = 5 - day; // 周一(1)→4，周二(2)→3，周三(3)→2，周四(4)→1
  }
  const target = new Date(d);
  target.setDate(d.getDate() + daysUntilFriday);
  target.setHours(23, 59, 59, 999);
  return { label: isThisWeekFridayPast ? '下周五' : '本周五', date: target };
}

// ─── CreateTaskModal 主组件 ────────────────────────────────

export default function CreateTaskModal({
  visible,
  onClose,
  onDirtyClose,
  onConfirm,
  prefillTitle = '',
  prefillAssigneeUids = [],
  channel,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState(prefillTitle);
  const [assigneeUids, setAssigneeUids] = useState<string[]>(prefillAssigneeUids);
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  // 用 join 做稳定的 key，避免每次渲染新数组引用触发 effect（比 JSON.stringify 更轻量）
  const prefillAssigneeUidsKey = prefillAssigneeUids.join(',');
  // stablePrefillAssigneeUids：用 key 做稳定化，避免每次渲染新数组引用导致 isDirty useMemo 失效
  const stablePrefillAssigneeUids = useMemo(
    () => prefillAssigneeUids,
    [prefillAssigneeUidsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── 快捷日期：在 visible 变为 true 时用 useEffect 计算，
  //     避免 useMemo 依赖 visible 语义不正确（visible=false 时也会重算）
  const [quickDates, setQuickDates] = useState(() => {
    const fri = getFridayInfo();
    return {
      today: getTodayEnd().toISOString().split('T')[0],
      tomorrow: getTomorrowEnd().toISOString().split('T')[0],
      friday: fri.date.toISOString().split('T')[0],
      fridayLabel: fri.label,
    };
  });

  // ─── 初始化：当 visible 变化时重置表单 + 聚焦确认按钮 ─────
  useEffect(() => {
    if (visible) {
      setTitle(prefillTitle);
      setAssigneeUids(prefillAssigneeUids);
      setDeadline('');
      setDescription('');
      setShowDescription(false);
      // visible=true 时重新计算日期，确保跨天/多次打开都是正确的
      const fri = getFridayInfo();
      setQuickDates({
        today: getTodayEnd().toISOString().split('T')[0],
        tomorrow: getTomorrowEnd().toISOString().split('T')[0],
        friday: fri.date.toISOString().split('T')[0],
        fridayLabel: fri.label,
      });
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  // prefillAssigneeUidsKey = join(',')，内容不变时 key 相同，effect 不重跑
  }, [visible, prefillTitle, prefillAssigneeUidsKey]);

  // ─── dirty 检测 ────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (title.trim() !== prefillTitle.trim()) return true;
    if (assigneeUids.length !== stablePrefillAssigneeUids.length) return true;
    // 用 Set 比较，不依赖顺序（MemberPicker toggle 顺序可能与 prefill 不同）
    const prefillSet = new Set(stablePrefillAssigneeUids);
    if (assigneeUids.some((uid) => !prefillSet.has(uid))) return true;
    if (deadline) return true;
    if (description.trim()) return true;
    return false;
  }, [title, assigneeUids, deadline, description, prefillTitle, stablePrefillAssigneeUids]);

  // ─── 关闭处理 ──────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isDirty) {
      onDirtyClose();
    } else {
      onClose();
    }
  }, [isDirty, onClose, onDirtyClose]);

  // ─── 确认提交 ──────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || submitting) return;

    setSubmitting(true);
    try {
      const req: CreateTodoReq = {
        title: trimmedTitle,
        description: description.trim() || undefined,
        assignee_ids: assigneeUids.length > 0 ? assigneeUids : undefined,
        deadline: deadline || undefined,
        source_channel_id: channel?.channelId,
        source_channel_type: channel?.channelType,
        source_name: channel?.name,
      };
      // 不在这里调 onClose，由调用方在 onConfirm 完成后控制关闭
      // 避免 onClose 被调用两次（调用方 + 这里各调一次）
      await onConfirm(req);
    } finally {
      setSubmitting(false);
    }
  }, [title, description, assigneeUids, deadline, submitting, onConfirm, channel]);

  // ─── 快捷日期选择 ──────────────────────────────────────
  const handleQuickDate = useCallback((type: 'today' | 'tomorrow' | 'friday' | 'custom') => {
    if (type === 'today') {
      setDeadline(quickDates.today);
    } else if (type === 'tomorrow') {
      setDeadline(quickDates.tomorrow);
    } else if (type === 'friday') {
      setDeadline(quickDates.friday);
    }
    // custom：不自动设置，让用户用 date picker 选
  }, [quickDates]);

  // ─── 键盘快捷键 ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && e.altKey) {
        // Alt+Enter 全局提交（不管焦点在哪）
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Enter' && e.target === confirmBtnRef.current) {
        // 焦点在确认按钮时，button 的默认行为已经会触发 click → handleConfirm
        // 不手动调用，避免双重触发
        e.preventDefault(); // 仍然阻止冒泡到 Modal 外层
      }
    },
    [handleClose, handleConfirm]
  );

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={null}
      width={480}
      closable={false}
      maskClosable={false}
      className="wk-create-task-modal"
    >
      <div className="wk-create-task-modal__content" onKeyDown={handleKeyDown}>
        <h3 className="wk-create-task-modal__title">创建任务</h3>

        {/* 任务名 */}
        <div className="wk-create-task-modal__field">
          <label className="wk-create-task-modal__label">任务名</label>
          <input
            type="text"
            className="wk-create-task-modal__input"
            placeholder="输入任务名称..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={false}
          />
        </div>

        {/* 负责人 */}
        <div className="wk-create-task-modal__field">
          <label className="wk-create-task-modal__label">负责人</label>
          <MemberPicker mode="controlled" value={assigneeUids} onChange={setAssigneeUids} channel={channel} placeholder="选择负责人..." />
        </div>

        {/* 截止日期 */}
        <div className="wk-create-task-modal__field">
          <label className="wk-create-task-modal__label">截止日期</label>
          <div className="wk-create-task-modal__date-shortcuts">
            <button
              type="button"
              className={`wk-create-task-modal__date-btn ${deadline === quickDates.today ? 'active' : ''}`}
              onClick={() => handleQuickDate('today')}
            >
              今天
            </button>
            <button
              type="button"
              className={`wk-create-task-modal__date-btn ${deadline === quickDates.tomorrow ? 'active' : ''}`}
              onClick={() => handleQuickDate('tomorrow')}
            >
              明天
            </button>
            <button
              type="button"
              className={`wk-create-task-modal__date-btn ${deadline === quickDates.friday ? 'active' : ''}`}
              onClick={() => handleQuickDate('friday')}
            >
              {quickDates.fridayLabel}
            </button>
            <button type="button" className="wk-create-task-modal__date-btn" onClick={() => handleQuickDate('custom')}>
              自定义...
            </button>
          </div>
          <input
            type="date"
            className="wk-create-task-modal__input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* 备注（折叠） */}
        <div className="wk-create-task-modal__field">
          {!showDescription ? (
            <button type="button" className="wk-create-task-modal__toggle-desc" onClick={() => setShowDescription(true)}>
              + 添加备注
            </button>
          ) : (
            <>
              <label className="wk-create-task-modal__label">备注</label>
              <textarea
                className="wk-create-task-modal__textarea"
                placeholder="添加任务备注..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </>
          )}
        </div>

        {/* 按钮组 */}
        <div className="wk-create-task-modal__actions">
          <button type="button" className="wk-create-task-modal__btn wk-create-task-modal__btn--cancel" onClick={handleClose}>
            取消 <span className="wk-create-task-modal__shortcut">Esc</span>
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="wk-create-task-modal__btn wk-create-task-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={!title.trim() || submitting}
          >
            发送并创建任务 <span className="wk-create-task-modal__shortcut">↵</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
