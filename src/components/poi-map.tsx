"use client";

import { useEffect, useRef, useState } from "react";
import { gcj02ToWgs84 } from "@/lib/coordinates";
import type { Poi } from "@/lib/poi";

type Props = {
  pois: Poi[];
  mapKey?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
};

const tiandituVectorUrl =
  "https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}";

export default function PoiMap({ pois, mapKey, selectedId, onSelect }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!element.current || map.current || !mapKey) return;
    void import("leaflet").then((L) => {
      if (!element.current || map.current) return;
      map.current = L.map(element.current, { zoomControl: false }).setView(
        [34.5, 108],
        4,
      );
      L.control.zoom({ position: "bottomright" }).addTo(map.current);
      const tiles = L.tileLayer(tiandituVectorUrl.replace("{key}", mapKey), {
        attribution: "© 天地图",
        maxZoom: 18,
        subdomains: "01234567",
      });
      tiles.on("tileerror", () => setTileError(true));
      tiles.addTo(map.current);
      markers.current = L.layerGroup().addTo(map.current);
      setMapReady(true);
    });
    return () => {
      map.current?.remove();
      map.current = null;
      markers.current = null;
      setMapReady(false);
    };
  }, [mapKey]);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    void import("leaflet").then((L) => {
      markers.current?.clearLayers();
      const bounds: [number, number][] = [];
      pois.forEach((poi) => {
        const point = gcj02ToWgs84(poi.longitude, poi.latitude);
        const latLng: [number, number] = [point.latitude, point.longitude];
        bounds.push(latLng);
        L.circleMarker(latLng, {
          color: poi.id === selectedId ? "#1c1917" : "#78716c",
          fillColor: "#fafaf9",
          fillOpacity: 1,
          radius: poi.id === selectedId ? 9 : 6,
          weight: 2,
        })
          .bindTooltip(poi.name)
          .on("click", () => onSelect(poi.id))
          .addTo(markers.current!);
      });
      if (bounds.length === 1) map.current?.setView(bounds[0], 13);
      if (bounds.length > 1)
        map.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    });
  }, [mapReady, onSelect, pois, selectedId]);

  if (!mapKey) {
    return (
      <div className="flex h-full min-h-96 items-center justify-center p-6 text-center text-sm text-stone-500">
        配置天地图 Key 后在此显示交互地图。
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-96">
      <div ref={element} className="h-full min-h-96" aria-label="POI 地图" />
      {tileError && (
        <p className="absolute left-3 top-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          天地图瓦片加载失败，请检查 Key 的服务权限和域名白名单。
        </p>
      )}
    </div>
  );
}
