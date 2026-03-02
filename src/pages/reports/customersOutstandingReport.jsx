import { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchCustomerOutstanding } from "../../hooks/useCustomerOutstanding.js";
import { FaRegFilePdf, FaFileExcel } from "react-icons/fa"; // Added FaFileExcel here
import { LuPrinter } from "react-icons/lu";
import { RiArrowGoBackFill } from "react-icons/ri";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function CustomersOutstandingPDF() {
  const location = useLocation();
  const navigate = useNavigate();
  const customers = Array.isArray(location.state) ? location.state : [];
  const [outstandings, setOutstandings] = useState({});
  const [loading, setLoading] = useState(true);

  const [toDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  useEffect(() => {
    const fetchOutstandingData = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          customers.map((c) => fetchCustomerOutstanding(c.customerId))
        );

        const map = {};
        results.forEach((res, i) => {
          map[customers[i].customerId] = res;
        });
        setOutstandings(map);
      } catch (err) {
        // toast.error("Failed to fetch outstanding balances");
        console.error("Failed to fetch outstanding balances", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutstandingData();
  }, [customers]);

  const format = (value) =>
    (value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

  // Totals calculation (fix keys to match your data)
  const totals = {
    current: 0,
    over30: 0,
    over60: 0,
    over90: 0,
    over120: 0,
    total: 0,
  };

  customers.forEach((c) => {
    const o = outstandings[c.customerId] || {};
    totals.current += Number(o.current || 0);
    totals.over30 += Number(o.over30 || 0);
    totals.over60 += Number(o.over60 || 0);
    totals.over90 += Number(o.over90 || 0);
    totals.over120 += Number(o.over120 || 0);
    totals.total += Number(o.total || 0);
  });

  const printRef = useRef();

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    const element = printRef.current;

    // Clone and style adjustments for PDF
    const clone = element.cloneNode(true);
    clone.style.fontFamily = "Arial, sans-serif";
    clone.style.padding = "20px";
    clone.style.maxWidth = "800px";
    clone.style.fontSize = "12px";
    clone.querySelectorAll("*").forEach((el) => {
      el.style.margin = "0";
      el.style.padding = "4px";
      el.style.border = "1px solid #ccc";
    });

    const wrapper = document.createElement("div");
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    wrapper.style.display = "none";

    html2pdf()
      .set({
        margin: 0.5,
        filename: `Customers_closing_balances_asat_${toDate.replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "_")}.pdf`,
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
    if (!printRef.current) return;

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

  // Excel download handler
  const handleDownloadExcel = () => {
    if (loading || customers.length === 0) return;

    const dataForExcel = customers.map((customer, idx) => {
      const o = outstandings[customer.customerId] || {};
      return {
        "#": idx + 1,
        "ID": customer.customerId,
        "Name": customer.businessName,
        "Current": o.current ?? 0,
        "30+ Days": o.over30 ?? 0,
        "60+ Days": o.over60 ?? 0,
        "90+ Days": o.over90 ?? 0,
        "120+ Days": o.over120 ?? 0,
        "Total": o.total ?? 0,
      };
    });

    // Add totals row
    dataForExcel.push({
      "#": "",
      "ID": "",
      "Name": "Total",
      "Current": totals.current,
      "30+ Days": totals.over30,
      "60+ Days": totals.over60,
      "90+ Days": totals.over90,
      "120+ Days": totals.over120,
      "Total": totals.total,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Balances");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `Customers_Closing_Balances_asAt_${toDate}.xlsx`);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
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
          disabled={loading}
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

      <div ref={printRef}>
        <h1 style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold" }}>CW Foods Ceylon Pvt Ltd</h1>
        <h1 style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold" }}>Customer Closing Balances and Age Analysis</h1>
        <p style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold" }}>
          <strong>As At:</strong> {toDate}
        </p>

        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontWeight: "bold", fontSize: "10px" }}>#</th>
              <th style={{ textAlign: "left", fontWeight: "bold", fontSize: "10px" }}>ID</th>
              <th style={{ textAlign: "left", fontWeight: "bold", fontSize: "10px" }}>Name</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>Current</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>30+ Days</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>60+ Days</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>90+ Days</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>120+ Days</th>
              <th style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {customers.map((customer, index) => {
              const data = outstandings[customer.customerId] || {};
              return (
                <tr key={customer.customerId || index}>
                  <td style={{ textAlign: "left", fontSize: "10px" }}>{index + 1}</td>
                  <td style={{ textAlign: "left", fontSize: "10px" }}>{customer.customerId}</td>
                  <td style={{ textAlign: "left", fontSize: "10px" }}>{customer.businessName}</td>
                  <td style={{ textAlign: "right", fontSize: "10px" }}>{format(data.current)}</td>
                  <td style={{ textAlign: "right", fontSize: "10px" }}>{format(data.over30)}</td>
                  <td style={{ textAlign: "right", fontSize: "10px"}}>{format(data.over60)}</td>
                  <td style={{ textAlign: "right", fontSize: "10px" }}>{format(data.over90)}</td>
                  <td style={{ textAlign: "right", fontSize: "10px" }}>{format(data.over120)}</td>
                  <td style={{ textAlign: "right", fontSize: "10px" }}>{format(data.total)}</td>
                </tr>
              );
            })}

            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                  Loading data...
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                Total
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.current)}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.over30)}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.over60)}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.over90)}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.over120)}
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>
                {format(totals.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p style={{ textAlign: "right", fontSize: "10px", marginTop: "10px" }}>
          Printed on: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
