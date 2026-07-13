/**
 * Minimal ClickUp REST API v2 client with:
 *  - token-bucket throttling (ClickUp allows 100 req/min; we default to 80)
 *  - 429 handling that honors Retry-After, plus exponential backoff for
 *    transient 5xx/network failures
 *  - typed helpers for every endpoint the importer uses
 */

import { setTimeout as sleep } from "node:timers/promises";
import type {
  ClickUpComment,
  ClickUpField,
  ClickUpFolder,
  ClickUpList,
  ClickUpSpace,
  ClickUpTag,
  ClickUpTask,
  ClickUpTeam,
  ClickUpTimeEntry,
  CommentsResponse,
  FieldsResponse,
  FoldersResponse,
  ListsResponse,
  SpaceTagsResponse,
  SpacesResponse,
  TasksPageResponse,
  TeamsResponse,
  TimeEntriesResponse,
} from "./snapshot-types";

const API_BASE = "https://api.clickup.com/api/v2";

export interface ClickUpClientOptions {
  token: string;
  /** Sustained request budget per minute (default 80; ClickUp cap is 100). */
  requestsPerMinute?: number;
  maxRetries?: number;
  verbose?: boolean;
}

export class ClickUpApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "ClickUpApiError";
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>;

export class ClickUpClient {
  private readonly token: string;
  private readonly rpm: number;
  private readonly maxRetries: number;
  private readonly verbose: boolean;
  /** Timestamps (ms) of requests issued within the trailing 60s window. */
  private stamps: number[] = [];
  requestCount = 0;

  constructor(opts: ClickUpClientOptions) {
    this.token = opts.token;
    this.rpm = Math.max(1, opts.requestsPerMinute ?? 80);
    this.maxRetries = opts.maxRetries ?? 6;
    this.verbose = opts.verbose ?? false;
  }

