"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

/**
 * Themed markdown renderer for agent / skill / rule prompt bodies.
 * Styled to match DESIGN.md typography — cyan headings, gold emphasis,
 * JetBrains Mono for inline code and fenced blocks, subtle borders.
 */
export function MarkdownBody({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("markdown-body text-body text-[var(--text-muted)]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node: _node, ...props }) => (
            <h3 className="text-display text-[var(--text)] mt-4 mb-2" {...props} />
          ),
          h2: ({ node: _node, ...props }) => (
            <h4 className="text-display-sm text-[var(--blue-bright)] uppercase tracking-[0.14em] mt-4 mb-2" {...props} />
          ),
          h3: ({ node: _node, ...props }) => (
            <h5 className="text-display-sm text-[var(--blue-star)] mt-3 mb-1.5" {...props} />
          ),
          p: ({ node: _node, ...props }) => (
            <p className="text-body text-[var(--text-muted)] leading-relaxed my-2" {...props} />
          ),
          ul: ({ node: _node, ...props }) => (
            <ul className="list-disc pl-5 my-2 text-body text-[var(--text-muted)] space-y-1" {...props} />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 text-body text-[var(--text-muted)] space-y-1" {...props} />
          ),
          li: ({ node: _node, ...props }) => <li {...props} />,
          strong: ({ node: _node, ...props }) => (
            <strong className="text-[var(--gold-bright)] font-semibold" {...props} />
          ),
          em: ({ node: _node, ...props }) => (
            <em className="text-[var(--blue-bright)] not-italic" {...props} />
          ),
          code: ({ node: _node, className: codeCls, ...props }) => {
            const inline = !/language-/.test(codeCls ?? "");
            if (inline) {
              return (
                <code
                  className="text-mono-sm text-[var(--blue-bright)] bg-[var(--surface)] px-1 py-0.5"
                  {...props}
                />
              );
            }
            return (
              <code className={cn("block text-mono-sm text-[var(--text)]", codeCls)} {...props} />
            );
          },
          pre: ({ node: _node, ...props }) => (
            <pre
              className="my-3 max-h-80 overflow-auto border border-[var(--border-subtle)] bg-[var(--void)] p-3 text-mono-sm whitespace-pre-wrap break-words"
              {...props}
            />
          ),
          blockquote: ({ node: _node, ...props }) => (
            <blockquote
              className="my-3 border-l-2 border-[var(--gold-deep)] pl-4 text-body text-[var(--text-muted)] italic"
              {...props}
            />
          ),
          hr: () => <hr className="my-4 border-none h-px bg-[var(--border-subtle)]" />,
          a: ({ node: _node, ...props }) => (
            <a
              className="text-[var(--blue-bright)] hover:text-[var(--blue-star)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="my-3 overflow-x-auto border border-[var(--border-subtle)]">
              <table className="w-full border-collapse text-body" {...props} />
            </div>
          ),
          thead: ({ node: _node, ...props }) => (
            <thead className="bg-[var(--surface)] text-[var(--text)]" {...props} />
          ),
          th: ({ node: _node, ...props }) => (
            <th className="border border-[var(--border-subtle)] px-2 py-1 text-left text-display-sm uppercase tracking-[0.12em] text-[var(--blue-bright)]" {...props} />
          ),
          td: ({ node: _node, ...props }) => (
            <td className="border border-[var(--border-subtle)] px-2 py-1 align-top" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
