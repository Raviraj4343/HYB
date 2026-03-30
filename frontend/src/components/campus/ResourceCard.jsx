import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ResourceCard = ({
  resource,
  section,
  isSuperAdmin,
  openEditDialog,
  handleDelete,
  formatDate,
  renderCategoryMeta,
  onOpenDetail,
  isDetail,
}) => {
  return (
    <article
      key={resource._id}
      onClick={onOpenDetail ? () => onOpenDetail(resource._id) : undefined}
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
      className={cn(
        'group overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-md transition-transform duration-300',
        onOpenDetail ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer' : 'hover:-translate-y-2 hover:shadow-xl',
      )}
    >
      {resource.images && resource.images.length > 0 ? (
        <div
          className={cn('relative overflow-hidden', !isDetail ? 'h-44 sm:h-52' : '')}
          style={isDetail ? { height: '100%' } : undefined}
        >
          <img
            src={resource.images[0]}
            alt={resource.professorName || resource.hostelName || resource.title}
            style={isDetail ? { objectFit: 'contain', height: '100%', width: '100%' } : undefined}
            className={cn('h-full w-full transition-transform duration-500', !isDetail && 'object-cover group-hover:scale-105')}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : resource.image && resource.attachmentType !== 'pdf' && (
        <div
          className={cn('relative overflow-hidden', !isDetail ? 'h-44 sm:h-52' : '')}
          style={isDetail ? { height: '100%' } : undefined}
        >
          <img
            src={resource.image}
            alt={resource.professorName || resource.hostelName || resource.title}
            style={isDetail ? { objectFit: 'contain', height: '100%', width: '100%' } : undefined}
            className={cn('h-full w-full transition-transform duration-500', !isDetail && 'object-cover group-hover:scale-105')}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {section.badge}
            </div>

            <h3 className="truncate text-lg font-semibold text-foreground dark:text-white">
              {resource.professorName || resource.hostelName || resource.title}
            </h3>

            {resource.effectiveDate && (
              <p className="mt-1 text-sm text-muted-foreground">Effective {formatDate(resource.effectiveDate)}</p>
            )}
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-3 text-sm"
                onClick={(e) => { e.stopPropagation(); openEditDialog(resource); }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-3 text-sm text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDelete(resource._id); }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {resource.attachmentType === 'pdf' && resource.image && (
          <div className="mt-4 rounded-lg border border-border/70 bg-background/75 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground dark:text-white">{resource.attachmentName || 'Attached PDF'}</div>
                <div className="mt-1 text-sm text-muted-foreground">Open the latest uploaded document for this notice.</div>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={resource.image} target="_blank" rel="noreferrer">
                  Open PDF
                </a>
              </Button>
            </div>
          </div>
        )}

        {resource.description && (
          <p className="mt-4 text-sm leading-7 text-foreground/85 dark:text-white/78">{resource.description}</p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {renderCategoryMeta(resource).map((item) => (
            <div key={`${resource._id}-${item.label}`} className="rounded-lg border border-border/70 bg-background/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-foreground dark:text-white">{item.value}</div>
            </div>
          ))}

          {/* show warden list for hostel */}
          {resource.wardens && resource.wardens.length > 0 && (
            <div className="rounded-lg border border-border/70 bg-background/80 px-4 py-3 sm:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wardens</div>
              <div className="mt-2 space-y-2">
                {resource.wardens.map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground dark:text-white">{w.name}</div>
                      <div className="text-sm text-muted-foreground">{w.designation} · {w.phone} {w.email && <>· {w.email}</>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* mess menu link */}
          {resource.messMenuUrl && (
            <div className="rounded-lg border border-border/70 bg-background/80 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mess Menu</div>
              <div className="mt-2 text-sm font-medium text-foreground dark:text-white">{resource.messMenuName || 'View menu'}</div>
              <div className="mt-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={resource.messMenuUrl} target="_blank" rel="noreferrer">Open</a>
                </Button>
              </div>
            </div>
          )}

          {resource.externalLink && (
            <a
              href={resource.externalLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border/70 bg-background/80 px-4 py-3 transition hover:border-primary/25 hover:text-primary"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Link
              </div>
              <div className="mt-2 text-sm font-medium text-foreground dark:text-white">Open attachment</div>
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span>Updated {formatDate(resource.updatedAt)}</span>
          {resource.updatedBy?.fullName && (
            <span>by <Link to={`/dashboard/users/${resource.updatedBy?.userName}`}>{resource.updatedBy.fullName}</Link></span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ResourceCard;
