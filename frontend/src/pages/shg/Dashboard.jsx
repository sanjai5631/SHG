import { useState, useMemo } from 'react';
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function Dashboard() {
    const { currentUser, getItems, getMemberLoans } = useApp();

    const groups = getItems('shgGroups');
    const members = getItems('members');
    const savings = getItems('savings');
    const loans = getItems('loans');
    const meetings = getItems('meetings');

    // Get user's assigned groups
    const myGroups = groups.filter(g => g.assignedTo === currentUser?.id);
    const myGroupIds = myGroups.map(g => g.id);

    // Get members in user's groups
    const myMembers = members.filter(m => myGroupIds.includes(m.groupId));

    // Get loans for user's groups
    const myLoans = loans.filter(l => {
        const member = members.find(m => m.id === l.memberId);
        return member && myGroupIds.includes(member.groupId);
    });

    // Get recent meetings
    const myMeetings = meetings
        .filter(m => myGroupIds.includes(m.groupId))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    // Calculate total savings collected
    const totalSavings = savings
        .filter(s => {
            const member = members.find(m => m.id === s.memberId);
            return member && myGroupIds.includes(member.groupId);
        })
        .reduce((sum, s) => sum + s.amount, 0);

    // Calculate total repayments
    const totalRepayments = loans
        .filter(l => {
            const member = members.find(m => m.id === l.memberId);
            return member && myGroupIds.includes(member.groupId) && l.status === 'approved';
        })
        .reduce((sum, l) => sum + (l.amountPaid || 0), 0);

    // Calculate active members
    const activeMembers = myMembers.filter(m => m.status === 'active').length;
    const inactiveMembers = myMembers.filter(m => m.status === 'inactive').length;
    const closedMembers = myMembers.filter(m => m.status === 'closed').length;
    const otherMembers = myMembers.length - activeMembers - inactiveMembers - closedMembers;

    // Today's transactions
    const today = new Date().toISOString().split("T")[0];
    const todayTransactions = savings.filter(s => {
        const member = members.find(m => m.id === s.memberId);
        return member && myGroupIds.includes(member.groupId) && s.date === today;
    });
    const todayCollection = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Loan stats
    const approvedLoans = myLoans.filter(l => l.status === 'approved');
    const totalLoanDisbursement = approvedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalLoanOutstanding = approvedLoans.reduce((sum, loan) => sum + (loan.balance || loan.amount - (loan.amountPaid || 0)), 0);

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
        if (!fromDate || !toDate) return { savings: [], loans: [] };

        const mySavings = savings.filter(s => {
            const member = members.find(m => m.id === s.memberId);
            return member && myGroupIds.includes(member.groupId);
        });

        return {
            savings: mySavings.filter((s) => s.date >= fromDate && s.date <= toDate),
            loans: myLoans.filter((l) => l.disbursementDate >= fromDate && l.disbursementDate <= toDate)
        };
    }, [fromDate, toDate, savings, myLoans, members, myGroupIds]);

    const dateRangeSavings = filteredData.savings.reduce((sum, s) => sum + s.amount, 0);
    const dateRangeTotalTransactions = filteredData.savings.length;
    const dateRangeLoanDisbursement = filteredData.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.amount, 0);
    const dateRangeLoanCollection = filteredData.loans.reduce((sum, l) => sum + (l.amountPaid || 0), 0);
    const dateRangeLoanOutstanding = filteredData.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.balance || l.amount - (l.amountPaid || 0)), 0);

    // First Row - 5 cards
    const statsRow1 = [
        {
            title: 'Total Savings',
            value: `₹${totalSavings.toLocaleString()}`,
            icon: '🏆',
            bg: '#d4f5d4'
        },
        {
            title: 'My Groups',
            value: myGroups.length,
            icon: '🏘️',
            bg: '#fdeccb'
        },
        {
            title: 'Total Members',
            value: myMembers.length,
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
            title: 'Active Loans',
            value: approvedLoans.length,
            icon: '💳',
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
            title: 'Meetings Held',
            value: myMeetings.length,
            icon: '📝',
            bg: '#fde8cf'
        },
        {
            title: 'Total Repayments',
            value: `₹${totalRepayments.toLocaleString()}`,
            icon: '💵',
            bg: '#e8d4f5'
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
        }
    ];

    return (
        <div className="fade-in">
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
                                className="w-100"
                                style={{ height: '38px' }}
                                disabled={!fromDate || !toDate}
                            >
                                Show
                            </Button>
                        </Col>
                    </Row>

                    {/* Date Range Stats - First Row (5 cards) */}
                    < Row className="g-3 mb-3" >
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#d4f5d4" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Total Savings</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>₹{dateRangeSavings.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>🏆</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#fdeccb" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>My Groups</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{myGroups.length}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>🏘️</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#fde8cf" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Total Members</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{myMembers.length}</h5>
                                            <div className="mt-2 d-flex justify-content-between" style={{ fontSize: '0.65rem' }}>
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
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>👥</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#e8d4f5" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Active Loans</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{filteredData.loans.filter(l => l.status === 'approved').length}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>💳</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#fde8cf" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Total Transactions</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{dateRangeTotalTransactions}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>📊</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row >

                    {/* Date Range Stats - Second Row (5 cards) */}
                    < Row className="g-3" >
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#ffd4e5" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Savings Collection</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>₹{dateRangeSavings.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>💰</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#fde8cf" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Meetings Held</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{myMeetings.length}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>📝</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#d4e8f5" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Disbursement</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>₹{dateRangeLoanDisbursement.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>💳</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#e8d4f5" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Collection</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>₹{dateRangeLoanCollection.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>💵</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={4} style={{ flex: '1 1 0' }}>
                            <Card className="border-0 h-100" style={{ background: "#ffd4e5" }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Loan Outstanding</p>
                                            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>₹{dateRangeLoanOutstanding.toLocaleString()}</h5>
                                        </div>
                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <span style={{ fontSize: '0.9rem' }}>📉</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row >
                </Card.Body >
            </Card >

        </div >
    );
}
