import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPois } from "@/lib/feishu";
import { isConfigured } from "@/lib/poi";

type Props = { params: Promise<{ id: string }> };

export default async function PoiDetailPage({ params }: Props) {
  if (!isConfigured()) notFound();
  const { id } = await params;
  const poi = (await getPublishedPois()).find((item) => item.id === id);
  if (!poi) notFound();

  return (
    <main className="min-h-dvh bg-stone-50 px-4 py-6 text-stone-900 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
        <Link href="/" className="text-sm font-medium text-stone-600 underline">
          返回地图
        </Link>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">{poi.type ?? "未分类"}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {poi.name}
            </h1>
          </div>
          {poi.rating !== null && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
              ★ {poi.rating} / 5
            </span>
          )}
        </div>
        <dl className="mt-8 grid gap-5 text-sm">
          <div>
            <dt className="font-medium text-stone-500">行政区</dt>
            <dd className="mt-1">
              {[poi.province, poi.city, poi.district]
                .filter(Boolean)
                .join(" · ") || "未填写"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-stone-500">坐标</dt>
            <dd className="mt-1 tabular-nums">
              {poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)}
            </dd>
          </div>
          {poi.review && (
            <div>
              <dt className="font-medium text-stone-500">评价</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-7">
                {poi.review}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-stone-500">图片</dt>
            <dd className="mt-1">
              {poi.imageCount
                ? `共 ${poi.imageCount} 张，附件展示将在飞书附件权限验收后启用。`
                : "暂无图片"}
            </dd>
          </div>
        </dl>
      </article>
    </main>
  );
}
