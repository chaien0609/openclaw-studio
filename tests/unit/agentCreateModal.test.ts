import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AgentCreateModal } from "@/features/agents/components/AgentCreateModal";

describe("AgentCreateModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("submits the basic path payload", () => {
    const onSubmit = vi.fn();
    render(
      createElement(AgentCreateModal, {
        open: true,
        suggestedName: "New Agent",
        onClose: vi.fn(),
        onSubmit,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /Basic/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByLabelText("Agent name"), {
      target: { value: "Planner Agent" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: "basic",
      name: "Planner Agent",
    });
  });

  it("gates guided outcome step until required fields are complete", () => {
    const onSubmit = vi.fn();
    render(
      createElement(AgentCreateModal, {
        open: true,
        suggestedName: "Guided Agent",
        onClose: vi.fn(),
        onSubmit,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /Guided/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("agent-create-outcome-step")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Primary outcome"), {
      target: { value: "Automate weekly release summaries." },
    });
    fireEvent.change(screen.getByLabelText("Success criteria (one per line, at least 3)"), {
      target: { value: "Fast\nAccurate\nActionable" },
    });
    fireEvent.change(screen.getByLabelText("Non-goals (one per line, at least 3)"), {
      target: { value: "No posting\nNo merges\nNo customer outreach" },
    });
    fireEvent.change(screen.getByLabelText("Example tasks (one per line, at least 2)"), {
      target: { value: "Summarize PRs\nDraft release note" },
    });
    fireEvent.change(screen.getByLabelText("Failure mode you cannot tolerate"), {
      target: { value: "Publishing inaccurate release notes." },
    });

    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "guided",
        name: "Guided Agent",
      })
    );
  });

  it("calls onClose when close is pressed", () => {
    const onClose = vi.fn();
    render(
      createElement(AgentCreateModal, {
        open: true,
        suggestedName: "New Agent",
        onClose,
        onSubmit: vi.fn(),
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
