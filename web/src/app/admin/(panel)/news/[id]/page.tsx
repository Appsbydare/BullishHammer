import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getArticleById } from "@/lib/news/data";
import { timeAgo } from "@/lib/format";
import Markdown from "@/components/Markdown";
import { deleteArticleAction, setArticleStatusAction } from "../../../actions";
import ArticleForm from "./ArticleForm";
import ConfirmButton from "./ConfirmButton";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = Number.isInteger(Number(id)) ? await getArticleById(Number(id)) : null;
  if (!a) notFound();
  const published = a.status === "published";

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="small">
            <Link href="/admin/news">← News</Link>
          </p>
          <h1>{a.title}</h1>
          <p className="muted small">
            <span className={`status status-${a.status}`}>{a.status}</span> · created {timeAgo(a.created_at)}
            {a.published_at ? ` · published ${timeAgo(a.published_at)}` : ""}
            {published && (
              <>
                {" · "}
                <Link href={`/news/${a.slug}`} target="_blank">
                  View on site ↗
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="admin-inline">
          <form action={setArticleStatusAction}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="status" value={published ? "draft" : "published"} />
            <button className={`btn btn-sm ${published ? "btn-ghost" : "btn-gold"}`}>{published ? "Unpublish" : "Publish"}</button>
          </form>
          <form action={deleteArticleAction}>
            <input type="hidden" name="id" value={a.id} />
            <ConfirmButton message="Delete this article permanently?">Delete</ConfirmButton>
          </form>
        </div>
      </div>

      <div className="admin-grid-2" style={{ alignItems: "start" }}>
        <ArticleForm a={a} />
        <div className="card">
          <p className="tiny muted" style={{ marginTop: 0 }}>
            Preview (saved version)
          </p>
          <h2 style={{ marginTop: 0 }}>{a.title}</h2>
          <p className="muted">{a.excerpt}</p>
          <div className="prose article-body">
            <Markdown>{a.body_md}</Markdown>
          </div>
          {a.sources.length > 0 && (
            <>
              <h3>Sources</h3>
              <ul className="small">
                {a.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
