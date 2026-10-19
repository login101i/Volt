'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react';
import {
  createDevelopmentIssue,
  deleteDevelopmentIssue,
  DEVELOPMENT_ISSUES_CHANGED_EVENT,
  fetchDevelopmentIssues,
  updateDevelopmentIssue,
  type DevelopmentIssue,
  type DevelopmentIssueFlag,
  type DevelopmentIssuePriority,
} from '@/lib/developmentIssues';
import {
  authorFromCreatedBy,
  getAuthorMeta,
  resolveDevAuthor,
  type DevAuthorId,
} from '@/lib/devAuthor';

type BoardColumnId = 'todo' | 'testing' | 'done';

const COLUMNS: Array<{
  id: BoardColumnId;
  title: string;
  flag: DevelopmentIssueFlag;
  accent: string;
}> = [
  { id: 'todo', title: 'To do', flag: 'pending', accent: '#64748b' },
  { id: 'testing', title: 'Testing', flag: 'testing', accent: '#d97706' },
  { id: 'done', title: 'Done', flag: 'corrected', accent: '#059669' },
];

function columnForFlag(flag: DevelopmentIssueFlag): BoardColumnId {
  if (flag === 'testing') return 'testing';
  if (flag === 'corrected') return 'done';
  // blocked/skipped (legacy) → To do
  return 'todo';
}

function flagForColumn(column: BoardColumnId): DevelopmentIssueFlag {
  return COLUMNS.find((c) => c.id === column)?.flag ?? 'pending';
}

