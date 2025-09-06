// SelectedReportContext.js
import { createContext, useContext, useState } from "react";

const SelectedReportContext = createContext();

export function SelectedReportProvider({ children }) {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <SelectedReportContext.Provider value={{ selectedReport, setSelectedReport }}>
      {children}
    </SelectedReportContext.Provider>
  );
}

export function useSelectedReport() {
  return useContext(SelectedReportContext);
}
