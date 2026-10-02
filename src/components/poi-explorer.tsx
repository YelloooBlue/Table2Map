"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Poi } from "@/lib/poi";

const PoiMap = dynamic(() => import("@/components/poi-map"), { ssr: false });
const controlClassName =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm";

type Props = { pois: Poi[]; mapKey?: string };
type FilterSelectProps = {
  label: string;
  value: string;
  emptyLabel: string;
  options: string[];
  onChange: (value: string) => void;
};

function uniqueOptions(values: Array<string | null>) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ].sort((left, right) => left.localeCompare(right, "zh-CN"));
}

function FilterSelect({
  label,
  value,
  emptyLabel,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <select
      aria-label={label}
      className={controlClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function PoiCard({
  poi,
  selected,
  onSelect,
}: {
  poi: Poi;
  selected: boolean;
  onSelect: () => void;
}) {
  const location = [poi.type, poi.province, poi.city, poi.district]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      className={`rounded-lg border p-3 ${selected ? "border-stone-900" : "border-stone-200"}`}
    >
      <button className="w-full text-left" onClick={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-medium">{poi.name}</h2>
          {poi.rating !== null && (
            <span className="text-sm text-amber-700">★ {poi.rating}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {location || "未填写行政区"}
        </p>
      </button>
      <Link
        className="mt-2 inline-block text-sm font-medium text-stone-700 underline"
        href={`/poi/${poi.id}`}
      >
        查看详情
      </Link>
    </article>
  );
}

export function PoiExplorer({ pois, mapKey }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const typeOptions = useMemo(
    () => uniqueOptions(pois.map((poi) => poi.type)),
    [pois],
  );
  const provinceOptions = useMemo(
    () => uniqueOptions(pois.map((poi) => poi.province)),
    [pois],
  );
  const cityOptions = useMemo(
    () =>
      uniqueOptions(
        pois
          .filter((poi) => !province || poi.province === province)
          .map((poi) => poi.city),
      ),
    [pois, province],
  );
  const districtOptions = useMemo(
    () =>
      uniqueOptions(
        pois
          .filter(
            (poi) =>
              (!province || poi.province === province) &&
              (!city || poi.city === city),
          )
          .map((poi) => poi.district),
      ),
    [city, pois, province],
  );
  const visiblePois = useMemo(
    () =>
      pois.filter(
        (poi) =>
          poi.name
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()) &&
          (!type || poi.type === type) &&
          (!province || poi.province === province) &&
          (!city || poi.city === city) &&
          (!district || poi.district === district),
      ),
    [city, district, pois, province, query, type],
  );

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">Table2Map</p>
            <h1 className="text-xl font-semibold">团队 POI 地图</h1>
          </div>
          <span className="text-sm text-stone-500">
            {visiblePois.length} 个地点
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[23rem_1fr] lg:p-6">
        <section className="order-2 rounded-xl border border-stone-200 bg-white p-4 lg:order-1 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <input
              aria-label="搜索地点"
              className={controlClassName}
              placeholder="搜索地点"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <FilterSelect
              label="类型"
              emptyLabel="所有类型"
              value={type}
              options={typeOptions}
              onChange={setType}
            />
            <FilterSelect
              label="省"
              emptyLabel="所有省份"
              value={province}
              options={provinceOptions}
              onChange={(value) => {
                setProvince(value);
                setCity("");
                setDistrict("");
              }}
            />
            <FilterSelect
              label="市"
              emptyLabel="所有城市"
              value={city}
              options={cityOptions}
              onChange={(value) => {
                setCity(value);
                setDistrict("");
              }}
            />
            <FilterSelect
              label="区"
              emptyLabel="所有区县"
              value={district}
              options={districtOptions}
              onChange={setDistrict}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {visiblePois.map((poi) => (
              <PoiCard
                key={poi.id}
                poi={poi}
                selected={selectedId === poi.id}
                onSelect={() => setSelectedId(poi.id)}
              />
            ))}
          </div>
          {visiblePois.length === 0 && (
            <p className="py-10 text-center text-sm text-stone-500">
              没有匹配的已发布地点。
            </p>
          )}
        </section>
        <section className="order-1 min-h-96 overflow-hidden rounded-xl border border-stone-200 bg-white lg:order-2 lg:min-h-[calc(100dvh-8.5rem)]">
          <PoiMap
            pois={visiblePois}
            mapKey={mapKey}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
      </div>
    </main>
  );
}
