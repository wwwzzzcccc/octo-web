import React from "react";
import { Input, Select } from "@douyinfe/semi-ui";
import type { FlowNodeConfig, GitHubStatusState } from "../../types/flow";

interface Props {
  config: FlowNodeConfig;
  onChange: (patch: Partial<FlowNodeConfig>) => void;
}

const STATES: GitHubStatusState[] = ["pending", "success", "failure", "error"];

export default function GitHubStatusConfig({ config, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>Token</div>
        <Input
          mode="password"
          value={config.githubToken ?? ""}
          placeholder="ghp_xxx 或 {{secrets.GITHUB_TOKEN}}"
          onChange={(v) => onChange({ githubToken: v })}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>仓库</div>
        <Input
          value={config.githubRepo ?? ""}
          placeholder="owner/repo"
          onChange={(v) => onChange({ githubRepo: v })}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>Commit SHA</div>
        <Input
          value={config.githubSha ?? ""}
          placeholder="{{trigger.payload.pull_request.head.sha}}"
          onChange={(v) => onChange({ githubSha: v })}
        />
        <div style={{ fontSize: 11, color: "var(--semi-color-text-2)", marginTop: 4 }}>
          支持模板表达式，例如 {"{{trigger.payload.head_sha}}"}。
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>状态</div>
        <Select
          value={config.githubState ?? "pending"}
          style={{ width: "100%" }}
          onChange={(v) => onChange({ githubState: v as GitHubStatusState })}
          optionList={STATES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>Context</div>
        <Input
          value={config.githubContext ?? "code-review"}
          placeholder="code-review"
          onChange={(v) => onChange({ githubContext: v })}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>描述</div>
        <Input
          value={config.githubDescription ?? ""}
          placeholder="Code review in progress"
          onChange={(v) => onChange({ githubDescription: v })}
        />
      </div>

      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>Target URL（可选）</div>
        <Input
          value={config.githubTargetUrl ?? ""}
          placeholder="https://ci.example.com/runs/123"
          onChange={(v) => onChange({ githubTargetUrl: v })}
        />
      </div>
    </div>
  );
}
