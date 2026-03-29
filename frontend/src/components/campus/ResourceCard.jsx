import React from 'react';
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
}) => {
  return (
    <article
      key={resource._id}
      className={cn(
        'group overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-md transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl',
      )}
    >
      {resource.image && resource.attachmentType !== 'pdf' && (
        <div className="relative overflow-hidden h-44 sm:h-52">
          <img
            src={resource.image}
            alt={resource.professorName || resource.hostelName || resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                onClick={() => openEditDialog(resource)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-3 text-sm text-destructive"
                onClick={() => handleDelete(resource._id)}
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
          {resource.updatedBy?.fullName && <span>by {resource.updatedBy.fullName}</span>}
        </div>
      </div>
    </article>
  );
};

export default ResourceCard;
