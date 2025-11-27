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

    // Filter members with loans by selected group
    const membersWithLoans = data.members.filter((member) => {
        const hasLoan = data.loans.some(
            (l) => l.memberId === member.id && l.status === "approved"
        );
        const matchesGroup = !repaymentGroup || member.groupId === parseInt(repaymentGroup);
        return hasLoan && matchesGroup;
    });

    const getActiveLoan = (memberId) =>
        data.loans.find(
            (l) => l.memberId === memberId && l.status === "approved"
        );

    // Calculate total repaid
    const getAmountRepaid = (memberId) => {
        const repayments =
            data.transactions?.filter(
                (t) => t.memberId === memberId && t.type === "repayment"
            ) || [];

        return repayments.reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    // Calculate loan balance
    const getLoanBalance = (memberId) => {
        const loan = getActiveLoan(memberId);
        if (!loan) return 0;

        const repaid = getAmountRepaid(memberId);
        return loan.amount - repaid;
    };

    const handleInputChange = (memberId, field, value) => {
        setEntries((prev) => ({
            ...prev,
            [memberId]: {
                ...prev[memberId],
                [field]: value,
            },
        }));
    };

    const handleSave = (memberId) => {
        const entry = entries[memberId] || {};

        const principal = Number(entry.collectionAmount || 0);
        const interest = Math.round(principal * 0.01);
        const total = principal + interest;

        const loan = getActiveLoan(memberId);
        const demandPrincipal = Math.round(loan.amount / 5);

        if (principal !== demandPrincipal) {
            if (
                !window.confirm(
                    "⚠ Collection amount does not match demand. Continue?"
                )
            )
                return;
        }

        addTransaction({
            type: "repayment",
            memberId,
            principal,
            interest,
            amount: total,
            paymentType: entry.paymentType || "cash",
            onlinePerson:
                entry.paymentType === "online" ? entry.onlinePerson : null,
        });

        setEntries((prev) => {
            const newState = { ...prev };
            delete newState[memberId];
            return newState;
        });
    };

    // ============================================================
    //                      COMPONENT UI
    // ============================================================

    return (
        <div className="fade-in">
            {/* TITLE */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bold">Loan Management</h1>
                    <p className="text-muted">
                        Create loan requests and collect repayments
                    </p>
                </div>

                <Button variant="primary" onClick={() => setShowModal(true)}>
                    ➕ New Loan Request
                </Button>
            </div>

            {/* REPAYMENT TABLE */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="fw-semibold mb-0">Loan Repayment Collection</h5>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-0">
                                <Form.Select
                                    size="sm"
                                    value={repaymentGroup}
                                    onChange={(e) => setRepaymentGroup(e.target.value)}
                                >
                                    <option value="">All Groups</option>
                                    {myGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle" style={{ minWidth: '1200px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th style={{ minWidth: '90px' }}>EMP CODE</th>
                                    <th style={{ minWidth: '140px' }}>NAME</th>
                                    <th style={{ minWidth: '110px' }}>OUTSTANDING</th>
                                    <th style={{ minWidth: '100px' }}>PRINCIPAL</th>
                                    <th style={{ minWidth: '80px' }}>1% INT.</th>
                                    <th style={{ minWidth: '120px' }}>TOTAL DEMAND</th>
                                    <th style={{ minWidth: '110px' }}>COLLECTION</th>
                                    <th style={{ minWidth: '70px' }}>INT.</th>
                                    <th style={{ minWidth: '100px' }}>TYPE</th>
                                    <th style={{ minWidth: '150px' }}>PERSON</th>
                                    <th style={{ minWidth: '100px' }}>TOTAL</th>
                                    <th style={{ minWidth: '80px' }}>ACTION</th>
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
                                            <td className="fw-medium">{m.name}</td>
                                            <td className="text-danger fw-bold">
                                                ₹{balance.toLocaleString()}
                                            </td>
                                            <td>₹{demandP.toLocaleString()}</td>
                                            <td>₹{demandI.toLocaleString()}</td>
                                            <td className="fw-bold">
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
                                                />
                                            </td>

                                            <td>{principal > 0 ? `₹${intr}` : "-"}</td>

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
                                                    variant="primary"
                                                    disabled={!principal}
                                                    onClick={() => handleSave(m.id)}
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
                <Card.Header className="bg-white">
                    <h5 className="fw-semibold mb-0">All Loan Requests</h5>
                </Card.Header>

                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle text-nowrap">
                            <thead className="bg-light">
                                <tr>
                                    <th>Member</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Interest</th>
                                    <th>Tenor</th>
                                    <th>EMI</th>
                                    <th>Purpose</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {myLoans.length ? (
                                    myLoans.map((loan) => (
                                        <tr key={loan.id}>
                                            <td className="fw-medium">{getMemberName(loan.memberId)}</td>
                                            <td>{getProductName(loan.productId)}</td>
                                            <td className="fw-bold">₹{loan.amount.toLocaleString()}</td>
                                            <td>{loan.interestRate}%</td>
                                            <td>{loan.tenor} months</td>
                                            <td>₹{loan.emi.toLocaleString()}</td>
                                            <td style={{ minWidth: '200px', whiteSpace: 'normal' }}>
                                                {loan.purpose}
                                            </td>
                                            <td className="text-muted">
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
