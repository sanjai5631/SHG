import { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTimes, FaFilePdf, FaFileExcel, FaList } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function MemberwiseReport({ data }) {
    const [memberwiseSearched, setMemberwiseSearched] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [localGroup, setLocalGroup] = useState('');
    const [localMemberwiseDateRange, setLocalMemberwiseDateRange] = useState({ startDate: '', endDate: '' });
    const [selectedGroup, setSelectedGroup] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Calculate member-wise data
    const getMemberWiseData = () => {
        const { startDate, endDate } = dateRange;
        const transactions = [];

        const members = data.members
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

        // Collect transactions for selected members
        const selectedMemberIds = members.map(m => m.id);

        // Add savings transactions
        data.savings.forEach(s => {
            if (selectedMemberIds.includes(s.memberId)) {
                const shouldInclude = !startDate || !endDate || (s.date >= startDate && s.date <= endDate);
                if (shouldInclude) {
                    const member = data.members.find(m => m.id === s.memberId);
                    const group = data.shgGroups.find(g => g.id === member?.groupId);
                    const product = data.savingProducts.find(p => p.id === s.productId);

                    transactions.push({
                        date: s.date,
                        memberName: member?.name || 'Unknown',
                        groupName: group?.name || 'N/A',
                        transactionNo: s.id,
                        mobileNo: member?.phone || 'N/A',
                        product: product?.name || 'Savings',
                        amount: s.amount,
                        type: 'Savings',
                        memberCode: member?.employeeCode || 'N/A'
                    });
                }
            }
        });

        // Add loan repayments
        data.loanRepayments.forEach(r => {
            const loan = data.loans.find(l => l.id === r.loanId);
            if (loan && selectedMemberIds.includes(loan.memberId)) {
                const shouldInclude = !startDate || !endDate || (r.date >= startDate && r.date <= endDate);
                if (shouldInclude) {
                    const member = data.members.find(m => m.id === loan.memberId);
                    const group = data.shgGroups.find(g => g.id === member?.groupId);

                    transactions.push({
                        date: r.date,
                        memberName: member?.name || 'Unknown',
                        groupName: group?.name || 'N/A',
                        transactionNo: r.id,
                        mobileNo: member?.phone || 'N/A',
                        product: 'Loan Repayment',
                        amount: r.amount,
                        type: 'Repayment',
                        memberCode: member?.employeeCode || 'N/A'
                    });
                }
            }
        });

        // Add loan disbursements
        data.loans.forEach(l => {
            if (selectedMemberIds.includes(l.memberId) && l.status === 'approved') {
                const shouldInclude = !startDate || !endDate || (l.approvedDate && l.approvedDate >= startDate && l.approvedDate <= endDate);
                if (shouldInclude) {
                    const member = data.members.find(m => m.id === l.memberId);
                    const group = data.shgGroups.find(g => g.id === member?.groupId);

                    transactions.push({
                        date: l.approvedDate,
                        memberName: member?.name || 'Unknown',
                        groupName: group?.name || 'N/A',
                        transactionNo: l.id,
                        mobileNo: member?.phone || 'N/A',
                        product: 'Loan Disbursement',
                        amount: l.amount,
                        type: 'Loan',
                        memberCode: member?.employeeCode || 'N/A'
                    });
                }
            }
        });

        // Sort transactions by date
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { members, transactions };
    };

    const handleSearch = () => {
        setSelectedGroup(localGroup);
        setDateRange(localMemberwiseDateRange);
        setMemberwiseSearched(true);
    };

    const handleClear = () => {
        setSelectedMember('');
        setLocalGroup('');
        setLocalMemberwiseDateRange({ startDate: '', endDate: '' });
        setMemberwiseSearched(false);
    };

    const memberWiseData = memberwiseSearched ? getMemberWiseData() : { members: [], transactions: [] };
    const memberData = memberWiseData.members.filter(m => {
        if (selectedMember && selectedMember !== 'all') {
            return m.id === parseInt(selectedMember);
        }
        return true;
    });
    const transactions = memberWiseData.transactions.filter(t => {
        if (selectedMember && selectedMember !== 'all') {
            const member = data.members.find(m => m.id === parseInt(selectedMember));
            return t.memberName === member?.name;
        }
        return true;
    });

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
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-bold text-muted mb-2">
                                <FaSearch className="me-2" />Search Member
                            </Form.Label>
                            <Form.Select size="sm" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
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
                            <Form.Select size="sm" value={localGroup} onChange={(e) => setLocalGroup(e.target.value)}>
                                <option value="">All Groups</option>
                                {data.shgGroups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-bold text-muted mb-2">Start Date</Form.Label>
                            <Form.Control type="date" size="sm" value={localMemberwiseDateRange.startDate}
                                onChange={(e) => setLocalMemberwiseDateRange({ ...localMemberwiseDateRange, startDate: e.target.value })} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-bold text-muted mb-2">End Date</Form.Label>
                            <Form.Control type="date" size="sm" value={localMemberwiseDateRange.endDate}
                                onChange={(e) => setLocalMemberwiseDateRange({ ...localMemberwiseDateRange, endDate: e.target.value })} />
                        </Col>
                        <Col md={1}>
                            <Button variant="primary" size="sm" className="w-100" onClick={handleSearch} disabled={!selectedMember}>
                                <FaSearch />
                            </Button>
                        </Col>
                        <Col md={1}>
                            <Button variant="outline-secondary" size="sm" className="w-100" onClick={handleClear} title="Clear filters">
                                <FaTimes />
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

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

                            {transactions.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="fw-bold text-muted mb-3 px-3">Transaction Details</h6>
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0 excel-table bg-white">
                                            <thead>
                                                <tr>
                                                    <th>Sl. No</th>
                                                    <th>Date</th>
                                                    <th>Member Name</th>
                                                    <th>Group Name</th>
                                                    <th>Transaction No</th>
                                                    <th>Mobile No</th>
                                                    <th>Product</th>
                                                    <th className="text-end">Amount</th>
                                                    <th>Member Code</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((transaction, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                                        <td className="fw-medium">{transaction.memberName}</td>
                                                        <td>{transaction.groupName}</td>
                                                        <td>{transaction.transactionNo}</td>
                                                        <td>{transaction.mobileNo}</td>
                                                        <td>
                                                            <span className={`badge ${transaction.type === 'Savings' ? 'bg-success' :
                                                                transaction.type === 'Repayment' ? 'bg-info' : 'bg-warning'
                                                                }`}>
                                                                {transaction.product}
                                                            </span>
                                                        </td>
                                                        <td className="text-end fw-bold">₹{transaction.amount.toLocaleString()}</td>
                                                        <td>{transaction.memberCode}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="table-light fw-bold">
                                                    <td colSpan="7" className="text-end">Total:</td>
                                                    <td className="text-end">₹{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
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
}
