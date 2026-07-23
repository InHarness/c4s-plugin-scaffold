/**
 * Test double for `@c4s/plugin-runtime/ui` — the Host UI Kit.
 *
 * Same reason as `host-runtime.ts`: the specifier only exists behind the host's
 * import map, so `vitest.config.ts` aliases it here. Every export mirrors the
 * PUBLISHED surface the scaffold imports — same names, same prop contracts.
 *
 * Each component renders a `data-ui-kit="<Name>"` element so a test can assert
 * "this came from the Host UI Kit, not hand-rolled markup" without depending on the
 * host's real DOM or styling.
 */
import type { CSSProperties, ComponentType, FormEvent, ReactNode } from 'react';

export interface Tag {
  slug: string;
  name?: string;
  color?: string;
  [key: string]: unknown;
}

// ── Detail frame ──

export interface DetailBreadcrumb {
  label: ReactNode;
  onClick?: () => void;
}
export interface DetailPanelShellProps {
  breadcrumb: DetailBreadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}
export const DetailPanelShell: ComponentType<DetailPanelShellProps> = ({ breadcrumb, actions, children }) => (
  <div data-ui-kit="DetailPanelShell">
    <nav data-ui-kit-slot="breadcrumb">
      {breadcrumb.map((crumb, i) => (
        <button key={i} type="button" onClick={crumb.onClick}>
          {crumb.label}
        </button>
      ))}
    </nav>
    {actions ? <div data-ui-kit-slot="actions">{actions}</div> : null}
    {children}
  </div>
);

// ── List screen ──

export interface EntityListHeaderProps {
  icon?: ComponentType<{ size?: number | string; style?: CSSProperties }>;
  title: string;
  count?: number;
  search?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}
export const EntityListHeader: ComponentType<EntityListHeaderProps> = ({
  icon: Icon,
  title,
  count,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
}) => (
  <header data-ui-kit="EntityListHeader">
    {Icon ? (
      <span data-ui-kit-slot="icon">
        <Icon size={16} />
      </span>
    ) : null}
    <h1>{title}</h1>
    {count === undefined ? null : <span data-ui-kit-slot="count">{count}</span>}
    {onSearchChange ? (
      <input
        data-ui-kit-slot="search"
        value={search ?? ''}
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    ) : null}
    {filters}
    {actions ? <div data-ui-kit-slot="actions">{actions}</div> : null}
  </header>
);

export interface EntityListLayoutProps {
  header?: ReactNode;
  children: ReactNode;
}
export const EntityListLayout: ComponentType<EntityListLayoutProps> = ({ header, children }) => (
  <div data-ui-kit="EntityListLayout">
    {header}
    {children}
  </div>
);

export interface EntityListRowProps {
  leading?: ReactNode;
  onClick: () => void;
  tags?: string[];
  tagLookup: Map<string, Tag>;
  trailing?: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}
export const EntityListRow: ComponentType<EntityListRowProps> = ({
  leading,
  onClick,
  tags,
  tagLookup,
  trailing,
  style,
  children,
}) => (
  <div data-ui-kit="EntityListRow" style={style} onClick={onClick}>
    {leading ? <span data-ui-kit-slot="leading">{leading}</span> : null}
    {children}
    <span data-ui-kit-slot="tags">
      {(tags ?? []).map((slug) => (
        <span key={slug} data-tag-slug={slug}>
          {tagLookup.get(slug)?.name ?? slug}
        </span>
      ))}
    </span>
    {trailing ? <span data-ui-kit-slot="trailing">{trailing}</span> : null}
  </div>
);

export interface TagBarProps {
  tags: Tag[];
  tagFilter: string[];
  onTagToggle: (slug: string) => void;
  tagMode: 'and' | 'or';
  onToggleMode: () => void;
  onClear: () => void;
}
export const TagFilterBar: ComponentType<TagBarProps> = ({ tags, tagFilter, onTagToggle }) => (
  <div data-ui-kit="TagFilterBar">
    {tags.map((t) => (
      <button
        key={t.slug}
        type="button"
        data-tag-slug={t.slug}
        data-active={tagFilter.includes(t.slug)}
        onClick={() => onTagToggle(t.slug)}
      >
        {t.name ?? t.slug}
      </button>
    ))}
  </div>
);

export interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}
export const EmptyState: ComponentType<EmptyStateProps> = ({ title, hint, action }) => (
  <div data-ui-kit="EmptyState">
    <p>{title}</p>
    {hint}
    {action}
  </div>
);

export interface LoadingStateProps {
  width?: number | string;
  height?: number | string;
  lines?: number;
  className?: string;
  style?: CSSProperties;
}
export const LoadingState: ComponentType<LoadingStateProps> = ({ style, className }) => (
  <div data-ui-kit="LoadingState" className={className} style={style} />
);

