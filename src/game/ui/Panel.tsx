import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEscape } from "./hooks";

interface PanelProps {
  eyebrow: string;
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared shell for every sub-screen of the main menu. Esc goes back. */
export function Panel({ eyebrow, title, onBack, children, footer }: PanelProps) {
  useEscape(onBack);
  return (
    <section
      className="panel panel-enter pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-lg md:w-[30rem]"
      aria-labelledby="panel-title"
    >
      <div className="hazard-stripe h-1.5 w-full opacity-80" aria-hidden />
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 pb-4 pt-5">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="panel-title" className="title-display mt-1 text-4xl">
            {title}
          </h2>
        </div>
        <Button variant="rail" size="sm" onClick={onBack} aria-label="Back to main menu">
          <ArrowLeft /> Back
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && <footer className="border-t border-border px-6 py-4">{footer}</footer>}
    </section>
  );
}
