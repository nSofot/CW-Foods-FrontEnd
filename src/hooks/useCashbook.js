import { useEffect, useState } from "react";
import axios from "axios";

/**
 * React hook that returns a cash‑book ready for display.
 *
 * @param {string} accountId   – account number (e.g. "325‑0001")
 * @param {string|Date} fromDate – inclusive range start
 * @param {string|Date} toDate   – inclusive range end
 *
 * @returns {object} { cashbook, loading, error }
 */
export function useCashbook(accountId, fromDate, toDate) {
  const [cashbook, setCashbook] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    // wait until all required props are present
    if (!accountId || !fromDate || !toDate) return;

    const fetchCashbook = async () => {
      setLoading(true);
      setError(null);

      try {
        /* 1️⃣  Load every transaction for the account */
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/accountTransactions/${encodeURIComponent(accountId)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        /* 2️⃣  Transform + filter + balance in one go */
        const rows = transformCashbook(data, fromDate, toDate);

        setCashbook(rows);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch cash‑book data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCashbook();
  }, [accountId, fromDate, toDate]);

  return { cashbook, loading, error };
}

/* ---------------------------------------------------------------------- */
/* Helper: massage the raw data into table rows                           */
/* ---------------------------------------------------------------------- */
function transformCashbook(data, fromDate, toDate) {
  /* 🔹 Normalise the range once */
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);                   // 00:00:00
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);                // 23:59:59

  /* 🔹 Split data into “before start” and “in range” */
  const beforeStart = [];
  const inRange     = [];

  for (const trx of data) {
    const d = new Date(trx.trxDate);
    if (d < start)      beforeStart.push(trx);
    else if (d <= end)  inRange.push(trx);      // ignore > end
  }

  /* 🔹 Balance B/F = net value of everything prior to fromDate */
  const bfAmount = beforeStart.reduce((sum, t) =>
    sum + (t.trxType === "Debit" ?  t.trxAmount
                                 : -t.trxAmount), 0);

  let rows = [];
  let running = bfAmount;

  // ✅ Only add Balance B/F row if non-zero
  if (bfAmount !== 0) {
    const bfRow = makeRow({
      trxDate   : start,
      trxId     : "B/F",
      transactionType   : "Balance B/F",
      description: "As At " + start.toLocaleDateString("en-GB"),
      reference : "-",
      trxType   : bfAmount >= 0 ? "Debit" : "Credit",
      trxAmount : Math.abs(bfAmount),
      createdAt : start,
    }, bfAmount);

    rows.push(bfRow);
  }

  /* 🔹 Map in-range rows, sorted ascending, with running balance */
  const mapped = inRange
    .sort((a, b) => new Date(a.trxDate) - new Date(b.trxDate))
    .map(trx => {
      running += trx.trxType === "Debit" ?  trx.trxAmount
                                         : -trx.trxAmount;
      return makeRow(trx, running);
    });

  /* 🔹 Reverse so newest appears first (UI preference) */
  return [...rows, ...mapped].reverse();
}

/* ---------------------------------------------------------------------- */
/* Helper: build one display‑ready row                                    */
/* ---------------------------------------------------------------------- */
function makeRow(trx, runningBalance) {
  const isDebit = trx.trxType === "Debit";

  return {
    date       : new Date(trx.trxDate).toLocaleDateString("en-GB"),     // dd/mm/yyyy
    trxId      : trx.trxId,
    trxType    : trx.transactionType || "",
    description: trx.description ||  "",
    reference  : trx.reference || "",
    debit      : isDebit ?  trx.trxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })
                         :  "0.00",
    credit     : isDebit ?  "0.00"
                         :  trx.trxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    balance    : runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    createdAt  : new Date(trx.createdAt),       // keep as Date if you need sorting
  };
}
