import { useState } from 'react';
import { Card, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import {
    FaCalendarAlt,
    FaSearch,
    FaHandHoldingUsd,
    FaMoneyBillWave,
    FaPiggyBank,
    FaUserPlus,
    FaFileExcel,
    FaList,
    FaTimes
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

export default function DaywiseReport({ data }) {
    const [daywiseSearched, setDaywiseSearched] = useState(false);
    const [localDaywiseDateRange, setLocalDaywiseDateRange] = useState({ startDate: '', endDate: '' });
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Calculate day-wise transactions similar to how MemberwiseReport prepares its data
    const getDayWiseData = () => {
        const { startDate, endDate } = dateRange;
        if (!startDate || !endDate) return [];

        const transactions = [];

        // Add savings transactions
        data.savings.forEach(s => {
            if (s.date >= startDate && s.date <= endDate) {
                const member = data.members.find(m => m.id === s.memberId);
                const group = data.shgGroups.find(g => g.id === member?.groupId);
                const product = data.savingProducts.find(p => p.id === s.productId);
                transactions.push({
                    date: s.date,
                    type: 'Savings',
                    member: member?.name || 'Unknown',
                    memberDescription: member
                        ? `${member.name}${member.employeeCode ? ` (${member.employeeCode})` : ''}`
                        : 'Unknown',
                    groupName: group?.name || 'N/A',
                    areaName: group?.areaName || 'N/A',
                    shareNo: s.shareNo || '-',
                    transactionNo: s.id,
                    mobileNo: member?.phone || 'N/A',
                    product: product?.name || 'Unknown',
                    amount: s.amount,
                    paymentType: s.paymentType || s.paymentMode || '-',
                    memberCode: member?.employeeCode || 'N/A'
                });
            }
        });

        // Add loan repayments
        data.loanRepayments.forEach(r => {
            if (r.date >= startDate && r.date <= endDate) {
                const loan = data.loans.find(l => l.id === r.loanId);
                const member = data.members.find(m => m.id === loan?.memberId);
                const group = data.shgGroups.find(g => g.id === member?.groupId);
                transactions.push({
                    date: r.date,
                    type: 'Loan Repayment',
                    member: member?.name || 'Unknown',
                    memberDescription: member
                        ? `${member.name}${member.employeeCode ? ` (${member.employeeCode})` : ''}`
                        : 'Unknown',
                    groupName: group?.name || 'N/A',
                    areaName: group?.areaName || 'N/A',
                    shareNo: loan?.shareNo || '-',
                    transactionNo: r.id,
                    mobileNo: member?.phone || 'N/A',
                    product: 'Loan Repayment',
                    amount: r.amount,
                    paymentType: r.paymentType || r.paymentMode || '-',
                    memberCode: member?.employeeCode || 'N/A'
                });
            }
        });

        // Add loan disbursements
        data.loans.forEach(l => {
            if (l.status === 'approved' && l.approvedDate >= startDate && l.approvedDate <= endDate) {
                const member = data.members.find(m => m.id === l.memberId);
                const group = data.shgGroups.find(g => g.id === member?.groupId);
                transactions.push({
                    date: l.approvedDate,
                    type: 'Loan Disbursement',
                    member: member?.name || 'Unknown',
                    memberDescription: member
                        ? `${member.name}${member.employeeCode ? ` (${member.employeeCode})` : ''}`
                        : 'Unknown',
                    groupName: group?.name || 'N/A',
                    areaName: group?.areaName || 'N/A',
                    shareNo: l.shareNo || '-',
                    transactionNo: l.id,
                    mobileNo: member?.phone || 'N/A',
                    product: 'Loan Disbursement',
                    amount: l.amount,
                    paymentType: l.paymentType || l.paymentMode || '-',
                    memberCode: member?.employeeCode || 'N/A'
                });
            }
        });

        return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const handleSearch = () => {
        setDateRange(localDaywiseDateRange);
        setDaywiseSearched(true);
    };

    const handleClear = () => {
        setLocalDaywiseDateRange({ startDate: '', endDate: '' });
        setDateRange({ startDate: '', endDate: '' });
        setDaywiseSearched(false);
    };

    const dayData = daywiseSearched ? getDayWiseData() : [];

    const summary = dayData.reduce(
        (acc, curr) => {
            if (curr.type === 'Savings') {
                acc.collection += curr.amount;
                acc.savings += curr.amount;
            } else if (curr.type === 'Loan Repayment') {
                acc.collection += curr.amount;
                acc.recovery += curr.amount;
            } else if (curr.type === 'Loan Disbursement') {
                acc.payments += curr.amount;
                acc.newLoans += curr.amount;
            }
            return acc;
        },
        { collection: 0, payments: 0, recovery: 0, newLoans: 0, savings: 0 }
    );

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            dayData.map(t => ({
                'Transaction Date': new Date(t.date).toLocaleDateString(),
                'Area Name': t.areaName,
                'Group Name': t.groupName,
                'Share No': t.shareNo,
                'Transaction No': t.transactionNo,
                'Mobile No': t.mobileNo,
                Product: t.product,
                Amount: t.amount,
                'Payment Type': t.paymentType,
                'Member Name/Description': t.memberDescription
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        XLSX.writeFile(wb, 'daywise_report.xlsx');
    };

    return (
        <div className="fade-in">
            {/* Header + Filter/Search panel - styled like the reference image */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="align-items-center mb-3">
                        <Col>
                            <div className="d-flex align-items-center gap-2">
                                <FaList className="text-primary" />
                                <h5 className="mb-0 fw-semibold">Collection Report</h5>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="success"
                                size="sm"
                                onClick={exportToExcel}
                                disabled={!daywiseSearched || dayData.length === 0}
                            >
                                <FaFileExcel className="me-2" />
                                Export to Excel
                            </Button>
                        </Col>
                    </Row>

                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-bold text-muted mb-1">From Date</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={localDaywiseDateRange.startDate}
                                onChange={e =>
                                    setLocalDaywiseDateRange({
                                        ...localDaywiseDateRange,
                                        startDate: e.target.value
                                    })
                                }
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-bold text-muted mb-1">To Date</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={localDaywiseDateRange.endDate}
                                onChange={e =>
                                    setLocalDaywiseDateRange({
                                        ...localDaywiseDateRange,
                                        endDate: e.target.value
                                    })
                                }
                            />
                        </Col>
                        <Col md={2}>
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-100"
                                onClick={handleSearch}
                                disabled={!localDaywiseDateRange.startDate || !localDaywiseDateRange.endDate}
                            >
                                <FaSearch className="me-2" />
                                Search
                            </Button>
                        </Col>
                        <Col md={2}>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100"
                                onClick={handleClear}
                                title="Clear filters"
                            >
                                <FaTimes />
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {!daywiseSearched ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div className="mb-3 opacity-25">
                            <FaCalendarAlt size={60} />
                        </div>
                        <h5 className="text-muted mb-2">Select a date range to view reports</h5>
                        <p className="text-muted small mb-0">
                            Choose a start and end date above and click Search to view day-wise transactions
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {/* Data table - structured like the reference image */}
                    <div className="mt-2">
                        {dayData.length > 0 ? (
                            <div className="table-responsive shadow-sm">
                                <div className="excel-header">
                                    <FaList className="me-2" /> Transactions
                                </div>
                                <table className="table table-hover mb-0 excel-table bg-white">
                                    <thead>
                                        <tr>
                                            <th>Sl. No</th>
                                            <th>Area Name</th>
                                            <th>Group Name</th>
                                            <th>Share No</th>
                                            <th>Transaction Date</th>
                                            <th>Mobile No</th>
                                            <th>Transaction No</th>
                                            <th>Product</th>
                                            <th className="text-end">Amount (₹)</th>
                                            <th>Payment Type</th>
                                            <th>Member Name/Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dayData.map((transaction, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>{transaction.areaName}</td>
                                                <td>{transaction.groupName}</td>
                                                <td>{transaction.shareNo}</td>
                                                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                                <td>{transaction.mobileNo}</td>
                                                <td>{transaction.transactionNo}</td>
                                                <td>
                                                    <Badge
                                                        bg={
                                                            transaction.type === 'Savings'
                                                                ? 'success'
                                                                : transaction.type === 'Loan Repayment'
                                                                    ? 'info'
                                                                    : 'warning'
                                                        }
                                                    >
                                                        {transaction.product}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-bold">
                                                    ₹{transaction.amount.toLocaleString()}
                                                </td>
                                                <td>{transaction.paymentType}</td>
                                                <td className="fw-medium">{transaction.memberDescription}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-light fw-bold">
                                            <td colSpan="7" className="text-end">
                                                Total:
                                            </td>
                                            <td className="text-end">
                                                ₹
                                                {dayData
                                                    .reduce((sum, t) => sum + t.amount, 0)
                                                    .toLocaleString()}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="text-center py-4">
                                    <p className="text-muted mb-0">
                                        No transactions found for the selected date range
                                    </p>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
