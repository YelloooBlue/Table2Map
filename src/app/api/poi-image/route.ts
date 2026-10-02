import { getTenantAccessToken } from "@/lib/feishu";

const baseUrl = "https://open.feishu.cn/open-apis";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return new Response("Invalid image token", { status: 400 });
  }

  const accessToken = await getTenantAccessToken();
  const response = await fetch(
    `${baseUrl}/drive/v1/medias/${encodeURIComponent(token)}/download`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok || !response.body) {
    return new Response("Image unavailable", { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