  /** Token bucket: never exceed `rpm` requests in any trailing 60s window. */
  private async throttle(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.stamps = this.stamps.filter((t) => now - t < 60_000);
      if (this.stamps.length < this.rpm) {
        this.stamps.push(now);
        return;
      }
      const waitMs = Math.max(this.stamps[0] + 60_000 - now, 250);
      await sleep(waitMs);
    }
  }

  private async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let lastError: Error = new Error("request never attempted");
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();
      this.requestCount++;
      let res: Response;
      try {
        res = await fetch(url, {
          headers: { Authorization: this.token, Accept: "application/json" },
        });
      } catch (err) {
        lastError =
          err instanceof Error ? err : new Error(`fetch failed: ${String(err)}`);
        const backoff = 1000 * 2 ** attempt + Math.random() * 500;
        if (this.verbose) {
          console.warn(
            `  network error on ${path} (attempt ${attempt + 1}): ${lastError.message}; retrying in ${Math.round(backoff)}ms`,
          );
        }
        await sleep(backoff);
        continue;
      }

      if (res.ok) {
        return (await res.json()) as T;
      }

      const bodyText = (await res.text().catch(() => "")).slice(0, 500);

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 1000 * 2 ** attempt + Math.random() * 500;
        console.warn(
          `  429 rate-limited on ${path}; waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${this.maxRetries + 1})`,
        );
        lastError = new ClickUpApiError("rate limited", 429, bodyText);
        await sleep(waitMs);
        continue;
      }

      if (res.status >= 500) {
        const backoff = 1000 * 2 ** attempt + Math.random() * 500;
        if (this.verbose) {
          console.warn(
            `  ${res.status} on ${path}; retrying in ${Math.round(backoff)}ms`,
          );
        }
        lastError = new ClickUpApiError(
          `ClickUp ${res.status} on ${path}`,
          res.status,
          bodyText,
        );
        await sleep(backoff);
        continue;
      }

      throw new ClickUpApiError(
        `ClickUp API ${res.status} on ${path}: ${bodyText}`,
        res.status,
        bodyText,
      );
    }
    throw new Error(
      `ClickUp API request failed after ${this.maxRetries + 1} attempts on ${path}: ${lastError.message}`,
    );
  }

  // --- Endpoints ---------------------------------------------------------------

  async getTeams(): Promise<ClickUpTeam[]> {
    const res = await this.get<TeamsResponse>("/team");
    return res.teams ?? [];
  }

  async getSpaces(teamId: string, archived: boolean): Promise<ClickUpSpace[]> {
    const res = await this.get<SpacesResponse>(`/team/${teamId}/space`, {
      archived,
    });
    return res.spaces ?? [];
  }

  async getFolders(spaceId: string, archived: boolean): Promise<ClickUpFolder[]> {
    const res = await this.get<FoldersResponse>(`/space/${spaceId}/folder`, {
      archived,
    });
    return res.folders ?? [];
  }

  async getFolderlessLists(
    spaceId: string,
    archived: boolean,
  ): Promise<ClickUpList[]> {
    const res = await this.get<ListsResponse>(`/space/${spaceId}/list`, {
      archived,
    });
    return res.lists ?? [];
  }

  async getSpaceTags(spaceId: string): Promise<ClickUpTag[]> {
    const res = await this.get<SpaceTagsResponse>(`/space/${spaceId}/tag`);
    return res.tags ?? [];
  }

  /** List detail — includes the list's full status set. */
  async getList(listId: string): Promise<ClickUpList> {
    return this.get<ClickUpList>(`/list/${listId}`);
  }

  /** Fields accessible on the list (list + inherited folder/space fields). */
  async getListFields(listId: string): Promise<ClickUpField[]> {
    const res = await this.get<FieldsResponse>(`/list/${listId}/field`);
    return res.fields ?? [];
  }

  /** One page of tasks. Pass sinceMs to fetch only tasks updated after it. */
  async getListTasksPage(
    listId: string,
    page: number,
    sinceMs?: number,
  ): Promise<TasksPageResponse> {
    return this.get<TasksPageResponse>(`/list/${listId}/task`, {
      page,
      include_closed: true,
      subtasks: true,
      date_updated_gt: sinceMs,
    });
  }

  /** Task detail — where attachments, checklists and dependencies live. */
  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.get<ClickUpTask>(`/task/${taskId}`, {
      include_subtasks: false,
    });
  }

  /**
   * One page (up to 25, newest first) of task comments. To page, pass the
   * oldest comment's date (`start`) and id (`start_id`) from the prior page.
   */
  async getTaskCommentsPage(
    taskId: string,
    start?: string,
    startId?: string,
  ): Promise<ClickUpComment[]> {
    const res = await this.get<CommentsResponse>(`/task/${taskId}/comment`, {
      start,
      start_id: startId,
    });
    return res.comments ?? [];
  }

  /** All comments for a task, oldest→newest. */
  async getAllTaskComments(taskId: string): Promise<ClickUpComment[]> {
    const all: ClickUpComment[] = [];
    let start: string | undefined;
    let startId: string | undefined;
    for (let page = 0; page < 200; page++) {
      const batch = await this.getTaskCommentsPage(taskId, start, startId);
      if (batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 25) break;
      const oldest = batch[batch.length - 1];
      start = oldest.date ?? undefined;
      startId = oldest.id;
      if (!start || !startId) break;
    }
    // API returns newest-first; store oldest-first for stable diffs.
    return all.reverse();
  }

  /** Time entries for the window, for the given assignees (workspace seats). */
  async getTimeEntries(
    teamId: string,
    startMs: number,
    endMs: number,
    assigneeIds: number[],
  ): Promise<ClickUpTimeEntry[]> {
    const res = await this.get<TimeEntriesResponse>(
      `/team/${teamId}/time_entries`,
      {
        start_date: startMs,
        end_date: endMs,
        assignee: assigneeIds.join(","),
        include_task_tags: false,
        include_location_names: false,
      },
    );
    return res.data ?? [];
  }
}
