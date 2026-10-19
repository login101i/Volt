/**
 * DevelopmentIssues CRUD — MariaDB (jak F6 developmentIssues.controller).
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'lxsxnvawhg_volt',
  user: process.env.MYSQL_USER || 'lxsxnvawhg_volt',
  password: process.env.MYSQL_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const FLAG_VALUES = new Set(['corrected', 'pending', 'testing', 'blocked', 'skipped']);
const PRIORITY_VALUES = new Set(['low', 'medium', 'high']);

function normalizeFlag(value) {
  if (typeof value === 'string' && FLAG_VALUES.has(value)) return value;
  return 'pending';
}

function normalizePriority(value) {
  if (typeof value === 'string' && PRIORITY_VALUES.has(value)) return value;
  return 'medium';
}

function toIsoDateOnly(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
}

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function capitalizeIssueTitle(title) {
  const t = String(title ?? '').trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase('pl-PL') + t.slice(1);
}

function rowToDto(row) {
  return {
    id: String(row.PublicId),
    title: capitalizeIssueTitle(String(row.Title ?? '')),
    description: String(row.Description ?? ''),
    page: String(row.Page ?? ''),
    screenshotUrl: String(row.ScreenshotUrl ?? ''),
    createdAt: toIso(row.CreatedAt),
    ...(row.CreatedBy ? { createdBy: String(row.CreatedBy) } : {}),
    flag: normalizeFlag(row.Flag),
    priority: normalizePriority(row.Priority),
    plannedDate: toIsoDateOnly(row.PlannedDate),
  };
}

let schemaReady = null;

async function ensureDevelopmentIssuesSchema() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DevelopmentIssues'`,
  );
  const byName = new Map(
    (cols || []).map((col) => [
      String(col.COLUMN_NAME),
      String(col.COLUMN_TYPE || '').toLowerCase(),
    ]),
  );

  if (byName.size === 0) {
    console.warn(
      '[developmentIssues] Tabela DevelopmentIssues nie istnieje — uruchom SQL z server/sql/create_development_issues.sql',
    );
    return;
  }

  if (!byName.has('ScreenshotUrl')) {
    await pool.query(
      `ALTER TABLE DevelopmentIssues
       ADD COLUMN ScreenshotUrl VARCHAR(1024) NULL AFTER Page`,
    );
  }

  const flagType = byName.get('Flag') || '';
  if (flagType && !flagType.includes('testing')) {
    await pool.query(
      `ALTER TABLE DevelopmentIssues
       MODIFY COLUMN Flag ENUM('pending','testing','corrected','blocked','skipped')
       NOT NULL DEFAULT 'pending'`,
    );
  }

  if (!byName.has('Priority')) {
    await pool.query(
      `ALTER TABLE DevelopmentIssues
       ADD COLUMN Priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium' AFTER Flag`,
    );
  }

  if (!byName.has('PlannedDate')) {
    await pool.query(
      `ALTER TABLE DevelopmentIssues
       ADD COLUMN PlannedDate DATE NULL COMMENT 'Calendar day YYYY-MM-DD' AFTER Priority`,
    );
  }
}

function readySchema() {
  if (!schemaReady) {
    schemaReady = ensureDevelopmentIssuesSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function listIssues() {
  await readySchema();
  const [rows] = await pool.query(
    `SELECT
       Id, PublicId, Title, Description, Page, ScreenshotUrl, Flag, Priority, PlannedDate,
       CreatedBy, CreatedByUserId, SourceHost, CreatedAt, UpdatedAt
     FROM DevelopmentIssues
     ORDER BY CreatedAt DESC`,
  );
  return (rows || []).map(rowToDto);
}

function makePublicId() {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveSourceHost(req) {
  const origin = String(req.get('origin') || '').trim();
  if (origin) {
    try {
      return new URL(origin).hostname;
    } catch {
      return origin.slice(0, 255);
    }
  }
  const host = String(req.get('host') || '').trim();
  return host ? host.slice(0, 255) : null;
}

/** GET /api/development-issues */
const fetchDevelopmentIssues = async (req, res) => {
  try {
    const issues = await listIssues();
    return res.status(200).json({ ok: true, issues });
  } catch (error) {
    console.error('[developmentIssues] fetch failed:', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to fetch development issues',
    });
  }
};

