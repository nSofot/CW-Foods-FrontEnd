import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useCustomerOutstanding } from "./useCustomerOutstanding";
import { over } from "lodash";

/**
 * Custom hook to check customer eligibility
 * @param {string} customerId
 * @param {string} token - auth token
 */
export function useCustomerEligibility(customerId, token) {
    const [status, setStatus] = useState({
        isLoading: true,
        isActive: false,
        balanceOk: false,
        overdueOk: false,
        customer: null,
    });

    useEffect(() => {
        if (!customerId) return;

        const fetchCustomerData = async () => {
            setStatus((prev) => ({ ...prev, isLoading: true }));

            try {
                // Fetch customer info
                const resCustomer = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/customer/${customerId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const customer = resCustomer.data;

                // Check if active
                const isActive = customer.isActive;

                // Check balance vs credit limit
                const balanceOk = ( customer.balance + customer.chequeBalance ) < customer.creditLimit;

                // Check last overdue transaction
                let overdueOk = true;
                let overdueDays;
                switch (customer.creditPeriod) {
                    case "None":
                        overdueDays = 0;
                        break;
                    case "7 days":
                        overdueDays = 7;
                        break;
                    case "14 days":
                        overdueDays = 14;
                        break;
                    case "30 days":
                        overdueDays = 30;
                        break;
                    default:
                        overdueDays = 0;
                }

                if (customer.balance > 0) {
                    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/customerTransactions/pending/${customerId}`);
                    const invoices = res.data.sort((b, a) => new Date(b.createdAt) - new Date(a.createdAt)) ;

                    if (invoices.length > 0) {
                        const lastTransaction = new Date(invoices[0].createdAt);
                        const now = new Date();
                        const daysOverdue = Math.floor((now - lastTransaction) / (1000 * 60 * 60 * 24));
                        overdueOk = daysOverdue <= overdueDays;
                    }                
                }

                setStatus({
                    isLoading: false,
                    isActive,
                    balanceOk,
                    overdueOk,
                    customer,
                });
            } catch (err) {
                console.error("Failed to fetch customer eligibility", err);
                toast.error("Failed to check customer eligibility.");
                setStatus((prev) => ({ ...prev, isLoading: false }));
            }
        };

        fetchCustomerData();
    }, [customerId, token]);

    return status;
}
