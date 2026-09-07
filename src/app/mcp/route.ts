import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { createTodo, getTodo, todoIdSchema } from "@/lib/todos";

function result(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function failure(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

type ToolResponse = ReturnType<typeof result> | ReturnType<typeof failure>;

async function runTool(
  operation: () => Promise<ToolResponse>,
): Promise<ToolResponse> {
  try {
    return await operation();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
    return failure(message);
  }
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_todo",
    {
      title: "Get Todo",
      description: "Get a todo by its ID",
      inputSchema: z.object({
        id: todoIdSchema.describe("The ID of the todo to retrieve"),
      }),
    },
    ({ id }) =>
      runTool(async () => {
        const todo = await getTodo(id);

        if (!todo) {
          return failure("Nie znaleziono elementu Todo.");
        }

        return result(todo);
      }),
  );
  server.registerTool(
    "create_todo",
    {
      title: "Create Todo",
      description: "Create a new todo",
      inputSchema: z.object({
        title: z.string().describe("The title of the todo"),
        description: z.string().describe("The description of the todo"),
      }),
    },
    ({ title }) =>
      runTool(async () => {
        return result(await createTodo({ title }));
      }),
  );
});

export { handler as GET, handler as POST };
