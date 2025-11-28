import { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Table, Button, Badge } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import { useSearchParams, useLocation } from 'react-router-dom';

export default function Reports() {
    const { data } = useApp();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [reportType, setReportType] = useState('memberwise');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('2024');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Read report type from URL query parameter or path
    useEffect(() => {
        const type = searchParams.get('type');
        let newReportType = reportType;
        
        if (type && ['memberwise', 'daywise', 'monthly', 'annual'].includes(type)) {
            newReportType = type;
        } else {
            // Check path
            if (location.pathname.includes('memberwise-report')) newReportType = 'memberwise';
            else if (location.pathname.includes('daywise-report')) newReportType = 'daywise';
            else if (location.pathname.includes('monthly-report')) newReportType = 'monthly';
            else if (location.pathname.includes('annual-report')) newReportType = 'annual';
        }
        
        // Only update state if the value has actually changed
        if (newReportType !== reportType) {
            setReportType(newReportType);
        }
    }, [searchParams, location.pathname, reportType]);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const years = ['2023', '2024', '2025', '2026'];

    const reportTypes = [
        { value: 'memberwise', label: 'Memberwise Report', icon: '👥' },
        { value: 'daywise', label: 'Daywise Report', icon: '📅' },
        { value: 'monthly', label: 'Monthly Report', icon: '📊' },
        { value: 'annual', label: 'Annual Report', icon: '📈' }
    ];

    // Calculate member-wise data
    const getMemberWiseData = () => {
        return data.members
            .filter(m => !selectedGroup || m.groupId === parseInt(selectedGroup))
            .map(member => {
                const savings = data.savings
                    .filter(s => s.memberId === member.id)
                    .reduce((sum, s) => sum + s.amount, 0);

                const loans = data.loans
                    .filter(l => l.memberId === member.id)
                    .reduce((sum, l) => sum + l.amount, 0);

                const repayments = data.loanRepayments
                    .filter(r => {
                        const loan = data.loans.find(l => l.id === r.loanId);
                        return loan && loan.memberId === member.id;
                    })
                    .reduce((sum, r) => sum + r.amount, 0);

                const group = data.shgGroups.find(g => g.id === member.groupId);

                return {
                    ...member,
                    groupName: group?.name || 'N/A',
                    totalSavings: savings,
                    totalLoans: loans,
                    totalRepayments: repayments,
                    loanBalance: loans - repayments
                };
            });
    };

    // Calculate day-wise data
    const getDayWiseData = () => {
        const { startDate, endDate } = dateRange;
        if (!startDate || !endDate) return [];

        const transactions = [];

        // Add savings transactions
        data.savings.forEach(s => {
            if (s.date >= startDate && s.date <= endDate) {
                const member = data.members.find(m => m.id === s.memberId);
                const product = data.savingProducts.find(p => p.id === s.productId);
                transactions.push({
                    date: s.date,
                    type: 'Savings',
                    member: member?.name || 'Unknown',
                    product: product?.name || 'Unknown',
                    amount: s.amount,
                    balance: s.amount
                });
            }
        });

        // Add loan repayments
        data.loanRepayments.forEach(r => {
            if (r.date >= startDate && r.date <= endDate) {
                const loan = data.loans.find(l => l.id === r.loanId);
                const member = data.members.find(m => m.id === loan?.memberId);
                transactions.push({
                    date: r.date,
                    type: 'Loan Repayment',
                    member: member?.name || 'Unknown',
                    product: 'EMI',
                    amount: r.amount,
                    balance: r.amount
                });
            }
        });

        return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Calculate monthly data
    const getMonthlyData = () => {
        if (!selectedMonth || !selectedYear) return null;

        const monthIndex = months.indexOf(selectedMonth) + 1;
        const monthStr = String(monthIndex).padStart(2, '0');

        const totalSavings = data.savings
            .filter(s => s.date.startsWith(`${selectedYear}-${monthStr}`))
            .reduce((sum, s) => sum + s.amount, 0);

        const totalRepayments = data.loanRepayments
            .filter(r => r.date.startsWith(`${selectedYear}-${monthStr}`))
            .reduce((sum, r) => sum + r.amount, 0);

        const loansIssued = data.loans
            .filter(l => l.approvedDate && l.approvedDate.startsWith(`${selectedYear}-${monthStr}`))
            .reduce((sum, l) => sum + l.amount, 0);

        const newMembers = data.members
            .filter(m => m.joinDate && m.joinDate.startsWith(`${selectedYear}-${monthStr}`))
            .length;

        return {
            totalSavings,
            totalRepayments,
            loansIssued,
            newMembers,
            netCashFlow: totalSavings + totalRepayments - loansIssued
        };
    };

    // Calculate annual data
    const getAnnualData = () => {
        if (!selectedYear) return null;

        const totalSavings = data.savings
            .filter(s => s.date.startsWith(selectedYear))
            .reduce((sum, s) => sum + s.amount, 0);

        const totalRepayments = data.loanRepayments
            .filter(r => r.date.startsWith(selectedYear))
            .reduce((sum, r) => sum + r.amount, 0);

        const loansIssued = data.loans
            .filter(l => l.approvedDate && l.approvedDate.startsWith(selectedYear))
            .reduce((sum, l) => sum + l.amount, 0);

        const newMembers = data.members
            .filter(m => m.joinDate && m.joinDate.startsWith(selectedYear))
            .length;

        const activeLoans = data.loans.filter(l => l.status === 'approved').length;
        const pendingLoans = data.loans.filter(l => l.status === 'pending').length;

        return {
            totalSavings,
            totalRepayments,
            loansIssued,
            newMembers,
            activeLoans,
            pendingLoans,
            netCashFlow: totalSavings + totalRepayments - loansIssued
        };
    };

    const renderMemberwiseReport = () => {
        const [searchTerm, setSearchTerm] = useState("");
        const [showDropdown, setShowDropdown] = useState(false);
        const [selectedMember, setSelectedMember] = useState(null);
        const [showPreview, setShowPreview] = useState(false);
        const [reportStartDate, setReportStartDate] = useState("2024-01-01");
        const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split("T")[0]);

        // Filter members based on search
        const filteredMembers = data.members.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Get member loan data
        const getMemberLoanData = (memberId) => {
            const memberLoans = data.loans.filter(l => l.memberId === memberId && l.status === 'approved');
            if (memberLoans.length === 0) return null;

            const loan = memberLoans[0]; // Get first loan for demo
            const repayments = data.loanRepayments.filter(r => r.loanId === loan.id);
            const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
            const principalPaid = totalRepaid * 0.85; // Assuming 85% goes to principal
            const interestPaid = totalRepaid * 0.15; // Assuming 15% is interest
            const principalYetToPay = loan.amount - principalPaid;

            return {
                loanAmount: loan.amount,
                principalPaid,
                principalYetToPay,
                interestPaid,
                emi: loan.emi,
                tenor: loan.tenor,
                repayments
            };
        };

        const MemberwiseReportContent = () => (
            <>
                <Row className="mb-4">
                    {/* Select Member with Search */}
                    <Col md={4}>
                        <Form.Group className="position-relative">
                            <Form.Label className="fw-medium small">Select Member</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type="text"
                                    placeholder="Search by Name or Code..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    size="sm"
                                />
                                {showDropdown && searchTerm && (
                                    <div className="position-absolute bg-white border rounded w-100 mt-1 shadow-lg" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                                        {filteredMembers.map(member => (
                                            <div
                                                key={member.id}
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setSearchTerm(member.name);
                                                    setShowDropdown(false);
                                                }}
                                                className="p-2 cursor-pointer"
                                                style={{ cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                <div className="fw-medium">{member.name}</div>
                                                <div className="small text-muted">{member.employeeCode}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Form.Group>
                    </Col>

                    {/* Start Date */}
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={reportStartDate}
                                onChange={(e) => setReportStartDate(e.target.value)}
                                size="sm"
                            />
                        </Form.Group>
                    </Col>

                    {/* End Date */}
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={reportEndDate}
                                onChange={(e) => setReportEndDate(e.target.value)}
                                size="sm"
                            />
                        </Form.Group>
                    </Col>

                    {/* Show Button */}
                    <Col md={2} className="d-flex align-items-end">
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={!selectedMember}
                            onClick={() => setShowPreview(true)}
                            className="w-100"
                        >
                            Show Report
                        </Button>
                    </Col>
                </Row>

                {/* Preview Modal */}
                {showPreview && selectedMember && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                        <div className="bg-white rounded shadow-lg p-4" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                            {/* Header with Close Button */}
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0 fw-bold">Loan Details Report</h4>
                                <div>
                                    <Button variant="success" size="sm" className="me-2">
                                        📥 Export PDF
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => setShowPreview(false)}>
                                        ✕ Close
                                    </Button>
                                </div>
                            </div>

                            {/* Report Content */}
                            <div className="border rounded p-4">
                                <h5 className="text-center fw-bold mb-4">Loan Details</h5>

                                {/* Member Summary */}
                                <h6 className="fw-bold mb-3">Member Summary</h6>
                                <div className="border rounded p-3 mb-4">
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-1"><strong>Member Name:</strong> {selectedMember.name}</p>
                                            <p className="mb-1"><strong>Employee Code:</strong> {selectedMember.employeeCode}</p>
                                            <p className="mb-0"><strong>Phone No:</strong> {selectedMember.phone}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1"><strong>From Date:</strong> {reportStartDate}</p>
                                            <p className="mb-0"><strong>To Date:</strong> {reportEndDate}</p>
                                        </Col>
                                    </Row>
                                </div>

                                {(() => {
                                    const loanData = getMemberLoanData(selectedMember.id);
                                    if (!loanData) {
                                        return <div className="text-center text-muted py-5">No loan data available for this member</div>;
                                    }

                                    return (
                                        <>
                                            {/* Loan Summary */}
                                            <div className="mb-4">
                                                <p className="mb-1"><strong>Loan Issued Amount:</strong> ₹{loanData.loanAmount.toLocaleString()}</p>
                                                <p className="mb-1"><strong>Principal Paid:</strong> ₹{loanData.principalPaid.toFixed(2)}</p>
                                                <p className="mb-1"><strong>Principal Yet to be Paid:</strong> ₹{loanData.principalYetToPay.toFixed(2)}</p>
                                                <p className="mb-0"><strong>Interest Paid:</strong> ₹{loanData.interestPaid.toFixed(2)}</p>
                                            </div>

                                            {/* Loan Repayment Scheduler */}
                                            <h6 className="fw-bold mb-2">Loan Repayment Scheduler:</h6>
                                            <Table bordered size="sm" className="mb-4">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>S.No</th>
                                                        <th>Date</th>
                                                        <th>Loan OS</th>
                                                        <th>Principal</th>
                                                        <th>Interest</th>
                                                        <th>Savings</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...Array(Math.min(loanData.tenor, 12)).keys()].map(i => {
                                                        const principal = loanData.emi * 0.85;
                                                        const interest = loanData.emi * 0.15;
                                                        const savings = 1000;
                                                        return (
                                                            <tr key={i}>
                                                                <td>{i + 1}</td>
                                                                <td>{new Date(reportStartDate).toLocaleDateString()}</td>
                                                                <td>₹{loanData.loanAmount.toLocaleString()}</td>
                                                                <td>₹{principal.toFixed(2)}</td>
                                                                <td>₹{interest.toFixed(2)}</td>
                                                                <td>₹{savings.toFixed(2)}</td>
                                                                <td>₹{(loanData.emi + savings).toFixed(2)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>

                                            {/* Loan Recovered */}
                                            <h6 className="fw-bold mb-2">Loan Recovered:</h6>
                                            <Table bordered size="sm" className="mb-4">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>S.No</th>
                                                        <th>Transferred Date</th>
                                                        <th>Loan Recovered</th>
                                                        <th>Interest Recovered</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loanData.repayments.map((repayment, idx) => (
                                                        <tr key={idx}>
                                                            <td>{idx + 1}</td>
                                                            <td>{new Date(repayment.date).toLocaleDateString()}</td>
                                                            <td>₹{(repayment.amount * 0.85).toFixed(2)}</td>
                                                            <td>₹{(repayment.amount * 0.15).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>

                                            {/* Loan Outstanding */}
                                            <h6 className="fw-bold mb-2">Loan Outstanding:</h6>
                                            <Table bordered size="sm" style={{ width: '40%' }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-semibold">Outstanding Amount</td>
                                                        <td className="text-danger fw-bold">₹{loanData.principalYetToPay.toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );

        return <MemberwiseReportContent />;
    };

    const renderDaywiseReport = () => {
        const dayData = getDayWiseData();

        return (
            <>
                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">End Date</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {dayData.length > 0 ? (
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>DATE</th>
                                    <th>TYPE</th>
                                    <th>MEMBER</th>
                                    <th>PRODUCT</th>
                                    <th>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayData.map((transaction, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td>
                                            <Badge bg={transaction.type === 'Savings' ? 'success' : 'info'}>
                                                {transaction.type}
                                            </Badge>
                                        </td>
                                        <td className="fw-medium">{transaction.member}</td>
                                        <td>{transaction.product}</td>
                                        <td className="fw-bold">₹{transaction.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-light fw-bold">
                                <tr>
                                    <td colSpan="4">TOTAL</td>
                                    <td>₹{dayData.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-muted py-5">
                        Please select a date range to view transactions
                    </div>
                )}
            </>
        );
    };

    const renderMonthlyReport = () => {
        const monthData = getMonthlyData();

        return (
            <>
                <Row className="mb-4">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Month</Form.Label>
                            <Form.Select
                                size="sm"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="">Select Month</option>
                                {months.map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Year</Form.Label>
                            <Form.Select
                                size="sm"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {monthData ? (
                    <Row className="g-3">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Total Savings</p>
                                            <h3 className="mb-0 fw-bold">₹{monthData.totalSavings.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">💰</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Loan Repayments</p>
                                            <h3 className="mb-0 fw-bold">₹{monthData.totalRepayments.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">💳</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Loans Issued</p>
                                            <h3 className="mb-0 fw-bold">₹{monthData.loansIssued.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">📤</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">New Members</p>
                                            <h3 className="mb-0 fw-bold">{monthData.newMembers}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">👥</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Net Cash Flow</p>
                                            <h3 className="mb-0 fw-bold">₹{monthData.netCashFlow.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">📊</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    <div className="text-center text-muted py-5">
                        Please select a month and year to view the report
                    </div>
                )}
            </>
        );
    };

    const renderAnnualReport = () => {
        const annualData = getAnnualData();

        return (
            <>
                <Row className="mb-4">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Year</Form.Label>
                            <Form.Select
                                size="sm"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {annualData && (
                    <Row className="g-3">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Total Savings</p>
                                            <h3 className="mb-0 fw-bold">₹{annualData.totalSavings.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">💰</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Loan Repayments</p>
                                            <h3 className="mb-0 fw-bold">₹{annualData.totalRepayments.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">💳</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Loans Issued</p>
                                            <h3 className="mb-0 fw-bold">₹{annualData.loansIssued.toLocaleString()}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">📤</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">New Members</p>
                                            <h3 className="mb-0 fw-bold">{annualData.newMembers}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">👥</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Active Loans</p>
                                            <h3 className="mb-0 fw-bold">{annualData.activeLoans}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">✅</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                                <Card.Body className="text-dark">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="mb-1 opacity-75">Pending Loans</p>
                                            <h3 className="mb-0 fw-bold">{annualData.pendingLoans}</h3>
                                        </div>
                                        <div className="fs-1 opacity-50">⏳</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={12}>
                            <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                                <Card.Body className="text-dark">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="mb-1 opacity-75 fw-medium">Net Cash Flow</p>
                                            <h2 className="mb-0 fw-bold">₹{annualData.netCashFlow.toLocaleString()}</h2>
                                        </div>
                                        <div className="fs-1 opacity-50">📈</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}
            </>
        );
    };

    const renderReport = () => {
        switch (reportType) {
            case 'memberwise':
                return renderMemberwiseReport();
            case 'daywise':
                return renderDaywiseReport();
            case 'monthly':
                return renderMonthlyReport();
            case 'annual':
                return renderAnnualReport();
            default:
                return null;
        }
    };

    const selectedReportType = reportTypes.find(r => r.value === reportType);

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="h4 fw-bold mb-1">Reports</h1>
            </div>
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0 fw-semibold">
                        {selectedReportType?.icon} {selectedReportType?.label}
                    </h5>
                </Card.Header>
                <Card.Body className="p-4">
                    {renderReport()}
                </Card.Body>
            </Card>
        </div>
    );
}