/** POST /api/development-issues */
const createDevelopmentIssue = async (req, res) => {
  try {
    await readySchema();
    const body = req.body || {};
    const title = capitalizeIssueTitle(String(body.title ?? ''));
    const description = String(body.description ?? '').trim();
    const page = String(body.page ?? '').trim();
    const screenshotUrl = String(body.screenshotUrl ?? '').trim();
    const createdBy = String(body.createdBy ?? '').trim();
    const createdByUserIdRaw = body.createdByUserId;
    const createdByUserId =
      createdByUserIdRaw === undefined ||
      createdByUserIdRaw === null ||
      createdByUserIdRaw === ''
        ? null
        : Number(createdByUserIdRaw);
    const flag = normalizeFlag(body.flag ?? 'pending');
    const priority = normalizePriority(body.priority ?? 'medium');
    const sourceHost = resolveSourceHost(req);
    const publicId = makePublicId();

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Title is required' });
    }

    await pool.execute(
      `INSERT INTO DevelopmentIssues
        (PublicId, Title, Description, Page, ScreenshotUrl, Flag, Priority, CreatedBy, CreatedByUserId, SourceHost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        publicId,
        title,
        description || null,
        page || null,
        screenshotUrl || null,
        flag,
        priority,
        createdBy || null,
        Number.isFinite(createdByUserId) ? createdByUserId : null,
        sourceHost,
      ],
    );

    const issues = await listIssues();
    const issue = issues.find((item) => item.id === publicId) ?? {
      id: publicId,
      title,
      description,
      page,
      screenshotUrl,
      createdAt: new Date().toISOString(),
      ...(createdBy ? { createdBy } : {}),
      flag,
      priority,
      plannedDate: null,
    };

    return res.status(201).json({ ok: true, issue, issues });
  } catch (error) {
    console.error('[developmentIssues] create failed:', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to create development issue',
    });
  }
};

/** PATCH /api/development-issues — body: { id, flag?, priority?, plannedDate?, title?, description? } */
const updateDevelopmentIssue = async (req, res) => {
  try {
    await readySchema();
    const body = req.body || {};
    const id = String(body.id ?? '').trim();
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const hasFlag = body.flag !== undefined;
    const hasPriority = body.priority !== undefined;
    const hasPlannedDate = body.plannedDate !== undefined;
    const hasTitle = body.title !== undefined;
    const hasDescription = body.description !== undefined;

    if (!hasFlag && !hasPriority && !hasPlannedDate && !hasTitle && !hasDescription) {
      return res.status(400).json({
        ok: false,
        message: 'flag, priority, plannedDate, title, or description is required',
      });
    }

    if (hasFlag && !FLAG_VALUES.has(body.flag)) {
      return res.status(400).json({
        ok: false,
        message: 'flag must be pending | testing | corrected | blocked | skipped',
      });
    }
    if (hasPriority && !PRIORITY_VALUES.has(body.priority)) {
      return res.status(400).json({
        ok: false,
        message: 'priority must be low | medium | high',
      });
    }

    const nextTitle = hasTitle ? capitalizeIssueTitle(String(body.title ?? '')) : '';
    if (hasTitle && !nextTitle) {
      return res.status(400).json({ ok: false, message: 'title is required' });
    }

    const assignments = [];
    const params = [];
    if (hasFlag) {
      assignments.push('Flag = ?');
      params.push(String(body.flag));
    }
    if (hasPriority) {
      assignments.push('Priority = ?');
      params.push(String(body.priority));
    }
    if (hasPlannedDate) {
      assignments.push('PlannedDate = ?');
      params.push(toIsoDateOnly(body.plannedDate));
    }
    if (hasTitle) {
      assignments.push('Title = ?');
      params.push(nextTitle);
    }
    if (hasDescription) {
      assignments.push('Description = ?');
      params.push(String(body.description ?? '').trim() || null);
    }
    params.push(id);

    const [result] = await pool.execute(
      `UPDATE DevelopmentIssues SET ${assignments.join(', ')} WHERE PublicId = ?`,
      params,
    );

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: 'Issue not found' });
    }

    const issues = await listIssues();
    const issue = issues.find((item) => item.id === id);
    return res.status(200).json({ ok: true, issue, issues });
  } catch (error) {
    console.error('[developmentIssues] update failed:', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to update development issue',
    });
  }
};

/** DELETE /api/development-issues/:id */
const deleteDevelopmentIssue = async (req, res) => {
  try {
    await readySchema();
    const body = req.body || {};
    const id = String(req.params.id ?? req.query.id ?? body.id ?? '').trim();
    if (!id) {
      return res.status(400).json({ ok: false, message: 'id is required' });
    }

    const [rows] = await pool.query(
      `SELECT PublicId FROM DevelopmentIssues WHERE PublicId = ? LIMIT 1`,
      [id],
    );
    if (!rows?.[0]) {
      return res.status(404).json({ ok: false, message: 'Issue not found' });
    }

    const [result] = await pool.execute(
      `DELETE FROM DevelopmentIssues WHERE PublicId = ?`,
      [id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: 'Issue not found' });
    }

    const issues = await listIssues();
    return res.status(200).json({ ok: true, issues });
  } catch (error) {
    console.error('[developmentIssues] delete failed:', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to delete development issue',
    });
  }
};

export default {
  fetchDevelopmentIssues,
  createDevelopmentIssue,
  updateDevelopmentIssue,
  deleteDevelopmentIssue,
};
