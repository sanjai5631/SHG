import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Form, Button, Toast, ToastContainer, Row, Col, Modal, Table, Badge } from "react-bootstrap";

export default function LoanIssue() {
    const { data, addItem } = useApp();

    // --- Filter States ---
    const [filterGroupId, setFilterGroupId] = useState("");
    const [filterMemberId, setFilterMemberId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [displayedLoans, setDisplayedLoans] = useState([]);
    const [showTable, setShowTable] = useState(false);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);

    // --- Form States ---
    const [groupId, setGroupId] = useState("");
    const [memberId, setMemberId] = useState("");
    const [productId, setProductId] = useState("");
    const [amount, setAmount] = useState("");
    const [interest, setInterest] = useState("");
    const [tenor, setTenor] = useState("");
    const [emi, setEmi] = useState("");
    const [purpose, setPurpose] = useState("");
    const [date, setDate] = useState("");

    const [showToast, setShowToast] = useState(false);

    // --- Filter Logic ---
    const handleShowData = () => {
        let filtered = data.loans;

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
            filtered = filtered.filter(loan => (loan.issuedDate || loan.approvedDate) === filterDate);
        }

        setDisplayedLoans(filtered);
        setShowTable(true);
    };

    // Derived state for filter members
    const filterMembers = filterGroupId
        ? data.members.filter(m => m.groupId === parseInt(filterGroupId))
        : data.members;

    // --- Form Logic ---
    // Filter members based on group
    const formMembers = data.members.filter(
        (m) => !groupId || m.groupId === parseInt(groupId)
    );

    // When product selected → load interest rate automatically
    const handleProductChange = (id) => {
        setProductId(id);
        const product = data.loanProducts.find((p) => p.id === parseInt(id));
        if (product) {
            setInterest(product.interestRate);
            updateEMI(amount, product.interestRate, tenor);
        }
    };

    // Auto-calculate EMI
    const calculateEMI = (loanAmount, rate, months) => {
        if (!loanAmount || !rate || !months) return "";
        const monthlyRate = rate / (12 * 100);
        const emiValue =
            (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
        return Math.round(emiValue);
    };

    // Update EMI dynamically whenever amount/interest/tenor changes
    const updateEMI = (newAmount, newInterest, newTenor) => {
        const result = calculateEMI(newAmount, newInterest, newTenor);
        setEmi(result);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();

        const newLoanIssue = {
            id: Date.now(),
            groupId: parseInt(groupId),
            memberId: parseInt(memberId),
            productId: parseInt(productId),
            amount: parseFloat(amount),
            interestRate: parseFloat(interest),
            tenor: parseInt(tenor),
            emi: parseInt(emi),
            purpose,
            issuedDate: date,
            status: "approved",
        };

        addItem("loans", newLoanIssue);
        setShowToast(true);
        setShowModal(false);

        // Clear inputs
        setGroupId("");
        setMemberId("");
        setProductId("");
        setAmount("");
        setInterest("");
        setTenor("");
        setEmi("");
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
    const getProductName = (id) => data.loanProducts.find(p => p.id === id)?.name || "Unknown";

    return (
        <div className="fade-in">
            {/* TITLE */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">Loan Issue</h4>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    +  Issue Loan
                </Button>
            </div>

            <ToastContainer position="top-end" className="p-3">
                <Toast bg="success" show={showToast} autohide delay={2000} onClose={() => setShowToast(false)}>
                    <Toast.Body className="text-white fw-bold">Loan Issued Successfully!</Toast.Body>
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
                                        setFilterMemberId(""); // Reset member when group changes
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
                                    disabled={!filterGroupId && filterMembers.length > 100} // Optional optimization
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
                                <Form.Label className="fw-semibold">Issue Date</Form.Label>
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
                        <h5 className="fw-semibold mb-0">Issued Loans List</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
                            <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#d9d9d9ff', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>LOAN ID</th>
                                        <th style={{ width: '12%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>GROUP</th>
                                        <th style={{ width: '12%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>MEMBER</th>
                                        <th style={{ width: '12%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>PRODUCT</th>
                                        <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>AMOUNT</th>
                                        <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>INT. %</th>
                                        <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TENOR</th>
                                        <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>EMI</th>
                                        <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>DATE</th>
                                        <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedLoans.length > 0 ? (
                                        displayedLoans.map((loan, index) => {
                                            const rowBg = index % 2 === 0 ? "#d2e6fcff" : "#f0f6fcff";
                                            return (
                                                <tr key={loan.id} style={{ backgroundColor: rowBg, borderBottom: "1px solid #dee2e6" }}>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#6c757d', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>#{loan.id}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{getGroupName(loan.memberId)}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{getMemberName(loan.memberId)}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{getProductName(loan.productId)}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#28a745', fontWeight: '600', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{loan.amount.toLocaleString()}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{loan.interestRate}%</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{loan.tenor} M</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{loan.emi}</td>
                                                    <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{loan.issuedDate || loan.approvedDate || "-"}</td>
                                                    <td style={{ backgroundColor: rowBg, padding: '16px 8px', textAlign: 'center' }}>
                                                        <Badge bg={loan.status === 'approved' ? 'success' : loan.status === 'pending' ? 'warning' : 'secondary'}>
                                                            {loan.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4 text-muted">
                                                No loans found.
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
                    <Modal.Title className="fw-bold">Issue New Loan</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* ---------------- ROW 1 — Group / Member / Product ---------------- */}
                        <Row className="g-3 mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Group</Form.Label>
                                    <Form.Select
                                        value={groupId}
                                        onChange={(e) => {
                                            setGroupId(e.target.value);
                                            setMemberId("");
                                        }}
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {data.shgGroups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Member</Form.Label>
                                    <Form.Select
                                        value={memberId}
                                        onChange={(e) => setMemberId(e.target.value)}
                                        disabled={!groupId}
                                        required
                                    >
                                        <option value="">Select Member</option>
                                        {formMembers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Loan Product</Form.Label>
                                    <Form.Select
                                        value={productId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {data.loanProducts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- ROW 2 — Amount / Interest / Tenor ---------------- */}
                        <Row className="g-3 mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Loan Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            updateEMI(e.target.value, interest, tenor);
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Interest (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={interest}
                                        readOnly
                                        style={{ backgroundColor: '#f8f9fa' }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Tenor (Months)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Months"
                                        value={tenor}
                                        onChange={(e) => {
                                            setTenor(e.target.value);
                                            updateEMI(amount, interest, e.target.value);
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- ROW 3 — EMI / Purpose / Issue Date ---------------- */}
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">EMI</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={emi}
                                        readOnly
                                        style={{ backgroundColor: '#f8f9fa' }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Purpose</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Purpose"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Issue Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- SUBMIT BUTTON ---------------- */}
                        <div className="text-end">
                            <Button
                                variant="danger"
                                className="me-2"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                className="px-4"
                            >
                                Issue Loan
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