function displayPriority(priority: DevelopmentIssuePriority): 'high' | 'low' {
  return priority === 'high' ? 'high' : 'low';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function DevelopmentBoard() {
  const [issues, setIssues] = useState<DevelopmentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<BoardColumnId | null>(null);
  const [addColumn, setAddColumn] = useState<BoardColumnId | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<DevelopmentIssuePriority>('low');
  const [saving, setSaving] = useState(false);

  const loadIssues = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(null);
      const list = await fetchDevelopmentIssues();
      setIssues(list);
    } catch (err) {
      if (!silent) {
        setError((err as Error).message || 'Nie udało się wczytać zadań');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIssues();
    const onChange = () => void loadIssues(true);
    window.addEventListener(DEVELOPMENT_ISSUES_CHANGED_EVENT, onChange);
    const interval = window.setInterval(() => {
      if (!document.hidden) void loadIssues(true);
    }, 10_000);
    return () => {
      window.removeEventListener(DEVELOPMENT_ISSUES_CHANGED_EVENT, onChange);
      window.clearInterval(interval);
    };
  }, [loadIssues]);

  const byColumn = useMemo(() => {
    const map = new Map<BoardColumnId, DevelopmentIssue[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const issue of issues) {
      const col = columnForFlag(issue.flag);
      map.get(col)!.push(issue);
    }
    for (const col of COLUMNS) {
      const list = map.get(col.id)!;
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return map;
  }, [issues]);

  const openAdd = (columnId: BoardColumnId) => {
    setEditingId(null);
    setAddColumn(columnId);
    setTitle('');
    setDescription('');
    setPriority('low');
  };

  const openEdit = (issue: DevelopmentIssue) => {
    setAddColumn(null);
    setEditingId(issue.id);
    setTitle(issue.title);
    setDescription(issue.description);
    setPriority(displayPriority(issue.priority));
  };

  const closeForm = () => {
    setAddColumn(null);
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setSaving(true);
    try {
      if (editingId) {
        const data = await updateDevelopmentIssue(editingId, {
          title: nextTitle,
          description,
          priority,
        });
        if (data.issues.length) setIssues(data.issues);
      } else if (addColumn) {
        const who = resolveDevAuthor();
        const data = await createDevelopmentIssue({
          title: nextTitle,
          description,
          priority,
          flag: flagForColumn(addColumn),
          createdBy: who,
          page: typeof window !== 'undefined' ? window.location.pathname : '/development',
        });
        setIssues(data.issues);
      }
      closeForm();
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Nie udało się zapisać');
    } finally {
      setSaving(false);
    }
  };

  const moveIssue = async (issueId: string, columnId: BoardColumnId) => {
    const flag = flagForColumn(columnId);
    setIssues((prev) =>
      prev.map((item) => (item.id === issueId ? { ...item, flag } : item)),
    );
    try {
      const data = await updateDevelopmentIssue(issueId, { flag });
      if (data.issues.length) setIssues(data.issues);
    } catch (err) {
      setError((err as Error).message || 'Nie udało się przenieść zadania');
      void loadIssues();
    }
  };

  const removeIssue = async (issueId: string) => {
    if (!window.confirm('Usunąć to zadanie?')) return;
    setIssues((prev) => prev.filter((item) => item.id !== issueId));
    try {
      const data = await deleteDevelopmentIssue(issueId);
      if (Array.isArray(data.issues)) setIssues(data.issues);
    } catch (err) {
      setError((err as Error).message || 'Nie udało się usunąć');
      void loadIssues();
    }
  };

  const togglePriority = async (issue: DevelopmentIssue) => {
    const next: DevelopmentIssuePriority =
      displayPriority(issue.priority) === 'high' ? 'low' : 'high';
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issue.id ? { ...item, priority: next } : item,
      ),
    );
    try {
      const data = await updateDevelopmentIssue(issue.id, { priority: next });
      if (data.issues.length) setIssues(data.issues);
    } catch (err) {
      setError((err as Error).message || 'Nie udało się zmienić priorytetu');
      void loadIssues();
    }
  };

  const onDragStart = (e: DragEvent, issueId: string) => {
    e.dataTransfer.setData('text/plain', issueId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: DragEvent, columnId: BoardColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const issueId = e.dataTransfer.getData('text/plain');
    if (!issueId) return;
    void moveIssue(issueId, columnId);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--volt-line)] border-t-[var(--volt-accent)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => void loadIssues()}
          >
            Odśwież
          </button>
        </div>
      )}

      <div
        className="dev-board-columns min-h-0 flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
          gap: 12,
          alignItems: 'stretch',
          overflowX: 'auto',
        }}
      >
        {COLUMNS.map((col) => {
          const list = byColumn.get(col.id) ?? [];
          const isDrop = dragOverColumn === col.id;
          return (
            <section
              key={col.id}
              className={`flex min-h-[calc(100vh-11rem)] min-w-0 flex-col overflow-hidden rounded-xl border bg-[var(--volt-surface)] ${
                isDrop
                  ? 'border-[var(--volt-accent)] ring-1 ring-[var(--volt-accent)]'
                  : 'border-[var(--volt-line)]'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(col.id);
              }}
              onDragLeave={() =>
                setDragOverColumn((prev) => (prev === col.id ? null : prev))
              }
              onDrop={(e) => onDrop(e, col.id)}
            >
              <header
                className="flex items-center justify-between border-b border-[var(--volt-line)] px-3 py-2.5"
                style={{ borderTop: `3px solid ${col.accent}` }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--volt-text)]">
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-[var(--volt-surface2)] px-2 py-0.5 text-[11px] text-[var(--volt-muted)]">
                    {list.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="volt-btn volt-btn--ghost volt-btn--sm"
                  onClick={() => openAdd(col.id)}
                  aria-label={`Dodaj w ${col.title}`}
                >
                  +
                </button>
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {addColumn === col.id && (
                  <IssueForm
                    title={title}
                    description={description}
                    priority={priority}
                    saving={saving}
                    submitLabel="Dodaj"
                    onTitle={setTitle}
                    onDescription={setDescription}
                    onPriority={setPriority}
                    onSubmit={onSubmit}
                    onCancel={closeForm}
                  />
                )}

                {list.map((issue) =>
                  editingId === issue.id ? (
                    <IssueForm
                      key={issue.id}
                      title={title}
                      description={description}
                      priority={priority}
                      saving={saving}
                      submitLabel="Zapisz"
                      onTitle={setTitle}
                      onDescription={setDescription}
                      onPriority={setPriority}
                      onSubmit={onSubmit}
                      onCancel={closeForm}
                    />
                  ) : (
                    <article
                      key={issue.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, issue.id)}
                      className={`cursor-grab rounded-lg border bg-[var(--volt-surface2)] p-2.5 active:cursor-grabbing ${
                        displayPriority(issue.priority) === 'high'
                          ? 'border-red-400/50'
                          : 'border-[var(--volt-line)]'
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          {(() => {
                            const who = authorFromCreatedBy(issue.createdBy);
                            return who ? (
                              <AuthorDot id={who} size={22} />
                            ) : null;
                          })()}
                          <h3 className="text-sm font-medium leading-snug text-[var(--volt-text)]">
                            {issue.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            displayPriority(issue.priority) === 'high'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-[var(--volt-surface)] text-[var(--volt-muted)]'
                          }`}
                          onClick={() => void togglePriority(issue)}
                          title="Przełącz priorytet"
                        >
                          {displayPriority(issue.priority)}
                        </button>
                      </div>
                      {issue.description ? (
                        <p className="mb-2 line-clamp-3 text-xs text-[var(--volt-muted)]">
                          {issue.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-[var(--volt-muted)]">
                        <span>{formatDate(issue.createdAt)}</span>
                        {issue.page ? (
                          <span className="truncate opacity-70">· {issue.page}</span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 text-[10px] text-[var(--volt-muted)] hover:bg-[var(--volt-surface)] hover:text-[var(--volt-text)]"
                          onClick={() => openEdit(issue)}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-[var(--volt-surface)]"
                          onClick={() => void removeIssue(issue.id)}
                        >
                          Usuń
                        </button>
                      </div>
                    </article>
                  ),
                )}

                {list.length === 0 && addColumn !== col.id && (
                  <p className="px-1 py-6 text-center text-xs text-[var(--volt-muted)]">
                    Przeciągnij kartę lub dodaj (+)
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AuthorDot({ id, size = 22 }: { id: DevAuthorId; size?: number }) {
  const meta = getAuthorMeta(id);
  return (
    <span
      title={meta.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none"
      style={{
        width: size,
        height: size,
        backgroundColor: meta.bg,
        color: meta.color,
      }}
    >
      {id}
    </span>
  );
}

function IssueForm({
  title,
  description,
  priority,
  saving,
  submitLabel,
  onTitle,
  onDescription,
  onPriority,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  priority: DevelopmentIssuePriority;
  saving: boolean;
  submitLabel: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  onPriority: (v: DevelopmentIssuePriority) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-[var(--volt-accent)]/40 bg-[var(--volt-surface)] p-2.5"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Tytuł"
        className="mb-2 w-full rounded border border-[var(--volt-line)] bg-[var(--volt-surface2)] px-2 py-1.5 text-sm text-[var(--volt-text)] outline-none focus:border-[var(--volt-accent)]"
      />
      <textarea
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        placeholder="Opis (opcjonalnie)"
        rows={2}
        className="mb-2 w-full resize-none rounded border border-[var(--volt-line)] bg-[var(--volt-surface2)] px-2 py-1.5 text-xs text-[var(--volt-text)] outline-none focus:border-[var(--volt-accent)]"
      />
      <select
        value={priority === 'high' ? 'high' : 'low'}
        onChange={(e) =>
          onPriority(e.target.value === 'high' ? 'high' : 'low')
        }
        className="mb-2 w-full rounded border border-[var(--volt-line)] bg-[var(--volt-surface2)] px-2 py-1 text-xs text-[var(--volt-text)]"
      >
        <option value="low">Priorytet: low</option>
        <option value="high">Priorytet: high</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="volt-btn volt-btn--sm"
        >
          {saving ? '…' : submitLabel}
        </button>
        <button
          type="button"
          className="volt-btn volt-btn--ghost volt-btn--sm"
          onClick={onCancel}
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
