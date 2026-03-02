import { useRef } from "react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatRs } from "../../utils/currencyFormat";
// import { formatNumber } from "../../utils/numberFormat";
import { FaRegFilePdf } from "react-icons/fa6";
import { FaRegFileExcel } from "react-icons/fa";
import { LuPrinter } from "react-icons/lu";
import { RiArrowGoBackFill } from "react-icons/ri";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CustomerStatementReport() {
    const printRef = useRef();
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure state passed via Link
    const { customer, statementData = [], overDuesData = {}, fromDate = "", toDate = "" } = location.state || {};

    const {
        currentMonth = 0,
        over30days = 0,
        over60days = 0,
        over90days = 0,
        over120days = 0,
        overTotal = 0,
    } = overDuesData || {};

    const formatNumber = (value) =>
        (value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const isValidData = customer && statementData.length > 0;

    const handleDownloadPDF = () => {
        if (!printRef.current || !isValidData) return;

        const element = printRef.current;
        const clone = element.cloneNode(true);

        clone.style.fontFamily = "Arial, sans-serif";
        clone.style.padding = "20px";
        clone.style.maxWidth = "800px";
        clone.style.fontSize = "12px";

        clone.querySelectorAll("*").forEach(el => {
            el.style.margin = "0";
            el.style.padding = "4px";
            el.style.border = "1px solid #ccc";
        });

        const wrapper = document.createElement("div");
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);
        wrapper.style.display = "none";

        const today = new Date().toISOString().split("T")[0];

        html2pdf()
          .set({
              margin: 0.5,
              filename: `Customer_Statement_${customer?.name?.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${today}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            })
              .from(clone)
              .save()
              .finally(() => {
                  wrapper.remove();
            });
        };

      const handlePrint = () => {
          if (!printRef.current || !isValidData) return;

          const printContent = printRef.current.innerHTML;
          const printWindow = window.open("", "", "height=900,width=1200");

          printWindow.document.write(`
              <html>
                  <head>
                      <title>Customer Statement</title>
                      <style>
                          body {
                              font-family: Arial, sans-serif;
                              padding: 20px;
                              font-size: 12px;
                          }
                          table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-top: 10px;
                          }
                          table, th, td {
                              border: 1px solid #ccc;
                              padding: 4px;
                              text-align: left;
                          }
                          th {
                              background-color: #f0f0f0;
                          }
                          td:last-child {
                              text-align: right;
                          }
                      </style>
                  </head>
                  <body>
                      ${printContent}
                  </body>
              </html>
          `);

          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      };

      const handleDownloadExcel = () => {
          if (!isValidData) return;

          // Prepare data for Excel - flatten and format as needed
          const dataForExcel = statementData.map(row => ({
              Date: row.date,
              ID: row.trxId,
              trxType: row.trxType,
              Description: row.description,
              Debit: row.debit ?? 0,
              Credit: row.credit ?? 0,
              Balance: row.balance ?? 0,
          }));

          // Create worksheet
          const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

          // Create workbook and add worksheet
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Statement");

          // Generate Excel buffer
          const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

          // Save file
          const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
          const today = new Date().toISOString().split("T")[0];
          saveAs(blob, `Customer_Statement_${customer?.name?.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${today}.xlsx`);
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
                      <FaRegFileExcel className="w-5 h-5" />
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

              {/* Statement Content */}
              <div ref={printRef}>
                <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
                  <strong>CF Foods Ceylon Pvt Ltd</strong>
                </h1>
                <h1 style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold" }}>
                  <strong>No.123, Hiriwadunna Kegalle. | Tel: 077 206 9430</strong>
                </h1>    
                <hr style={{ margin: "10px 0" }} />   

                <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
                  <strong>Statement of Account</strong>
                </h1>
                <p style={{ textAlign: "center" }}>
                  <strong>
                    for the period {fromDate} - {toDate}
                  </strong>
                </p>
                <p><strong>{customer?.businessName}</strong></p>
                <p><strong>{customer?.address}</strong></p>

                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", fontWeight: "bold" }}>Date</th>
                      <th style={{ textAlign: "left", fontWeight: "bold" }}>ID</th>
                        <th style={{ textAlign: "left", fontWeight: "bold" }}>Transaction Type</th>
                      <th style={{ textAlign: "left", fontWeight: "bold" }}>Description</th>
                      <th style={{ textAlign: "right", fontWeight: "bold" }}>Debit</th>
                      <th style={{ textAlign: "right", fontWeight: "bold" }}>Credit</th>
                      <th style={{ textAlign: "right", fontWeight: "bold" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.map((row, i) => (
                      <tr key={row.trxId || i}>
                        <td style={{ textAlign: "left" }}>{row.date}</td>
                        <td style={{ textAlign: "left" }}>{row.trxId}</td>
                        <td style={{ textAlign: "left" }}>{row.trxType}</td>
                        <td style={{ textAlign: "left" }}>{row.description}</td>
                        <td style={{ textAlign: "right" }}>{formatNumber(row.debit)}</td>
                        <td style={{ textAlign: "right" }}>{formatNumber(row.credit)}</td>
                        <td style={{ textAlign: "right" }}>{formatNumber(row.balance)}</td>
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
