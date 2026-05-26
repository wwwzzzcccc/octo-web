import React from "react";
import { Button, Input, InputNumber, TextArea } from "@douyinfe/semi-ui";
import { IconClose, IconPlus } from "@douyinfe/semi-icons";
import type { FlowNodeConfig } from "../../types/flow";

interface Props {
  config: FlowNodeConfig;
  onChange: (patch: Partial<FlowNodeConfig>) => void;
}

const DEFAULT_TIMEOUT = 60;

export default function ShellConfig({ config, onChange }: Props) {
  const env = config.shellEnv ?? [];

  const updateEnv = (idx: number, patch: Partial<{ key: string; value: string }>) => {
    const next = env.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onChange({ shellEnv: next });
  };
  const addEnv = () => onChange({ shellEnv: [...env, { key: "", value: "" }] });
  const removeEnv = (idx: number) =>
    onChange({ shellEnv: env.filter((_, i) => i !== idx) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>命令</div>
        <TextArea
          value={config.shellCommand ?? ""}
          placeholder={`#!/bin/bash\nset -euo pipefail\necho "hello"`}
          autosize={{ minRows: 6, maxRows: 16 }}
          style={{ fontFamily: "monospace", fontSize: 12 }}
          onChange={(v) => onChange({ shellCommand: v })}
        />
        <div style={{ fontSize: 11, color: "var(--semi-color-text-2)", marginTop: 4 }}>
          支持多行脚本，可使用 {"{{trigger.payload.xxx}}"} 模板。
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>超时（秒）</div>
        <InputNumber
          value={config.shellTimeout ?? DEFAULT_TIMEOUT}
          min={1}
          max={86400}
          step={10}
          style={{ width: "100%" }}
          onChange={(v) => onChange({ shellTimeout: typeof v === "number" ? v : DEFAULT_TIMEOUT })}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4, display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1 }}>环境变量</span>
          <Button size="small" icon={<IconPlus />} onClick={addEnv}>添加</Button>
        </div>
        {env.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--semi-color-text-2)" }}>暂无环境变量</div>
        ) : (
          env.map((e, idx) => (
            <div key={idx} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <Input
                value={e.key}
                placeholder="KEY"
                onChange={(v) => updateEnv(idx, { key: v })}
                style={{ flex: 1 }}
              />
              <Input
                value={e.value}
                placeholder="value"
                onChange={(v) => updateEnv(idx, { value: v })}
                style={{ flex: 2 }}
              />
              <Button
                size="small"
                type="tertiary"
                icon={<IconClose />}
                onClick={() => removeEnv(idx)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
