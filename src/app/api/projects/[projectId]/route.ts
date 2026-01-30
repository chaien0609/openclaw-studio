import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import type { ProjectUpdatePayload } from "@/lib/projects/types";
import { resolveProjectFromParams } from "@/lib/projects/resolve.server";
import {
  archiveProjectInStore,
  restoreProjectInStore,
  saveStore,
} from "../store";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolved = await resolveProjectFromParams(context.params);
    if (!resolved.ok) {
      return resolved.response;
    }
    const { store, projectId: resolvedProjectId } = resolved;

    const { store: nextStore } = archiveProjectInStore(store, resolvedProjectId);
    saveStore(nextStore);
    return NextResponse.json({ store: nextStore, warnings: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to archive workspace.";
    logger.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const body = (await request.json()) as ProjectUpdatePayload;
    const hasArchivedAt = Object.prototype.hasOwnProperty.call(body ?? {}, "archivedAt");
    if (!hasArchivedAt) {
      return NextResponse.json(
        { error: "Workspace update requires archivedAt." },
        { status: 400 }
      );
    }
    if (body.archivedAt !== null && typeof body.archivedAt !== "number") {
      return NextResponse.json({ error: "ArchivedAt is invalid." }, { status: 400 });
    }

    const resolved = await resolveProjectFromParams(context.params);
    if (!resolved.ok) {
      return resolved.response;
    }
    const { store, projectId: resolvedProjectId } = resolved;
    const now = Date.now();
    const result =
      body.archivedAt === null
        ? restoreProjectInStore(store, resolvedProjectId, now)
        : archiveProjectInStore(store, resolvedProjectId, now);
    if (!result.updated) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }
    saveStore(result.store);
    return NextResponse.json({ store: result.store, warnings: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update workspace.";
    logger.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
