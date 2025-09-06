import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// --- Helpers ---------------------------------------------------------------
function getLngLatFromAny(item) {
    const rawLat = item?.lat ?? item?.latitude ?? item?.geo_y ?? item?.y;
    const rawLng = item?.lng ?? item?.lon ?? item?.longitude ?? item?.geo_x ?? item?.x;
    const lat = typeof rawLat === "string" ? parseFloat(rawLat) : rawLat;
    const lng = typeof rawLng === "string" ? parseFloat(rawLng) : rawLng;
    if (typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng)) {
        return [Number(lng), Number(lat)];
    }
    return null;
}

// Haversine distance (km)
function haversine(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Simple centroid-based clustering by distance threshold (km)
function clusterHotspots(coords, maxDistanceKm = 2) {
    const clusters = [];
    coords.forEach((pt) => {
        let placed = false;
        for (const cluster of clusters) {
            const center = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
            const centroid = [center[0] / cluster.length, center[1] / cluster.length];
            if (haversine(pt, centroid) <= maxDistanceKm) {
                cluster.push(pt);
                placed = true;
                break;
            }
        }
        if (!placed) clusters.push([pt]);
    });
    return clusters.map((cluster) => {
        const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
        return [sum[0] / cluster.length, sum[1] / cluster.length];
    });
}

// --- Lightweight Dev Tests (run in browser console) ------------------------
(() => {
    if (typeof window === "undefined" || !console?.assert) return;
    // getLngLatFromAny tests
    const coordCases = [
        { input: { lat: 42, lon: 23 }, expected: [23, 42], note: "lat/lon numeric" },
        { input: { latitude: "42.70", longitude: "23.32" }, expected: [23.32, 42.7], note: "latitude/longitude strings" },
        { input: { geo_y: 41.998, geo_x: 25.123 }, expected: [25.123, 41.998], note: "geo_x/geo_y" },
        { input: { y: 40.1, x: 19.9 }, expected: [19.9, 40.1], note: "generic x/y" },
        { input: { foo: 1, bar: 2 }, expected: null, note: "invalid fields -> null" },
    ];
    coordCases.forEach((c, i) => {
        const got = getLngLatFromAny(c.input);
        const ok = (got === null && c.expected === null) || (Array.isArray(got) && Math.abs(got[0] - c.expected[0]) < 1e-9 && Math.abs(got[1] - c.expected[1]) < 1e-9);
        console.assert(ok, `Coord test #${i + 1} failed: ${c.note}`, { got, expected: c.expected });
    });

    // haversine tests
    console.assert(Math.abs(haversine([0, 0], [0, 0])) < 1e-9, "Haversine zero distance failed");
    console.assert(haversine([0, 0], [0.01, 0]) > 0, "Haversine positive distance failed");

    // clusterHotspots tests (two close points should cluster to one)
    const clustered = clusterHotspots([[23, 42], [23.001, 42.001]], 2);
    console.assert(Array.isArray(clustered) && clustered.length === 1, "Clustering close points failed", { clustered });
})();

// --- Map component ----------------------------------------------------------
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

export default function FullscreenMap() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        document.documentElement.style.height = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/satellite-streets-v12",
            center: [23.3219, 42.6977],
            zoom: 10,
            pitch: 0,
            bearing: 0,
            antialias: true,
        });

        const map = mapRef.current;

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
        map.addControl(
            new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }),
            "top-right"
        );
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

        const onLoad = () => {
            map.resize();
            map.flyTo({ center: [23.3219, 42.6977], zoom: 6.5, speed: 0.6 });

            fetch("https://server-production-32f2.up.railway.app/home-map")
                .then((res) => res.json())
                .then((data) => {
                    if (!data || !Array.isArray(data.sat_data)) {
                        console.log("Unexpected response format:", data);
                        return;
                    }

                    // Build GeoJSON FeatureCollection for sat_data (hotspots)
                    const features = [];
                    const bounds = new mapboxgl.LngLatBounds();

                    (data.sat_data).forEach((item) => {
                        const coord = getLngLatFromAny(item);
                        if (!coord) return;
                        bounds.extend(coord);
                        features.push({
                            type: "Feature",
                            geometry: { type: "Point", coordinates: coord },
                            properties: {
                                date: item?.date ?? null,
                                time: item?.time ?? null,
                                confidence: item?.confidence ?? null,
                            },
                        });
                    });

                    if (features.length === 0) {
                        console.warn("No valid hotspot points found.");
                        return;
                    }

                    const collection = {
                        type: "FeatureCollection",
                        features,
                    };

                    // Add a clustered GeoJSON source for hotspots
                    const HOTSPOT_SRC = "hotspots-src";
                    const CLUSTERS_LAYER = "hotspots-clusters";
                    const CLUSTER_COUNT_LAYER = "hotspots-cluster-count";
                    const UNCLUSTERED_LAYER = "hotspots-unclustered";

                    if (map.getSource(HOTSPOT_SRC)) {
                        map.getSource(HOTSPOT_SRC).setData(collection);
                    } else {
                        map.addSource(HOTSPOT_SRC, {
                            type: "geojson",
                            data: collection,
                            cluster: true,
                            clusterRadius: 45, // px distance for grouping close pixels
                            clusterMaxZoom: 12,
                        });

                        // Cluster bubbles
                        map.addLayer({
                            id: CLUSTERS_LAYER,
                            type: "circle",
                            source: HOTSPOT_SRC,
                            filter: ["has", "point_count"],
                            paint: {
                                "circle-color": [
                                    "step",
                                    ["get", "point_count"],
                                    "#ffeda0",
                                    5, "#feb24c",
                                    20, "#f03b20",
                                ],
                                "circle-radius": [
                                    "step",
                                    ["get", "point_count"],
                                    16,
                                    5, 20,
                                    20, 28,
                                ],
                                "circle-stroke-color": "#ffffff",
                                "circle-stroke-width": 1.5,
                                "circle-opacity": 0.85,
                            },
                        });

                        // Cluster count labels
                        map.addLayer({
                            id: CLUSTER_COUNT_LAYER,
                            type: "symbol",
                            source: HOTSPOT_SRC,
                            filter: ["has", "point_count"],
                            layout: {
                                "text-field": ["get", "point_count_abbreviated"],
                                "text-size": 12,
                                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                            },
                            paint: { "text-color": "#1a1a1a" },
                        });

                        // Individual (unclustered) hotspots
                        map.addLayer({
                            id: UNCLUSTERED_LAYER,
                            type: "circle",
                            source: HOTSPOT_SRC,
                            filter: ["!has", "point_count"],
                            paint: {
                                "circle-color": "#ff3b30",
                                "circle-radius": 6,
                                "circle-stroke-color": "#ffffff",
                                "circle-stroke-width": 1.25,
                            },
                        });

                        // Cursor feedback
                        map.on("mouseenter", CLUSTERS_LAYER, () => (map.getCanvas().style.cursor = "pointer"));
                        map.on("mouseleave", CLUSTERS_LAYER, () => (map.getCanvas().style.cursor = ""));

                        // Zoom in when clicking a cluster
                        map.on("click", CLUSTERS_LAYER, (e) => {
                            const feats = map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER] });
                            const clusterId = feats[0]?.properties?.cluster_id;
                            const src = map.getSource(HOTSPOT_SRC);
                            if (clusterId != null && src.getClusterExpansionZoom) {
                                src.getClusterExpansionZoom(clusterId, (err, zoom) => {
                                    if (err) return;
                                    const [lng, lat] = feats[0].geometry.coordinates;
                                    map.easeTo({ center: [lng, lat], zoom });
                                });
                            }
                        });

                        // Popup for a single hotspot (FIXED QUOTING IN HTML STRING)
                        map.on("click", UNCLUSTERED_LAYER, (e) => {
                            const f = e.features?.[0];
                            if (!f) return;
                            const [lng, lat] = f.geometry.coordinates;
                            const { date, time, confidence } = f.properties ?? {};
                            new mapboxgl.Popup({ offset: 12 })
                                .setLngLat([lng, lat])
                                .setHTML(`<div style='font: 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;'>
                  <strong>Hotspot</strong><br/>
                  <div>${typeof lat === 'number' && Number.isFinite(lat) ? lat.toFixed(5) : lat}, ${typeof lng === 'number' && Number.isFinite(lng) ? lng.toFixed(5) : lng}</div>
                  <div>Date: ${date ?? '—'}</div>
                  <div>Time: ${time ?? '—'}</div>
                  <div>Confidence: ${confidence ?? '—'}</div>
                </div>`)
                                .addTo(map);
                        });
                    }

                    // Fit to data
                    if (!bounds.isEmpty()) {
                        map.fitBounds(bounds, { padding: 40, duration: 900, maxZoom: 10 });
                    }
                })
                .catch((err) => console.error("Failed to fetch sat_data:", err));
        };

        map.on("load", onLoad);

        return () => {
            try { map.off("load", onLoad); } catch { }
            const m = map?.__customMarkers;
            if (m && Array.isArray(m)) m.forEach((mk) => mk.remove());
            map.remove();
        };
    }, []);

    return (
        <div ref={mapContainerRef} style={{ width: "100%", height: "80vh" }} />
    );
}