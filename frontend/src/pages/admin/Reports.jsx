import { useState, useEffect, useRef } from 'react';
import { Card, Form, Row, Col, Table, Button, Badge, Container, Nav, Tab, ButtonGroup } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    FaUsers, FaCalendarAlt, FaChartBar, FaChartLine,
    FaFilePdf, FaFileExcel, FaSearch, FaFilter, FaDownload,
    FaMoneyBillWave, FaHandHoldingUsd, FaPiggyBank, FaUserPlus,
    FaThLarge, FaList, FaTimes
} from 'react-icons/fa';

export default function Reports() {
    const { data } = useApp();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [reportType, setReportType] = useState('memberwise'); // Default to memberwise
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('2024');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Search state management
    const [memberwiseSearched, setMemberwiseSearched] = useState(false);
    const [daywiseSearched, setDaywiseSearched] = useState(false);
    const [monthlySearched, setMonthlySearched] = useState(false);
    const [annualSearched, setAnnualSearched] = useState(false);

    // Memberwise report state
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('card');
    const [localGroup, setLocalGroup] = useState('');
    const [localMemberwiseDateRange, setLocalMemberwiseDateRange] = useState({ startDate: '', endDate: '' });

    // Daywise report state
    const [localDaywiseDateRange, setLocalDaywiseDateRange] = useState({ startDate: '', endDate: '' });

    // Monthly report state
    const [localMonth, setLocalMonth] = useState('');
    const [localMonthYear, setLocalMonthYear] = useState('2024');

    // Annual report state
    const [localAnnualYear, setLocalAnnualYear] = useState('2024');

    // Member selection for memberwise report
    const [selectedMember, setSelectedMember] = useState('');

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
        { value: 'memberwise', label: 'Memberwise Report', icon: <FaUsers /> },
        { value: 'daywise', label: 'Daywise Report', icon: <FaCalendarAlt /> },
        { value: 'monthly', label: 'Monthly Report', icon: <FaChartBar /> },
        { value: 'annual', label: 'Annual Report', icon: <FaChartLine /> }
    ];

    // Calculate member-wise data
    const getMemberWiseData = () => {
        const { startDate, endDate } = dateRange;

        return data.members
            .filter(m => !selectedGroup || m.groupId === parseInt(selectedGroup))
            .map(member => {
                // All time stats
                const allSavings = data.savings.filter(s => s.memberId === member.id);
                const totalSavings = allSavings.reduce((sum, s) => sum + s.amount, 0);

                const allLoans = data.loans.filter(l => l.memberId === member.id);
                const totalLoans = allLoans.reduce((sum, l) => sum + l.amount, 0);

                const allRepayments = data.loanRepayments.filter(r => {
                    const loan = data.loans.find(l => l.id === r.loanId);
                    return loan && loan.memberId === member.id;
                });
                const totalRepayments = allRepayments.reduce((sum, r) => sum + r.amount, 0);
                const pendingDues = totalLoans - totalRepayments;

                const lastPayment = allRepayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                const lastPaymentDate = lastPayment ? lastPayment.date : 'N/A';

                // Period stats
                let periodSavings = totalSavings;
                let periodLoans = totalLoans;

                if (startDate && endDate) {
                    periodSavings = allSavings
                        .filter(s => s.date >= startDate && s.date <= endDate)
                        .reduce((sum, s) => sum + s.amount, 0);

                    periodLoans = allLoans
                        .filter(l => l.approvedDate >= startDate && l.approvedDate <= endDate)
                        .reduce((sum, l) => sum + l.amount, 0);
                }

                const group = data.shgGroups.find(g => g.id === member.groupId);

                return {
                    ...member,
                    groupName: group?.name || 'N/A',
                    totalSavings,
                    totalLoans,
                    pendingDues,
                    lastPaymentDate,
                    periodSavings,
                    periodLoans,
                    displaySavings: startDate && endDate ? periodSavings : totalSavings,
                    displayLoans: startDate && endDate ? periodLoans : totalLoans
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

        // Add loan disbursements
        data.loans.forEach(l => {
            if (l.status === 'approved' && l.approvedDate >= startDate && l.approvedDate <= endDate) {
                const member = data.members.find(m => m.id === l.memberId);
                transactions.push({
                    date: l.approvedDate,
                    type: 'Loan Disbursement',
                    member: member?.name || 'Unknown',
                    product: 'Loan',
                    amount: l.amount,
                    balance: l.amount
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
        const daysInMonth = new Date(selectedYear, monthIndex, 0).getDate();

        const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${selectedYear}-${monthStr}-${String(day).padStart(2, '0')}`;
            return {
                day,
                date: dateStr,
                savings: 0,
                repayments: 0,
                loans: 0,
                collection: 0
            };
        });

        // Fill daily data
        data.savings.forEach(s => {
            if (s.date.startsWith(`${selectedYear}-${monthStr}`)) {
                const day = parseInt(s.date.split('-')[2]);
                if (dailyData[day - 1]) {
                    dailyData[day - 1].savings += s.amount;
                    dailyData[day - 1].collection += s.amount;
                }
            }
        });

        data.loanRepayments.forEach(r => {
            if (r.date.startsWith(`${selectedYear}-${monthStr}`)) {
                const day = parseInt(r.date.split('-')[2]);
                if (dailyData[day - 1]) {
                    dailyData[day - 1].repayments += r.amount;
                    dailyData[day - 1].collection += r.amount;
                }
            }
        });

        data.loans.forEach(l => {
            if (l.approvedDate && l.approvedDate.startsWith(`${selectedYear}-${monthStr}`)) {
                const day = parseInt(l.approvedDate.split('-')[2]);
                if (dailyData[day - 1]) {
                    dailyData[day - 1].loans += l.amount;
                }
            }
        });

        const totalSavings = dailyData.reduce((sum, d) => sum + d.savings, 0);
        const totalRepayments = dailyData.reduce((sum, d) => sum + d.repayments, 0);
        const loansIssued = dailyData.reduce((sum, d) => sum + d.loans, 0);

        const newMembers = data.members
            .filter(m => m.joinDate && m.joinDate.startsWith(`${selectedYear}-${monthStr}`))
            .length;

        return {
            totalSavings,
            totalRepayments,
            loansIssued,
            newMembers,
            netCashFlow: totalSavings + totalRepayments - loansIssued,
            dailyData
        };
    };

    // Calculate annual data
    const getAnnualData = () => {
        if (!selectedYear) return null;

        const monthlyData = months.map((month, index) => {
            const monthStr = String(index + 1).padStart(2, '0');
            const datePrefix = `${selectedYear}-${monthStr}`;

            const savings = data.savings
                .filter(s => s.date.startsWith(datePrefix))
                .reduce((sum, s) => sum + s.amount, 0);

            const repayments = data.loanRepayments
                .filter(r => r.date.startsWith(datePrefix))
                .reduce((sum, r) => sum + r.amount, 0);

            const loans = data.loans
                .filter(l => l.approvedDate && l.approvedDate.startsWith(datePrefix))
                .reduce((sum, l) => sum + l.amount, 0);

            return {
                month: month.substring(0, 3),
                savings,
                repayments,
                loans,
                netFlow: savings + repayments - loans
            };
        });

        const totalSavings = monthlyData.reduce((sum, m) => sum + m.savings, 0);
        const totalRepayments = monthlyData.reduce((sum, m) => sum + m.repayments, 0);
        const loansIssued = monthlyData.reduce((sum, m) => sum + m.loans, 0);

        const newMembers = data.members
            .filter(m => m.joinDate && m.joinDate.startsWith(selectedYear))
            .length;

        const activeLoans = data.loans.filter(l => l.status === 'approved').length;
        const pendingLoans = data.loans.filter(l => l.status === 'pending').length;

        // Calculate interest (approximate from repayments for demo)
        const totalInterest = totalRepayments * 0.15; // Assuming 15% interest component

        return {
            totalSavings,
            totalRepayments,
            loansIssued,
            newMembers,
            activeLoans,
            pendingLoans,
            totalInterest,
            netCashFlow: totalSavings + totalRepayments - loansIssued,
            monthlyData
        };
    };

    const renderMemberwiseReport = () => {
        const handleSearch = () => {
            setSelectedGroup(localGroup);
            setDateRange(localMemberwiseDateRange);
            setMemberwiseSearched(true);
        };

        const handleClear = () => {
            setSelectedMember('');
            setLocalGroup('');
            setLocalMemberwiseDateRange({ startDate: '', endDate: '' });
            setSearchTerm('');
            setMemberwiseSearched(false);
        };

        const memberData = memberwiseSearched ? getMemberWiseData().filter(m => {
            // Filter by selected member if specified
            if (selectedMember && selectedMember !== 'all') {
                return m.id === parseInt(selectedMember);
            }
            return true;
        }) : [];

        const exportToPDF = () => {
            const doc = new jsPDF();
            doc.text("Memberwise Report", 14, 15);

            const tableColumn = ["Name", "Group", "Total Savings", "Total Loans", "Pending Dues", "Last Payment"];
            const tableRows = memberData.map(m => [
                m.name,
                m.groupName,
                `Rs. ${m.displaySavings}`,
                `Rs. ${m.displayLoans}`,
                `Rs. ${m.pendingDues}`,
                m.lastPaymentDate !== 'N/A' ? new Date(m.lastPaymentDate).toLocaleDateString() : 'N/A'
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });
            doc.save("memberwise_report.pdf");
        };

        const exportToExcel = () => {
            const ws = XLSX.utils.json_to_sheet(memberData.map(m => ({
                Name: m.name,
                Group: m.groupName,
                'Total Savings': m.displaySavings,
                'Total Loans': m.displayLoans,
                'Pending Dues': m.pendingDues,
                'Last Payment': m.lastPaymentDate
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Members");
            XLSX.writeFile(wb, "memberwise_report.xlsx");
        };

        return (
            <div className="fade-in">
                {/* Search and Filters */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Row className="g-3 align-items-end">
                            <Col md={4}>
                                <Form.Label className="small fw-bold text-muted mb-2">
                                    <FaSearch className="me-2" />Search Member
                                </Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                >
                                    <option value="">Select a member...</option>
                                    <option value="all">All Members</option>
                                    {data.members.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} {member.employeeCode ? `(${member.employeeCode})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-muted mb-2">
                                    <FaFilter className="me-2" />Group
                                </Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={localGroup}
                                    onChange={(e) => setLocalGroup(e.target.value)}
                                >
                                    <option value="">All Groups</option>
                                    {data.shgGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-muted mb-2">Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={localMemberwiseDateRange.startDate}
                                    onChange={(e) => setLocalMemberwiseDateRange({ ...localMemberwiseDateRange, startDate: e.target.value })}
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-muted mb-2">End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={localMemberwiseDateRange.endDate}
                                    onChange={(e) => setLocalMemberwiseDateRange({ ...localMemberwiseDateRange, endDate: e.target.value })}
                                />
                            </Col>
                            <Col md={1}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={handleSearch}
                                    disabled={!selectedMember}
                                >
                                    <FaSearch />
                                </Button>
                            </Col>
                            <Col md={1}>
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

                {/* Results Section */}
                {!memberwiseSearched ? (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaSearch size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Select a member to view reports</h5>
                            <p className="text-muted small mb-0">Choose a specific member or "All Members" from the dropdown above and click Search</p>
                        </Card.Body>
                    </Card>
                ) : (
                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-muted mb-0">Report Data</h6>
                            <div className="d-flex gap-2">
                                <Button variant="outline-danger" size="sm" onClick={exportToPDF} title="Export PDF">
                                    <FaFilePdf className="me-1" /> PDF
                                </Button>
                                <Button variant="outline-success" size="sm" onClick={exportToExcel} title="Export Excel">
                                    <FaFileExcel className="me-1" /> Excel
                                </Button>
                            </div>
                        </div>

                        {memberData.length > 0 ? (
                            <div className="table-responsive shadow-sm">
                                <div className="excel-header">
                                    <FaList className="me-2" /> Member Details
                                </div>
                                <table className="table table-hover mb-0 excel-table bg-white">
                                    <thead>
                                        <tr>
                                            <th>Member Name</th>
                                            <th>Employee Code</th>
                                            <th>Group Name</th>
                                            <th className="text-end">Total Savings</th>
                                            <th className="text-end">Total Loans</th>
                                            <th className="text-end">Pending Dues</th>
                                            <th className="text-end">Last Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberData.map(member => (
                                            <tr key={member.id}>
                                                <td className="fw-medium">{member.name}</td>
                                                <td>{member.employeeCode || '-'}</td>
                                                <td>{member.groupName}</td>
                                                <td className="text-end text-success">₹{member.displaySavings.toLocaleString()}</td>
                                                <td className="text-end text-primary">₹{member.displayLoans.toLocaleString()}</td>
                                                <td className="text-end text-danger fw-bold">₹{member.pendingDues.toLocaleString()}</td>
                                                <td className="text-end">
                                                    {member.lastPaymentDate !== 'N/A' ? new Date(member.lastPaymentDate).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="text-center py-4">
                                    <p className="text-muted mb-0">No data found for the selected criteria</p>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        );
    };
    const renderDaywiseReport = () => {
        const handleSearch = () => {
            setDateRange(localDaywiseDateRange);
            setDaywiseSearched(true);
        };

        const dayData = daywiseSearched ? getDayWiseData() : [];

        const summary = dayData.reduce((acc, curr) => {
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
        }, { collection: 0, payments: 0, recovery: 0, newLoans: 0, savings: 0 });

        const exportToPDF = () => {
            const doc = new jsPDF();
            doc.text("Daywise Report", 14, 15);
            doc.text(`From: ${localDaywiseDateRange.startDate} To: ${localDaywiseDateRange.endDate}`, 14, 22);

            const tableColumn = ["Date", "Type", "Member", "Product", "Amount"];
            const tableRows = dayData.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.type,
                t.member,
                t.product,
                `Rs. ${t.amount.toLocaleString()}`
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 30,
            });
            doc.save("daywise_report.pdf");
        };

        const exportToExcel = () => {
            const ws = XLSX.utils.json_to_sheet(dayData.map(t => ({
                Date: new Date(t.date).toLocaleDateString(),
                Type: t.type,
                Member: t.member,
                Product: t.product,
                Amount: t.amount
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transactions");
            XLSX.writeFile(wb, "daywise_report.xlsx");
        };

        return (
            <div className="fade-in">
                {/* Date Filter */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Row className="align-items-end">
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-2">
                                    <FaCalendarAlt className="me-2" />Start Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={localDaywiseDateRange.startDate}
                                    onChange={(e) => setLocalDaywiseDateRange({ ...localDaywiseDateRange, startDate: e.target.value })}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-2">End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={localDaywiseDateRange.endDate}
                                    onChange={(e) => setLocalDaywiseDateRange({ ...localDaywiseDateRange, endDate: e.target.value })}
                                />
                            </Col>
                            <Col md={3}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={handleSearch}
                                    disabled={!localDaywiseDateRange.startDate || !localDaywiseDateRange.endDate}
                                >
                                    <FaSearch className="me-2" />
                                    Search Reports
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Results Section */}
                {!daywiseSearched ? (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaCalendarAlt size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Please search to view reports</h5>
                            <p className="text-muted small mb-0">Select a date range above and click "Search Reports" to view transactions</p>
                        </Card.Body>
                    </Card>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-start border-4 border-success">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted small mb-1 fw-bold text-uppercase">Total Collection</p>
                                                <h4 className="mb-0 fw-bold text-success">₹{summary.collection.toLocaleString()}</h4>
                                            </div>
                                            <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success">
                                                <FaHandHoldingUsd size={20} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-start border-4 border-danger">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted small mb-1 fw-bold text-uppercase">Total Payments</p>
                                                <h4 className="mb-0 fw-bold text-danger">₹{summary.payments.toLocaleString()}</h4>
                                            </div>
                                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                                                <FaMoneyBillWave size={20} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-start border-4 border-info">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted small mb-1 fw-bold text-uppercase">Loan Recovery</p>
                                                <h4 className="mb-0 fw-bold text-info">₹{summary.recovery.toLocaleString()}</h4>
                                            </div>
                                            <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info">
                                                <FaPiggyBank size={20} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-start border-4 border-warning">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted small mb-1 fw-bold text-uppercase">New Loans</p>
                                                <h4 className="mb-0 fw-bold text-warning">₹{summary.newLoans.toLocaleString()}</h4>
                                            </div>
                                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning">
                                                <FaUserPlus size={20} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Transactions Table */}
                        {dayData.length > 0 ? (
                            <div className="mt-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-muted mb-0">Transaction Details</h6>
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-danger" size="sm" onClick={exportToPDF} title="Export PDF">
                                            <FaFilePdf className="me-1" /> PDF
                                        </Button>
                                        <Button variant="outline-success" size="sm" onClick={exportToExcel} title="Export Excel">
                                            <FaFileExcel className="me-1" /> Excel
                                        </Button>
                                    </div>
                                </div>
                                <div className="table-responsive shadow-sm">
                                    <div className="excel-header">
                                        <FaList className="me-2" /> Transactions
                                    </div>
                                    <table className="table table-hover mb-0 excel-table bg-white">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Member</th>
                                                <th>Product</th>
                                                <th className="text-end">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayData.map((transaction, idx) => (
                                                <tr key={idx}>
                                                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <Badge bg={
                                                            transaction.type === 'Savings' ? 'success' :
                                                                transaction.type === 'Loan Repayment' ? 'info' :
                                                                    'warning'
                                                        }>
                                                            {transaction.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="fw-medium">{transaction.member}</td>
                                                    <td>{transaction.product}</td>
                                                    <td className="text-end fw-bold">₹{transaction.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="text-center py-4">
                                    <p className="text-muted mb-0">No transactions found for the selected date range</p>
                                </Card.Body>
                            </Card>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderMonthlyReport = () => {
        const handleSearch = () => {
            setSelectedMonth(localMonth);
            setSelectedYear(localMonthYear);
            setMonthlySearched(true);
        };

        const monthData = monthlySearched ? getMonthlyData() : null;

        const exportMonthlyPDF = () => {
            if (!monthData) return;
            const doc = new jsPDF();
            doc.text(`Monthly Report - ${selectedMonth} ${selectedYear}`, 14, 15);

            doc.autoTable({
                head: [['Category', 'Amount']],
                body: [
                    ['Total Savings', `Rs. ${monthData.totalSavings}`],
                    ['Total Repayments', `Rs. ${monthData.totalRepayments}`],
                    ['Total Inflow', `Rs. ${monthData.totalSavings + monthData.totalRepayments}`],
                    ['Loans Issued', `Rs. ${monthData.loansIssued}`],
                    ['Net Cash Flow', `Rs. ${monthData.netCashFlow}`],
                    ['New Members', monthData.newMembers]
                ],
                startY: 20
            });
            doc.save(`monthly_report_${selectedMonth}_${selectedYear}.pdf`);
        };

        const exportMonthlyExcel = () => {
            if (!monthData) return;
            const ws = XLSX.utils.json_to_sheet([
                { Category: 'Total Savings', Amount: monthData.totalSavings },
                { Category: 'Total Repayments', Amount: monthData.totalRepayments },
                { Category: 'Total Inflow', Amount: monthData.totalSavings + monthData.totalRepayments },
                { Category: 'Loans Issued', Amount: monthData.loansIssued },
                { Category: 'Net Cash Flow', Amount: monthData.netCashFlow },
                { Category: 'New Members', Amount: monthData.newMembers }
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");
            XLSX.writeFile(wb, `monthly_report_${selectedMonth}_${selectedYear}.xlsx`);
        };

        return (
            <div className="fade-in">
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Row className="align-items-end">
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-2">
                                    <FaChartBar className="me-2" />Month
                                </Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={localMonth}
                                    onChange={(e) => setLocalMonth(e.target.value)}
                                >
                                    <option value="">Select Month</option>
                                    {months.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-2">Year</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={localMonthYear}
                                    onChange={(e) => setLocalMonthYear(e.target.value)}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={handleSearch}
                                    disabled={!localMonth}
                                >
                                    <FaSearch className="me-2" />
                                    Search Reports
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {!monthlySearched ? (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaChartBar size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Please search to view reports</h5>
                            <p className="text-muted small mb-0">Select a month and year above and click "Search Reports" to view monthly data</p>
                        </Card.Body>
                    </Card>
                ) : monthData ? (
                    <>
                        {/* Charts */}
                        <Row className="mb-4">
                            <Col md={8}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white">
                                        <h6 className="mb-0 fw-bold">Daily Collection & Repayment</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={monthData.dailyData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="day" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="collection" fill="#4facfe" name="Collection" />
                                                <Bar dataKey="repayments" fill="#f093fb" name="Repayments" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white">
                                        <h6 className="mb-0 fw-bold">Distribution</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Savings', value: monthData.totalSavings },
                                                        { name: 'Repayments', value: monthData.totalRepayments },
                                                        { name: 'Loans Issued', value: monthData.loansIssued }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#0088FE" />
                                                    <Cell fill="#00C49F" />
                                                    <Cell fill="#FFBB28" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Summary Table */}
                        <div className="mt-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-muted mb-0">Monthly Summary</h6>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-danger" size="sm" onClick={exportMonthlyPDF} title="Export PDF">
                                        <FaFilePdf className="me-1" /> PDF
                                    </Button>
                                    <Button variant="outline-success" size="sm" onClick={exportMonthlyExcel} title="Export Excel">
                                        <FaFileExcel className="me-1" /> Excel
                                    </Button>
                                </div>
                            </div>
                            <div className="table-responsive shadow-sm">
                                <div className="excel-header">
                                    <FaList className="me-2" /> Summary Data
                                </div>
                                <table className="table table-hover mb-0 excel-table bg-white">
                                    <tbody>
                                        <tr>
                                            <td className="fw-medium">Total Inflow (Savings + Repayments)</td>
                                            <td className="text-end fw-bold text-success">₹{(monthData.totalSavings + monthData.totalRepayments).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-medium">Total Outflow (Loans Issued)</td>
                                            <td className="text-end fw-bold text-danger">₹{monthData.loansIssued.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-medium">Net Cash Flow</td>
                                            <td className="text-end fw-bold text-primary">₹{monthData.netCashFlow.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-medium">New Members Joined</td>
                                            <td className="text-end fw-bold">{monthData.newMembers}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-4">
                            <p className="text-muted mb-0">No data available for the selected period</p>
                        </Card.Body>
                    </Card>
                )}
            </div>
        );
    };

    const renderAnnualReport = () => {
        const handleSearch = () => {
            setSelectedYear(localAnnualYear);
            setAnnualSearched(true);
        };

        const annualData = annualSearched ? getAnnualData() : null;

        const exportAnnualPDF = () => {
            if (!annualData) return;
            const doc = new jsPDF();
            doc.text(`Annual Report - ${selectedYear}`, 14, 15);

            // Summary Table
            doc.autoTable({
                head: [['Category', 'Amount']],
                body: [
                    ['Total Savings', `Rs. ${annualData.totalSavings}`],
                    ['Total Repayments', `Rs. ${annualData.totalRepayments}`],
                    ['Loans Issued', `Rs. ${annualData.loansIssued}`],
                    ['Net Cash Flow', `Rs. ${annualData.netCashFlow}`],
                    ['New Members', annualData.newMembers],
                    ['Active Loans', annualData.activeLoans]
                ],
                startY: 20
            });

            // Monthly Breakdown
            doc.text("Monthly Breakdown", 14, doc.lastAutoTable.finalY + 15);
            doc.autoTable({
                head: [['Month', 'Savings', 'Repayments', 'Loans Issued', 'Net Flow']],
                body: annualData.monthlyData.map(m => [
                    m.month,
                    `Rs. ${m.savings}`,
                    `Rs. ${m.repayments}`,
                    `Rs. ${m.loans}`,
                    `Rs. ${m.netFlow}`
                ]),
                startY: doc.lastAutoTable.finalY + 20
            });

            doc.save(`annual_report_${selectedYear}.pdf`);
        };

        const exportAnnualExcel = () => {
            if (!annualData) return;

            const wb = XLSX.utils.book_new();

            // Summary Sheet
            const wsSummary = XLSX.utils.json_to_sheet([
                { Category: 'Total Savings', Amount: annualData.totalSavings },
                { Category: 'Total Repayments', Amount: annualData.totalRepayments },
                { Category: 'Loans Issued', Amount: annualData.loansIssued },
                { Category: 'Net Cash Flow', Amount: annualData.netCashFlow },
                { Category: 'New Members', Amount: annualData.newMembers },
                { Category: 'Active Loans', Amount: annualData.activeLoans }
            ]);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

            // Monthly Sheet
            const wsMonthly = XLSX.utils.json_to_sheet(annualData.monthlyData);
            XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Breakdown");

            XLSX.writeFile(wb, `annual_report_${selectedYear}.xlsx`);
        };

        return (
            <div className="fade-in">
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Row className="align-items-end">
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-2">
                                    <FaChartLine className="me-2" />Year
                                </Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={localAnnualYear}
                                    onChange={(e) => setLocalAnnualYear(e.target.value)}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={handleSearch}
                                >
                                    <FaSearch className="me-2" />
                                    Search Reports
                                </Button>
                            </Col>
                            {annualSearched && annualData && (
                                <Col md={6} className="d-flex justify-content-end gap-2">
                                    <Button variant="outline-danger" size="sm" onClick={exportAnnualPDF}>
                                        <FaFilePdf className="me-2" /> Export Report
                                    </Button>
                                    <Button variant="outline-success" size="sm" onClick={exportAnnualExcel}>
                                        <FaFileExcel className="me-2" /> Export Data
                                    </Button>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                {!annualSearched ? (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaChartLine size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Please search to view reports</h5>
                            <p className="text-muted small mb-0">Select a year above and click "Search Reports" to view annual data</p>
                        </Card.Body>
                    </Card>
                ) : annualData ? (
                    <>
                        {/* KPI Cards */}
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-bottom border-4 border-primary">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="text-muted small mb-0 text-uppercase fw-bold">Total Savings</h6>
                                            <FaPiggyBank className="text-primary" size={20} />
                                        </div>
                                        <h3 className="fw-bold mb-0">₹{annualData.totalSavings.toLocaleString()}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-bottom border-4 border-success">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="text-muted small mb-0 text-uppercase fw-bold">Loan Repayments</h6>
                                            <FaHandHoldingUsd className="text-success" size={20} />
                                        </div>
                                        <h3 className="fw-bold mb-0">₹{annualData.totalRepayments.toLocaleString()}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-bottom border-4 border-warning">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="text-muted small mb-0 text-uppercase fw-bold">Loans Issued</h6>
                                            <FaMoneyBillWave className="text-warning" size={20} />
                                        </div>
                                        <h3 className="fw-bold mb-0">₹{annualData.loansIssued.toLocaleString()}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100 border-bottom border-4 border-info">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="text-muted small mb-0 text-uppercase fw-bold">Net Cash Flow</h6>
                                            <FaChartLine className="text-info" size={20} />
                                        </div>
                                        <h3 className="fw-bold mb-0">₹{annualData.netCashFlow.toLocaleString()}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Trend Graph */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white py-3">
                                <h6 className="mb-0 fw-bold">Annual Financial Trend</h6>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={annualData.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorRepayments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="savings" stroke="#8884d8" fillOpacity={1} fill="url(#colorSavings)" name="Savings" />
                                        <Area type="monotone" dataKey="repayments" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRepayments)" name="Repayments" />
                                        <Area type="monotone" dataKey="loans" stroke="#ffc658" fill="none" strokeWidth={2} name="Loans Issued" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>

                        {/* Additional Stats */}
                        <Row className="g-3">
                            <Col md={6}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
                                            <FaUsers size={24} />
                                        </div>
                                        <div>
                                            <p className="text-muted small mb-1">New Members Joined</p>
                                            <h4 className="fw-bold mb-0">{annualData.newMembers}</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
                                            <FaChartBar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-muted small mb-1">Active Loans</p>
                                            <h4 className="fw-bold mb-0">{annualData.activeLoans}</h4>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                ) : (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-4">
                            <p className="text-muted mb-0">No data available for the selected year</p>
                        </Card.Body>
                    </Card>
                )}
            </div>
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

    const renderReportContent = () => {
        if (!reportType) {
            return (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div className="mb-3 opacity-25">
                            <FaChartBar size={60} />
                        </div>
                        <h5 className="text-muted mb-2">Select a Report Type</h5>
                        <p className="text-muted small mb-0">Choose a report type from the dropdown above to get started</p>
                    </Card.Body>
                </Card>
            );
        }

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

    return (
        <div className="fade-in">
            {/* Dashboard Cards Section */}
            <div className="mb-4">
                <Row className="g-3">
                    {reportTypes.map(type => (
                        <Col md={3} key={type.value}>
                            <Card
                                className={`border-0 shadow-sm h-100 cursor-pointer transition-all ${reportType === type.value ? 'ring-2 ring-primary bg-primary bg-opacity-10' : 'hover-shadow'}`}
                                onClick={() => {
                                    setReportType(type.value);
                                    // Reset search states
                                    setMemberwiseSearched(false);
                                    setDaywiseSearched(false);
                                    setMonthlySearched(false);
                                    setAnnualSearched(false);
                                }}
                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Card.Body className="d-flex align-items-center p-3">
                                    <div className={`rounded-circle p-3 me-3 ${reportType === type.value ? 'bg-primary text-white' : 'bg-light text-primary'}`}>
                                        {type.icon}
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">{type.label}</h6>
                                        <small className="text-muted">Click to view</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Excel Table Styles */}
            <style>{`
                .excel-table {
                    border: 1px solid #d1d5db;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .excel-table thead th {
                    background-color: #f8f9fa;
                    border-bottom: 2px solid #d1d5db;
                    border-right: 1px solid #e5e7eb;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 0.85rem;
                    padding: 12px;
                    vertical-align: middle;
                }
                .excel-table tbody td {
                    border-bottom: 1px solid #e5e7eb;
                    border-right: 1px solid #e5e7eb;
                    padding: 10px 12px;
                    font-size: 0.9rem;
                    color: #1f2937;
                    vertical-align: middle;
                }
                .excel-table tbody tr:hover {
                    background-color: #f3f4f6;
                }
                .excel-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .excel-header {
                    background-color: #107c41;
                    color: white;
                    padding: 8px 16px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    border-radius: 4px 4px 0 0;
                }
            `}</style>

            {renderReportContent()}
        </div>
    );
}
