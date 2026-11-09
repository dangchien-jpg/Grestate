import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerUrl from "leaflet/dist/images/marker-icon.png";
import markerRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { Coordinates } from "@/types/valuation";

interface Props {
  coordinates: Coordinates;
  disabled: boolean;
  bounds: { south: number; north: number; west: number; east: number };
  onChange: (coordinates: Coordinates) => void;
}
export default function PredictMap({
  coordinates,
  onChange,
  disabled,
  bounds,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const callback = useRef(onChange);
  const locked = useRef(disabled);
  const limits = useRef(bounds);
  useEffect(() => {
    locked.current = disabled;
    marker.current?.dragging?.[disabled ? "disable" : "enable"]();
  }, [disabled]);
  useEffect(() => {
    limits.current = bounds;
    map.current?.setMaxBounds([
      [bounds.south, bounds.west],
      [bounds.north, bounds.east],
    ]);
  }, [bounds]);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current).setView([16.0611, 108.2208], 13);
    const pin = L.marker([16.0611, 108.2208], {
      draggable: true,
      icon: L.icon({
        iconUrl: markerUrl,
        iconRetinaUrl: markerRetinaUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowSize: [41, 41],
      }),
    }).addTo(instance);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance);
    function selectPoint(point: L.LatLng) {
      const area = limits.current;
      if (
        !locked.current &&
        point.lat >= area.south &&
        point.lat <= area.north &&
        point.lng >= area.west &&
        point.lng <= area.east
      ) {
        callback.current({ lat: point.lat, lon: point.lng });
      }
    }
    instance.on("click", (event: L.LeafletMouseEvent) =>
      selectPoint(event.latlng),
    );
    pin.on("dragend", () => {
      const point = pin.getLatLng();
      const area = limits.current;
      const clamped = L.latLng(
        Math.min(area.north, Math.max(area.south, point.lat)),
        Math.min(area.east, Math.max(area.west, point.lng)),
      );
      pin.setLatLng(clamped);
      selectPoint(clamped);
    });
    instance.setMaxBounds([
      [limits.current.south, limits.current.west],
      [limits.current.north, limits.current.east],
    ]);
    map.current = instance;
    marker.current = pin;
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    const point: L.LatLngTuple = [coordinates.lat, coordinates.lon];
    marker.current?.setLatLng(point);
    map.current?.setView(point, map.current.getZoom());
  }, [coordinates.lat, coordinates.lon]);
  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="mb-3 font-semibold">Bản đồ vị trí bất động sản</h2>
      <p className="mb-3 text-sm text-slate-500">
        Nhấn bản đồ hoặc kéo ghim để chọn tọa độ.
      </p>
      <div
        ref={container}
        className="relative z-0 h-72 w-full rounded-xl"
        aria-label="Bản đồ chọn vị trí bất động sản"
      />
    </section>
  );
}
