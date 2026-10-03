"use client";

import { useEffect, useRef, useState } from "react";
import { gcj02ToWgs84 } from "@/lib/coordinates";
import type { Poi, PoiImage } from "@/lib/poi";

type Props = {
  pois: Poi[];
  mapKey?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
  onPreviewImages: (images: PoiImage[], activeIndex: number) => void;
};

const tiandituVectorUrl =
  "https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}";

function poiImageUrl(token: string) {
  return `/api/poi-image?token=${encodeURIComponent(token)}`;
}

function popupContent(
  poi: Poi,
  onPreviewImages: (images: PoiImage[], activeIndex: number) => void,
) {
  const content = document.createElement("article");
  content.className = "poi-map-popup";
  if (poi.images.length) {
    const gallery = document.createElement("div");
    gallery.className = `poi-map-popup__gallery${poi.images.length === 1 ? " poi-map-popup__gallery--single" : ""}`;
    poi.images.forEach((poiImage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "poi-map-popup__gallery-item";
      button.setAttribute("aria-label", `查看图片 ${index + 1}`);
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onPreviewImages(poi.images, index);
      };
      const image = document.createElement("img");
      image.src = poiImageUrl(poiImage.token);
      image.alt = "";
      image.loading = "lazy";
      button.append(image);
      gallery.append(button);
    });
    content.append(gallery);
  }
  const header = document.createElement("div");
  header.className = "poi-map-popup__header";
  const title = document.createElement("h2");
  title.textContent = poi.name;
  header.append(title);
  const badges = document.createElement("div");
  badges.className = "poi-map-popup__badges";
  if (poi.rating !== null) {
    const rating = document.createElement("span");
    rating.className = "poi-map-popup__rating";
    rating.textContent = `★ ${poi.rating.toFixed(1)}`;
    badges.append(rating);
  }
  header.append(badges);
  content.append(header);
  const details = document.createElement("div");
  details.className = "poi-map-popup__details";
  if (poi.type) {
    const type = document.createElement("span");
    type.className = "poi-map-popup__type";
    type.textContent = poi.type;
    details.append(type);
  }
  const location = document.createElement("span");
  location.className = "poi-map-popup__meta";
  location.textContent =
    [poi.city, poi.district].filter(Boolean).join(" ") || "地点信息待补充";
  details.append(location);
  content.append(details);
  if (poi.review) {
    const reviewLabel = document.createElement("p");
    reviewLabel.className = "poi-map-popup__review-label";
    reviewLabel.textContent = "推荐理由";
    content.append(reviewLabel);
    const review = document.createElement("p");
    review.className = "poi-map-popup__review";
    review.textContent = poi.review;
    content.append(review);
  }
  return content;
}

export default function PoiMap({
  pois,
  mapKey,
  selectedId,
  onSelect,
  onPreviewImages,
}: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<import("leaflet").LayerGroup | null>(null);
  const markerById = useRef<Map<string, import("leaflet").CircleMarker>>(
    new Map(),
  );
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!element.current || map.current || !mapKey) return;
    const markerLookup = markerById.current;
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
      markerLookup.clear();
      setMapReady(false);
    };
  }, [mapKey]);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    const currentMap = map.current;
    const markerLayer = markers.current;
    void import("leaflet").then((L) => {
      if (map.current !== currentMap || markers.current !== markerLayer) return;
      markerLayer.clearLayers();
      markerById.current.clear();
      const bounds: [number, number][] = [];
      pois.forEach((poi) => {
        const point = gcj02ToWgs84(poi.longitude, poi.latitude);
        const latLng: [number, number] = [point.latitude, point.longitude];
        bounds.push(latLng);
        const marker = L.circleMarker(latLng, {
          color: "#155eef",
          fillColor: "#ffffff",
          fillOpacity: 1,
          radius: 6,
          weight: 2,
        });
        marker
          .bindPopup(popupContent(poi, onPreviewImages), {
            autoPanPadding: [36, 36],
            closeButton: false,
            offset: [0, -4],
          })
          .on("click", () => onSelect(poi.id))
          .addTo(markerLayer);
        markerById.current.set(poi.id, marker);
      });
      if (bounds.length === 1) currentMap.setView(bounds[0], 13);
      if (bounds.length > 1)
        currentMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    });
  }, [mapReady, onPreviewImages, onSelect, pois]);

  useEffect(() => {
    markerById.current.forEach((marker, id) => {
      const active = id === selectedId;
      marker.setStyle({
        color: active ? "#101828" : "#155eef",
        fillColor: active ? "#155eef" : "#ffffff",
        radius: active ? 9 : 6,
        weight: active ? 3 : 2,
      });
    });
    const selectedMarker = selectedId
      ? markerById.current.get(selectedId)
      : undefined;
    if (selectedMarker && map.current) {
      map.current.panTo(selectedMarker.getLatLng(), { animate: true });
      selectedMarker.openPopup();
    }
  }, [mapReady, pois, selectedId]);

  if (!mapKey) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-500">
        配置天地图 Key 后在此显示交互地图。
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={element} className="h-full" aria-label="POI 地图" />
      {tileError && (
        <p className="absolute left-3 top-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          天地图瓦片加载失败，请检查 Key 的服务权限和域名白名单。
        </p>
      )}
    </div>
  );
}