// ── Actions / form ──

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost';
export interface ActionButtonProps {
  label: ReactNode;
  onClick: () => void;
  icon?: ReactNode;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  title?: string;
}
export const ActionButton: ComponentType<ActionButtonProps> = ({ label, onClick, disabled, title }) => (
  <button data-ui-kit="ActionButton" type="button" onClick={onClick} disabled={disabled} title={title}>
    {label}
  </button>
);

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
}
export const Dialog: ComponentType<DialogProps> = ({ open, onClose, title, footer, children }) => {
  if (!open) return null;
  return (
    <div data-ui-kit="Dialog" role="dialog">
      {title ? <div data-ui-kit-slot="title">{title}</div> : null}
      <button type="button" data-ui-kit-slot="close" aria-label="Close" onClick={onClose} />
      {children}
      {footer ? <div data-ui-kit-slot="footer">{footer}</div> : null}
    </div>
  );
};

export interface FormShellProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  error?: string;
  actions?: ReactNode;
  children: ReactNode;
}
export const FormShell: ComponentType<FormShellProps> = ({ onSubmit, busy, error, actions, children }) => (
  <form data-ui-kit="FormShell" onSubmit={onSubmit}>
    <fieldset data-ui-kit-slot="fieldset" disabled={busy}>
      {children}
    </fieldset>
    {error ? (
      <p data-ui-kit-slot="error" role="alert">
        {error}
      </p>
    ) : null}
    <div data-ui-kit-slot="actions">{actions}</div>
  </form>
);

export interface FormFieldProps {
  label: ReactNode;
  error?: string | null;
  children: ReactNode;
}
export const FormField: ComponentType<FormFieldProps> = ({ label, error, children }) => (
  <label data-ui-kit="FormField">
    <span>{label}</span>
    {children}
    {error ? <span data-ui-kit-slot="error">{error}</span> : null}
  </label>
);

export interface SegmentedControlTab {
  id: string;
  label: ReactNode;
}
export interface SegmentedControlTabsProps {
  tabs: SegmentedControlTab[];
  active: string;
  onChange: (id: string) => void;
}
export const SegmentedControlTabs: ComponentType<SegmentedControlTabsProps> = ({ tabs, active, onChange }) => (
  <div data-ui-kit="SegmentedControlTabs">
    {tabs.map((t) => (
      <button key={t.id} type="button" data-tab-id={t.id} data-active={t.id === active} onClick={() => onChange(t.id)}>
        {t.label}
      </button>
    ))}
  </div>
);

// ── Tags / references / history ──

export interface TagPickerProps {
  allTags: Array<{ slug: string; name?: string; color?: string }>;
  selected: string[];
  onToggle: (slug: string) => void;
  onCreate: (name: string) => void;
  variant?: 'collapsed' | 'expanded';
}
export const TagPicker: ComponentType<TagPickerProps> = ({ allTags, selected, onToggle }) => (
  <div data-ui-kit="TagPicker">
    {allTags.map((t) => (
      <button
        key={t.slug}
        type="button"
        data-tag-slug={t.slug}
        data-active={selected.includes(t.slug)}
        onClick={() => onToggle(t.slug)}
      >
        {t.name ?? t.slug}
      </button>
    ))}
  </div>
);

export interface ReferencesListItem {
  pagePath: string;
  label: ReactNode;
}
export interface ReferencesListProps {
  references: ReferencesListItem[];
  loading?: boolean;
}
export const ReferencesList: ComponentType<ReferencesListProps> = ({ references, loading }) => (
  <div data-ui-kit="ReferencesList" data-loading={Boolean(loading)}>
    {references.map((r, i) => (
      <div key={i} data-ui-kit-slot="reference">
        {r.label}
      </div>
    ))}
  </div>
);

export interface VersionHistoryItem {
  id: string;
  label: ReactNode;
  createdAt?: ReactNode;
  author?: ReactNode;
}
export interface VersionHistoryProps {
  versions: VersionHistoryItem[];
  activeVersion?: string;
  onSelect?: (id: string) => void;
  onRestore?: (id: string) => void;
  variant?: 'timeline' | 'list';
  compareVersion?: string;
  onCompare?: (id: string) => void;
}
export const VersionHistory: ComponentType<VersionHistoryProps> = ({ versions, onSelect, onRestore }) => (
  <div data-ui-kit="VersionHistory">
    {versions.map((v) => (
      <div key={v.id} data-ui-kit-slot="version" data-version-id={v.id}>
        <button type="button" onClick={() => onSelect?.(v.id)}>
          {v.label}
        </button>
        <button type="button" data-action="restore" onClick={() => onRestore?.(v.id)}>
          Restore
        </button>
      </div>
    ))}
  </div>
);

export interface DiffViewLine {
  op: 'added' | 'removed' | 'context';
  content: string;
}
export interface DiffViewProps {
  hunks: DiffViewLine[];
  title?: ReactNode;
}
export const DiffView: ComponentType<DiffViewProps> = ({ hunks, title }) => (
  <div data-ui-kit="DiffView">
    {title ? <div data-ui-kit-slot="title">{title}</div> : null}
    {hunks.map((h, i) => (
      <div key={i} data-op={h.op}>
        {h.content}
      </div>
    ))}
  </div>
);
