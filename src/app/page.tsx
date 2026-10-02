import { getPublishedPois } from "@/lib/feishu";
import { isConfigured } from "@/lib/poi";
import { PoiExplorer } from "@/components/poi-explorer";

export default async function HomePage() {
  const configured = isConfigured();
  const pois = configured ? await getPublishedPois() : [];
  if (!configured)
    return (
      <main className="mx-auto flex min-h-dvh max-w-6xl items-center px-6 py-16">
        <div>
          <p className="text-sm font-medium text-stone-500">Table2Map</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            团队 POI 地图
          </h1>
          <p className="mt-4 max-w-xl text-stone-600">
            完成环境变量配置后，这里将展示飞书多维表格中的已发布地点。
          </p>
        </div>
      </main>
    );
  return (
    <PoiExplorer
      pois={pois}
      mapKey={process.env.NEXT_PUBLIC_TIANDITU_TILE_KEY}
    />
  );
}
