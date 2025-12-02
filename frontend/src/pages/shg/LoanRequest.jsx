import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Form, Button, Toast, ToastContainer, Row, Col, Modal, Table, Badge } from "react-bootstrap";

export default function LoanRequestPage() {
    const { data, addLoanRequest } = useApp();

    // --- Filter States ---
    const [filterGroupId, setFilterGroupId] = useState("");
    const [filterMemberId, setFilterMemberId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [displayedRequests, setDisplayedRequests] = useState([]);
    const [showTable, setShowTable] = useState(false);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);

    // --- Form States ---
    const [groupId, setGroupId] = useState("");
    const [memberId, setMemberId] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [date, setDate] = useState("");

    const [showToast, setShowToast] = useState(false);

    // --- Filter Logic ---
    const handleShowData = () => {
        // Filter loans with status 'requested' or 'pending' (assuming requests are pending)
        // Adjust status check based on how requests are stored. The original file used 'requested'.
        // However, looking at AppContext, status might be 'pending'. 
        // Let's filter generally for now, or just show all loans that match filters if they are requests.
        // Actually, the original code saved status as "requested".

        let filtered = data.loans.filter(l => l.status === 'requested' || l.status === 'pending');

        if (filterGroupId) {
            filtered = filtered.filter(loan => {
                const member = data.members.find(m => m.id === loan.memberId);
                return member && member.groupId === parseInt(filterGroupId);
            });
        }

        if (filterMemberId) {
            filtered = filtered.filter(loan => loan.memberId === parseInt(filterMemberId));
        }

        if (filterDate) {
            filtered = filtered.filter(loan => loan.appliedDate === filterDate);
        }

        setDisplayedRequests(filtered);
        setShowTable(true);
    };

    // Derived state for filter members
    const filterMembers = filterGroupId
        ? data.members.filter(m => m.groupId === parseInt(filterGroupId))
        : data.members;

    // --- Form Logic ---
    const formMembers = data.members.filter(
        (m) => !groupId || m.groupId === parseInt(groupId)
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        const newLoan = {
            id: Date.now(),
            groupId: parseInt(groupId),
            memberId: parseInt(memberId),
            amount: Number(amount),
            purpose,
            appliedDate: date,
            status: "requested",
        };

        addLoanRequest(newLoan);
        setShowToast(true);
        setShowModal(false);

        // Clear form
        setGroupId("");
        setMemberId("");
        setAmount("");
        setPurpose("");
        setDate("");
    };

    // --- Helpers for Table Display ---
    const getMemberName = (id) => data.members.find(m => m.id === id)?.name || "Unknown";
    const getGroupName = (memberId) => {
        const member = data.members.find(m => m.id === memberId);
        if (!member) return "Unknown";
        const group = data.shgGroups.find(g => g.id === member.groupId);
        return group ? group.name : "Unknown";
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
        <div className="fade-in">
            {/* TITLE */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">Loan Request</h4>
                <Button onClick={() => setShowModal(true)} style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: 'white' }}>
                    + Request Loan
                </Button>
            </div>

            <ToastContainer position="top-end" className="p-3">
                <Toast bg="success" show={showToast} autohide delay={3000} onClose={() => setShowToast(false)}>
                    <Toast.Header closeButton={false} className="text-success fw-bold">
                        <strong className="me-auto">Success</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white fw-medium">
                        Loan Request Submitted Successfully!
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            {/* FILTERS */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Group</Form.Label>
                                <Form.Select
                                    value={filterGroupId}
                                    onChange={(e) => {
                                        setFilterGroupId(e.target.value);
                                        setFilterMemberId("");
                                    }}
                                >
                                    <option value="">All Groups</option>
                                    {data.shgGroups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Member Name</Form.Label>
                                <Form.Select
                                    value={filterMemberId}
                                    onChange={(e) => setFilterMemberId(e.target.value)}
                                    disabled={!filterGroupId && filterMembers.length > 100}
                                >
                                    <option value="">All Members</option>
                                    {filterMembers.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Application Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Button variant="primary" className="w-50 mb-1 ms-3" onClick={handleShowData}>
                                Show
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* TABLE */}
            {showTable && (
                <Card className="border-1 shadow-sm" style={{ height: 'auto' }}>
                    <Card.Header className="bg-white">
                        <h5 className="fw-semibold mb-0">Loan Requests List</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
                            <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ ...headerStyle, width: '10%' }}>ID</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>GROUP</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>MEMBER</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>AMOUNT</th>
                                        <th style={{ ...headerStyle, width: '20%' }}>PURPOSE</th>
                                        <th style={{ ...headerStyle, width: '15%' }}>DATE</th>
                                        <th style={{ ...headerStyle, width: '10%', textAlign: 'center' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedRequests.length > 0 ? (
                                        displayedRequests.map((loan, index) => {
                                            const rowBg = index % 2 === 0 ? "#bbdefb" : "#ffffff";
                                            return (
                                                <tr key={loan.id} style={{ backgroundColor: rowBg }}>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg }}>#{loan.id}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg, fontWeight: '500' }}>{getGroupName(loan.memberId)}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg, fontWeight: '500' }}>{getMemberName(loan.memberId)}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg, color: '#28a745', fontWeight: '600' }}>₹{loan.amount.toLocaleString()}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.purpose}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg }}>{loan.appliedDate}</td>
                                                    <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'center' }}>
                                                        <Badge bg="warning" text="dark">
                                                            {loan.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">
                                                No loan requests found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* MODAL */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">New Loan Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">SHG Group</Form.Label>
                                    <Form.Select
                                        value={groupId}
                                        onChange={(e) => { setGroupId(e.target.value); setMemberId(""); }}
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {data.shgGroups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">Member Name</Form.Label>
                                    <Form.Select
                                        value={memberId}
                                        onChange={(e) => setMemberId(e.target.value)}
                                        required
                                        disabled={!groupId}
                                    >
                                        <option value="">Select Member</option>
                                        {formMembers.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">Loan Amount (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">Application Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">Purpose of Loan</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Describe the purpose"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <div className="text-end">
                            <Button
                                variant="danger"
                                className="me-4"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                className="px-2"
                            >
                                Submit Request
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
