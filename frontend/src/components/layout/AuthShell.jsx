import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AuthShell = ({
  eyebrow,
  title,
  description,
  highlights = [],
  sideLabel = 'HYB',
  backLabel = 'Back',
  onBack,
  children,
  footer,
}) => {
  return (
    <div className="app-page-shell">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),transparent_55%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid w-full items-center gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,560px)]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative hidden overflow-hidden rounded-3xl border border-white/45 bg-[linear-gradient(160deg,#102134_0%,#1a3b56_100%)] p-8 text-white shadow-[0_26px_64px_rgba(15,23,42,0.18)] xl:flex xl:min-h-[700px] xl:flex-col xl:justify-between"
        >
          <div className="absolute inset-0 opacity-50">
            <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-cyan-400/14 blur-3xl" />
            <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-emerald-400/12 blur-3xl" />
          </div>
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-4 py-2">
              <img src="/logo.png" alt="HYB logo" className="h-9 w-9 object-contain" />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">Help Your Buddy</div>
                <div className="text-lg font-semibold tracking-tight">{sideLabel}</div>
              </div>
            </Link>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-4 inline-flex rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              {eyebrow}
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">{title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-200/78">{description}</p>
          </div>

          <div className="relative grid gap-4">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="flex items-start gap-3 rounded-[1.4rem] border border-cyan-100/20 bg-cyan-100/10 px-4 py-4"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/18 text-cyan-100">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-sm leading-7 text-slate-100/86">{highlight}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center"
        >
          <div className="auth-panel-surface w-full max-w-[560px] rounded-3xl p-4 shadow-[0_20px_52px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full border border-border/70 bg-background/70 px-3 text-muted-foreground hover:text-foreground"
                onClick={onBack}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {backLabel}
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <img src="/logo.png" alt="HYB logo" className="h-4 w-4 object-contain" />
                HYB
              </div>
            </div>

            <div className="mb-6 text-center lg:text-left">
              <div className="mb-3 inline-flex rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground lg:hidden">
                {eyebrow}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="auth-caption mt-2 text-sm leading-7">{description}</p>
            </div>

            {children}

            {footer ? <div className={cn('mt-6 border-t border-border/60 pt-5 text-sm text-muted-foreground')}>{footer}</div> : null}
          </div>
        </motion.section>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
