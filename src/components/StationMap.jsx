import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { circle as turfCircle } from "@turf/turf";
import { endpoints } from "../api/endpoints";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

export default function StationMap() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [liveRadiusM, setLiveRadiusM] = useState(0);
    const centerRef = useRef(null); // mapboxgl.LngLat | null

    // ---------------------------- Network ------------------------------------
    // POST (with JWT) and GET (public) endpoints
    const SERVER_URL = endpoints.reports;          // POST here
    const SERVER_GET_URL = endpoints.reports;      // GET here
    const SERVER_DELETE_URL = (id) => endpoints.reportById(id);
    const SERVER_STATUS_URL = (id) => endpoints.reportStatus(id);

    // Testing JWT provided by you; can be overridden by localStorage key 'accessToken'
    const TEST_JWT =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiZXhhbXBsZUBleGFtcGxlLmNvbSIsInJvbGUiOjIsImlhdCI6MTc1NzIwNDI5OSwiZXhwIjoxNzU3MjkwNjk5fQ.S9Rzs1sRd-DTDeTIy3oPXhf8Vkm0OIwgElyPl-15ero";
    const JWT = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("accessToken") || TEST_JWT
        : TEST_JWT;

    // ---------------------------- Status Colors -------------------------------
    // 2 Под контрол -> blue, 3 Потушен -> green, 4 Разпространява се -> orange/red
    const STATUS_COLOR = {
        2: "#3498db", // blue
        3: "#27ae60", // green
        4: "#e67e22", // orange
    };
    const serverStatusColor = (statusId) => STATUS_COLOR[statusId] || "#7f8c8d"; // default gray

    const STATUS_TEXT = {
        2: "Под контрол",
        3: "Потушен",
        4: "Разпространява се",
    };
    const isValidStatusId = (v) => v === 2 || v === 3 || v === 4;

    // ---------------------------- Helpers -------------------------------------
    const toFiniteNumber = (x) => {
        const n = Number(x);
        return Number.isFinite(n) ? n : 0;
    };

    const buildReportPayload = (centerLngLat, radiusMeters) => ({
        geo_x: toFiniteNumber(centerLngLat.lng),
        geo_y: toFiniteNumber(centerLngLat.lat),
        radius: Math.max(0, Math.round(toFiniteNumber(radiusMeters))),
    });

    const parseResponseText = (status, statusText, text) => {
        try {
            const j = text ? JSON.parse(text) : null;
            if (j && (j.message || j.error)) return j.message || j.error;
        } catch (_) { }
        return text || statusText || `HTTP ${status}`;
    };

    // Build a Feature for a server report
    const buildServerFeature = (report) => {
        const { id, lat, lng, radius, statusId, statusText, latestStatusId } = report;
        const rKm = Math.max(0.001, Number(radius || 0) / 1000);
        const center = [Number(lng), Number(lat)];
        const feature = turfCircle(center, rKm, { steps: 128, units: "kilometers" });
        feature.properties = {
            kind: "server",
            id: Number(id),
            center_lng: Number(lng),
            center_lat: Number(lat),
            radius_m: Math.round(Number(radius || 0)),
            statusId: Number(statusId),
            latestStatusId: Number(latestStatusId || statusId),
            statusText: String(statusText || STATUS_TEXT[Number(statusId)] || "Неизвестен статус"),
        };
        return feature;
    };

    // ---------------------------- Sources/Layers ------------------------------
    // Saved & temp circles (user-drawn)
    const TEMP_SOURCE_ID = "temp-circle";
    const TEMP_FILL_ID = "temp-circle-fill";
    const TEMP_LINE_ID = "temp-circle-line";
    const SAVED_SOURCE_ID = "saved-circles";
    const SAVED_FILL_ID = "saved-circles-fill";
    const SAVED_LINE_ID = "saved-circles-line";

    const ensureUserSourcesAndLayers = () => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        if (!map.getSource(SAVED_SOURCE_ID)) {
            map.addSource(SAVED_SOURCE_ID, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
        }
        if (!map.getSource(TEMP_SOURCE_ID)) {
            map.addSource(TEMP_SOURCE_ID, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
        }

        if (!map.getLayer(SAVED_FILL_ID)) {
            map.addLayer({
                id: SAVED_FILL_ID,
                type: "fill",
                source: SAVED_SOURCE_ID,
                paint: { "fill-color": "#E67E22", "fill-opacity": 0.12 },
            });
        }
        if (!map.getLayer(SAVED_LINE_ID)) {
            map.addLayer({
                id: SAVED_LINE_ID,
                type: "line",
                source: SAVED_SOURCE_ID,
                paint: { "line-color": "#D35400", "line-width": 2 },
            });
        }

        if (!map.getLayer(TEMP_FILL_ID)) {
            map.addLayer({
                id: TEMP_FILL_ID,
                type: "fill",
                source: TEMP_SOURCE_ID,
                paint: { "fill-color": "#E74C3C", "fill-opacity": 0.18 },
            });
        }
        if (!map.getLayer(TEMP_LINE_ID)) {
            map.addLayer({
                id: TEMP_LINE_ID,
                type: "line",
                source: TEMP_SOURCE_ID,
                paint: { "line-color": "#C0392B", "line-width": 2.5 },
            });
        }
    };

    const setTempCircle = (centerLngLat, radiusMeters) => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        ensureUserSourcesAndLayers();

        const radiusKm = Math.max(0.001, radiusMeters / 1000);
        const feature = turfCircle([centerLngLat.lng, centerLngLat.lat], radiusKm, {
            steps: 128,
            units: "kilometers",
        });
        feature.properties = { kind: "temp", radius_m: radiusMeters };

        const src = map.getSource(TEMP_SOURCE_ID);
        if (src) src.setData(feature);
    };

    const clearTempCircle = () => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        const src = map.getSource(TEMP_SOURCE_ID);
        if (src) src.setData({ type: "FeatureCollection", features: [] });
    };

    const appendSavedCircle = (centerLngLat, radiusMeters) => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        ensureUserSourcesAndLayers();

        const src = map.getSource(SAVED_SOURCE_ID);
        const existing = (src && src._data) || { type: "FeatureCollection", features: [] };

        const radiusKm = Math.max(0.001, radiusMeters / 1000);
        const feature = turfCircle([centerLngLat.lng, centerLngLat.lat], radiusKm, {
            steps: 128,
            units: "kilometers",
        });
        feature.properties = {
            kind: "saved",
            radius_m: Math.round(radiusMeters),
            center_lng: centerLngLat.lng,
            center_lat: centerLngLat.lat,
            created_at: Date.now(),
        };

        const next = { type: "FeatureCollection", features: [...(existing.features || []), feature] };
        src.setData(next);
    };

    const clearAllSaved = () => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;
        const src = map.getSource(SAVED_SOURCE_ID);
        if (src) src.setData({ type: "FeatureCollection", features: [] });
    };

    // ---------------------------- Server Layers -------------------------------
    const SERVER_SOURCE_ID = "server-reports";
    const SERVER_FILL_ID = "server-reports-fill";
    const SERVER_LINE_ID = "server-reports-line";

    const ensureServerLayers = () => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        if (!map.getSource(SERVER_SOURCE_ID)) {
            map.addSource(SERVER_SOURCE_ID, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
        }

        if (!map.getLayer(SERVER_FILL_ID)) {
            map.addLayer({
                id: SERVER_FILL_ID,
                type: "fill",
                source: SERVER_SOURCE_ID,
                paint: {
                    "fill-color": [
                        "match",
                        ["get", "statusId"],
                        4, STATUS_COLOR[4],
                        3, STATUS_COLOR[3],
                        2, STATUS_COLOR[2],
                        "#7f8c8d",
                    ],
                    "fill-opacity": 0.18,
                },
            });
        }

        if (!map.getLayer(SERVER_LINE_ID)) {
            map.addLayer({
                id: SERVER_LINE_ID,
                type: "line",
                source: SERVER_SOURCE_ID,
                paint: {
                    "line-color": [
                        "match",
                        ["get", "statusId"],
                        4, "#c0392b", // deeper orange/red outline for 4
                        3, "#1e8449", // darker green outline for 3
                        2, "#2c3e50", // darker blue/steel for 2
                        "#7f8c8d",
                    ],
                    "line-width": 2.5,
                },
            });
        }
    };

    // ---------------------------- Network Calls -------------------------------
    async function reportCircle(centerLngLat, radiusMeters) {
        const payload = buildReportPayload(centerLngLat, radiusMeters);

        if (!Number.isFinite(payload.geo_x) || !Number.isFinite(payload.geo_y)) {
            console.error("Invalid center coordinates");
            return;
        }

        try {
            const res = await fetch(SERVER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${JWT}`,
                },
                body: JSON.stringify(payload),
                mode: "cors",
                credentials: "omit",
                cache: "no-store",
                keepalive: true,
            });

            const text = await res.text().catch(() => "");
            const detail = parseResponseText(res.status, res.statusText, text);

            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${detail}`);

            // success: nothing UI-wise (no toasts)
        } catch (err) {
            const msg = err?.message || (typeof err === "string" ? err : "Network error");
            console.error("Report failed:", msg);
        }
    }

    async function deleteReport(id) {
        try {
            const res = await fetch(SERVER_DELETE_URL(id), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${JWT}` },
                mode: "cors",
                credentials: "omit",
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(parseResponseText(res.status, res.statusText, text));
            }
            return true;
        } catch (e) {
            console.error("Delete failed:", e?.message || e);
            return false;
        }
    }

    async function updateReportStatus(id, statusId) {
        try {
            const res = await fetch(SERVER_STATUS_URL(id), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${JWT}`,
                },
                body: JSON.stringify({ statusId }),
                mode: "cors",
                credentials: "omit",
            });
            const text = await res.text().catch(() => "");
            if (!res.ok) throw new Error(parseResponseText(res.status, res.statusText, text));
            return true;
        } catch (e) {
            console.error("Status update failed:", e?.message || e);
            return false;
        }
    }

    // ---------------------------- Source mutations ----------------------------
    const getServerCollection = () => {
        const map = mapRef.current;
        const src = map && map.getSource(SERVER_SOURCE_ID);
        return (src && src._data) || { type: "FeatureCollection", features: [] };
    };
    const setServerCollection = (collection) => {
        const map = mapRef.current;
        const src = map && map.getSource(SERVER_SOURCE_ID);
        if (src) src.setData(collection);
    };
    const removeReportLocally = (id) => {
        const col = getServerCollection();
        const next = { ...col, features: (col.features || []).filter((f) => Number(f.properties?.id) !== Number(id)) };
        setServerCollection(next);
    };
    const updateReportStatusLocally = (id, statusId) => {
        const col = getServerCollection();
        const next = {
            ...col, features: (col.features || []).map((f) => {
                if (Number(f.properties?.id) !== Number(id)) return f;
                const nf = { ...f, properties: { ...f.properties, statusId, statusText: STATUS_TEXT[statusId] || f.properties.statusText } };
                return nf;
            })
        };
        setServerCollection(next);
    };

    // ---------------------------- Network: GET reports ------------------------
    async function fetchServerReports() {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        ensureServerLayers();

        let res;
        try {
            res = await fetch(SERVER_GET_URL, { method: "GET", mode: "cors", cache: "no-store" });
        } catch (e) {
            console.error("GET /reports failed (network):", e);
            return;
        }

        let data;
        try {
            data = await res.json();
        } catch (e) {
            console.error("GET /reports failed (bad JSON):", e);
            return;
        }

        if (!res.ok || !Array.isArray(data)) {
            console.error("GET /reports unexpected:", res.status, data);
            return;
        }

        const features = [];
        const bounds = new mapboxgl.LngLatBounds();

        data.forEach((r) => {
            try {
                const f = buildServerFeature(r);
                features.push(f);
                bounds.extend([f.properties.center_lng, f.properties.center_lat]);
            } catch (e) {
                console.warn("Skipping bad report:", r, e);
            }
        });

        const src = map.getSource(SERVER_SOURCE_ID);
        src.setData({ type: "FeatureCollection", features });

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 48, duration: 600, maxZoom: 9 });
        }

        map.off("click", SERVER_FILL_ID, onReportClick);
        map.on("click", SERVER_FILL_ID, onReportClick);
    }

    function onReportClick(e) {
        const map = mapRef.current;
        if (!map) return;
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties || {};

        const currentStatus = Number(p.statusId);
        const centerLng = Number(p.center_lng);
        const centerLat = Number(p.center_lat);
        const reportId = Number(p.id);

        const html = `
      <div style="font-family: system-ui; font-size:14px; min-width:220px;">
        <div style="margin-bottom:6px;"><strong>ID:</strong> ${reportId}</div>
        <div style="margin-bottom:6px;"><strong>Статус:</strong> <span id="status-label">${p.statusText ?? "-"}</span></div>
        <div style="margin-bottom:6px;"><strong>Радиус:</strong> ${p.radius_m ?? "-"} m</div>
        <div style="margin-bottom:10px;"><strong>Координати:</strong> ${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}</div>

        <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px; flex-wrap: wrap;">
          <select id="status-select" style="flex:1; padding:4px 6px;">
            <option value="2" ${currentStatus === 2 ? "selected" : ""}>2 — Под контрол</option>
            <option value="3" ${currentStatus === 3 ? "selected" : ""}>3 — Потушен</option>
            <option value="4" ${currentStatus === 4 ? "selected" : ""}>4 — Разпространява се</option>
          </select>
          <button id="status-save" style="padding:4px 8px; border:1px solid #ccc; border-radius:6px; background:#fff; font-weight:600;" disabled>Запази</button>
        </div>
        <div id="inline-msg" style="min-height:16px; font-size:12px; color:#666;"></div>
        <hr style="margin:8px 0;"/>
        <div id="delete-row">
          <button id="delete-btn" style="padding:4px 8px; border:1px solid #d33; color:#d33; border-radius:6px; background:#fff; font-weight:700;">Изтрий</button>
        </div>
        <div id="confirm-row" style="display:none; margin-top:8px;">
          <span style="font-size:12px;">Изтриване на репорт #${reportId}?</span>
          <div style="margin-top:6px; display:flex; gap:6px;">
            <button id="cancel-del" style="padding:4px 8px; border:1px solid #ccc; border-radius:6px; background:#fff;">Откажи</button>
            <button id="confirm-del" style="padding:4px 8px; border:1px solid #d33; color:#fff; background:#e74c3c; border-radius:6px; font-weight:700;">Изтрий</button>
          </div>
        </div>
      </div>`;

        const popup = new mapboxgl.Popup({ closeButton: true })
            .setLngLat([centerLng, centerLat])
            .setHTML(html)
            .addTo(map);

        const root = popup.getElement();
        const $ = (sel) => root.querySelector(sel);

        const statusSelect = $("#status-select");
        const statusSave = $("#status-save");
        const statusLabel = $("#status-label");
        const inlineMsg = $("#inline-msg");

        const deleteBtn = $("#delete-btn");
        const confirmRow = $("#confirm-row");
        const cancelDel = $("#cancel-del");
        const confirmDel = $("#confirm-del");

        // Status selector logic
        statusSelect.addEventListener("change", () => {
            const val = Number(statusSelect.value);
            statusSave.disabled = (val === currentStatus || !isValidStatusId(val));
        });

        statusSave.addEventListener("click", async () => {
            const newId = Number(statusSelect.value);
            if (!isValidStatusId(newId) || newId === currentStatus) return;
            statusSave.disabled = true;
            statusSelect.disabled = true;
            inlineMsg.textContent = "Записване…";

            const ok = await updateReportStatus(reportId, newId);
            if (ok) {
                updateReportStatusLocally(reportId, newId);
                statusLabel.textContent = STATUS_TEXT[newId] || statusLabel.textContent;
                inlineMsg.textContent = "Записано";
            } else {
                inlineMsg.textContent = "Грешка при запис";
            }
            statusSelect.disabled = false;
            statusSave.disabled = true; // require a new change before enabling again
            setTimeout(() => { if (inlineMsg) inlineMsg.textContent = ""; }, 3000);
        });

        // Delete logic
        deleteBtn.addEventListener("click", () => {
            confirmRow.style.display = "block";
        });

        cancelDel.addEventListener("click", () => {
            confirmRow.style.display = "none";
        });

        confirmDel.addEventListener("click", async () => {
            confirmDel.disabled = true;
            cancelDel.disabled = true;
            inlineMsg.textContent = "Изтриване…";
            const ok = await deleteReport(reportId);
            if (ok) {
                removeReportLocally(reportId);
                inlineMsg.textContent = "Изтрито";
                setTimeout(() => popup.remove(), 150);
            } else {
                inlineMsg.textContent = "Грешка при изтриване";
                confirmDel.disabled = false;
                cancelDel.disabled = false;
            }
            setTimeout(() => { if (inlineMsg) inlineMsg.textContent = ""; }, 3000);
        });
    }

    // ---------------------------- Map Init ------------------------------------
    useEffect(() => {
        if (mapRef.current) return; // initialize once

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/outdoors-v12",
            center: [25.4858, 42.7339], // Approx center of Bulgaria
            zoom: 5.4,
            pitch: 0,
            bearing: 0,
            attributionControl: false,
        });

        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

        map.on("load", () => {
            setMapLoaded(true);
            fetchServerReports();
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // ------------------------- Interaction Logic ----------------------------
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const canvas = map.getCanvas();

        function handleMouseDown(e) {
            if (!placing) return;
            if (!map.isStyleLoaded()) return;

            centerRef.current = new mapboxgl.LngLat(e.lngLat.lng, e.lngLat.lat);
            canvas.style.cursor = "crosshair";
            setLiveRadiusM(0);

            map.dragPan.disable();

            function onMove(ev) {
                if (!centerRef.current) return;
                const radius = ev.lngLat.distanceTo(centerRef.current); // meters
                setLiveRadiusM(radius);
                setTempCircle(centerRef.current, radius);
            }

            function finish(ev) {
                if (centerRef.current && ev && ev.lngLat) {
                    const radius = ev.lngLat.distanceTo(centerRef.current);
                    setLiveRadiusM(radius);
                    appendSavedCircle(centerRef.current, radius);
                    reportCircle(centerRef.current, radius);
                }
                map.off("mousemove", onMove);
                map.off("mouseup", finish);
                window.removeEventListener("mouseup", finish);
                map.dragPan.enable();
                canvas.style.cursor = "";
                setPlacing(false);
                centerRef.current = null;
                clearTempCircle();
                setLiveRadiusM(0);
            }

            map.on("mousemove", onMove);
            map.on("mouseup", finish);
            window.addEventListener("mouseup", finish);
        }

        if (placing) {
            canvas.style.cursor = "crosshair";
            map.on("mousedown", handleMouseDown);
        } else {
            canvas.style.cursor = "";
            map.off("mousedown", handleMouseDown);
        }

        return () => {
            map.off("mousedown", handleMouseDown);
            canvas.style.cursor = "";
        };
    }, [placing]);

    const startPlacing = () => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return;
        centerRef.current = null;
        clearTempCircle();
        setLiveRadiusM(0);
        setPlacing(true);
    };

    const clearAll = () => {
        clearTempCircle();
        clearAllSaved();
    };

    const formatMeters = (m) => {
        if (!m || m <= 0) return "";
        if (m < 1000) return `${Math.round(m)} m`;
        const km = m / 1000;
        return `${km.toFixed(km < 10 ? 2 : 1)} km`;
    };

    // ------------------------------ Tiny Tests --------------------------------
    // Lightweight runtime checks for helpers; logs to console (no network calls here)
    useEffect(() => {
        // Existing tests ----------------------------
        const p = buildReportPayload({ lng: 25.12345, lat: 42.98765 }, 1234.6);
        if (p.geo_x === 25.12345 && p.geo_y === 42.98765 && p.radius === 1235) {
            console.debug("✅ buildReportPayload ok");
        } else {
            console.error("❌ buildReportPayload failed", p);
        }

        const p2 = buildReportPayload({ lng: 25, lat: 42 }, -15);
        if (p2.radius === 0) console.debug("✅ negative radius clamped");
        else console.error("❌ negative radius not clamped", p2);

        const auth = `Bearer ${JWT}`;
        if (auth.startsWith("Bearer ") && auth.length > 20) {
            console.debug("✅ Authorization header assembled");
        } else {
            console.error("❌ Authorization header malformed", auth);
        }

        if (SERVER_URL.endsWith("/reports")) console.debug("✅ URL path correct (/reports)");
        else console.error("❌ URL should end with /reports", SERVER_URL);

        const p3 = buildReportPayload({ lng: "24.5", lat: "42.7" }, "2000.2");
        if (typeof p3.geo_x === "number" && typeof p3.geo_y === "number" && typeof p3.radius === "number") {
            console.debug("✅ payload types are numbers");
        } else {
            console.error("❌ payload types wrong", p3);
        }

        const d1 = parseResponseText(200, "OK", JSON.stringify({ message: "created" }));
        const d2 = parseResponseText(400, "Bad Request", JSON.stringify({ error: "missing" }));
        const d3 = parseResponseText(204, "No Content", "");
        if (d1 === "created" && d2 === "missing" && d3 === "No Content") console.debug("✅ response parser");
        else console.error("❌ response parser failed", { d1, d2, d3 });

        // New tests for server features & status colors ---------
        try {
            const sample = {
                id: 14,
                lat: 42.108904998993495,
                lng: 24.230623090687914,
                radius: 804,
                statusId: 2,
                statusText: "Под контрол",
                latestStatusId: 2,
            };
            const feat = buildServerFeature(sample);
            if (feat?.geometry?.type === "Polygon" && feat.properties?.id === 14 && feat.properties?.radius_m === 804) {
                console.debug("✅ buildServerFeature ok");
            } else {
                console.error("❌ buildServerFeature failed", feat);
            }
            if (serverStatusColor(4) === "#e67e22" && serverStatusColor(3) === "#27ae60" && serverStatusColor(2) === "#3498db") {
                console.debug("✅ status color mapping ok");
            } else {
                console.error("❌ status color mapping wrong", STATUS_COLOR);
            }

            // Extra: dummy function existence tests
            if (typeof reportCircle === "function" && typeof fetchServerReports === "function") {
                console.debug("✅ network call functions exist");
            } else {
                console.error("❌ network call functions missing");
            }

            // New tests for local mutation helpers
            const before = { type: "FeatureCollection", features: [buildServerFeature(sample)] };
            setServerCollection(before);
            updateReportStatusLocally(14, 3);
            const after1 = getServerCollection();
            const changed = after1.features.find((f) => f.properties.id === 14);
            if (changed && changed.properties.statusId === 3) console.debug("✅ local status update ok");
            else console.error("❌ local status update failed");
            removeReportLocally(14);
            const after2 = getServerCollection();
            if (!after2.features.find((f) => f.properties.id === 14)) console.debug("✅ local delete ok");
            else console.error("❌ local delete failed");
        } catch (e) {
            console.error("❌ tests for server features threw", e);
        }
    }, []);

    return (
        <div style={{ width: "98vw", height: "100vh", position: "relative" }}>
            {/* Map container */}
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

            {/* UI overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    display: "flex",
                    gap: 8,
                    zIndex: 1,
                }}
            >
                <button
                    onClick={startPlacing}
                    disabled={!mapLoaded || placing}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        background: placing ? "#eee" : "#fff",
                        cursor: placing ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        fontWeight: 600,
                    }}
                >
                    {placing ? "Click center, then drag…" : "Place radius"}
                </button>

                <button
                    onClick={clearAll}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        background: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        fontWeight: 600,
                    }}
                >
                    Clear all
                </button>
            </div>

            {/* Live radius badge */}
            {placing && liveRadiusM > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 1,
                        background: "#fff",
                        border: "1px solid #ddd",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontWeight: 700,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                >
                    Radius: {formatMeters(liveRadiusM)}
                </div>
            )}
        </div>
    );
}
