import { useState } from "react";
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Badge,
    Alert,
    Row,
    Col,
} from "react-bootstrap";
import { useApp } from "../../context/AppContext";

export default function LoanManagement() {
    const {
        data,
        currentUser,
        addItem,
        addTransaction,
        getMemberSavingsBalance
    } = useApp();

    const [showModal, setShowModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [repaymentGroup, setRepaymentGroup] = useState(""); // Group filter for repayment section
    const [entries, setEntries] = useState({});
    const [formData, setFormData] = useState({
        memberId: "",
        productId: "",
        amount: "",
        tenor: "",
        purpose: "",
    });

    // ============================================================
    //                 LOAN REQUEST SECTION
    // ============================================================

    const myGroups = data.shgGroups.filter(
        (g) => g.assignedTo === currentUser.id && g.status === "active"
    );
    const myGroupIds = myGroups.map((g) => g.id);

    const groupMembers = selectedGroup
        ? data.members.filter(
            (m) =>
                m.groupId === parseInt(selectedGroup) && m.status === "active"
        )
        : [];

    const myLoans = data.loans.filter((l) => {
        const member = data.members.find((m) => m.id === l.memberId);
        return member && myGroupIds.includes(member.groupId);
    });

    const loanProducts = data.loanProducts.filter((p) => p.status === "active");

    const handleSubmit = (e) => {
        e.preventDefault();

        const balance = getMemberSavingsBalance(parseInt(formData.memberId));
        const loanAmount = Number(formData.amount);

        if (balance < loanAmount * 0.1) {
            alert("Member must have 10% savings to apply loan.");
            return;
        }

        const product = data.loanProducts.find(
            (p) => p.id === parseInt(formData.productId)
        );

        const tenor = Number(formData.tenor);
        const monthlyInterest = (loanAmount * product.interestRate) / (100 * 12);
        const emi = Math.round(loanAmount / tenor + monthlyInterest);

        addItem("loans", {
            memberId: Number(formData.memberId),
            productId: Number(formData.productId),
            amount: loanAmount,
            interestRate: product.intermentRoute,
            tenor,
            purpose: formData.purpose,
            status: "pending",
            appliedDate: new Date().toISOString().split("T")[0],
            emi,
        });

        setShowModal(false);
        alert("Loan request created successfully!");
    };

    const getMemberName = (id) =>
        data.members.find((m) => m.id === id)?.name || "Unknown";

    const getProductName = (id) =>
        data.loanProducts.find((p) => p.id === id)?.name || "Unknown";

    // ============================================================
    //                 LOAN REPAYMENT SECTION
    // ============================================================

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Filter members with loans by selected group and search term
    const membersWithLoans = data.members.filter((member) => {
        const hasLoan = data.loans.some(
            (l) => l.memberId === member.id && l.status === "approved"
        );
        const matchesGroup = !repaymentGroup || member.groupId === parseInt(repaymentGroup);
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
        return hasLoan && matchesGroup && matchesSearch;
    });

    // ... (keep existing helper functions)

    return (
        <div className="fade-in">
            {/* TITLE & ACTIONS */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 fw-bold mb-0">Loan Management</h1>
                <Button variant="primary" onClick={() => setShowModal(true)} className="shadow-sm">
                    ➕ New Loan Request
                </Button>
            </div>

            {/* REPAYMENT TABLE */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-2 border-bottom d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <h6 className="mb-0 fw-bold text-dark">Loan Repayment Collection</h6>
                        <Form.Select
                            size="sm"
                            value={repaymentGroup}
                            onChange={(e) => setRepaymentGroup(e.target.value)}
                            className="border-secondary-subtle fw-medium"
                            style={{ fontSize: '0.8rem', width: '150px' }}
                        >
                            <option value="">All Groups</option>
                            {myGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                    <div style={{ width: '250px' }}>
                        <div className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder="Search member..."
                                size="sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-secondary-subtle ps-4"
                                style={{ fontSize: '0.85rem' }}
                            />
                            <span className="position-absolute top-50 start-0 translate-middle-y ps-2 text-muted small">
                                🔍
                            </span>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Table hover className="mb-0 align-middle table-hover" style={{ minWidth: '1200px' }}>
                            <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                <tr>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '90px', backgroundColor: '#f8f9fa' }}>EMP CODE</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '140px', backgroundColor: '#f8f9fa' }}>NAME</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '110px', backgroundColor: '#f8f9fa' }}>OUTSTANDING</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '100px', backgroundColor: '#f8f9fa' }}>PRINCIPAL</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '80px', backgroundColor: '#f8f9fa' }}>1% INT.</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '120px', backgroundColor: '#f8f9fa' }}>TOTAL DEMAND</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '110px', backgroundColor: '#f8f9fa' }}>COLLECTION</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '70px', backgroundColor: '#f8f9fa' }}>INT.</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '100px', backgroundColor: '#f8f9fa' }}>TYPE</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '150px', backgroundColor: '#f8f9fa' }}>PERSON</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '100px', backgroundColor: '#f8f9fa' }}>TOTAL</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '80px', backgroundColor: '#f8f9fa' }}>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {membersWithLoans.map((m) => {
                                    const loan = getActiveLoan(m.id);
                                    const repaid = getAmountRepaid(m.id);
                                    const balance = getLoanBalance(m.id);

                                    const demandP = Math.round(loan.amount / 5);
                                    const demandI = Math.round(demandP * 0.01);

                                    const entry = entries[m.id] || {};
                                    const principal = Number(entry.collectionAmount || 0);
                                    const intr = Math.round(principal * 0.01);
                                    const total = principal + intr;

                                    return (
                                        <tr key={m.id}>
                                            <td className="text-muted small">{m.employeeCode || '-'}</td>
                                            <td className="fw-semibold text-dark">{m.name}</td>
                                            <td className="text-danger fw-bold">
                                                ₹{balance.toLocaleString()}
                                            </td>
                                            <td className="text-muted">₹{demandP.toLocaleString()}</td>
                                            <td className="text-muted">₹{demandI.toLocaleString()}</td>
                                            <td className="fw-bold text-dark">
                                                ₹{(demandP + demandI).toLocaleString()}
                                            </td>

                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={entry.collectionAmount || ""}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            m.id,
                                                            "collectionAmount",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{ minWidth: '90px' }}
                                                    className="border-secondary-subtle"
                                                />
                                            </td>

                                            <td className="text-muted">{principal > 0 ? `₹${intr}` : "-"}</td>

                                            <td>
                                                <Form.Select
                                                    size="sm"
                                                    value={entry.paymentType || "cash"}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            m.id,
                                                            "paymentType",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{ minWidth: '90px' }}
                                                    className="border-secondary-subtle"
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="online">Online</option>
                                                </Form.Select>
                                            </td>

                                            <td>
                                                {entry.paymentType === "online" ? (
                                                    <Form.Select
                                                        size="sm"
                                                        value={entry.onlinePerson || ""}
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                m.id,
                                                                "onlinePerson",
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{ minWidth: '130px' }}
                                                        className="border-secondary-subtle"
                                                    >
                                                        <option value="">Select</option>
                                                        {data.members
                                                            .filter((x) => x.id !== m.id)
                                                            .map((x) => (
                                                                <option
                                                                    key={x.id}
                                                                    value={x.id}
                                                                >
                                                                    {x.name}
                                                                </option>
                                                            ))}
                                                    </Form.Select>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>

                                            <td className="text-success fw-bold">
                                                {principal > 0 ? `₹${total.toLocaleString()}` : "-"}
                                            </td>

                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    disabled={!principal}
                                                    onClick={() => handleSave(m.id)}
                                                    className="py-0 px-2"
                                                >
                                                    Save
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* LOAN REQUEST TABLE */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <h5 className="fw-bold text-dark mb-0">All Loan Requests</h5>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <Table hover className="mb-0 align-middle text-nowrap table-hover">
                            <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                <tr>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Member</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Product</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Amount</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Interest</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Tenor</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>EMI</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Purpose</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Date</th>
                                    <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ backgroundColor: '#f8f9fa' }}>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {myLoans.length ? (
                                    myLoans.map((loan) => (
                                        <tr key={loan.id}>
                                            <td className="fw-medium">{getMemberName(loan.memberId)}</td>
                                            <td className="text-muted">{getProductName(loan.productId)}</td>
                                            <td className="fw-bold text-dark">₹{loan.amount.toLocaleString()}</td>
                                            <td className="text-muted">{loan.interestRate}%</td>
                                            <td className="text-muted">{loan.tenor} months</td>
                                            <td className="fw-medium">₹{loan.emi.toLocaleString()}</td>
                                            <td style={{ minWidth: '200px', whiteSpace: 'normal' }} className="text-secondary small">
                                                {loan.purpose}
                                            </td>
                                            <td className="text-muted small">
                                                {new Date(loan.appliedDate).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        loan.status === "approved"
                                                            ? "success"
                                                            : loan.status === "pending"
                                                                ? "warning"
                                                                : "danger"
                                                    }
                                                    className="fw-normal"
                                                >
                                                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            No loan requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* LOAN REQUEST MODAL */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create Loan Request</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select SHG Group *</Form.Label>
                                    <Form.Select
                                        value={selectedGroup}
                                        onChange={(e) => {
                                            setSelectedGroup(e.target.value);
                                            setFormData({
                                                ...formData,
                                                memberId: "",
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Choose group</option>
                                        {myGroups.map((g) => (
                                            <option value={g.id} key={g.id}>
                                                {g.name} ({g.code})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                {selectedGroup && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Member *</Form.Label>
                                        <Form.Select
                                            value={formData.memberId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    memberId: e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            <option value="">Choose member...</option>

                                            {groupMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} (Balance: ₹
                                                    {getMemberSavingsBalance(m.id)})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}
                            </Col>
                        </Row>

                        {formData.memberId && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loan Product *</Form.Label>
                                    <Form.Select
                                        value={formData.productId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                productId: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Choose product</option>

                                        {loanProducts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.interestRate}% - Max: ₹
                                                {p.maxAmount})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Loan Amount *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        amount: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tenor *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.tenor}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        tenor: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Purpose *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.purpose}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                purpose: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </Form.Group>

                                <Alert variant="info">
                                    Member must have minimum 10% of loan amount in
                                    savings balance.
                                </Alert>
                            </>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Submit Request
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
