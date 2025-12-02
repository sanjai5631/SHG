import { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Table, Spinner } from 'react-bootstrap';
import { FaSearch, FaFileExcel, FaFilePdf, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function MonthlyReport({ data }) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        savings: 0,
        loanRepayment: 0,
        totalInflow: 0,
        savingsRepaid: 0,
        loanGiven: 0,
        cash: 0,
        online: 0,
        totalMode: 0
    });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    // Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('₹', '₹ ');
    };

    // Generate Report Data
    const generateReport = async () => {
        if (!data) return;

        setIsLoading(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dailyData = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Helper to check date match
            const isSameDate = (d) => d === dateStr;

            // 1. Savings
            const daySavings = (data.savings || []).filter(s => isSameDate(s.date));
            const savingsAmount = daySavings.reduce((sum, s) => sum + s.amount, 0);

            // 2. Loan Repayments
            const dayRepayments = (data.loanRepayments || []).filter(r => isSameDate(r.date));
            const repaymentAmount = dayRepayments.reduce((sum, r) => sum + r.amount, 0);

            // 3. Total Inflow
            const totalInflow = savingsAmount + repaymentAmount;

            // 4. Savings Repaid (Withdrawals)
            const savingsRepaid = (data.withdrawals || [])
                .filter(w => w.status === 'approved' && isSameDate(w.date))
                .reduce((sum, w) => sum + w.amount, 0);

            // 5. Loan Given (Disbursements)
            const loanGiven = (data.loans || [])
                .filter(l => l.status === 'approved' && isSameDate(l.approvedDate))
                .reduce((sum, l) => sum + l.amount, 0);

            // 6. Payment Modes (Cash vs Online)
            // Check savings payment mode
            const savingsCash = daySavings
                .filter(s => !s.paymentMode || s.paymentMode.toLowerCase() === 'cash')
                .reduce((sum, s) => sum + s.amount, 0);
            const savingsOnline = daySavings
                .filter(s => s.paymentMode && s.paymentMode.toLowerCase() === 'online')
                .reduce((sum, s) => sum + s.amount, 0);

            // Check repayments payment mode
            const repaymentCash = dayRepayments
                .filter(r => !r.paymentType || r.paymentType.toLowerCase() === 'cash')
                .reduce((sum, r) => sum + r.amount, 0);
            const repaymentOnline = dayRepayments
                .filter(r => r.paymentType && r.paymentType.toLowerCase() === 'online')
                .reduce((sum, r) => sum + r.amount, 0);

            const cashTotal = savingsCash + repaymentCash;
            const onlineTotal = savingsOnline + repaymentOnline;
            const totalMode = cashTotal + onlineTotal;

            if (totalInflow > 0 || savingsRepaid > 0 || loanGiven > 0) {
                dailyData.push({
                    date: dateStr,
                    savings: savingsAmount,
                    loanRepayment: repaymentAmount,
                    totalInflow,
                    savingsRepaid,
                    loanGiven,
                    cash: cashTotal,
                    online: onlineTotal,
                    totalMode
                });
            }
        }

        // Calculate Totals
        const newTotals = dailyData.reduce((acc, curr) => ({
            savings: acc.savings + curr.savings,
            loanRepayment: acc.loanRepayment + curr.loanRepayment,
            totalInflow: acc.totalInflow + curr.totalInflow,
            savingsRepaid: acc.savingsRepaid + curr.savingsRepaid,
            loanGiven: acc.loanGiven + curr.loanGiven,
            cash: acc.cash + curr.cash,
            online: acc.online + curr.online,
            totalMode: acc.totalMode + curr.totalMode
        }), {
            savings: 0,
            loanRepayment: 0,
            totalInflow: 0,
            savingsRepaid: 0,
            loanGiven: 0,
            cash: 0,
            online: 0,
            totalMode: 0
        });

        setReportData(dailyData);
        setTotals(newTotals);
        setIsLoading(false);
    };

    // Export to PDF
    const exportToPdf = () => {
        if (!reportData || reportData.length === 0) {
            alert('No data available to export. Please generate a report first.');
            return;
        }
        
        setIsLoading(true);
        try {
            // Initialize jsPDF with landscape orientation
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const title = 'Monthly Report';
            const monthYear = `${months[selectedMonth]} ${selectedYear}`;
            
            // Set document properties
            doc.setProperties({
                title: `Monthly Report - ${monthYear}`,
                subject: 'Monthly Financial Report',
                author: 'SHG Management System'
            });

            // Add title and month/year
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Month: ${monthYear}`, 14, 25);

            // Prepare table data with proper null checks
            const headers = [
                'Date', 'Savings', 'Loan Repayment', 'Total', 'Savings Repaid', 
                'Loan Given', 'Cash', 'Online', 'Total'
            ];
            
            const tableData = (reportData || []).map(item => {
                // Ensure item exists and has all required properties
                const safeItem = item || {};
                return [
                    safeItem.date ? new Date(safeItem.date).toLocaleDateString('en-GB') : '-',
                    `₹${(safeItem.savings || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.loanRepayment || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.totalInflow || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.savingsRepaid || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.loanGiven || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.cash || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.online || 0).toLocaleString('en-IN')}`,
                    `₹${(safeItem.totalMode || 0).toLocaleString('en-IN')}`
                ];
            });

            // Add totals row with null checks
            const totalsRow = [
                'Total',
                `₹${(totals?.savings || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.loanRepayment || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.totalInflow || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.savingsRepaid || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.loanGiven || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.cash || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.online || 0).toLocaleString('en-IN')}`,
                `₹${(totals?.totalMode || 0).toLocaleString('en-IN')}`
            ];

            // Add table
            autoTable(doc, {
                head: [headers],
                body: [...tableData, totalsRow],
                startY: 35,
                styles: { 
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                headStyles: { 
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 15 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 15 },
                    6: { cellWidth: 15 },
                    7: { cellWidth: 15 },
                    8: { cellWidth: 15 }
                },
                didDrawPage: function(data) {
                    // Add page number
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height || pageSize.getHeight();
                    doc.setFontSize(8);
                    doc.text(
                        `Page ${doc.internal.getNumberOfPages()}`,
                        data.settings.margin.left,
                        pageHeight - 10
                    );
                }
            });

            // Save the PDF
            doc.save(`Monthly_Report_${monthYear.replace(' ', '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please check console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = () => {
        if (reportData.length === 0) return;

        const wb = XLSX.utils.book_new();

        const wsData = [
            [
                'Date',
                'Savings',
                'Loan Repayment Given',
                'Total',
                'Savings Repaid',
                'Loan Given',
                'Cash',
                'Online',
                'Total'
            ],
            ...reportData.map(item => [
                new Date(item.date).toLocaleDateString('en-GB'),
                item.savings,
                item.loanRepayment,
                item.totalInflow,
                item.savingsRepaid,
                item.loanGiven,
                item.cash,
                item.online,
                item.totalMode
            ]),
            [
                'Total',
                totals.savings,
                totals.loanRepayment,
                totals.totalInflow,
                totals.savingsRepaid,
                totals.loanGiven,
                totals.cash,
                totals.online,
                totals.totalMode
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column Widths
        const colWidths = [
            { wch: 12 }, // Date
            { wch: 12 }, // Savings
            { wch: 20 }, // Loan Repayment Given
            { wch: 12 }, // Total
            { wch: 15 }, // Savings Repaid
            { wch: 12 }, // Loan Given
            { wch: 12 }, // Cash
            { wch: 12 }, // Online
            { wch: 12 }  // Total
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
        XLSX.writeFile(wb, `Monthly_Report_${months[selectedMonth]}_${selectedYear}.xlsx`);
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold mb-0">Monthly Report</h1>
                <div className="d-flex gap-2">
                   
                </div>
            </div>
            
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">

                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted mb-1">
                                    <FaCalendarAlt className="me-2" />Month
                                </Form.Label>
                                <Form.Select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted mb-1">
                                    <FaCalendarAlt className="me-2" />Year
                                </Form.Label>
                                <Form.Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Button
                                variant="primary"
                                className="w-100"
                                onClick={generateReport}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FaSearch className="me-2" /> Generate Report
                                    </>
                                )}
                            </Button>
                        </Col>

                        {reportData.length > 0 && (
                            <Col xs="auto">
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-danger"
                                        className="export-btn pdf-btn"
                                        onClick={exportToPdf}
                                    >
                                        <FaFilePdf className="me-1" />
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        className="export-btn excel-btn"
                                        onClick={exportToExcel}
                                    >
                                        <FaFileExcel className="me-1" />
                                        Excel
                                    </Button>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            {reportData.length > 0 ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="mb-0 text-center align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-3">Date</th>
                                        <th className="py-3">Savings</th>
                                        <th className="py-3">Loan Repayment Given</th>
                                        <th className="py-3">Total</th>
                                        <th className="py-3">Savings Repaid</th>
                                        <th className="py-3">Loan Given</th>
                                        <th className="py-3">Cash</th>
                                        <th className="py-3">Online</th>
                                        <th className="py-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index}>
                                            <td className="fw-medium">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                                            <td>{row.savings > 0 ? formatCurrency(row.savings) : '-'}</td>
                                            <td>{row.loanRepayment > 0 ? formatCurrency(row.loanRepayment) : '-'}</td>
                                            <td className="fw-bold text-primary">{row.totalInflow > 0 ? formatCurrency(row.totalInflow) : '-'}</td>
                                            <td>{row.savingsRepaid > 0 ? formatCurrency(row.savingsRepaid) : '-'}</td>
                                            <td>{row.loanGiven > 0 ? formatCurrency(row.loanGiven) : '-'}</td>
                                            <td>{row.cash > 0 ? formatCurrency(row.cash) : '-'}</td>
                                            <td>{row.online > 0 ? formatCurrency(row.online) : '-'}</td>
                                            <td className="fw-bold">{row.totalMode > 0 ? formatCurrency(row.totalMode) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light fw-bold">
                                    <tr>
                                        <td>Total</td>
                                        <td>{formatCurrency(totals.savings)}</td>
                                        <td>{formatCurrency(totals.loanRepayment)}</td>
                                        <td className="text-primary">{formatCurrency(totals.totalInflow)}</td>
                                        <td>{formatCurrency(totals.savingsRepaid)}</td>
                                        <td>{formatCurrency(totals.loanGiven)}</td>
                                        <td>{formatCurrency(totals.cash)}</td>
                                        <td>{formatCurrency(totals.online)}</td>
                                        <td>{formatCurrency(totals.totalMode)}</td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                !isLoading && (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <FaFileAlt className="display-4 text-muted mb-3" />
                            <h5 className="text-muted mb-3">No Data Found</h5>
                            <p className="text-muted mb-0">
                                No transactions found for {months[selectedMonth]} {selectedYear}.
                            </p>
                        </Card.Body>
                    </Card>
                )
            )}
        </div>
    );
}
