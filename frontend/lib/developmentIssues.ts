import { api } from './api';

/** green=corrected/done, yellow=pending/todo, amber=testing, red=blocked/not fixed */
export type DevelopmentIssueFlag =
  | 'corrected'
  | 'pending'
  | 'testing'
  | 'blocked'
  | 'skipped';

export type DevelopmentIssuePriority = 'low' | 'medium' | 'high';

export type DevelopmentIssue = {
  id: string;
  title: string;
  description: string;
  page: string;
  screenshotUrl: string;
  createdAt: string;
  createdBy?: string;
  flag: DevelopmentIssueFlag;
  priority: DevelopmentIssuePriority;
  plannedDate: string | null;
};

export type CreateDevelopmentIssueInput = {
  title: string;
  description?: string;
  page?: string;
  screenshotUrl?: string;
  createdBy?: string;
  flag?: DevelopmentIssueFlag;
  priority?: DevelopmentIssuePriority;
};

export const DEVELOPMENT_ISSUES_CHANGED_EVENT = 'development-issues-changed';

export function notifyDevelopmentIssuesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DEVELOPMENT_ISSUES_CHANGED_EVENT));
}

export function capitalizeIssueTitle(title: string): string {
  const t = String(title ?? '').trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase('pl-PL') + t.slice(1);
}

function normalizeIssue(
  raw: Partial<DevelopmentIssue> & { id?: string },
): DevelopmentIssue {
  const plannedRaw =
    raw.plannedDate === null || raw.plannedDate === undefined || raw.plannedDate === ''
      ? null
      : String(raw.plannedDate).slice(0, 10);
  return {
    id: String(raw.id ?? ''),
    title: capitalizeIssueTitle(String(raw.title ?? '')),
    description: String(raw.description ?? ''),
    page: String(raw.page ?? ''),
    screenshotUrl: String(raw.screenshotUrl ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    ...(raw.createdBy ? { createdBy: String(raw.createdBy) } : {}),
    flag: (raw.flag as DevelopmentIssueFlag) || 'pending',
    priority:
      (raw.priority as DevelopmentIssuePriority) === 'high'
        ? 'high'
        : (raw.priority as DevelopmentIssuePriority) === 'medium'
          ? 'medium'
          : 'low',
    plannedDate:
      plannedRaw && /^\d{4}-\d{2}-\d{2}$/.test(plannedRaw) ? plannedRaw : null,
  };
}

async function parseIssuesResponse(data: {
  ok?: boolean;
  issues?: unknown;
  issue?: unknown;
  message?: string;
}): Promise<{
  ok: boolean;
  issues: DevelopmentIssue[];
  issue?: DevelopmentIssue;
  message?: string;
}> {
  if (data?.ok === false) {
    throw new Error(data?.message || 'Development issues request failed');
  }
  return {
    ok: true,
    issues: Array.isArray(data?.issues)
      ? (data.issues as Partial<DevelopmentIssue>[]).map(normalizeIssue)
      : [],
    issue: data?.issue
      ? normalizeIssue(data.issue as Partial<DevelopmentIssue>)
      : undefined,
    message: data?.message,
  };
}

export async function fetchDevelopmentIssues(): Promise<DevelopmentIssue[]> {
  const data = await api.fetch('/api/development-issues');
  const parsed = await parseIssuesResponse(data);
  return parsed.issues;
}

export async function createDevelopmentIssue(
  input: CreateDevelopmentIssueInput,
): Promise<{ issue: DevelopmentIssue; issues: DevelopmentIssue[] }> {
  const title = capitalizeIssueTitle(String(input.title ?? ''));
  if (!title) throw new Error('Title is required');

  const data = await api.fetch('/api/development-issues', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description: String(input.description ?? '').trim(),
      page: String(input.page ?? '').trim(),
      screenshotUrl: String(input.screenshotUrl ?? '').trim(),
      createdBy: String(input.createdBy ?? '').trim() || undefined,
      flag: input.flag ?? 'pending',
      priority: input.priority ?? 'low',
    }),
  });

  const parsed = await parseIssuesResponse(data);
  if (!parsed.issue) throw new Error('Server did not return the created issue');
  notifyDevelopmentIssuesChanged();
  return { issue: parsed.issue, issues: parsed.issues };
}

export async function updateDevelopmentIssue(
  issueId: string,
  patch: {
    flag?: DevelopmentIssueFlag;
    priority?: DevelopmentIssuePriority;
    plannedDate?: string | null;
    title?: string;
    description?: string;
  },
): Promise<{ issue?: DevelopmentIssue; issues: DevelopmentIssue[] }> {
  const body: Record<string, unknown> = { id: issueId, ...patch };
  if (patch.title !== undefined) {
    body.title = capitalizeIssueTitle(String(patch.title ?? ''));
  }
  if (patch.description !== undefined) {
    body.description = String(patch.description ?? '').trim();
  }
  const data = await api.fetch('/api/development-issues', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const parsed = await parseIssuesResponse(data);
  notifyDevelopmentIssuesChanged();
  return parsed;
}

export async function deleteDevelopmentIssue(
  issueId: string,
): Promise<{ issues: DevelopmentIssue[] }> {
  const id = String(issueId ?? '').trim();
  if (!id) throw new Error('id is required');
  const data = await api.fetch(`/api/development-issues/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const parsed = await parseIssuesResponse(data);
  notifyDevelopmentIssuesChanged();
  return parsed;
}
