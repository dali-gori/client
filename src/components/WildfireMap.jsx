import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// =========================
// Mapbox Configuration
// =========================
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;
const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";
const INITIAL_VIEW = [25.4858, 42.7339]; // Bulgaria center [lng, lat]
const INITIAL_ZOOM = 6;

// =========================
// Backend Configuration (testing)
// =========================
const BACKEND_URL = "https://server-production-32f2.up.railway.app/saved-locations";
// For testing only; move to a secure place/env later
const TEST_JWT = localStorage.getItem("accessToken");

// =========================
// Fullscreen Map Component
// =========================
export default function WildfireMap() {
    const mapNode = useRef(null);
    const mapRef = useRef(null);
    const placingRef = useRef(false);
    const [isPlacing, setIsPlacing] = useState(false);
    const [status, setStatus] = useState(null);
    const savedMarkersRef = useRef([]);

    const clearSavedMarkers = useCallback(() => {
        savedMarkersRef.current.forEach((m) => m.remove());
        savedMarkersRef.current = [];
    }, []);

    const handleDeleteLocation = useCallback(async (id, marker) => {
        try {
            setStatus("Deleting location…");
            const res = await fetch(`${BACKEND_URL}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${TEST_JWT}` },
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText} ${errText}`);
            }
            marker.remove();
            setStatus("Location deleted ✅");
        } catch (err) {
            console.error(err);
            setStatus(`Failed to delete location: ${err?.message ?? "Unknown error"}`);
        } finally {
            setTimeout(() => setStatus(null), 2500);
        }
    }, []);

    const renderSavedLocations = useCallback(
        (items) => {
            if (!mapRef.current || !Array.isArray(items)) return;
            clearSavedMarkers();
            items.forEach((loc) => {
                const lng = Number(loc.geo_x);
                const lat = Number(loc.geo_y);
                if (Number.isFinite(lng) && Number.isFinite(lat)) {
                    const popupContent = document.createElement("div");
                    popupContent.innerHTML = `<div style="font-size:14px;">${loc.name ?? "Saved location"}</div>`;
                    const btn = document.createElement("button");
                    btn.textContent = "Delete";
                    btn.style.cssText =
                        "margin-top:4px;padding:4px 8px;border:none;background:#dc2626;color:#fff;border-radius:4px;cursor:pointer;font-size:12px;";
                    btn.onclick = () => handleDeleteLocation(loc.id, marker);
                    popupContent.appendChild(btn);

                    const marker = new mapboxgl.Marker({ color: "#2563eb" })
                        .setLngLat([lng, lat])
                        .setPopup(new mapboxgl.Popup({ offset: 12 }).setDOMContent(popupContent))
                        .addTo(mapRef.current);
                    savedMarkersRef.current.push(marker);
                }
            });
        },
        [clearSavedMarkers, handleDeleteLocation]
    );

    const fetchSavedLocations = useCallback(async () => {
        try {
            setStatus("Loading saved locations…");
            const res = await fetch(BACKEND_URL, {
                method: "GET",
                headers: { Authorization: `Bearer ${TEST_JWT}` },
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText} ${errText}`);
            }
            const data = await res.json();
            renderSavedLocations(data);
            setStatus(`Loaded ${Array.isArray(data) ? data.length : 0} saved location(s) ✅`);
        } catch (err) {
            console.error(err);
            setStatus(`Failed to load saved locations: ${err?.message ?? "Unknown error"}`);
        } finally {
            setTimeout(() => setStatus(null), 2500);
        }
    }, [renderSavedLocations]);

    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(BACKEND_URL, {
                    headers: {
                        Authorization: `Bearer ${TEST_JWT}`,
                    },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setLocations(data);
                renderSavedLocations(data);
            } catch (err) {
                console.error("Failed to fetch saved locations", err);
                setStatus("Failed to load saved locations");
            }
        };

        fetchLocations();
    }, [renderSavedLocations]);

    const placeMarker = useCallback(async (lngLat) => {
        if (!mapRef.current) return;

        new mapboxgl.Marker({ color: "#e11d48" }).setLngLat(lngLat).addTo(mapRef.current);

        setIsPlacing(false);

        try {
            const nameInput = window.prompt("Name this location:", "Home");
            const name =
                nameInput && nameInput.trim()
                    ? nameInput.trim()
                    : `Saved ${new Date().toLocaleString()}`;

            const payload = {
                name,
                geo_x: lngLat.lng,
                geo_y: lngLat.lat,
            };

            setStatus("Saving location…");
            const res = await fetch(BACKEND_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TEST_JWT}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText} ${errText}`);
            }

            setStatus("Location saved ✅");
        } catch (err) {
            console.error(err);
            setStatus(`Failed to save: ${err?.message ?? "Unknown error"}`);
        } finally {
            setTimeout(() => setStatus(null), 2500);
        }
    }, []);

    useEffect(() => {
        if (mapRef.current || !mapNode.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
            container: mapNode.current,
            style: MAP_STYLE,
            center: INITIAL_VIEW,
            zoom: INITIAL_ZOOM,
            attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");

        mapRef.current = map;

        map.once("load", () => {
            fetchSavedLocations();
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, [fetchSavedLocations]);

    useEffect(() => {
        placingRef.current = isPlacing;
        const canvas = mapRef.current?.getCanvas();
        if (canvas) canvas.style.cursor = isPlacing ? "crosshair" : "";
    }, [isPlacing]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e) => {
            if (!placingRef.current) return;
            placeMarker(e.lngLat);
        };

        if (isPlacing) {
            map.on("click", handleClick);
        }

        return () => {
            map.off("click", handleClick);
        };
    }, [isPlacing, placeMarker]);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    zIndex: 10,
                    top: 12,
                    left: 12,
                    display: "flex",
                    gap: 8,
                }}
            >
                <button
                    onClick={() => setIsPlacing((v) => !v)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.2)",
                        background: isPlacing ? "#fde68a" : "#ffffff",
                        fontSize: 14,
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                >
                    {isPlacing ? "Placing: ON (click map)" : "Place marker"}
                </button>
                <button
                    onClick={fetchSavedLocations}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.2)",
                        background: "#ffffff",
                        fontSize: 14,
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                >
                    Refresh saved locations
                </button>
            </div>

            <div ref={mapNode} style={{ width: "100%", height: "100%" }} />

            {status && (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        bottom: 12,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(0,0,0,0.2)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        fontSize: 14,
                        zIndex: 10,
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    title={status}
                >
                    {status}
                </div>
            )}
        </div>
    );
}