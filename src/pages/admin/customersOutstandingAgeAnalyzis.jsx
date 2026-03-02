import axios from 'axios';
import Modal from "react-modal";
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineHome } from "react-icons/hi2";
import { LuPrinter } from "react-icons/lu";
import { RiArrowGoBackFill } from "react-icons/ri";

import LoadingSpinner from "../../components/loadingSpinner";
import { fetchCustomerOutstanding } from "../../hooks/useCustomerOutstanding.js";
import Statement from "../../components/viewCustomerStatement";
import Outstanding from "../../components/viewCustomerOutstaning";

export default function CustomersOutstandingAgeAnalyzis() {
    // 🔄 Core States
    const [customers, setCustomers] = useState([]);
    const [outstandings, setOutstandings] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // 🔍 Search
    const [searchTerm, setSearchTerm] = useState('');

    // 🔘 Modal & Tabs
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Statement');
    const [activeRecord, setActiveRecord] = useState(null);

    // 🧾 Statement Data
    const [statementData, setStatementData] = useState([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // 💸 Outstanding Summary Data
    const [outstandingData, setOutstandingData] = useState({});
    const [overDuesData, setOverDuesData] = useState({});

    const statementRef = useRef();
    const navigate = useNavigate();

    // 🚀 Fetch Customers
    useEffect(() => {
        const fetchCustomers = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/customer`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setCustomers(res.data);
            } catch (err) {
                toast.error("Failed to fetch customers");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    
    // 📊 Fetch Outstandings
    useEffect(() => {
        const fetchOutstandingData = async () => {
            try {
                const results = await Promise.all(
                    customers.map((c) => fetchCustomerOutstanding(c.customerId))
                );
                const map = {};
                results.forEach((res, i) => {
                    map[customers[i].customerId] = res;
                });
                setOutstandings(map);
            } catch {
                toast.error("Failed to fetch outstanding balances");
            }
        };
        if (customers.length) fetchOutstandingData();
    }, [customers]);

    // 🔍 Filtered Customers
    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const format = value =>
        (value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    // 📄 PDF/Print Path and State
    const isStatement = activeTab === 'Statement';
    const goPath = isStatement
        ? "/admin/customer-statement"
        : "/admin/customer-outstanding-statement";
    const reportState = isStatement
        ? { customer: activeRecord, statementData, overDuesData, fromDate, toDate }
        : { customer: activeRecord, outstandingData, overDuesData, toDate };

        
    return (
        <div className="hidden md:flex w-full h-full flex-col bg-gray-100 rounded-md p-4">
            {/* 📋 Page Header */}
            <div className='flex justify-between items-center mb-4'>
                <div className='w-[50%] flex flex-col'>
                    <h1 className='text-xl font-semibold text-gray-800'>🧾 Customers Closing Balances and Age Analysis</h1>
                    <p className='text-sm text-gray-600'>Analyze Customer Balances by Age Bracket and Overdue Periods</p>
                </div>
                <div className='w-[50%] flex justify-end gap-6'>
                    <Link
                        to="/admin/customers-oustanding"
                        state={customers}
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="Print Report"
                    >
                        <LuPrinter className="w-5 h-5" />
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="Go to Home"
                    >
                        <HiOutlineHome className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* 🔍 Search Input */}
            <div className="mb-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by Customer ID, Name, Address or Mobile Number ...."
                    className="w-full text-sm p-2 border border-gray-300 rounded"
                />
            </div>

            {/* 📊 Table */}
            <div className="h-[79%]">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <CustomerTable
                        customers={filteredCustomers}
                        outstandings={outstandings}
                        setIsModalOpen={setIsModalOpen}
                        setActiveRecord={setActiveRecord}
                    />
                )}
            </div>


            {/* 🔍 Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Customer Details"
                overlayClassName="fixed inset-0 bg-[#00000099] flex items-center justify-center z-50"
                className="max-w-5xl w-full h-[95%] bg-white p-6 rounded-lg shadow-2xl border-4 border-gray-400"
            >
                {activeRecord && (
                    <div className="space-y-4">
                        {/* Header & Actions */}
                        <div className="w-full flex justify-between items-center pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">👤 Customer Outstanding</h2>
                            <div className='flex justify-end gap-3'>                         
                                <Link to={goPath} state={reportState}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" title="Print">
                                    <LuPrinter className="w-5 h-5" />
                                </Link>
                                <button onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" title="Go Back">
                                    <RiArrowGoBackFill className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <p className="text-lg font-semibold">
                            {activeRecord.title ? `${activeRecord.title} ${activeRecord.name}` : activeRecord.name}
                        </p>

                        {/* Tabs */}
                        <div className="flex border-b gap-6 text-sm font-medium text-gray-600">
                            {['Statement', 'Outstanding'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-2 ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'Statement' ? (
                            <div ref={statementRef}>
                                <Statement
                                    customerId={activeRecord.customerId}
                                    statementData={statementData}
                                    setStatementData={setStatementData}
                                    overDuesData={overDuesData}
                                    setOverDuesData={setOverDuesData}
                                    fromDate={fromDate}
                                    toDate={toDate}
                                    setFromDate={setFromDate}
                                    setToDate={setToDate}
                                />
                            </div>
                        ) : (
                            <Outstanding
                                customerId={activeRecord.customerId}
                                outstandingData={outstandings[activeRecord.customerId]}
                                overDuesData={overDuesData}
                                setOutstandingData={setOutstandingData}
                                setOverDuesData={setOverDuesData}
                                toDate={toDate}
                                setToDate={setToDate}
                            />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

// 📄 Table Subcomponent
function CustomerTable({ customers, outstandings, setIsModalOpen, setActiveRecord }) {
    const format = val => (val ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    // Totals Calculation
    const totals = {
        current: 0, over30: 0, over60: 0, over90: 0, over120: 0, total: 0
    };
    customers.forEach(c => {
        const o = outstandings[c.customerId] || {};
        totals.current += +o.current || 0;
        totals.over30 += +o.over30 || 0;
        totals.over60 += +o.over60 || 0;
        totals.over90 += +o.over90 || 0;
        totals.over120 += +o.over120 || 0;
        totals.total += +o.total || 0;
    });

    return (
        <div className="w-full h-full">
            {/* Summary */}
            <div className="flex justify-end items-center px-4 py-2 flex-wrap gap-4 text-sm text-gray-600">
                <p><strong>Count:</strong> {customers.length}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>Current:</strong> {format(totals.current)}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>30+ Days:</strong> {format(totals.over30)}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>60+ Days:</strong> {format(totals.over60)}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>90+ Days:</strong> {format(totals.over90)}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>120+ Days:</strong> {format(totals.over120)}</p>
                <p className='bg-gray-600 px-4 py-2 rounded text-white'><strong>Total:</strong> {format(totals.total)}</p>
            </div>

            {/* Table */}
            <div className="h-[82%] bg-white overflow-y-auto shadow">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-tableHeader text-tableHeaderText sticky top-0 z-10">
                        <tr className="font-semibold">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 text-right">Current</th>
                            <th className="px-4 py-3 text-right">Over 30</th>
                            <th className="px-4 py-3 text-right">Over 60</th>
                            <th className="px-4 py-3 text-right">Over 90</th>
                            <th className="px-4 py-3 text-right">Over 120</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {customers.map((c, index) => {
                            const o = outstandings[c.customerId] || {};
                            return (
                                <tr
                                    key={c.customerId || index}
                                    onClick={() => {
                                        setActiveRecord(c);
                                        setIsModalOpen(true);
                                    }}
                                    className="font-semibold cursor-pointer hover:bg-tableHover transition duration-150"
                                >
                                    <td className="px-4 py-2">{index + 1}</td>
                                    <td className="px-4 py-2">{c.customerId}</td>
                                    <td className="px-4 py-2">{c.businessName}</td>
                                    <td className="px-4 py-2 text-right">{format(o.current)}</td>
                                    <td className="px-4 py-2 text-right">{format(o.over30)}</td>
                                    <td className="px-4 py-2 text-right">{format(o.over60)}</td>
                                    <td className="px-4 py-2 text-right">{format(o.over90)}</td>
                                    <td className="px-4 py-2 text-right">{format(o.over120)}</td>
                                    <td className="px-4 py-2 text-right">{format(o.total)}</td>
                                </tr>
                            );
                        })}
                        {!customers.length && (
                            <tr>
                                <td colSpan={9} className="text-center text-gray-500 py-4">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
