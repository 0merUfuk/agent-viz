import { NextResponse } from "next/server";
import { parseSlug, fetchClaudeDir, GitHubError } from "@/lib/github";
import { buildEcosystem } from "@/lib/parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  slug?: unknown;
  url?: unknown;
}

export async function POST(req: Request) {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "unknown", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const input =
    typeof body.slug === "string"
      ? body.slug
      : typeof body.url === "string"
        ? body.url
        : "";

  const parsed = parseSlug(input);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "unknown",
        message:
          "Could not parse repo. Use owner/repo, github.com/owner/repo, or a full HTTPS URL.",
      },
      { status: 400 },
    );
  }

  try {
    const { files, sourceLabel } = await fetchClaudeDir(parsed);
    const ecosystem = buildEcosystem(files, sourceLabel);
    return NextResponse.json(ecosystem);
  } catch (err) {
    if (err instanceof GitHubError) {
      const status = err.code === "rate-limited" ? 429 : err.code === "private-repo" ? 403 : 404;
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status },
      );
    }
    console.error("fetch-repo failed", err);
    return NextResponse.json(
      { error: "unknown", message: "Unexpected error fetching repository." },
      { status: 500 },
    );
  }
}
