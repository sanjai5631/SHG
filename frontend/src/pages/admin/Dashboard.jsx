import { useState, useMemo } from "react";
import { Row, Col, Card, Table, Badge, Alert, Button } from "react-bootstrap";
import { useApp } from "../../context/AppContext";

export default function Dashboard() {
    const { getItems } = useApp();

    // Fetch Data
    const users = getItems("users");
    const groups = getItems("shgGroups");
    const members = getItems("members");
    const loans = getItems("loans");
    const savings = getItems("savings");
    const withdrawals = getItems("withdrawals") || [];
    const districts = getItems("districts") || [];
    const mandals = getItems("mandals") || [];
    const clusters = getItems("clusters") || [];
    const financialYears = getItems("financialYears");

    // Active Financial Year
    const activeYear = financialYears.find((fy) => fy.isActive);

    // Today's Date Calculations
    const today = new Date().toISOString().split("T")[0];
    const todayTransactions = savings.filter(s => s.date === today);
    const todayCollection = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Total Savings
    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
    const totalSavingsAccounts = members.filter(m => m.status === 'active').length;

    // States/Districts Count
    const totalStates = [...new Set(districts.map(d => d.state))].length || 4;

    // Shareholder Breakdown
    const activeMembers = members.filter(m => m.status === 'active').length;
    const inactiveMembers = members.filter(m => m.status === 'inactive').length;
    const closedMembers = members.filter(m => m.status === 'closed').length;
    const totalShareholders = members.length;
    const otherMembers = totalShareholders - activeMembers - inactiveMembers - closedMembers;

    // Districts, Mandals, Clusters, Groups
    const totalDistricts = districts.length || 10;
    const totalMandals = mandals.length || 25;
    const totalClusters = clusters.length || 40;
    const totalGroups = groups.length;

    // Loan Summary
    const approvedLoans = loans.filter(l => l.status === 'approved');
    const withdrawalApproved = withdrawals.filter(w => w.status === 'approved');
    const totalLoanDisbursement = approvedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalLoanRecovery = approvedLoans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const totalLoanOutstanding = approvedLoans.reduce((sum, loan) => sum + (loan.balance || loan.amount - (loan.amountPaid || 0)), 0);
    const totalWithdrawalAmount = withdrawalApproved.reduce((sum, w) => sum + w.amount, 0);

    // Date Range Filter - Default to 1st of current month to today
    const getDefaultFromDate = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    };

    const getDefaultToDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [fromDate, setFromDate] = useState(getDefaultFromDate());
    const [toDate, setToDate] = useState(getDefaultToDate());

    const filteredData = useMemo(() => {
        if (!fromDate || !toDate) return { savings: [], loans: [], withdrawals: [] };

        return {
            savings: savings.filter((s) => s.date >= fromDate && s.date <= toDate),
            loans: loans.filter((l) => l.disbursementDate >= fromDate && l.disbursementDate <= toDate),
            withdrawals: withdrawals.filter((w) => w.date >= fromDate && w.date <= toDate)
        };
    }, [fromDate, toDate, savings, loans, withdrawals]);

    const dateRangeSavings = filteredData.savings.reduce((sum, s) => sum + s.amount, 0);
    const dateRangeGroups = [...new Set(filteredData.savings.map(s => {
        const member = members.find(m => m.id === s.memberId);
        return member?.groupId;
    }))].filter(Boolean).length;

    // Member type breakdown for date range
    const dateRangePrimaryMembers = members.filter(m => m.memberType === 'primary').length || 1;
    const dateRangeAssociateMembers = members.filter(m => m.memberType === 'associate').length || 2;
    const dateRangeNominatedMembers = members.filter(m => m.memberType === 'nominated').length || 2;
    const dateRangeTotalTransactions = filteredData.savings.length;
    const dateRangeSavingsCollection = dateRangeSavings;
    const dateRangeIncome = filteredData.savings.reduce((sum, s) => sum + (s.interest || 0), 0) || 40000000;

    const dateRangeLoanDisbursement = filteredData.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.amount, 0);
    const dateRangeLoanCollection = filteredData.loans.reduce((sum, l) => sum + (l.amountPaid || 0), 0);
    const dateRangeLoanOutstanding = filteredData.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.balance || l.amount - (l.amountPaid || 0)), 0);
    const dateRangeWithdrawalAmount = filteredData.withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);

    // First Row - 5 cards
    const statsRow1 = [
        {
            title: 'Total Savings',
            value: `₹${totalSavings.toLocaleString()}`,
            icon: '🏆',
            bg: '#d4f5d4'
        },
        {
            title: 'Total Savings Accounts',
            value: totalSavingsAccounts,
            icon: '📋',
            bg: '#fdeccb'
        },
        {
            title: 'Total Shareholders',
            value: totalShareholders,
            subStats: [
                { label: "Active", value: activeMembers },
                { label: "Inactive", value: inactiveMembers },
                { label: "Closed", value: closedMembers },
                { label: "Others", value: otherMembers }
            ],
            icon: '👥',
            bg: '#fde8cf'
        },
        {
            title: 'Total Groups',
            value: totalGroups,
            icon: '👥',
            bg: '#e8d4f5'
        },
        {
            title: 'Day Transactions',
            value: todayTransactions.length,
            icon: '📊',
            bg: '#fde8cf'
        }
    ];

    // Second Row - 5 cards
    const statsRow2 = [
        {
            title: 'Day Collection',
            value: `₹${todayCollection.toLocaleString()}`,
            icon: '💰',
            bg: '#ffd4e5'
        },
        {
            title: 'No of Loans Approved',
            value: approvedLoans.length,
            icon: '✅',
            bg: '#fde8cf'
        },
        {
            title: 'Loan Disbursement',
            value: `₹${totalLoanDisbursement.toLocaleString()}`,
            icon: '💳',
            bg: '#d4e8f5'
        },
        {
            title: 'Loan Outstanding',
            value: `₹${totalLoanOutstanding.toLocaleString()}`,
            icon: '📉',
            bg: '#ffd4e5'
        },
        {
            title: 'Amount Withdrawal',
            value: `₹${totalWithdrawalAmount.toLocaleString()}`,
            icon: '🏦',
            bg: '#d4f5f5'
        }
    ];

    const recentGroups = groups.slice(0, 5);

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="mb-3">
                <h1 className="h4 fw-bold mb-0">Dashboard</h1>
            </div>

            {/* Dashboard Cards */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    {/* First Row - 5 Cards */}
                    <Row className="g-3 mb-3">
                        {statsRow1.map((item, index) => (
                            <Col key={index} xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>

                                <Card
                                    className="border-0 h-100"
                                    style={{ background: item.bg }}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>{item.title}</p>
                                                <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{item.value}</h5>
                                                {item.subStats && (
                                                    <div className="mt-2 d-flex justify-content-between" style={{ fontSize: '0.65rem' }}>
                                                        {item.subStats.map((stat, idx) => (
                                                            <div key={idx} className="text-center">
                                                                <div className="fw-semibold">{stat.label}</div>
                                                                <div className="fw-bold">{stat.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: "32px", height: "32px" }}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Second Row - 5 Cards */}
                    <Row className="g-3">
                        {statsRow2.map((item, index) => (
                            <Col key={index} xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>

                                <Card
                                    className="border-0 h-100"
                                    style={{ background: item.bg }}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>{item.title}</p>
                                                <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{item.value}</h5>
                                            </div>
                                            <div
                                                className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: "32px", height: "32px" }}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {/* DATE RANGE Section */}
            <Card className="border-0 shadow-sm mb-0">
                <Card.Body>
                    <h6 className="fw-semibold mb-3 text-uppercase" style={{ fontSize: '0.875rem' }}>DATE RANGE</h6>

                    {/* Date Range Inputs */}
                    <Row className="g-3 mb-3">
                        <Col xs={12} sm={4} md={3} lg={2}>
                            <input
                                type="date"
                                className="form-control"
                                style={{ height: '38px' }}
                                value={fromDate}
                                max={getDefaultToDate()}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    // If toDate is less than new fromDate, update toDate
                                    if (toDate && e.target.value > toDate) {
                                        setToDate(e.target.value);
                                    }
                                }}
                            />
                        </Col>
                        <Col xs={12} sm={4} md={3} lg={2}>
                            <input
                                type="date"
                                className="form-control"
                                style={{ height: '38px' }}
                                value={toDate}
                                min={fromDate}
                                max={getDefaultToDate()}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </Col>

                        <Col xs={12} sm={4} md={2} lg={1}>
                            <Button
                                variant="primary"
                                className="w-100 d-flex align-items-center justify-content-center"
                                style={{ height: '38px' }}
                                disabled={!fromDate || !toDate}
                            >
                                Show
                            </Button>
                        </Col>
                    </Row>

                    {/* Date Range Stats - First Row */}
                    <Row className="g-3 mb-3">
                        <Col xs={12} sm={6} lg={3}>
                            <Card className="border-0 h-100" style={{ background: "#d4f5d4" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.813rem' }}>Total Savings</p>
                                            <h4 className="fw-bold mb-0">₹{dateRangeSavings.toLocaleString()}</h4>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                                            <span style={{ fontSize: '1.25rem' }}>🏆</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} lg={3}>
                            <Card className="border-0 h-100" style={{ background: "#fdeccb" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.813rem' }}>Total Savings Accounts</p>
                                            <h4 className="fw-bold mb-0">{totalSavingsAccounts}</h4>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                                            <span style={{ fontSize: '1.25rem' }}>📋</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} lg={3}>
                            <Card className="border-0 h-100" style={{ background: "#d6f5d6" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.813rem' }}>Total Groups</p>
                                            <h4 className="fw-bold mb-0">{dateRangeGroups || totalGroups}</h4>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                                            <span style={{ fontSize: '1.25rem' }}>👥</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} lg={3}>
                            <Card className="border-0 h-100" style={{ background: "#fde8cf" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.813rem' }}>Total Shareholders</p>
                                            <h4 className="fw-bold mb-0">{totalShareholders}</h4>
                                            <div className="mt-2 d-flex justify-content-between" style={{ fontSize: '0.75rem' }}>
                                                <div className="text-center">
                                                    <div className="fw-semibold">Active</div>
                                                    <div className="fw-bold">{activeMembers}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="fw-semibold">Inactive</div>
                                                    <div className="fw-bold">{inactiveMembers}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="fw-semibold">Closed</div>
                                                    <div className="fw-bold">{closedMembers}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="fw-semibold">Others</div>
                                                    <div className="fw-bold">{otherMembers}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                                            <span style={{ fontSize: '1.25rem' }}>👥</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Date Range Stats - Second Row */}
                    <Row className="g-3 mb-3">
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#fff4e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Primary Members</p>
                                            <h5 className="fw-bold mb-0">{dateRangePrimaryMembers}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>👤</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Associate Members</p>
                                            <h5 className="fw-bold mb-0">{dateRangeAssociateMembers}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>👥</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#fff4e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Nominated Members</p>
                                            <h5 className="fw-bold mb-0">{dateRangeNominatedMembers}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>👤</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0f0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Total Transaction</p>
                                            <h5 className="fw-bold mb-0">{dateRangeTotalTransactions}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>📊</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#d6f5d6" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Savings Collection</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeSavingsCollection.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>💰</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#e0f4ff" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Income</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeIncome.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>💵</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Date Range Stats - Third Row */}
                    <Row className="g-3">
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#fff4e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>No of Loans Approved</p>
                                            <h5 className="fw-bold mb-0">{filteredData.loans.filter(l => l.status === 'approved').length}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>✅</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>No of Withdraw Approved</p>
                                            <h5 className="fw-bold mb-0">{filteredData.withdrawals.filter(w => w.status === 'approved').length}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>💸</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#e0f4ff" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Disbursement</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeLoanDisbursement.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>💳</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0f0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Collection</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeLoanCollection.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>💵</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Outstanding</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeLoanOutstanding.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>📉</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={2}>
                            <Card className="border-0 h-100" style={{ background: "#ffe0e0" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Amount Withdrawal</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>₹{dateRangeWithdrawalAmount.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                            <span style={{ fontSize: '1rem' }}>🏦</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
}
