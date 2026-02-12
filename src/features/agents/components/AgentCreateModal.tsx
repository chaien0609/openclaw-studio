"use client";

import { useMemo, useState } from "react";
import {
  compileGuidedAgentCreation,
  createDefaultGuidedDraft,
} from "@/features/agents/creation/compiler";
import type {
  AgentCreateModalSubmitPayload,
  AgentCreateMode,
  GuidedAgentCreationDraft,
} from "@/features/agents/creation/types";

type AgentCreateModalProps = {
  open: boolean;
  suggestedName: string;
  busy?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (payload: AgentCreateModalSubmitPayload) => Promise<void> | void;
};

const parseLineList = (value: string): string[] => {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const formatLineList = (values: string[]): string => values.join("\n");

const fieldClassName =
  "w-full rounded-md border border-border/80 bg-surface-3 px-3 py-2 text-xs text-foreground outline-none";
const labelClassName =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const AgentCreateModal = ({
  open,
  suggestedName,
  busy = false,
  submitError = null,
  onClose,
  onSubmit,
}: AgentCreateModalProps) => {
  const [mode, setMode] = useState<AgentCreateMode | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(() => suggestedName);
  const [guidedDraft, setGuidedDraft] = useState<GuidedAgentCreationDraft>(
    createDefaultGuidedDraft
  );

  const steps = useMemo(() => {
    if (!mode) return ["mode"] as const;
    if (mode === "basic") return ["mode", "review"] as const;
    return ["mode", "outcome", "controls", "identity", "review"] as const;
  }, [mode]);
  const stepKey = steps[stepIndex] ?? "mode";

  const compiledGuided = useMemo(() => {
    if (mode !== "guided") return null;
    return compileGuidedAgentCreation({ name, draft: guidedDraft });
  }, [guidedDraft, mode, name]);

  const outcomeReady =
    guidedDraft.primaryOutcome.trim().length > 0 &&
    parseLineList(formatLineList(guidedDraft.successCriteria)).length >= 3 &&
    parseLineList(formatLineList(guidedDraft.nonGoals)).length >= 3 &&
    parseLineList(formatLineList(guidedDraft.exampleTasks)).length >= 2 &&
    guidedDraft.failureMode.trim().length > 0;

  const canGoNext =
    stepKey === "mode"
      ? Boolean(mode)
      : stepKey === "outcome"
        ? outcomeReady
        : stepKey !== "review";

  const canSubmit =
    stepKey === "review" &&
    name.trim().length > 0 &&
    (mode === "basic" ||
      (compiledGuided !== null && compiledGuided.validation.errors.length === 0));

  const moveNext = () => {
    if (!canGoNext) return;
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const moveBack = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const handleSubmit = () => {
    if (!canSubmit || !mode) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (mode === "basic") {
      void onSubmit({ mode: "basic", name: trimmedName });
      return;
    }
    void onSubmit({ mode: "guided", name: trimmedName, draft: guidedDraft });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create agent"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-4xl rounded-lg border border-border bg-card"
        onClick={(event) => event.stopPropagation()}
        data-testid="agent-create-modal"
      >
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              New Agent
            </div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {mode ? `${mode === "basic" ? "Basic" : "Guided"} setup` : "Choose setup mode"}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md border border-border/80 bg-surface-3 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:border-border hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="max-h-[72vh] overflow-auto px-5 py-4">
          {stepKey !== "mode" ? (
            <div className="mb-4">
              <label className={labelClassName}>
                Agent name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`mt-1 ${fieldClassName}`}
                  placeholder="My agent"
                />
              </label>
            </div>
          ) : null}

          {stepKey === "mode" ? (
            <div className="grid gap-3 md:grid-cols-2" data-testid="agent-create-mode-step">
              <button
                type="button"
                className={`rounded-md border px-4 py-4 text-left transition ${
                  mode === "basic"
                    ? "border-border bg-surface-2"
                    : "border-border/80 bg-surface-1 hover:border-border hover:bg-surface-2"
                }`}
                onClick={() => setMode("basic")}
              >
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Basic
                </div>
                <div className="mt-2 text-sm text-foreground">
                  Fast path: create the agent with minimal setup.
                </div>
              </button>
              <button
                type="button"
                className={`rounded-md border px-4 py-4 text-left transition ${
                  mode === "guided"
                    ? "border-border bg-surface-2"
                    : "border-border/80 bg-surface-1 hover:border-border hover:bg-surface-2"
                }`}
                onClick={() => setMode("guided")}
              >
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Guided
                </div>
                <div className="mt-2 text-sm text-foreground">
                  Define outcomes, risk controls, and behavior before creating.
                </div>
              </button>
            </div>
          ) : null}

          {stepKey === "outcome" ? (
            <div className="grid gap-4" data-testid="agent-create-outcome-step">
              <label className={labelClassName}>
                Primary outcome
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={guidedDraft.primaryOutcome}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      primaryOutcome: event.target.value,
                    }))
                  }
                  placeholder="What should this agent achieve?"
                />
              </label>
              <label className={labelClassName}>
                Success criteria (one per line, at least 3)
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.successCriteria)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      successCriteria: parseLineList(event.target.value),
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Non-goals (one per line, at least 3)
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.nonGoals)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      nonGoals: parseLineList(event.target.value),
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Example tasks (one per line, at least 2)
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.exampleTasks)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      exampleTasks: parseLineList(event.target.value),
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Failure mode you cannot tolerate
                <input
                  className={`mt-1 ${fieldClassName}`}
                  value={guidedDraft.failureMode}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      failureMode: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          ) : null}

          {stepKey === "controls" ? (
            <div className="grid gap-4" data-testid="agent-create-controls-step">
              <label className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-surface-2 px-3 py-2">
                <span className={labelClassName}>Allow runtime exec tools</span>
                <input
                  type="checkbox"
                  checked={guidedDraft.controls.allowExec}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      controls: {
                        ...current.controls,
                        allowExec: event.target.checked,
                      },
                    }))
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className={labelClassName}>
                  Exec autonomy
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.execAutonomy}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          execAutonomy: event.target.value as GuidedAgentCreationDraft["controls"]["execAutonomy"],
                        },
                      }))
                    }
                  >
                    <option value="ask-first">Ask first</option>
                    <option value="auto">Auto (bounded)</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  File edit autonomy
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.fileEditAutonomy}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          fileEditAutonomy:
                            event.target.value as GuidedAgentCreationDraft["controls"]["fileEditAutonomy"],
                        },
                      }))
                    }
                  >
                    <option value="propose-only">Propose only</option>
                    <option value="auto-edit">Auto edit</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  Sandbox mode
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.sandboxMode}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          sandboxMode:
                            event.target.value as GuidedAgentCreationDraft["controls"]["sandboxMode"],
                        },
                      }))
                    }
                  >
                    <option value="off">Off</option>
                    <option value="non-main">Non-main</option>
                    <option value="all">All sessions</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  Workspace access
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.workspaceAccess}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          workspaceAccess:
                            event.target.value as GuidedAgentCreationDraft["controls"]["workspaceAccess"],
                        },
                      }))
                    }
                  >
                    <option value="none">None</option>
                    <option value="ro">Read-only</option>
                    <option value="rw">Read/write</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  Tool profile
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.toolsProfile}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          toolsProfile:
                            event.target.value as GuidedAgentCreationDraft["controls"]["toolsProfile"],
                        },
                      }))
                    }
                  >
                    <option value="minimal">Minimal</option>
                    <option value="coding">Coding</option>
                    <option value="messaging">Messaging</option>
                    <option value="full">Full</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  Approval security
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.approvalSecurity}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          approvalSecurity:
                            event.target.value as GuidedAgentCreationDraft["controls"]["approvalSecurity"],
                        },
                      }))
                    }
                  >
                    <option value="deny">Deny</option>
                    <option value="allowlist">Allowlist</option>
                    <option value="full">Full</option>
                  </select>
                </label>
                <label className={labelClassName}>
                  Approval ask
                  <select
                    className={`mt-1 ${fieldClassName}`}
                    value={guidedDraft.controls.approvalAsk}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        controls: {
                          ...current.controls,
                          approvalAsk:
                            event.target.value as GuidedAgentCreationDraft["controls"]["approvalAsk"],
                        },
                      }))
                    }
                  >
                    <option value="always">Always</option>
                    <option value="on-miss">On miss</option>
                    <option value="off">Off</option>
                  </select>
                </label>
              </div>
              <label className={labelClassName}>
                Additional tool allowlist entries (comma or newline separated)
                <textarea
                  className={`mt-1 min-h-16 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.controls.toolsAllow)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      controls: {
                        ...current.controls,
                        toolsAllow: parseLineList(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Additional tool denylist entries (comma or newline separated)
                <textarea
                  className={`mt-1 min-h-16 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.controls.toolsDeny)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      controls: {
                        ...current.controls,
                        toolsDeny: parseLineList(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Exec approval allowlist patterns (comma or newline separated)
                <textarea
                  className={`mt-1 min-h-16 ${fieldClassName}`}
                  value={formatLineList(guidedDraft.controls.approvalAllowlist)}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      controls: {
                        ...current.controls,
                        approvalAllowlist: parseLineList(event.target.value),
                      },
                    }))
                  }
                />
              </label>
            </div>
          ) : null}

          {stepKey === "identity" ? (
            <div className="grid gap-4" data-testid="agent-create-identity-step">
              <label className={labelClassName}>
                Tone and boundaries
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={guidedDraft.tone}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      tone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                User profile
                <textarea
                  className={`mt-1 min-h-20 ${fieldClassName}`}
                  value={guidedDraft.userProfile}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      userProfile: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Tool usage notes
                <textarea
                  className={`mt-1 min-h-16 ${fieldClassName}`}
                  value={guidedDraft.toolNotes}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      toolNotes: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={labelClassName}>
                Memory seeds
                <textarea
                  className={`mt-1 min-h-16 ${fieldClassName}`}
                  value={guidedDraft.memoryNotes}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      memoryNotes: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-surface-2 px-3 py-2">
                <span className={labelClassName}>Enable heartbeat checklist</span>
                <input
                  type="checkbox"
                  checked={guidedDraft.heartbeatEnabled}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      heartbeatEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
              {guidedDraft.heartbeatEnabled ? (
                <label className={labelClassName}>
                  Heartbeat checklist
                  <textarea
                    className={`mt-1 min-h-16 ${fieldClassName}`}
                    value={formatLineList(guidedDraft.heartbeatChecklist)}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        heartbeatChecklist: parseLineList(event.target.value),
                      }))
                    }
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {stepKey === "review" ? (
            <div className="grid gap-4" data-testid="agent-create-review-step">
              {mode === "basic" ? (
                <div className="rounded-md border border-border/80 bg-surface-2 px-4 py-3 text-sm text-foreground">
                  This will create <span className="font-semibold">{name.trim() || "New Agent"}</span>{" "}
                  with default runtime behavior and no additional overrides.
                </div>
              ) : compiledGuided ? (
                <>
                  <div className="rounded-md border border-border/80 bg-surface-2 px-4 py-3">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Config preview
                    </div>
                    <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
                      {compiledGuided.summary.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  {compiledGuided.validation.errors.length > 0 ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/12 px-4 py-3 text-sm text-destructive">
                      {compiledGuided.validation.errors.map((error) => (
                        <div key={error}>{error}</div>
                      ))}
                    </div>
                  ) : null}
                  {compiledGuided.validation.warnings.length > 0 ? (
                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                      {compiledGuided.validation.warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    {Object.entries(compiledGuided.files).map(([fileName, content]) => (
                      <details
                        key={fileName}
                        className="rounded-md border border-border/80 bg-surface-2 px-3 py-2"
                      >
                        <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {fileName}
                        </summary>
                        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-md border border-border/70 bg-surface-3 p-2 text-[11px] text-foreground">
                          {content}
                        </pre>
                      </details>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/12 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/80 px-5 py-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border/80 bg-surface-3 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:border-border hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={moveBack}
              disabled={stepIndex === 0 || busy}
            >
              Back
            </button>
            {stepKey === "review" ? (
              <button
                type="button"
                className="rounded-md border border-transparent bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                onClick={handleSubmit}
                disabled={!canSubmit || busy}
              >
                {busy ? "Creating..." : "Create agent"}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md border border-transparent bg-primary px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                onClick={moveNext}
                disabled={!canGoNext || busy}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
