#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupTools, REGISTERED_TOOL_NAMES } from "./server.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "darkforge",
    version: "1.1.0",
  });

  setupTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stderr is safe under stdio transport — stdout is reserved for MCP protocol frames.
  process.stderr.write(
    `Darkforge MCP server running — ${REGISTERED_TOOL_NAMES.length} tools registered: ${REGISTERED_TOOL_NAMES.join(", ")}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`Darkforge MCP server fatal error: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
