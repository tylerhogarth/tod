import { Result, TaggedError } from "better-result";
import { z } from "zod";
import { type IoError, type OutOfBoundsError, readFileIfExists, writeFileAtomic } from "./fsx.ts";

export const workItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  kind: z.enum(["feature", "bug", "task"]),
  status: z.enum(["open", "in-progress", "done"]),
  parent: z.number().int().positive().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workStateSchema = z.object({
  version: z.literal(1),
  nextId: z.number().int().positive(),
  projects: z.array(
    z.object({
      name: z.string().min(1),
      items: z.array(workItemSchema),
    }),
  ),
});

export type WorkItem = z.infer<typeof workItemSchema>;
export type WorkState = z.infer<typeof workStateSchema>;

export const emptyWorkState: WorkState = { version: 1, nextId: 1, projects: [] };

export class WorkStateError extends TaggedError("WorkState")<{
  path: string;
  message: string;
}> {}

export class UnknownWorkItemError extends TaggedError("UnknownWorkItem")<{
  id: number;
}> {}

export function loadWorkState(path: string): Result<WorkState, WorkStateError> {
  const raw = readFileIfExists(path);
  if (raw === null) {
    return Result.ok(emptyWorkState);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    return Result.err(
      new WorkStateError({
        path,
        message: `not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
    );
  }
  const checked = workStateSchema.safeParse(parsed);
  if (!checked.success) {
    return Result.err(new WorkStateError({ path, message: z.prettifyError(checked.error) }));
  }
  return Result.ok(checked.data);
}

export function saveWorkState(
  path: string,
  state: WorkState,
  roots: readonly string[],
): Result<"created" | "updated" | "unchanged", OutOfBoundsError | IoError> {
  return writeFileAtomic(path, `${JSON.stringify(state, null, 2)}\n`, roots);
}

export interface AddedItem {
  state: WorkState;
  item: WorkItem;
}

export function addItem(
  state: WorkState,
  input: {
    project: string;
    title: string;
    kind: WorkItem["kind"];
    parent?: number;
    now: string;
  },
): Result<AddedItem, UnknownWorkItemError> {
  if (input.parent !== undefined && !findItem(state, input.parent)) {
    return Result.err(new UnknownWorkItemError({ id: input.parent }));
  }
  const item: WorkItem = {
    id: state.nextId,
    title: input.title,
    kind: input.kind,
    status: "open",
    ...(input.parent !== undefined ? { parent: input.parent } : {}),
    createdAt: input.now,
    updatedAt: input.now,
  };
  const projects = state.projects.some((p) => p.name === input.project)
    ? state.projects.map((p) =>
        p.name === input.project ? { ...p, items: [...p.items, item] } : p,
      )
    : [...state.projects, { name: input.project, items: [item] }];
  return Result.ok({ state: { ...state, nextId: state.nextId + 1, projects }, item });
}

export function findItem(state: WorkState, id: number): { project: string; item: WorkItem } | null {
  for (const project of state.projects) {
    const item = project.items.find((candidate) => candidate.id === id);
    if (item) {
      return { project: project.name, item };
    }
  }
  return null;
}

export interface UpdatedItem {
  state: WorkState;
  item: WorkItem;
  changed: boolean;
}

export function setStatus(
  state: WorkState,
  id: number,
  status: WorkItem["status"],
  now: string,
): Result<UpdatedItem, UnknownWorkItemError> {
  const found = findItem(state, id);
  if (!found) {
    return Result.err(new UnknownWorkItemError({ id }));
  }
  if (found.item.status === status) {
    return Result.ok({ state, item: found.item, changed: false });
  }
  const updated: WorkItem = { ...found.item, status, updatedAt: now };
  const projects = state.projects.map((project) => ({
    ...project,
    items: project.items.map((item) => (item.id === id ? updated : item)),
  }));
  return Result.ok({ state: { ...state, projects }, item: updated, changed: true });
}
