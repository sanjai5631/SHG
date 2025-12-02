import { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import {
    FaCalendarAlt,
    FaFileExcel,
    FaFilePdf,
    FaList,
    FaTimes,
    FaEye
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DaywiseReport({ data }) {
    const [showReport, setShowReport] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    // Helper to get unique groups and members for dropdowns
    const groups = data.shgGroups || [];
    const members = data.members || [];

    // Filter members for the member dropdown based on selected group
    const filteredMembers = selectedGroupId
        ? members.filter(m => m.groupId.toString() === selectedGroupId.toString())
        : members;

    // Calculate member-wise stats based on filters
    const getReportData = () => {
        let startDate, endDate;

        if (selectedMonth) {
            const date = new Date(selectedMonth);
            startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        // Filter the main members list based on selections
        let membersToProcess = members;
        if (selectedGroupId) {
            membersToProcess = membersToProcess.filter(m => m.groupId.toString() === selectedGroupId.toString());
        }
        if (selectedMemberId) {
            membersToProcess = membersToProcess.filter(m => m.id.toString() === selectedMemberId.toString());
        }

        const reportData = membersToProcess.map(member => {
            const group = groups.find(g => g.id === member.groupId);

            // Savings Calculations
            const memberSavings = data.savings.filter(s => s.memberId === member.id);
            const totalSavings = memberSavings.reduce((sum, s) => sum + Number(s.amount), 0);

            const monthSavings = startDate && endDate
                ? memberSavings.filter(s => s.date >= startDate && s.date <= endDate)
                : [];
            const monthDeposit = monthSavings.reduce((sum, s) => sum + Number(s.amount), 0);

            // Withdrawal Calculations
            const withdrawalAmount = 0;

            // Loan Calculations
            const memberLoans = data.loans.filter(l => l.memberId === member.id);
            const activeLoan = memberLoans.find(l => l.status === 'approved');

            let loanOutstanding = 0;
            let monthRepayment = 0;
            let installmentNo = '-';

            if (activeLoan) {
                const loanRepayments = data.loanRepayments.filter(r => r.loanId === activeLoan.id);
                const totalRepaid = loanRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
                loanOutstanding = activeLoan.amount - totalRepaid;

                if (startDate && endDate) {
                    const monthRepayments = loanRepayments.filter(r => r.date >= startDate && r.date <= endDate);
                    monthRepayment = monthRepayments.reduce((sum, r) => sum + Number(r.amount), 0);

                    if (monthRepayments.length > 0) {
                        const sortedRepayments = [...loanRepayments].sort((a, b) => new Date(a.date) - new Date(b.date));
                        const indexes = monthRepayments.map(mr => sortedRepayments.findIndex(sr => sr.id === mr.id) + 1);
                        installmentNo = indexes.length > 0 ? indexes.join(', ') : '-';
                    }
                }
            }

            return {
                memberId: member.id,
                memberName: member.name,
                memberCode: member.employeeCode,
                groupName: group?.name || 'N/A',
                totalSavings,
                monthDeposit,
                loanOutstanding,
                monthRepayment,
                installmentNo,
                withdrawalAmount
            };
        });

        return reportData;
    };

    const handleShow = () => {
        setShowReport(true);
    };

    const handleClear = () => {
        setSelectedGroupId('');
        setSelectedMemberId('');
        setSelectedMonth('');
        setShowReport(false);
    };

    const dayData = showReport ? getReportData() : [];

    const summary = dayData.reduce(
        (acc, curr) => {
            acc.totalSavings += curr.totalSavings;
            acc.monthDeposit += curr.monthDeposit;
            acc.loanOutstanding += curr.loanOutstanding;
            acc.monthRepayment += curr.monthRepayment;
            acc.withdrawalAmount += curr.withdrawalAmount;
            return acc;
        },
        { totalSavings: 0, monthDeposit: 0, loanOutstanding: 0, monthRepayment: 0, withdrawalAmount: 0 }
    );

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            dayData.map(t => ({
                'Member Name': t.memberName,
                'Group Name': t.groupName,
                'Total Savings': t.totalSavings,
                "Month's Deposit": t.monthDeposit,
                'Loan Outstanding': t.loanOutstanding,
                'Loan Repayment': t.monthRepayment,
                'Installment No': t.installmentNo,
                'Withdrawal Amounts': t.withdrawalAmount
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Overall Report');
        XLSX.writeFile(wb, 'overall_report.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Overall Reports of All Members", 14, 15);

        const tableColumn = ["Member Name", "Group Name", "Total Savings", "Month's Deposit", "Loan Outstanding", "Loan Repayment", "Installment No", "Withdrawal"];
        const tableRows = [];

        dayData.forEach(row => {
            const rowData = [
                row.memberName,
                row.groupName,
                row.totalSavings.toLocaleString(),
                row.monthDeposit.toLocaleString(),
                row.loanOutstanding.toLocaleString(),
                row.monthRepayment.toLocaleString(),
                row.installmentNo,
                row.withdrawalAmount.toLocaleString()
            ];
            tableRows.push(rowData);
        });

        // Add summary row
        tableRows.push([
            "Total",
            "",
            summary.totalSavings.toLocaleString(),
            summary.monthDeposit.toLocaleString(),
            summary.loanOutstanding.toLocaleString(),
            summary.monthRepayment.toLocaleString(),
            "",
            summary.withdrawalAmount.toLocaleString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save("overall_report.pdf");
    };

    // Table Styles matching LoanApproval.jsx
    const headerStyle = {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        padding: '10px 12px',
        borderBottom: '1px solid #dee2e6',
        borderRight: '1px solid #dee2e6',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        textAlign: 'left',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap'
    };

    const cellStyle = {
        fontSize: '0.875rem',
        padding: '8px 12px',
        borderRight: '1px solid #dee2e6',
        verticalAlign: 'middle'
    };

    return (
        <div className="fade-in">
            {/* Header + Filter/Search panel */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">

                            <h5 className="mb-3 fw-semibold">Overall Reports of All Members</h5>
                        </div>

                        {/* Export Buttons - Positioned above table, right aligned */}

                    </div>

                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Group Name</Form.Label>
                                <Form.Select
                                    value={selectedGroupId}
                                    onChange={(e) => {
                                        setSelectedGroupId(e.target.value);
                                        setSelectedMemberId('');
                                    }}
                                >
                                    <option value="">All Groups</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Member Name</Form.Label>
                                <Form.Select
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    disabled={!selectedGroupId && filteredMembers.length > 500}
                                >
                                    <option value="">All Members</option>
                                    {filteredMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.employeeCode})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Month</Form.Label>
                                <Form.Control
                                    type="month"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Button
                                variant="primary"
                                className="w-75 mb-1 ms-3"
                                onClick={handleShow}
                            >
                               
                                Show
                            </Button>
                        </Col>
                        <Col md={2}>

                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            {showReport && dayData.length > 0 && (
                <div className="d-flex justify-content-end gap-4 mb-3">
                    {/* PDF Button */}
                    <span
                        onClick={exportToPDF}
                        style={{
                            cursor: "pointer",
                            color: "#dc3545",
                            fontWeight: "500",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e30719ff"; // red bg
                            e.currentTarget.style.color = "#fff"; // white text
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#dc3545"; // back to red text
                        }}
                    >
                        <FaFilePdf size={18} /> PDF
                    </span>

                    {/* Excel Button */}
                    <span
                        onClick={exportToExcel}
                        style={{
                            cursor: "pointer",
                            color: "#198754",
                            fontWeight: "500",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#00874aff"; // green bg
                            e.currentTarget.style.color = "#fff"; // white text
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#198754"; // back to green text
                        }}
                    >
                        <FaFileExcel size={18} /> Excel
                    </span>
                </div>
            )}



            {/* Data table */}
            {showReport && (
                <div className="mt-2">
                    {dayData.length > 0 ? (
                        <div className="shadow-sm" style={{ maxHeight: '65vh', overflowY: 'auto', position: 'relative', border: '1px solid #dee2e6', borderRadius: '0.375rem' }}>
                            <table className="table table-hover mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ ...headerStyle, width: '5%' }}>Sl. No</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>Member Name</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>Group Name</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'right' }}>Total Savings</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'right' }}>Month's Deposit</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'right' }}>Loan Outstanding</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'right' }}>Loan Repayment</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'center' }}>Installment No</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'right', borderRight: 'none' }}>Withdrawal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayData.map((row, idx) => {
                                        const rowBg = idx % 2 === 0 ? "#bbdefb" : "#ffffff";
                                        return (
                                            <tr key={idx} style={{ backgroundColor: rowBg }}>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{idx + 1}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>
                                                    <div className="fw-medium">{row.memberName}</div>
                                                    <div className="small text-muted">{row.memberCode}</div>
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{row.groupName}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right', color: '#198754', fontWeight: 'bold' }}>
                                                    ₹{row.totalSavings.toLocaleString()}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right', color: '#0d6efd' }}>
                                                    ₹{row.monthDeposit.toLocaleString()}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right', color: '#dc3545' }}>
                                                    ₹{row.loanOutstanding.toLocaleString()}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right', color: '#0dcaf0' }}>
                                                    ₹{row.monthRepayment.toLocaleString()}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'center' }}>{row.installmentNo}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right', color: '#6c757d', borderRight: 'none' }}>
                                                    ₹{row.withdrawalAmount.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                                    <tr>
                                        <td colSpan="3" style={{ ...cellStyle, fontWeight: '700', textAlign: 'right', color: '#049bffff' }}>
                                            Total:
                                        </td>
                                        <td style={{ ...cellStyle, fontWeight: '700', textAlign: 'right' }}>₹{summary.totalSavings.toLocaleString()}</td>
                                        <td style={{ ...cellStyle, fontWeight: '700', textAlign: 'right' }}>₹{summary.monthDeposit.toLocaleString()}</td>
                                        <td style={{ ...cellStyle, fontWeight: '700', textAlign: 'right' }}>₹{summary.loanOutstanding.toLocaleString()}</td>
                                        <td style={{ ...cellStyle, fontWeight: '700', textAlign: 'right' }}>₹{summary.monthRepayment.toLocaleString()}</td>
                                        <td style={{ ...cellStyle, fontWeight: '700' }}></td>
                                        <td style={{ ...cellStyle, fontWeight: '700', textAlign: 'right', borderRight: 'none' }}>₹{summary.withdrawalAmount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center py-4">
                                <p className="text-muted mb-0">
                                    No members found for the selected criteria
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            )}

            {!showReport && (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div className="mb-3 opacity-25">
                            <FaCalendarAlt size={60} />
                        </div>
                        <h5 className="text-muted mb-2">Select filters and click Show to view reports</h5>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}
