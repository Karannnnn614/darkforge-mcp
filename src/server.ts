import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import * as scanStack from "./tools/scan-stack.js";
import * as forgeComponent from "./tools/forge-component.js";
import * as forgeSkeleton from "./tools/forge-skeleton.js";
import * as forgeDark from "./tools/forge-dark.js";
import * as forgePage from "./tools/forge-page.js";
import * as listLibraries from "./tools/list-libraries.js";
import * as getReference from "./tools/get-reference.js";
import * as listReferences from "./tools/list-references.js";

interface ToolModule {
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  }>;
}

const TOOLS: Array<{ name: string; mod: ToolModule }> = [
  { name: "scan_stack", mod: scanStack as unknown as ToolModule },
  { name: "list_libraries", mod: listLibraries as unknown as ToolModule },
  { name: "forge_component", mod: forgeComponent as unknown as ToolModule },
  { name: "forge_skeleton", mod: forgeSkeleton as unknown as ToolModule },
  { name: "forge_dark", mod: forgeDark as unknown as ToolModule },
  { name: "forge_page", mod: forgePage as unknown as ToolModule },
  { name: "get_reference", mod: getReference as unknown as ToolModule },
  { name: "list_references", mod: listReferences as unknown as ToolModule },
];

export function setupTools(server: McpServer): void {
  for (const { name, mod } of TOOLS) {
    server.registerTool(
      name,
      {
        title: mod.title,
        description: mod.description,
        inputSchema: mod.inputSchema as never,
      },
      mod.handler as never,
    );
  }
}

export const REGISTERED_TOOL_NAMES = TOOLS.map((t) => t.name);
