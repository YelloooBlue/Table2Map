"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Poi, PoiImage } from "@/lib/poi";

const PoiMap = dynamic(() => import("@/components/poi-map"), { ssr: false });
type Props = { pois: Poi[]; mapKey?: string; initialSelectedId?: string };
type GalleryState = { images: PoiImage[]; activeIndex: number };

function uniqueOptions(values: Array<string | null>) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function locationOf(poi: Poi) {
  return [poi.city, poi.district].filter(Boolean).join(" · ") || "地点待补充";
}

function poiImageUrl(token: string) {
  return `/api/poi-image?token=${encodeURIComponent(token)}`;
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
  return (
    <article
      className={`rounded-lg border p-2.5 transition ${selected ? "border-[#155eef] bg-[#eff4ff] shadow-[0_4px_12px_rgba(21,94,239,.10)]" : "border-transparent bg-white hover:border-[#d0d5dd] hover:shadow-sm"}`}
    >
      <button className="block w-full text-left" onClick={onSelect}>
        <div className="flex items-start gap-2">
          {poi.images[0] ? (
            <span className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-md bg-[#f2f4f7]">
              <Image
                src={poiImageUrl(poi.images[0].token)}
                alt=""
                fill
                sizes="40px"
                unoptimized
                className="object-cover"
              />
            </span>
          ) : (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f2f4f7] text-sm">
              {poi.type === "餐饮" ? "🍜" : poi.type === "景点" ? "⌂" : "●"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="line-clamp-1 min-w-0 font-semibold leading-5 tracking-[-0.01em] text-[#101828]">
                {poi.name}
              </h2>
              <div className="flex shrink-0 items-center gap-1.5 text-xs">
                {poi.type && (
                  <span className="rounded-full bg-[#eff4ff] px-1.5 py-0.5 font-semibold text-[#175cd3]">
                    {poi.type}
                  </span>
                )}
                {poi.rating !== null && (
                  <span className="shrink-0 font-semibold text-[#b54708]">
                    ★ {poi.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-[#667085]">
              {locationOf(poi)}
            </p>
            {poi.review && (
              <div className="mt-1.5 border-l-2 border-[#84adff] pl-1.5">
                <p className="text-[11px] font-bold tracking-[.04em] text-[#175cd3]">
                  推荐理由
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-[#475467]">
                  {poi.review}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}

function ImageViewer({
  gallery,
  onClose,
  onSelectImage,
}: {
  gallery: GalleryState;
  onClose: () => void;
  onSelectImage: (activeIndex: number) => void;
}) {
  const image = gallery.images[gallery.activeIndex];
  const showImage = (activeIndex: number) =>
    gallery.images.length &&
    activeIndex >= 0 &&
    activeIndex < gallery.images.length;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#101828]/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-4xl flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="关闭图片预览"
          onClick={onClose}
          className="absolute -right-1 -top-10 size-8 rounded-full bg-white/15 text-lg text-white backdrop-blur hover:bg-white/25"
        >
          ×
        </button>
        <div className="relative min-h-[50dvh] overflow-hidden rounded-lg bg-black">
          <Image
            src={poiImageUrl(image.token)}
            alt={image.name ?? "地点图片"}
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            unoptimized
            className="object-contain"
          />
          {gallery.images.length > 1 && (
            <>
              <button
                aria-label="上一张图片"
                disabled={!showImage(gallery.activeIndex - 1)}
                onClick={() => {
                  if (showImage(gallery.activeIndex - 1)) {
                    onSelectImage(gallery.activeIndex - 1);
                  }
                }}
                className="absolute left-3 top-1/2 size-9 -translate-y-1/2 rounded-full bg-black/45 text-lg text-white disabled:opacity-30"
              >
                ‹
              </button>
              <button
                aria-label="下一张图片"
                disabled={!showImage(gallery.activeIndex + 1)}
                onClick={() => {
                  if (showImage(gallery.activeIndex + 1)) {
                    onSelectImage(gallery.activeIndex + 1);
                  }
                }}
                className="absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full bg-black/45 text-lg text-white disabled:opacity-30"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PoiExplorer({ pois, mapKey, initialSelectedId }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedId,
  );
  const [gallery, setGallery] = useState<GalleryState>();
  const selectPoi = useCallback((id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `/?poi=${encodeURIComponent(id)}`);
  }, []);
  const openGallery = useCallback(
    (images: PoiImage[], activeIndex: number) =>
      setGallery({ images, activeIndex }),
    [],
  );
  const typeOptions = useMemo(
    () => uniqueOptions(pois.map((poi) => poi.type)),
    [pois],
  );
  const cityOptions = useMemo(
    () => uniqueOptions(pois.map((poi) => poi.city)),
    [pois],
  );
  const visiblePois = useMemo(
    () =>
      pois.filter(
        (poi) =>
          poi.name
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()) &&
          (!type || poi.type === type) &&
          (!city || poi.city === city),
      ),
    [city, pois, query, type],
  );
  const hasFilters = Boolean(query || type || city);
  const clearFilters = () => {
    setQuery("");
    setType("");
    setCity("");
  };

  return (
    <main className="min-h-dvh bg-[#f8fafc] text-[#101828]">
      <header className="relative z-20 border-b border-[#eaecf0] bg-white">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#155eef] text-base text-white shadow-[0_4px_10px_rgba(21,94,239,.25)]">
              ⌖
            </span>
            <div>
              <p className="text-sm font-bold leading-4 tracking-tight">
                Table2Map
              </p>
              <p className="mt-0.5 text-xs text-[#667085]">地点探索图册</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-[#667085] sm:flex">
            <span className="size-2 rounded-full bg-[#12b76a]" />
            已收录{" "}
            <strong className="font-semibold text-[#344054]">
              {pois.length}
            </strong>{" "}
            个地点
          </div>
        </div>
      </header>

      <div className="grid gap-2 p-2 sm:p-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="poi-layout-list relative order-2 overflow-hidden rounded-lg border border-[#eaecf0] bg-white shadow-[0_1px_3px_rgba(16,24,40,.06)] lg:order-1">
          <div className="hidden border-b border-[#eaecf0] px-3 py-2.5 lg:block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight">探索地点</h1>
                <p className="mt-px text-xs text-[#667085]">
                  从地图上的每个标记开始
                </p>
              </div>
              <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-semibold text-[#475467]">
                {visiblePois.length} 个结果
              </span>
            </div>
            <label className="relative mt-2.5 block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                ⌕
              </span>
              <input
                aria-label="搜索地点"
                className="h-10 w-full rounded-lg border border-[#d0d5dd] bg-[#f9fafb] py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#84adff] focus:bg-white focus:ring-4 focus:ring-[#eff4ff]"
                placeholder="搜索名称…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="mt-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[.08em] text-[#667085]">
                  地点类型
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#155eef] hover:underline"
                  >
                    清除筛选
                  </button>
                )}
              </div>
              <div
                className="flex flex-wrap gap-1.5"
                aria-label="按地点类型筛选"
              >
                <button
                  onClick={() => setType("")}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${!type ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467] hover:bg-[#eaecf0]"}`}
                >
                  全部
                </button>
                {typeOptions.map((option) => {
                  const count = pois.filter(
                    (poi) => poi.type === option,
                  ).length;
                  return (
                    <button
                      key={option}
                      onClick={() => setType(type === option ? "" : option)}
                      aria-pressed={type === option}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${type === option ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467] hover:bg-[#eaecf0]"}`}
                    >
                      {option} <span className="opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {cityOptions.length > 1 && (
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto">
                <span className="shrink-0 text-xs font-semibold text-[#667085]">
                  城市
                </span>
                {cityOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setCity(city === option ? "" : option)}
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${city === option ? "bg-[#dbeafe] text-[#175cd3]" : "text-[#667085] hover:bg-[#f2f4f7]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1 p-2 lg:max-h-[calc(100dvh-290px)] lg:overflow-y-auto">
            <div className="mb-2.5 lg:hidden">
              <label className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                  ⌕
                </span>
                <input
                  aria-label="搜索地点"
                  className="h-10 w-full rounded-lg border border-[#d0d5dd] bg-[#f9fafb] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[#98a2b3] focus:border-[#84adff] focus:ring-4 focus:ring-[#eff4ff]"
                  placeholder="搜索地点…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setType("")}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${!type ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467]"}`}
                >
                  全部
                </button>
                {typeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setType(type === option ? "" : option)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${type === option ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <p className="px-0.5 pb-1 text-xs font-semibold text-[#475467] lg:hidden">
              {visiblePois.length} 个地点
            </p>
            {visiblePois.map((poi) => (
              <PoiCard
                key={poi.id}
                poi={poi}
                selected={selectedId === poi.id}
                onSelect={() => selectPoi(poi.id)}
              />
            ))}
            {visiblePois.length === 0 && (
              <div className="px-4 py-9 text-center">
                <p className="text-xl">⌕</p>
                <p className="mt-2 text-sm font-semibold">没有找到相符地点</p>
                <button
                  onClick={clearFilters}
                  className="mt-1.5 text-sm font-semibold text-[#155eef]"
                >
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="poi-layout-map relative order-1 min-h-[300px] overflow-hidden rounded-lg border border-[#d0d5dd] bg-white shadow-[0_6px_18px_rgba(16,24,40,.08)] lg:order-2">
          <PoiMap
            pois={visiblePois}
            mapKey={mapKey}
            selectedId={selectedId}
            onSelect={selectPoi}
            onPreviewImages={openGallery}
          />
          <div className="pointer-events-none absolute left-3 top-3 hidden rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur lg:block">
            <p className="text-xs font-medium text-[#667085]">正在查看</p>
            <p className="mt-0.5 text-sm font-bold">
              {type || "全部地点"}
              {city ? ` · ${city}` : ""}
            </p>
          </div>
        </section>
      </div>
      {gallery && (
        <ImageViewer
          gallery={gallery}
          onClose={() => setGallery(undefined)}
          onSelectImage={(activeIndex) =>
            setGallery((current) =>
              current ? { ...current, activeIndex } : current,
            )
          }
        />
      )}
    </main>
  );
}
