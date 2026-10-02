"use client";

import { useEffect, useRef, useState } from "react";
import { gcj02ToWgs84 } from "@/lib/coordinates";
import type { Poi } from "@/lib/poi";

type Props = { pois: Poi[]; mapKey?: string; selectedId?: string; onSelect: (id: string) => void };

export default function PoiMap({ pois, mapKey, selectedId, onSelect }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!element.current || map.current || !mapKey) return;
    void import("leaflet").then((L) => {
      if (!element.current || map.current) return;
      map.current = L.map(element.current, { zoomControl: false }).setView([34.5, 108], 4);
      L.control.zoom({ position: "bottomright" }).addTo(map.current);
      L.tileLayer(`https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${mapKey}`, { subdomains: "01234567", maxZoom: 18, attribution: "© 天地图" }).addTo(map.current);
      markers.current = L.layerGroup().addTo(map.current);
      setMapReady(true);
    });
    return () => { map.current?.remove(); map.current = null; markers.current = null; setMapReady(false); };
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
        L.circleMarker(latLng, { radius: poi.id === selectedId ? 9 : 6, color: poi.id === selectedId ? "#1c1917" : "#78716c", weight: 2, fillColor: "#fafaf9", fillOpacity: 1 }).bindTooltip(poi.name).on("click", () => onSelect(poi.id)).addTo(markers.current!);
      });
      if (bounds.length === 1) map.current?.setView(bounds[0], 13);
      if (bounds.length > 1) map.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    });
  }, [mapReady, onSelect, pois, selectedId]);

  if (!mapKey) return <div className="flex h-full min-h-96 items-center justify-center p-6 text-center text-sm text-stone-500">配置天地图 Key 后在此显示交互地图。</div>;
  return <div ref={element} className="h-full min-h-96" aria-label="POI 地图" />;
}
