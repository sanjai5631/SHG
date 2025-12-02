import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Table, Badge, Button, Row, Col, Form, Pagination } from "react-bootstrap";
import { FaCheck, FaTimes } from "react-icons/fa";

export default function ApprovedLoansPage() {
    const { data, currentUser, updateItem } = useApp();
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(""); // New: Status filter
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

            // show even if member has no groupId (avoids missing display)
            if (!member.groupId) return true;

            // Show all requested/pending loans regardless of permissions to ensure visibility
            return loan.status !== "approved" && loan.status !== "rejected";
        })
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

    // --------------------- APPROVED & REJECTED LOANS ---------------------
    let processedLoans = data.loans
        .filter((loan) => {
            const member = getMember(loan.memberId);

            if (!member.groupId) return false;

            // Show both approved and rejected loans
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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedLoans.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedLoans.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

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

    // Styles matching SavingsManagement.jsx
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
        <div>
            <h4 className="fw-bold mb-3">Loan Management</h4>


            {/* ------------ LOAN REQUESTS TABLE ------------ */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <h5 className="fw-semibold mb-0">Loan Requests</h5>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: "340px" }}>
                        <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                <tr>
                                    <th style={{ ...headerStyle, width: '15%' }}>Employee Code</th>
                                    <th style={{ ...headerStyle, width: '15%' }}>Name</th>
                                    <th style={{ ...headerStyle, width: '15%' }}>Loan Amount</th>
                                    <th style={{ ...headerStyle, width: '25%' }}>Purpose</th>
                                    <th style={{ ...headerStyle, width: '15%' }}>Date</th>
                                    <th style={{ ...headerStyle, width: '15%', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loanRequests.length > 0 ? (
                                    loanRequests.map((loan, index) => {
                                        const member = getMember(loan.memberId);
                                        const rowBg = index % 2 === 0 ? "#bbdefb" : "#ffffff";

                                        return (
                                            <tr
                                                key={loan.id}
                                                style={{
                                                    backgroundColor: rowBg,
                                                }}
                                            >
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{member.code || "N/A"}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, fontWeight: '500' }}>{member.name || "Unknown"}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, color: '#28a745', fontWeight: '600' }}>₹{loan.amount?.toLocaleString()}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.purpose || "-"}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>
                                                    {loan.appliedDate
                                                        ? new Date(loan.appliedDate).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'center' }}>
                                                    <Button
                                                        variant="link"
                                                        className="text-success p-0 me-3"
                                                        title="Approve"
                                                        onClick={() => handleApprove(loan.id)}
                                                    >
                                                        <FaCheck size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        className="text-danger p-0"
                                                        title="Reject"
                                                        onClick={() => handleReject(loan.id)}
                                                    >
                                                        <FaTimes size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-muted">
                                            No pending loan requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
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
                                        onChange={(e) => {
                                            setSelectedStatus(e.target.value);
                                            setCurrentPage(1); // Reset to page 1 on filter change
                                        }}
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
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setCurrentPage(1); // Reset to page 1 on filter change
                                        }}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <Form.Select
                                        size="sm"
                                        value={selectedMember}
                                        onChange={(e) => {
                                            setSelectedMember(e.target.value);
                                            setCurrentPage(1); // Reset to page 1 on filter change
                                        }}
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
                    <div className="table-responsive" style={{ maxHeight: "340px" }}>
                        <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                <tr>
                                    <th style={{ ...headerStyle, width: '12%' }}>Member</th>
                                    <th style={{ ...headerStyle, width: '12%' }}>Product</th>
                                    <th style={{ ...headerStyle, width: '10%' }}>Amount</th>
                                    <th style={{ ...headerStyle, width: '8%' }}>Interest</th>
                                    <th style={{ ...headerStyle, width: '8%' }}>Tenor</th>
                                    <th style={{ ...headerStyle, width: '10%' }}>EMI</th>
                                    <th style={{ ...headerStyle, width: '15%' }}>Purpose</th>
                                    <th style={{ ...headerStyle, width: '10%' }}>Date</th>
                                    <th style={{ ...headerStyle, width: '10%', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((loan, index) => {
                                        const member = getMember(loan.memberId);
                                        const rowBg = index % 2 === 0 ? "#bbdefb" : "#ffffff";

                                        return (
                                            <tr
                                                key={loan.id}
                                                style={{
                                                    backgroundColor: rowBg,
                                                }}
                                            >
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, fontWeight: '500' }}>{member.name || "Unknown"}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{getProductName(loan.productId)}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, color: '#28a745', fontWeight: '600' }}>₹{loan.amount?.toLocaleString()}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.interestRate}%</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.tenor} months</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>₹{loan.emi?.toLocaleString()}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.purpose || "-"}</td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg }}>
                                                    {loan.appliedDate
                                                        ? new Date(loan.appliedDate).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'center' }}>
                                                    {loan.status === "approved" ? (
                                                        <Badge bg="success">Approved</Badge>
                                                    ) : (
                                                        <Badge bg="danger">Rejected</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4 text-muted">
                                            No loan records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div >
                    {/* Pagination Controls */}
                    {
                        totalPages > 1 && (
                            <div className="d-flex justify-content-center py-3 border-top">
                                <Pagination>
                                    <Pagination.Prev
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Pagination.Prev>
                                    <Pagination.Next
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Pagination.Next>
                                </Pagination>
                            </div>
                        )
                    }
                </Card.Body >
            </Card>
        </div>
    );
}
