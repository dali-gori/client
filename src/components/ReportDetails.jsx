import { useState } from "react";
import { useSelectedReport } from "../contexts/SelectedReportContext";
import FireIcon from "./FireIcon";
import { endpoints } from "../api/endpoints";

export default function ReportDetailsContainer() {
    const { selectedReport, setSelectedReport } = useSelectedReport();
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState("");
    const [phone, setPhone] = useState("");
    const [names, setNames] = useState("");

    if (!selectedReport) {
        return (
            <div id="reportDetails" style={{ padding: "12px", color: "#666" }}>
                <div className="report-details-container">
                    Няма избран пожар.
                </div>
            </div>
        );
    }

    const color =
        selectedReport.latestId === 1 || selectedReport.latestId === 4
            ? "#FF7410"
            : selectedReport.latestId === 2
                ? "#0095FF"
                : "#3AB549";

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem) return;

        const payload = {
            itemId: Number(selectedItem),
            quantity: Number(quantity),
            names,
            phoneNumber: phone,
        };

        try {
            const res = await fetch(endpoints.createItemDonation, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                console.error("Donation failed:", error);
                toast.success("Неуспешно изпращане: " + (error.message || "Грешка"));
                return;
            }

            const data = await res.json();

            let newReport = selectedReport;
            newReport.items.map((e) => {
                if (e.id === data.item.id) e.quantity = data.item.quantity
            })
            setSelectedReport(newReport);

            toast.success("Успешно изпратено! Благодарим за помощта ❤️");
            setShowModal(false);
            setSelectedItem("");
            setQuantity(1);
            setNames("");
            setPhone("");
        } catch (err) {
            console.error("Request error:", err);
            toast.error("Грешка при връзка със сървъра.");
        }
    };

    return (
        <div
            id="reportDetails"
        >
            <div className="report-details-container">
                <div>
                    <h1><span>Пожар - {selectedReport.statusText ?? "—"}</span> <FireIcon color={color} width={29} /></h1>
                </div>
                <div className="data-wrapper">
                    <div>
                        <h2>История:</h2>
                        <ul className="history">
                            {selectedReport.statusHistory.map((h, idx) => (
                                <li key={idx} className="history-menu-item">
                                    {h.reportStatus} <br /> {new Date(h.created_at).toLocaleString()}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Необходимости:</h2>
                        <ul className="items">
                            {selectedReport.items.length ? selectedReport.items.map((h, idx) => (
                                <li key={idx}>
                                    <div className="large">
                                        {h.name}
                                    </div>
                                    <div className="small">
                                        x{h.quantity}
                                    </div>
                                </li>
                            )) :
                                <>
                                    <li className="empty">
                                        <div className="large">
                                            <i>Няма въведени</i>
                                        </div>
                                    </li>
                                </>}
                        </ul>
                        <button disabled={!selectedReport.items.length} type="button" href="#" className="accent-button" onClick={() => setShowModal(true)}>Помогни</button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // prevent closing on inner click
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setShowModal(false)}
                        >
                            ✕
                        </button>
                        <h2>Запиши се и помогни</h2>

                        <form className="help-form" onSubmit={onFormSubmit}>
                            {/* Item select */}
                            <label className="form-label">
                                Избери материал:
                                <select
                                    className="form-select"
                                    value={selectedItem}
                                    onChange={(e) => { setSelectedItem(e.target.value) }}
                                >
                                    <option value="">— избери —</option>
                                    {selectedReport.items.map((it, idx) => (
                                        <option key={idx} value={it.id}>
                                            {it.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedItem && (
                                <div className="item-quantity">
                                    Нужно количество: {" "}
                                    {
                                        selectedReport.items.find((it) => it.id == selectedItem)?.quantity ??
                                        "—"
                                    }
                                </div>
                            )}

                            {/* Phone input */}
                            <label className="form-label">
                                Количество:
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Въведи количество"
                                    min={1}
                                />
                            </label>

                            {/* Phone input */}
                            <label className="form-label">
                                Телефон:
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+359 xxx xxx xxx"
                                />
                            </label>

                            {/* Names input */}
                            <label className="form-label">
                                Имена:
                                <input
                                    type="text"
                                    className="form-input"
                                    value={names}
                                    onChange={(e) => setNames(e.target.value)}
                                    placeholder="Въведете три имена"
                                />
                            </label>

                            <button type="submit" href="#" className="accent-button" onClick={() => setShowModal(true)}>Изпрати</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}