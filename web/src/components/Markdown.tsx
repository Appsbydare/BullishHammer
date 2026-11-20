import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders AI or admin-written Markdown. Raw HTML is never rendered (react-markdown default),
 * images are dropped, and external links open in a new tab without passing ranking.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{
        h1: ({ children }) => <h2>{children}</h2>,
        a: ({ href, children }) => {
          const external = !!href && /^https?:\/\//.test(href);
          return external ? (
            <a href={href} target="_blank" rel="nofollow noopener noreferrer">
              {children}
            </a>
          ) : (
            <a href={href}>{children}</a>
          );
        },
        table: ({ children }) => (
          <div className="table-wrap">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
