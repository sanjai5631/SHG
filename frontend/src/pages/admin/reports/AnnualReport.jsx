import { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Table, Spinner } from 'react-bootstrap';
import { FaSearch, FaFileExcel, FaFilePdf, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
    import * as XLSX from 'xlsx';

export default function AnnualReport({ data }) {
    const [isLoading, setIsLoading] = useState(false);
    const [financialYears, setFinancialYears] = useState([]);
    const [selectedFY, setSelectedFY] = useState('');
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        savingAmount: 0,
        loanRepayment: 0,
        totalAmount: 0,
        loanAmountGiven: 0,
        savingRepaid: 0,
        balanceAmount: 0
    });

    // Initialize Financial Years
    useEffect(() => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 5; i++) {
            const start = currentYear - i;
            years.push(`${start}-${start + 1}`);
        }
        setFinancialYears(years);
        setSelectedFY(`${currentYear}-${currentYear + 1}`); // Default to current FY
    }, []);

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
        if (!selectedFY || !data) return;

        setIsLoading(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const [startYear, endYear] = selectedFY.split('-').map(Number);
        const months = [
            { name: 'Apr', year: startYear, monthIndex: 3 },
            { name: 'May', year: startYear, monthIndex: 4 },
            { name: 'Jun', year: startYear, monthIndex: 5 },
            { name: 'Jul', year: startYear, monthIndex: 6 },
            { name: 'Aug', year: startYear, monthIndex: 7 },
            { name: 'Sep', year: startYear, monthIndex: 8 },
            { name: 'Oct', year: startYear, monthIndex: 9 },
            { name: 'Nov', year: startYear, monthIndex: 10 },
            { name: 'Dec', year: startYear, monthIndex: 11 },
            { name: 'Jan', year: endYear, monthIndex: 0 },
            { name: 'Feb', year: endYear, monthIndex: 1 },
            { name: 'Mar', year: endYear, monthIndex: 2 },
        ];

        const monthlyData = months.map(m => {
            const startDate = new Date(m.year, m.monthIndex, 1);
            const endDate = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);

            const isWithinMonth = (dateStr) => {
                if (!dateStr) return false;
                const d = new Date(dateStr);
                return d >= startDate && d <= endDate;
            };

            // 1. Saving Amount
            const savingAmount = (data.savings || [])
                .filter(s => isWithinMonth(s.date))
                .reduce((sum, s) => sum + s.amount, 0);

            // 2. Loan Repayment
            const loanRepayment = (data.loanRepayments || [])
                .filter(r => isWithinMonth(r.date))
                .reduce((sum, r) => sum + r.amount, 0);

            // 3. Total Amount (Inflow)
            const totalAmount = savingAmount + loanRepayment;

            // 4. Loan Amount Given (Disbursement)
            const loanAmountGiven = (data.loans || [])
                .filter(l => l.status === 'approved' && isWithinMonth(l.approvedDate))
                .reduce((sum, l) => sum + l.amount, 0);

            // 5. Saving Repaid (Withdrawals)
            // Assuming data.withdrawals exists based on Dashboard.jsx
            const savingRepaid = (data.withdrawals || [])
                .filter(w => w.status === 'approved' && isWithinMonth(w.date))
                .reduce((sum, w) => sum + w.amount, 0);

            // 6. Balance Amount in Hand
            const balanceAmount = totalAmount - loanAmountGiven - savingRepaid;

            return {
                month: `${m.name} ${m.year}`,
                savingAmount,
                loanRepayment,
                totalAmount,
                loanAmountGiven,
                savingRepaid,
                balanceAmount
            };
        });

        // Calculate Totals
        const newTotals = monthlyData.reduce((acc, curr) => ({
            savingAmount: acc.savingAmount + curr.savingAmount,
            loanRepayment: acc.loanRepayment + curr.loanRepayment,
            totalAmount: acc.totalAmount + curr.totalAmount,
            loanAmountGiven: acc.loanAmountGiven + curr.loanAmountGiven,
            savingRepaid: acc.savingRepaid + curr.savingRepaid,
            balanceAmount: acc.balanceAmount + curr.balanceAmount
        }), {
            savingAmount: 0,
            loanRepayment: 0,
            totalAmount: 0,
            loanAmountGiven: 0,
            savingRepaid: 0,
            balanceAmount: 0
        });

        setReportData(monthlyData);
        setTotals(newTotals);
        setIsLoading(false);
    };

    // Export to PDF
    const exportToPdf = () => {
        if (!reportData || reportData.length === 0) {
            alert('No data available to export. Please generate a report first.');
            return;
        }

        try {
            const doc = new jsPDF();
            const title = 'Annual Report';
            const financialYear = selectedFY;
            
            // Add title and financial year
            doc.setFontSize(16);
            doc.text(title, 14, 15);
            
            doc.setFontSize(12);
            doc.text(`Financial Year: ${financialYear}`, 14, 25);

            // Prepare table data
            const headers = [
                'Month',
                'Saving Amount',
                'Loan Repayment',
                'Total Amount',
                'Loan Given',
                'Saving Repaid',
                'Balance in Hand'
            ];
            
            const tableData = reportData.map(item => [
                item.month,
                `₹${item.savingAmount.toLocaleString('en-IN')}`,
                `₹${item.loanRepayment.toLocaleString('en-IN')}`,
                `₹${item.totalAmount.toLocaleString('en-IN')}`,
                `₹${item.loanAmountGiven.toLocaleString('en-IN')}`,
                `₹${item.savingRepaid.toLocaleString('en-IN')}`,
                `₹${item.balanceAmount.toLocaleString('en-IN')}`
            ]);

            // Add totals row
            const totalsRow = [
                'Total',
                `₹${totals.savingAmount.toLocaleString('en-IN')}`,
                `₹${totals.loanRepayment.toLocaleString('en-IN')}`,
                `₹${totals.totalAmount.toLocaleString('en-IN')}`,
                `₹${totals.loanAmountGiven.toLocaleString('en-IN')}`,
                `₹${totals.savingRepaid.toLocaleString('en-IN')}`,
                `₹${totals.balanceAmount.toLocaleString('en-IN')}`
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
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 20 }
                },
                didDrawPage: function (data) {
                    // Add page number
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    doc.setFontSize(8);
                    doc.text(
                        `Page ${doc.internal.getNumberOfPages()}`,
                        data.settings.margin.left,
                        pageHeight - 10
                    );
                }
            });

            // Save the PDF
            doc.save(`Annual_Report_${financialYear.replace('/', '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please check console for details.');
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        if (reportData.length === 0) return;

        const wb = XLSX.utils.book_new();

        const wsData = [
            [
                'Month',
                'Saving Amount',
                'Loan Repayment',
                'Total Amount',
                'Loan Amount Given',
                'Saving Repaid',
                'Bal Amount in Hand'
            ],
            ...reportData.map(item => [
                item.month,
                item.savingAmount,
                item.loanRepayment,
                item.totalAmount,
                item.loanAmountGiven,
                item.savingRepaid,
                item.balanceAmount
            ]),
            [
                'Total',
                totals.savingAmount,
                totals.loanRepayment,
                totals.totalAmount,
                totals.loanAmountGiven,
                totals.savingRepaid,
                totals.balanceAmount
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column Widths
        const colWidths = [
            { wch: 15 }, // Month
            { wch: 15 }, // Saving Amount
            { wch: 15 }, // Loan Repayment
            { wch: 15 }, // Total Amount
            { wch: 18 }, // Loan Amount Given
            { wch: 15 }, // Saving Repaid
            { wch: 18 }  // Bal Amount in Hand
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Annual Report');
        XLSX.writeFile(wb, `Annual_Report_${selectedFY}.xlsx`);
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold mb-0">Annual Report</h1>
                <div className="d-flex gap-2">
                   
                </div>
            </div>
            
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">

                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted mb-1">
                                    <FaCalendarAlt className="me-2" />Financial Year
                                </Form.Label>
                                <Form.Select
                                    value={selectedFY}
                                    onChange={(e) => setSelectedFY(e.target.value)}
                                >
                                    <option value="">Select Financial Year</option>
                                    {financialYears.map(fy => (
                                        <option key={fy} value={fy}>{fy}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Button
                                variant="primary"
                                className="w-100"
                                onClick={generateReport}
                                disabled={!selectedFY || isLoading}
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

            {reportData.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="mb-0 text-center align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-3">Month</th>
                                        <th className="py-3">Saving Amount</th>
                                        <th className="py-3">Loan Repayment</th>
                                        <th className="py-3">Total Amount</th>
                                        <th className="py-3">Loan Amount Given</th>
                                        <th className="py-3">Saving Repaid</th>
                                        <th className="py-3">Bal Amount in Hand</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index}>
                                            <td className="fw-medium text-start ps-4">{row.month}</td>
                                            <td>{row.savingAmount > 0 ? formatCurrency(row.savingAmount) : '-'}</td>
                                            <td>{row.loanRepayment > 0 ? formatCurrency(row.loanRepayment) : '-'}</td>
                                            <td className="fw-bold text-primary">{row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}</td>
                                            <td>{row.loanAmountGiven > 0 ? formatCurrency(row.loanAmountGiven) : '-'}</td>
                                            <td>{row.savingRepaid > 0 ? formatCurrency(row.savingRepaid) : '-'}</td>
                                            <td className={`fw-bold ${row.balanceAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(row.balanceAmount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light fw-bold">
                                    <tr>
                                        <td className="text-start ps-4">Total</td>
                                        <td>{formatCurrency(totals.savingAmount)}</td>
                                        <td>{formatCurrency(totals.loanRepayment)}</td>
                                        <td className="text-primary">{formatCurrency(totals.totalAmount)}</td>
                                        <td>{formatCurrency(totals.loanAmountGiven)}</td>
                                        <td>{formatCurrency(totals.savingRepaid)}</td>
                                        <td className={totals.balanceAmount >= 0 ? 'text-success' : 'text-danger'}>
                                            {formatCurrency(totals.balanceAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}
