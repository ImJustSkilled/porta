/**
 * /api/workspaces route
 */

import type { Hono } from "hono";
import { discovery, rpc } from "../routing.js";
import { handleRPCError } from "../errors.js";

export function registerWorkspaceRoutes(app: Hono): void {
  app.get("/api/workspaces", async (c) => {
    try {
      const instances = await discovery.getInstances();
      const allInfos: { workspaceUri: string; gitRootUri?: string }[] = [];
      let homeDirPath = "";
      let homeDirUri = "";

      await Promise.allSettled(
        instances.map(async (inst) => {
          try {
            const data = (await rpc.call("GetWorkspaceInfos", {}, inst)) as {
              homeDirPath?: string;
              homeDirUri?: string;
              workspaceInfos?: { workspaceUri: string; gitRootUri?: string }[];
            };
            if (data.homeDirPath) homeDirPath = data.homeDirPath;
            if (data.homeDirUri) homeDirUri = data.homeDirUri;
            if (data.workspaceInfos) allInfos.push(...data.workspaceInfos);
          } catch {
            // Skip unreachable instances
          }
        }),
      );

      return c.json({ homeDirPath, homeDirUri, workspaceInfos: allInfos });
    } catch (err) {
      return handleRPCError(c, err);
    }
  });
}
