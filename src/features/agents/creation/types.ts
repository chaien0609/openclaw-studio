import type { AgentFileName } from "@/lib/agents/agentFiles";
import type { GatewayAgentOverrides } from "@/lib/gateway/agentConfig";
import type {
  GatewayExecApprovalAsk,
  GatewayExecApprovalSecurity,
} from "@/lib/gateway/execApprovals";

export type GuidedExecAutonomy = "ask-first" | "auto";
export type GuidedFileEditAutonomy = "propose-only" | "auto-edit";

export type GuidedCreationControls = {
  allowExec: boolean;
  execAutonomy: GuidedExecAutonomy;
  fileEditAutonomy: GuidedFileEditAutonomy;
  sandboxMode: "off" | "non-main" | "all";
  workspaceAccess: "none" | "ro" | "rw";
  toolsProfile: "minimal" | "coding" | "messaging" | "full";
  toolsAllow: string[];
  toolsDeny: string[];
  approvalSecurity: GatewayExecApprovalSecurity;
  approvalAsk: GatewayExecApprovalAsk;
  approvalAllowlist: string[];
};

export type GuidedAgentCreationDraft = {
  primaryOutcome: string;
  successCriteria: string[];
  nonGoals: string[];
  exampleTasks: string[];
  failureMode: string;
  tone: string;
  userProfile: string;
  toolNotes: string;
  memoryNotes: string;
  heartbeatEnabled: boolean;
  heartbeatChecklist: string[];
  controls: GuidedCreationControls;
};

export type AgentCreateMode = "basic" | "guided";

export type AgentCreateModalSubmitPayload =
  | {
      mode: "basic";
      name: string;
    }
  | {
      mode: "guided";
      name: string;
      draft: GuidedAgentCreationDraft;
    };

export type GuidedExecApprovalsPolicy = {
  security: GatewayExecApprovalSecurity;
  ask: GatewayExecApprovalAsk;
  allowlist: Array<{ pattern: string }>;
};

export type GuidedAgentCreationCompileResult = {
  files: Partial<Record<AgentFileName, string>>;
  agentOverrides: GatewayAgentOverrides;
  execApprovals: GuidedExecApprovalsPolicy | null;
  validation: {
    errors: string[];
    warnings: string[];
  };
  summary: string[];
};
