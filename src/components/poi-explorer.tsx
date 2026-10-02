"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Poi } from "@/lib/poi";

const PoiMap = dynamic(() => import("@/components/poi-map"), { ssr: false });

type Props = { pois: Poi[]; mapKey?: string };

function options(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function PoiExplorer({ pois, mapKey }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedId, setSelectedId] = useState<string>();

  const provinceOptions = useMemo(() => options(pois.map((poi) => poi.province)), [pois]);
  const cityOptions = useMemo(() => options(pois.filter((poi) => !province || poi.province === province).map((poi) => poi.city)), [pois, province]);
  const districtOptions = useMemo(() => options(pois.filter((poi) => (!province || poi.province === province) && (!city || poi.city === city)).map((poi) => poi.district)), [pois, province, city]);
  const typeOptions = useMemo(() => options(pois.map((poi) => poi.type)), [pois]);
  const visiblePois = useMemo(() => pois.filter((poi) => {
    const matchesQuery = poi.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery && (!type || poi.type === type) && (!province || poi.province === province) && (!city || poi.city === city) && (!district || poi.district === district);
  }), [city, district, pois, province, query, type]);

  return <main className="min-h-dvh bg-stone-50 text-stone-900">
    <header className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div><p className="text-sm font-medium text-stone-500">Table2Map</p><h1 className="text-xl font-semibold">团队 POI 地图</h1></div><span className="text-sm text-stone-500">{visiblePois.length} 个地点</span></div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[23rem_1fr] lg:p-6">
      <section className="order-2 rounded-xl border border-stone-200 bg-white p-4 lg:order-1 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <input aria-label="搜索地点" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索地点" className="h-10 rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-stone-600" />
          <select aria-label="类型" value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"><option value="">所有类型</option>{typeOptions.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="省" value={province} onChange={(event) => { setProvince(event.target.value); setCity(""); setDistrict(""); }} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"><option value="">所有省份</option>{provinceOptions.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="市" value={city} onChange={(event) => { setCity(event.target.value); setDistrict(""); }} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"><option value="">所有城市</option>{cityOptions.map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="区" value={district} onChange={(event) => setDistrict(event.target.value)} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm"><option value="">所有区县</option>{districtOptions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="mt-4 grid gap-3">{visiblePois.map((poi) => <article key={poi.id} className={`rounded-lg border p-3 ${selectedId === poi.id ? "border-stone-900" : "border-stone-200"}`}><button className="w-full text-left" onClick={() => setSelectedId(poi.id)}><div className="flex items-start justify-between gap-3"><h2 className="font-medium">{poi.name}</h2>{poi.rating !== null && <span className="text-sm text-amber-700">★ {poi.rating}</span>}</div><p className="mt-1 text-sm text-stone-500">{[poi.type, poi.province, poi.city, poi.district].filter(Boolean).join(" · ") || "未填写行政区"}</p></button><Link href={`/poi/${poi.id}`} className="mt-2 inline-block text-sm font-medium text-stone-700 underline">查看详情</Link></article>)}</div>
        {visiblePois.length === 0 && <p className="py-10 text-center text-sm text-stone-500">没有匹配的已发布地点。</p>}
      </section>
      <section className="order-1 min-h-96 overflow-hidden rounded-xl border border-stone-200 bg-white lg:order-2 lg:min-h-[calc(100dvh-8.5rem)]"><PoiMap pois={visiblePois} mapKey={mapKey} selectedId={selectedId} onSelect={setSelectedId} /></section>
    </div>
  </main>;
}
