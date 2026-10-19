/**
 * DevelopmentIssues — MariaDB row + API DTO (jak w F6).
 * Tablica: DevelopmentIssues
 */

export type DevelopmentIssueFlag =
  | 'corrected'
  | 'pending'
  | 'testing'
  | 'blocked'
  | 'skipped';

export type DevelopmentIssuePriority = 'low' | 'medium' | 'high';

/** Wiersz tabeli DevelopmentIssues (PascalCase jak kolumny MySQL). */
export interface DevelopmentIssues_Interface {
  Id: number;
  PublicId: string;
  Title: string;
  Description: string | null;
  Page: string | null;
  ScreenshotUrl: string | null;
  Flag: DevelopmentIssueFlag;
  Priority: DevelopmentIssuePriority;
  PlannedDate: string | Date | null;
  CreatedBy: string | null;
  CreatedByUserId: number | null;
  SourceHost: string | null;
  CreatedAt: string | Date;
  UpdatedAt: string | Date;
}

/** DTO zwracane do frontendu (camelCase). */
export interface DevelopmentIssueDto {
  id: string;
  title: string;
  description: string;
  page: string;
  screenshotUrl: string;
  createdAt: string;
  createdBy?: string;
  flag: DevelopmentIssueFlag;
  priority: DevelopmentIssuePriority;
  /** ISO date YYYY-MM-DD gdy zaplanowane w kalendarzu */
  plannedDate: string | null;
}

export interface CreateDevelopmentIssueBody {
  title: string;
  description?: string;
  page?: string;
  screenshotUrl?: string;
  createdBy?: string;
  createdByUserId?: number | null;
  flag?: DevelopmentIssueFlag;
  priority?: DevelopmentIssuePriority;
}

export interface UpdateDevelopmentIssueBody {
  id: string;
  flag?: DevelopmentIssueFlag;
  priority?: DevelopmentIssuePriority;
  plannedDate?: string | null;
  title?: string;
  description?: string;
}
