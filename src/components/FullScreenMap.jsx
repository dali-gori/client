import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSelectedReport } from "../contexts/SelectedReportContext";
import { endpoints } from "../api/endpoints";

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

function makeCircle(lng, lat, radiusMeters, steps = 64) {
    const coords = [];
    const distanceX = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
    const distanceY = radiusMeters / 111320;

    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * (2 * Math.PI);
        const dx = Math.cos(angle) * distanceX;
        const dy = Math.sin(angle) * distanceY;
        coords.push([lng + dx, lat + dy]);
    }

    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [coords],
        },
        properties: {},
    };
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
    const { setSelectedReport } = useSelectedReport();
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

            fetch(endpoints.homeMap)
                .then((res) => res.json())
                .then((data) => {
                    if (!data || !Array.isArray(data.sat_data)) {
                        console.log("Unexpected response format:", data);
                        return;
                    }

                    // Build GeoJSON FeatureCollection for sat_data (hotspots)
                    const features = [];
                    const pointFeatures = [];
                    const circleFeatures = [];
                    const bounds = new mapboxgl.LngLatBounds();


                    //data.report_data = [{ "lat": 43, "lng": 25, "statusText": "Нов", "statusHistory": [ { "created_at": "2025-09-05T08:54:26.695Z", "reportStatus": "Нов", "reportStatusId": 1 } ] }, { "lat": 41.94177, "lng": 25.11144, "statusText": "Нов", "statusHistory": [ { "created_at": "2025-09-05T15:54:15.693Z", "reportStatus": "Нов", "reportStatusId": 1 }, { "created_at": "2025-09-05T17:50:59.070Z", "reportStatus": "Под контрол", "reportStatusId": 2 }, { "created_at": "2025-09-05T18:47:28.889Z", "reportStatus": "Нов", "reportStatusId": 1 } ] }]

                    const REPORT_SRC = "reports-src";
                    const REPORT_LAYER = "reports-layer";

                    // Build Features for reports and extend the same `bounds` used by hotspots
                    (Array.isArray(data.report_data) ? data.report_data : []).forEach((item, idx) => {
                        if (!item || typeof item.lat !== "number" || typeof item.lng !== "number") return;

                        const latestId = item.latestStatusId ?? 0;

                        // extend bounds for fitBounds to include report locations
                        if (typeof bounds !== "undefined" && bounds && bounds.extend) {
                            bounds.extend([item.lng, item.lat]);
                        }

                        // flame icon feature
                        pointFeatures.push({
                            type: "Feature",
                            geometry: { type: "Point", coordinates: [item.lng, item.lat] },
                            properties: {
                                _id: item.id ?? idx,
                                statusText: item.statusText ?? "",
                                latestId,
                                statusHistory: JSON.stringify(item.statusHistory ?? []),
                                lat: item.lat,
                                lng: item.lng,
                                items: JSON.stringify(item.items ?? []),
                            },
                        });

                        // circle radius feature if present
                        if (item.radius && item.radius > 0) {
                            const circleFeature = makeCircle(item.lng, item.lat, item.radius);
                            // attach useful props if you want to style by status later
                            circleFeature.properties = {
                                _id: item.id ?? idx,
                                latestId,
                            };
                            circleFeatures.push(circleFeature);
                        }
                    });

                    const pointCollection = { type: "FeatureCollection", features: pointFeatures };
                    const circleCollection = { type: "FeatureCollection", features: circleFeatures };

                    // add/update source
                    if (map.getSource(REPORT_SRC)) {
                        map.getSource(REPORT_SRC).setData(pointCollection);
                    } else {
                        map.addSource(REPORT_SRC, { type: "geojson", data: pointCollection });

                        // helper to create the SVG data URL
                        const fireSvg = (color) =>
                            `<svg viewBox="0 0 25 29" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                <path d="M7.08225 0.363345C6.82768 0.17263 6.5194 0.0671583 6.20136 0.0619687C5.88332 0.0567791 5.57175 0.152137 5.3111 0.334444C5.05045 0.516752 4.85401 0.776701 4.74979 1.07723C4.64557 1.37775 4.6389 1.70351 4.73072 2.00805C4.99472 2.88884 5.02439 3.82326 4.81681 4.71903C4.60992 5.60949 4.1724 6.42985 3.54817 7.09773C3.50656 7.14265 3.46772 7.19006 3.43187 7.2397C2.53174 8.47361 -2.54888 15.6973 2.01069 23.4935L2.056 23.5675C3.16359 25.2332 4.68059 26.5864 6.46152 27.4972C8.22097 28.3982 10.1833 28.8294 12.1583 28.7493C14.2584 28.786 16.3323 28.2787 18.1784 27.2767C20.0565 26.2554 21.6382 24.7652 22.7696 22.9513C24.7345 19.6286 24.5578 16.0704 23.6577 13.2235C22.7772 10.4325 21.1204 8.06734 19.7204 7.02826C19.5004 6.86538 19.2403 6.76534 18.9679 6.73883C18.6955 6.71232 18.421 6.76034 18.1737 6.87776C17.9265 6.99518 17.7158 7.17758 17.5642 7.40546C17.4126 7.63334 17.3257 7.89814 17.313 8.17155C17.2118 10.3328 16.7647 12.0243 16.1138 13.3534C15.7785 9.71809 14.4117 7.01618 12.7549 5.01051C11.0226 2.91121 8.88252 1.53684 7.7362 0.799819C7.5146 0.661632 7.29703 0.517087 7.08376 0.366365L7.08225 0.363345Z" fill="${color}" />
                            </svg>`;

                        function loadImgFromSvg(name, svg) {
                            return new Promise((resolve, reject) => {
                                if (map.hasImage(name)) return resolve(); // already present
                                const img = new Image();
                                img.onload = () => {
                                    try {
                                        map.addImage(name, img);
                                    } catch (err) {
                                        // if addImage fails (rare), still resolve to avoid blocking.
                                        console.warn("map.addImage failed for", name, err);
                                    }
                                    resolve();
                                };
                                img.onerror = (e) => reject(e);
                                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
                            });
                        }

                        // load three colored icons (orange, blue, green)
                        Promise.all([
                            loadImgFromSvg("fire-orange", fireSvg("#FF7410")),
                            loadImgFromSvg("fire-blue", fireSvg("#0095FF")),
                            loadImgFromSvg("fire-green", fireSvg("#3AB549")),
                        ])
                            .then(() => {
                                // add the symbol layer if not already there
                                if (!map.getLayer(REPORT_LAYER)) {
                                    map.addLayer({
                                        id: REPORT_LAYER,
                                        type: "symbol",
                                        source: REPORT_SRC,
                                        layout: {
                                            // choose image by numeric latestId (1 or 4 -> orange, 2 -> blue, 3 -> green)
                                            "icon-image": [
                                                "match",
                                                ["to-number", ["get", "latestId"]],
                                                1, "fire-orange",
                                                4, "fire-orange",
                                                2, "fire-blue",
                                                3, "fire-green",
                                                "fire-orange"
                                            ],
                                            "icon-size": 1,
                                            "icon-allow-overlap": true,
                                            "icon-ignore-placement": true
                                        }
                                    });
                                }

                                // Click handler: populate #reportDetails and smoothly scroll to it
                                // (no popup on the map)
                                // Remove existing click listener first (defensive)
                                // NOTE: map.off requires the exact function reference; if you re-create this code block you may end up with duplicated handlers.
                                // For typical usage, this block runs once per load, so it's fine.
                                map.on("click", REPORT_LAYER, (e) => {
                                    const f = e.features && e.features[0];
                                    if (!f) return;
                                    const props = f.properties || {};
                                    let history = [];
                                    try {
                                        history = JSON.parse(props.statusHistory || "[]");
                                    } catch (err) {
                                        history = [];
                                    }

                                    let items = [];
                                    try {
                                        items = JSON.parse(props.items || "[]");
                                    } catch (err) {
                                        items = [];
                                    }

                                    setSelectedReport({
                                        id: f.properties?._id,
                                        lat: Number(f.properties?.lat),
                                        lng: Number(f.properties?.lng),
                                        statusText: f.properties?.statusText,
                                        statusHistory: history,
                                        latestId: Number(f.properties?.latestId || 0),
                                        items: items
                                    });

                                    // Smooth scroll to the details box
                                    const box = document.getElementById("reportDetails");
                                    if (box) {
                                        box.scrollIntoView({ block: "center", behavior: "smooth" });
                                    }
                                });

                                // cursor feedback
                                map.on("mouseenter", REPORT_LAYER, () => (map.getCanvas().style.cursor = "pointer"));
                                map.on("mouseleave", REPORT_LAYER, () => (map.getCanvas().style.cursor = ""));
                            })
                            .catch((err) => {
                                console.error("Failed to load report icons:", err);
                                // Fallback: add a simple circle layer if images fail
                                if (!map.getLayer(REPORT_LAYER)) {
                                    map.addLayer({
                                        id: REPORT_LAYER,
                                        type: "circle",
                                        source: REPORT_SRC,
                                        paint: {
                                            "circle-color": "#888888",
                                            "circle-radius": 6,
                                            "circle-stroke-color": "#ffffff",
                                            "circle-stroke-width": 1.25,
                                        }
                                    });
                                }
                            });
                    }

                    const REPORT_CIRCLE_SRC = "reports-circle-src";
                    const REPORT_CIRCLE_LAYER = "reports-circle-layer";

                    if (map.getSource(REPORT_CIRCLE_SRC)) {
                        map.getSource(REPORT_CIRCLE_SRC).setData(circleCollection);
                    } else {
                        map.addSource(REPORT_CIRCLE_SRC, { type: "geojson", data: circleCollection });
                        map.addLayer({
                            id: REPORT_CIRCLE_LAYER,
                            type: "fill",
                            source: REPORT_CIRCLE_SRC,
                            paint: {
                                "fill-color": "#fc9d03", // or use a function to match latestId for color
                                "fill-opacity": 0.4
                            }
                        });
                    }
                    // ---------- end reports ----------

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