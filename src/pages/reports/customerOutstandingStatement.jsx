import { useRef } from "react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatRs } from "../../utils/currencyFormat";
// import { formatNumber } from "../../utils/numberFormat";
import { FaRegFilePdf, FaFileExcel } from "react-icons/fa";
import { LuPrinter } from "react-icons/lu";
import { RiArrowGoBackFill } from "react-icons/ri";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CustomerOutstandingStatement() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();

  const { customer, outstandingData = [], overDuesData = {} } = location.state || {};

  const {
    currentMonth = 0,
    over30days = 0,
    over60days = 0,
    over90days = 0,
    over120days = 0,
    overTotal = 0,
  } = overDuesData || {};

  const isValidData =
    customer &&
    Array.isArray(outstandingData) &&
    outstandingData.length > 0;

  const formatNumber = (value) =>
    (value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });    

  const handleDownloadPDF = () => {
    if (!isValidData) return;
    const element = printRef.current;
    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
    const options = {
      margin: 0.5,
      filename: `${customer?.name}_Outstanding_Statement_${today}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(element).set(options).save();
  };

  const handlePrint = () => {
    if (!isValidData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Outstanding Statement</title>
          <style>
            body { font-family: Arial; font-size: 12px; padding: 20px; }
            h2 { text-align: center; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 5px; text-align: right; }
            th { background-color: #f0f0f0; }
            td:first-child, th:first-child { text-align: left; }
            .summary { margin-top: 15px; text-align: right; font-weight: bold; }
            .summary span { margin-right: 20px; }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handleDownloadExcel = () => {
    if (!isValidData) return;

    // Prepare data for Excel export
    const dataForExcel = outstandingData.map(t => ({
      Date: t.date || "-",
      "Ref No": t.trxId || "-",
      "Trx.Type": t.type || "-",
      Description: t.reference || "-",
      "Invoice Amount": t.trxAm ?? 0,
      "Due Amount": t.dueAm ?? 0,
      "Age (days)": t.overDueDays ?? 0,
    }));

    // Add summary row at the bottom
    dataForExcel.push({
      Date: "",
      "Ref No": "",
      "Trx.Type": "",
      Description: "Total",
      "Invoice Amount": outstandingData.reduce((sum, t) => sum + (t.trxAm ?? 0), 0),
      "Due Amount": outstandingData.reduce((sum, t) => sum + (t.dueAm ?? 0), 0),
      "Age (days)": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Statement");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const today = new Date().toISOString().split("T")[0];

    saveAs(blob, `${customer?.name}_Outstanding_Statement_${today}.xlsx`);
  };

  if (!isValidData) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <p className="text-red-500">No customer data found for this report.</p>
        <Link
          to="/dashboard/customers/outstanding"
          className="mt-2 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <RiArrowGoBackFill className="inline mr-1" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      {/* Buttons */}
      <div className="flex justify-end gap-4 mb-4">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          title="Download as PDF"
        >
          <FaRegFilePdf className="w-5 h-5" />
          PDF
        </button>
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2"
          title="Download as Excel"
        >
          <FaFileExcel className="w-5 h-5" />
          Excel
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          title="Print"
        >
          <LuPrinter className="w-5 h-5" />
          Print
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          title="Go Back"
        >
          <RiArrowGoBackFill className="w-5 h-5" />
          Back
        </button>
      </div>

      {/* Report Content */}
      <div ref={printRef}>
        <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
          <strong>CF Foods Ceylon Pvt Ltd</strong>
        </h1>
        <h1 style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
          <strong>No.123, Hiriwadunna Kegalle. | Tel: 077 206 9430</strong>
        </h1>    
         <hr style={{ margin: "10px 0" }} />   
                  
        <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
          <strong>Statement of Outstanding</strong>
        </h1>
        <p style={{ textAlign: "center" }}>
          <strong>
            As At: {new Date().toLocaleDateString()}
          </strong>
        </p>        

        <p><strong>{[customer?.title, customer?.businessName].filter(Boolean).join(" ")}</strong></p>
        <p>{customer?.address || "N/A"}</p>
        <p>Customer ID: {customer?.customerId || "N/A"}</p>
        <hr style={{ margin: "10px 0" }} />  

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontWeight: "bold" }}>Date</th>
              <th style={{ textAlign: "left", fontWeight: "bold" }}>Ref No</th>
              <th style={{ textAlign: "left", fontWeight: "bold" }}>Trx.Type</th>
              <th style={{ textAlign: "left", fontWeight: "bold" }}>Description</th>
              <th style={{ textAlign: "right", fontWeight: "bold" }}>Invoice Amount</th>
              <th style={{ textAlign: "right", fontWeight: "bold" }}>Due Amount</th>
              <th style={{ textAlign: "right", fontWeight: "bold" }}>Age (days)</th>
            </tr>
          </thead>
          <tbody>
            {outstandingData.map((t, idx) => (
              <tr key={t.trxId || idx}>
                <td style={{ textAlign: "left" }}>{t.date || "-"}</td>
                <td style={{ textAlign: "left" }}>{t.trxId || "-"}</td>
                <td style={{ textAlign: "left" }}>{t.type || "-"}</td>
                <td style={{ textAlign: "left" }}>{t.reference || "-"}</td>
                <td style={{ textAlign: "right" }}>{formatNumber(t.trxAm || 0)}</td>
                <td style={{ textAlign: "right" }}>{formatNumber(t.dueAm || 0)}</td>
                <td style={{ textAlign: "right" }}>{t.overDueDays || 0} days</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary" style={{ marginTop: "10px" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", textAlign: "center", fontSize: "12px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Current Month</th>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Over 30 Days</th>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Over 60 Days</th>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Over 90 Days</th>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Over 120 Days</th>
                <th style={{ border: "1px solid #ccc", padding: "6px" }}>Total Overdue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{formatRs(currentMonth)}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{formatRs(over30days)}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{formatRs(over60days)}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{formatRs(over90days)}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{formatRs(over120days)}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px", fontWeight: "bold" }}>{formatRs(overTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ textAlign: "left", fontSize: "12px", marginTop: "10px" }}>
            We would appreciate your prompt payment. Any discrepancies in this statement 
            should be reported to us within 10 days. This is a computer-generated statement 
            and does not require a signature. It is considered final and official.
        </p>
        <p style={{ textAlign: "right", fontSize: "10px", marginTop: "10px" }}>
          Printed on: {new Date().toLocaleDateString()}
        </p>

      </div>
    </div>
  );
}
