import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Badge, Button, Row, Col, Form } from "react-bootstrap";
import { FaCheck, FaTimes } from "react-icons/fa";
import DataTable from "../../components/DataTable";

export default function ApprovedLoansPage() {
    const { data, currentUser, updateItem } = useApp();
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    if (!currentUser) return null;

    // Safe getters
    const getMember = (id) => data.members.find((m) => m.id === id) || {};
    const getProductName = (id) =>
        data.loanProducts.find((p) => p.id === id)?.name || "Unknown";

    // Groups assigned to current user
    const myGroups = data.shgGroups
        .filter((g) => g.assignedTo === currentUser.id)
        .map((g) => g.id);

    // --------------------- LOAN REQUESTS ---------------------
    const loanRequests = data.loans
        .filter((loan) => {
            const member = getMember(loan.memberId);
            if (!member.groupId) return true;
            return loan.status !== "approved" && loan.status !== "rejected";
        })
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
        .map(loan => ({
            ...loan,
            member: getMember(loan.memberId)
        }));

    // --------------------- APPROVED & REJECTED LOANS ---------------------
    let processedLoans = data.loans
        .filter((loan) => {
            const member = getMember(loan.memberId);
            if (!member.groupId) return false;
            return loan.status === "approved" || loan.status === "rejected";
        });

    // Filter by Status
    if (selectedStatus) {
        processedLoans = processedLoans.filter(loan =>
            loan.status === selectedStatus
        );
    }

    // Filter by Date
    if (selectedDate) {
        processedLoans = processedLoans.filter(loan =>
            loan.appliedDate === selectedDate
        );
    }

    // Filter by Member
    if (selectedMember) {
        processedLoans = processedLoans.filter(loan =>
            loan.memberId === parseInt(selectedMember)
        );
    }

    // Sort finally
    processedLoans.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

    // Map with member data
    processedLoans = processedLoans.map(loan => ({
        ...loan,
        member: getMember(loan.memberId),
        productName: getProductName(loan.productId)
    }));

    // Get list of members who have approved or rejected loans (for dropdown)
    const processedMemberIds = new Set(data.loans.filter(l => l.status === 'approved' || l.status === 'rejected').map(l => l.memberId));
    const processedMembers = data.members.filter(m => processedMemberIds.has(m.id));

    // Actions
    const handleApprove = (loanId) => {
        if (window.confirm("Are you sure you want to approve this loan?")) {
            updateItem("loans", loanId, {
                status: "approved",
                approvedDate: new Date().toISOString(),
            });
        }
    };

    const handleReject = (loanId) => {
        if (window.confirm("Are you sure you want to reject this loan?")) {
            updateItem("loans", loanId, {
                status: "rejected",
            });
        }
    };

    return (
        <div>
            <h4 className="fw-bold mb-3">Loan Management</h4>

            {/* ------------ LOAN REQUESTS TABLE ------------ */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <h5 className="fw-semibold mb-0">Loan Requests</h5>
                </Card.Header>

                <Card.Body className="p-0">
                    <DataTable
                        data={loanRequests}
                        initialColumns={[
                            {
                                key: 'member',
                                label: 'Employee Code',
                                sortable: true,
                                render: (member) => member.code || "N/A"
                            },
                            {
                                key: 'member',
                                label: 'Name',
                                sortable: true,
                                render: (member) => <span style={{ fontWeight: '500' }}>{member.name || "Unknown"}</span>
                            },
                            {
                                key: 'amount',
                                label: 'Loan Amount',
                                sortable: true,
                                render: (val) => <span style={{ color: '#28a745', fontWeight: '600' }}>₹{val?.toLocaleString()}</span>
                            },
                            {
                                key: 'purpose',
                                label: 'Purpose',
                                sortable: true,
                                render: (val) => val || "-"
                            },
                            {
                                key: 'appliedDate',
                                label: 'Date',
                                sortable: true,
                                render: (val) => val ? new Date(val).toLocaleDateString() : "-"
                            }
                        ]}
                        actionRenderer={(row) => (
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <Button
                                    variant="link"
                                    className="text-success p-0"
                                    title="Approve"
                                    onClick={() => handleApprove(row.id)}
                                >
                                    <FaCheck size={18} />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    title="Reject"
                                    onClick={() => handleReject(row.id)}
                                >
                                    <FaTimes size={18} />
                                </Button>
                            </div>
                        )}
                        enableFilter={true}
                        enablePagination={true}
                        enableExport={true}
                        rowsPerPageOptions={[10, 25, 50]}
                    />
                </Card.Body>
            </Card>

            {/* ------------ APPROVED & REJECTED LOANS TABLE ------------ */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="fw-semibold mb-0">Loan Records</h5>
                        </Col>
                        <Col md={6}>
                            <Row className="g-2 justify-content-end">
                                <Col xs={6} md={3}>
                                    <Form.Select
                                        size="sm"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </Form.Select>
                                </Col>
                                <Col xs={6} md={4}>
                                    <Form.Control
                                        type="date"
                                        size="sm"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <Form.Select
                                        size="sm"
                                        value={selectedMember}
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                    >
                                        <option value="">All Members</option>
                                        {processedMembers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body className="p-0">
                    <DataTable
                        key={`${selectedStatus}-${selectedDate}-${selectedMember}`}
                        data={processedLoans}
                        initialColumns={[
                            {
                                key: 'member',
                                label: 'Member',
                                sortable: true,
                                render: (member) => <span style={{ fontWeight: '500' }}>{member.name || "Unknown"}</span>
                            },
                            {
                                key: 'productName',
                                label: 'Product',
                                sortable: true
                            },
                            {
                                key: 'amount',
                                label: 'Amount',
                                sortable: true,
                                render: (val) => <span style={{ color: '#28a745', fontWeight: '600' }}>₹{val?.toLocaleString()}</span>
                            },
                            {
                                key: 'interestRate',
                                label: 'Interest',
                                sortable: true,
                                render: (val) => `${val}%`
                            },
                            {
                                key: 'tenor',
                                label: 'Tenor',
                                sortable: true,
                                render: (val) => `${val} months`
                            },
                            {
                                key: 'emi',
                                label: 'EMI',
                                sortable: true,
                                render: (val) => `₹${val?.toLocaleString()}`
                            },
                            {
                                key: 'purpose',
                                label: 'Purpose',
                                sortable: true,
                                render: (val) => val || "-"
                            },
                            {
                                key: 'appliedDate',
                                label: 'Date',
                                sortable: true,
                                render: (val) => val ? new Date(val).toLocaleDateString() : "-"
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                sortable: true,
                                render: (val) => (
                                    <div style={{ textAlign: 'center' }}>
                                        {val === "approved" ? (
                                            <Badge bg="success">Approved</Badge>
                                        ) : (
                                            <Badge bg="danger">Rejected</Badge>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                        enableFilter={true}
                        enablePagination={true}
                        enableExport={true}
                        rowsPerPageOptions={[10, 25, 50]}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}
