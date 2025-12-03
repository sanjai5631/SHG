import { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTimes, FaFilePdf, FaFileExcel, FaList, FaPrint } from 'react-icons/fa';
import DataTable from '../../../components/DataTable';
// Import jsPDF with autoTable plugin
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Initialize jsPDF with autoTable
const doc = new jsPDF();
// This makes sure autoTable is available on the jsPDF instance
Object.assign(jsPDF.API, { autoTable });
import * as XLSX from 'xlsx';

export default function MemberwiseReport({ data }) {
    const [memberwiseSearched, setMemberwiseSearched] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [localGroup, setLocalGroup] = useState('');
    const [localMemberwiseDateRange, setLocalMemberwiseDateRange] = useState({ startDate: '', endDate: '' });
    const [dateError, setDateError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [searchTerm, setSearchTerm] = useState('');

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
                        .filter(s => {
                            const date = new Date(s.date).toISOString().split('T')[0];
                            return date >= startDate && date <= endDate;
                        })
                        .reduce((sum, s) => sum + s.amount, 0);

                    periodLoans = allLoans
                        .filter(l => {
                            const date = new Date(l.approvedDate).toISOString().split('T')[0];
                            return date >= startDate && date <= endDate;
                        })
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Helper: get the next day (Start Date + 1) in YYYY-MM-DD format
    const getNextDayISO = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const handleSearch = () => {
        // Validate date range only if both dates are selected
        const { startDate, endDate } = localMemberwiseDateRange;

        if (startDate && startDate > todayStr) {
            setDateError('Start Date cannot be in the future.');
            return;
        }

        if (endDate && endDate < todayStr) {
            setDateError('End Date cannot be earlier than today.');
            return;
        }

        if (startDate && endDate && endDate < startDate) {
            setDateError('End Date cannot be earlier than Start Date.');
            return;
        }

        // Extra rule: End Date must be at least one day after Start Date (cannot be same day)
        if (startDate && endDate && endDate === startDate) {
            setDateError('End Date must be at least one day after Start Date.');
            return;
        }

        setDateError('');
        setSelectedGroup(localGroup);
        setDateRange(localMemberwiseDateRange);
        setMemberwiseSearched(true);
    };

    const handleClear = () => {
        setSelectedMember('');
        setLocalGroup('');
        setLocalMemberwiseDateRange({ startDate: '', endDate: '' });
        setMemberwiseSearched(false);
        setDateError('');
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
        
        // Add title
        doc.setFontSize(16);
        doc.text("Memberwise Report", 14, 15);
        
        // Prepare table data
        const tableColumn = ["Name", "Group", "Total Savings", "Total Loans", "Pending Dues", "Last Payment"];
        const tableRows = memberData.map(m => [
            m.name || '-',
            m.groupName || '-',
            `Rs. ${m.displaySavings || '0'}`,
            `Rs. ${m.displayLoans || '0'}`,
            `Rs. ${m.pendingDues || '0'}`,
            m.lastPaymentDate && m.lastPaymentDate !== 'N/A' 
                ? new Date(m.lastPaymentDate).toLocaleDateString() 
                : 'N/A'
        ]);

        // Add table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
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

    // Prepare data for DataTables
    const memberColumns = [
        { key: 'name', label: 'Member Name' },
        { key: 'employeeCode', label: 'Employee Code' },
        { key: 'groupName', label: 'Group Name' },
        { 
            key: 'displaySavings', 
            label: 'Total Savings',
            render: (value) => <span className="text-success">₹{value.toLocaleString()}</span>,
            sortable: true 
        },
        { 
            key: 'displayLoans', 
            label: 'Total Loans',
            render: (value) => <span className="text-primary">₹{value.toLocaleString()}</span>,
            sortable: true 
        },
        { 
            key: 'pendingDues', 
            label: 'Pending Dues',
            render: (value) => <span className="text-danger fw-bold">₹{value.toLocaleString()}</span>,
            sortable: true 
        },
        { 
            key: 'lastPaymentDate', 
            label: 'Last Payment',
            render: (value) => value !== 'N/A' ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const transactionColumns = [
        { 
            key: 'slNo', 
            label: 'Sl. No',
            render: (_, __, index) => index + 1
        },
        { 
            key: 'date', 
            label: 'Date',
            render: (date) => new Date(date).toLocaleDateString()
        },
        { key: 'memberName', label: 'Member Name' },
        { key: 'groupName', label: 'Group Name' },
        { key: 'transactionNo', label: 'Transaction No' },
        { key: 'mobileNo', label: 'Mobile No' },
        { 
            key: 'product', 
            label: 'Product',
            render: (value, row) => (
                <span className={`badge ${row.type === 'Savings' ? 'bg-success' : row.type === 'Repayment' ? 'bg-info' : 'bg-warning'}`}>
                    {value}
                </span>
            )
        },
        { 
            key: 'amount', 
            label: 'Amount',
            render: (value) => <span className="fw-bold">₹{value.toLocaleString()}</span>,
            sortable: true
        },
        { key: 'memberCode', label: 'Member Code' }
    ];

    return (
        <div className="container-fluid px-3 py-3">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Memberwise Report</h4>
                
            </div>

            {/* Filter Section */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-bold text-muted mb-2">
                                <FaSearch className="me-2" /> Search Member
                            </Form.Label>
                            <Form.Select 
                                size="sm" 
                                value={selectedMember} 
                                onChange={(e) => setSelectedMember(e.target.value)}
                                className="form-select-sm"
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
                                <FaFilter className="me-2" /> Group
                            </Form.Label>
                            <Form.Select 
                                size="sm" 
                                value={localGroup} 
                                onChange={(e) => setLocalGroup(e.target.value)}
                                className="form-select-sm"
                            >
                                <option value="">All Groups</option>
                                {data.shgGroups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        
                        <Col md={2}>
                            <Form.Label className="small fw-bold text-muted mb-2">
                                From Date
                            </Form.Label>
                            <div className="input-group input-group-medium">
                                <Form.Control 
                                    type="date" 
                                    size="sm" 
                                    value={localMemberwiseDateRange.startDate}
                                    max={todayStr}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLocalMemberwiseDateRange({
                                            ...localMemberwiseDateRange,
                                            startDate: value
                                        });

                                        if (value && value > todayStr) {
                                            setDateError('Start Date cannot be in the future.');
                                        } else if (
                                            value &&
                                            localMemberwiseDateRange.endDate &&
                                            localMemberwiseDateRange.endDate < value
                                        ) {
                                            setDateError('End Date cannot be earlier than Start Date.');
                                        } else {
                                            setDateError('');
                                        }
                                    }}
                                    className="form-control-sm"
                                />
                            </div>
                        </Col>
                        
                        <Col md={2}>
                            <Form.Label className="small fw-bold text-muted mb-2">
                                To Date
                            </Form.Label>
                            <div className="input-group input-group-medium">
                                <Form.Control 
                                    type="date" 
                                    size="sm" 
                                    value={localMemberwiseDateRange.endDate}
                                    min={
                                        localMemberwiseDateRange.startDate
                                            ? (
                                                getNextDayISO(localMemberwiseDateRange.startDate) > todayStr
                                                    ? getNextDayISO(localMemberwiseDateRange.startDate)
                                                    : todayStr
                                            )
                                            : todayStr
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLocalMemberwiseDateRange({
                                            ...localMemberwiseDateRange,
                                            endDate: value
                                        });

                                        if (value && value < todayStr) {
                                            setDateError('End Date cannot be earlier than today.');
                                        } else if (
                                            value &&
                                            localMemberwiseDateRange.startDate &&
                                            value < localMemberwiseDateRange.startDate
                                        ) {
                                            setDateError('End Date cannot be earlier than Start Date.');
                                        } else if (
                                            value &&
                                            localMemberwiseDateRange.startDate &&
                                            value === localMemberwiseDateRange.startDate
                                        ) {
                                            setDateError('End Date must be at least one day after Start Date.');
                                        } else {
                                            setDateError('');
                                        }
                                    }}
                                    className="form-control-sm"
                                />
                            </div>
                        </Col>
                        
                        <Col md={1}>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="w-100" 
                                onClick={handleSearch}
                                disabled={!selectedMember || !!dateError}
                                title="Search"
                            >
                                <FaSearch className="me-1" /> Search
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
                                <FaTimes className="me-1" /> Clear
                            </Button>
                        </Col>
                    </Row>
                    
                    {dateError && (
                        <div className="text-danger small fw-semibold mt-2">
                            {dateError}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Results Section */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {!memberwiseSearched ? (
                        <div className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaSearch size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Select a member to view reports</h5>
                            <p className="text-muted small mb-0">
                                Choose a specific member or "All Members" from the dropdown above and click Search
                            </p>
                        </div>
                    ) : memberData.length > 0 ? (
                        <div className="table-responsive">
                            <div className="p-3 border-bottom">
                                <h6 className="mb-0 fw-bold">Member Details</h6>
                            </div>
                            <div className="p-4">
                                <div className=" justify-content-start mb-3">
                                    <div className="d-flex gap-1">
                                        <Button variant="outline-black" size="sm" onClick={exportToPDF} className="d-flex align-items-center">
                                           Export To :  <FaFilePdf className="me-1" />
                                        </Button>
                                        <Button variant="outline-black" size="sm" onClick={exportToExcel} className="d-flex align-items-center">
                                            <FaFileExcel className="me-1" /> 
                                        </Button>
                                        <Button variant="outline-black" size="sm" onClick={() => window.print()} className="d-flex align-items-center">
                                            <FaPrint className="me-1" /> 
                                        </Button>
                                    </div>
                                </div>
                                <DataTable
                                    initialColumns={memberColumns}
                                    data={memberData}
                                    rowsPerPageOptions={[10, 25, 50]}
                                    enableFilter={true}
                                    enableExport={false}
                                    enablePagination={true}
                                    enableSort={true}
                                    className="mb-0"
                                />
                            </div>
                            
                            {transactions.length > 0 && (
                                <>
                                    <div className="p-3 border-top border-bottom">
                                        <h6 className="mb-0 fw-bold">Transaction Details</h6>
                                    </div>
                                    <div className="p-3">
                                        <DataTable
                                            initialColumns={transactionColumns}
                                            data={transactions}
                                            rowsPerPageOptions={[10, 25, 50]}
                                            enableFilter={true}
                                            enableExport={false}
                                            enablePagination={true}
                                            enableSort={true}
                                            className="mb-0"
                                        />
                                        <div className="d-flex justify-content-end fw-bold mt-3">
                                            <div className="bg-light p-2 rounded">
                                                Total: ₹{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted mb-0">No data found for the selected criteria</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
