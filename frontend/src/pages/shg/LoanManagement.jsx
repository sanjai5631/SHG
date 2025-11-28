import { useState } from "react";
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Alert,
    Row,
    Col,
} from "react-bootstrap";
import {
      FaSave
}from "react-icons/fa";
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
    const [repaymentGroup, setRepaymentGroup] = useState("");
    const [entries, setEntries] = useState({});
    const [formData, setFormData] = useState({
        memberId: "",
        productId: "",
        amount: "",
        tenor: "",
        purpose: "",
    });

    // ===========================
    // LOAN REQUEST
    // ===========================

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
        const monthlyInterest =
            (loanAmount * product.interestRate) / (100 * 12);

        const emi = Math.round(loanAmount / tenor + monthlyInterest);

        addItem("loans", {
            memberId: Number(formData.memberId),
            productId: Number(formData.productId),
            amount: loanAmount,
            interestRate: product.interestRate,
            tenor,
            purpose: formData.purpose,
            status: "pending",
            appliedDate: new Date().toISOString().split("T")[0],
            emi,
        });

        setShowModal(false);
        alert("Loan request created successfully!");
    };

    // ===========================
    // REPAYMENT SECTION
    // ===========================

    const membersWithLoans = data.members.filter((member) => {
        const hasLoan = data.loans.some(
            (l) => l.memberId === member.id && l.status === "approved"
        );
        const matchesGroup =
            !repaymentGroup || member.groupId === parseInt(repaymentGroup);
        return hasLoan && matchesGroup;
    });

    // ... (keep existing helper functions)

    const getAmountRepaid = (memberId) => {
        const repayments =
            data.transactions?.filter(
                (t) => t.memberId === memberId && t.type === "repayment"
            ) || [];
        return repayments.reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    const getLoanBalance = (memberId) => {
        const loan = getActiveLoan(memberId);
        if (!loan) return 0;

        const repaid = getAmountRepaid(memberId);
        return loan.amount - repaid;
    };

    const handleInputChange = (memberId, field, value) => {
        setEntries((prev) => {
            const currentEntry = prev[memberId] || {};
            const updates = { [field]: value };

            if (field === "collectionAmount") {
                updates.interestAmount = Math.round(Number(value) * 0.01);
            }

            return {
                ...prev,
                [memberId]: {
                    ...currentEntry,
                    ...updates,
                },
            };
        });
    };

    const handleSave = (memberId) => {
        const entry = entries[memberId] || {};

        const principal = Number(entry.collectionAmount || 0);
        const interest = Number(entry.interestAmount || 0);
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

    // ===========================
    // TOTAL FOOTER
    // ===========================

    const totalDemandPrincipal = membersWithLoans.reduce((sum, m) => {
        const loan = getActiveLoan(m.id);
        if (!loan) return sum;
        return sum + Math.round(loan.amount / 5);
    }, 0);

    const totalDemandInterest = Math.round(totalDemandPrincipal * 0.01);

    const totalCollectionPrincipal = membersWithLoans.reduce((sum, m) => {
        const entry = entries[m.id] || {};
        return sum + Number(entry.collectionAmount || 0);
    }, 0);

    const totalCollectionInterest = membersWithLoans.reduce((sum, m) => {
        const entry = entries[m.id] || {};
        return sum + Number(entry.interestAmount || 0);
    }, 0);

    // ===========================
    // UI
    // ===========================

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bold">Loan Management</h1>
                    <p className="text-muted">
                        Create loan requests and collect repayments
                    </p>
                </div>

                <Button variant="warning" onClick={() => setShowModal(true)}>
                    ➕ Add Loan Request
                </Button>
            </div>

            {/* Table */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h5 className="fw-semibold mb-0">Loan Repayment Collection</h5>
                        </Col>
                        <Col md={4} className="text-end">
                            <Form.Group className="mb-0" style={{ display: 'inline-block', width: 'auto', minWidth: '180px' }}>
                                <Form.Select
                                    size="sm"
                                    value={repaymentGroup}
                                    onChange={(e) => setRepaymentGroup(e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
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
                    <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
                        <Table className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                                <tr>
                                    <th style={{ width: '7%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>EMP<br />CODE</th>
                                    <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>NAME</th>
                                    <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>OUTSTANDING</th>
                                    <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>PRINCIPAL</th>
                                    <th style={{ width: '7%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>1% INT.</th>
                                    <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TOTAL<br />DEMAND</th>
                                    <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>COLLECTION</th>
                                    <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>INT.</th>
                                    <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TYPE</th>
                                    <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>PERSON</th>
                                    <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TOTAL</th>
                                    <th style={{ width: '6%', fontSize: '0.65rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #e0e0e0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {membersWithLoans.map((m) => {
                                    const loan = getActiveLoan(m.id);
                                    const repaid = getAmountRepaid(m.id);
                                    const balance = getLoanBalance(m.id);

                                    const entry = entries[m.id] || {};
                                    const demandP = Math.round(loan.amount / 5);
                                    const demandI = entry.demandInterest !== undefined ? Number(entry.demandInterest) : Math.round(demandP * 0.01);

                                    const principal = Number(entry.collectionAmount || 0);
                                    const intr = entry.interestAmount !== undefined ? Number(entry.interestAmount) : 0;
                                    const total = principal + intr;

                                    return (
                                        <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ fontSize: '0.875rem', color: '#6c757d', padding: '16px 8px' }}>{m.employeeCode || '-'}</td>
                                            <td style={{ fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px' }}>{m.name}</td>
                                            <td style={{ fontSize: '0.875rem', color: '#dc3545', fontWeight: '600', padding: '16px 8px' }}>
                                                ₹{balance.toLocaleString()}
                                            </td>
                                            <td style={{ fontSize: '0.875rem', padding: '16px 8px' }}>₹{demandP.toLocaleString()}</td>
                                           <td style={{ padding: '12px 8px' }}>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={entry.demandInterest !== undefined ? entry.demandInterest : Math.round(demandP * 0.01)}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            m.id,
                                                            "demandInterest",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{ fontSize: '0.875rem', padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                                                />
                                            </td>
                                            <td style={{ fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px' }}>
                                                ₹{(demandP + demandI).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '12px 8px' }}>
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
                                                    style={{ fontSize: '0.875rem', padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                                                />
                                            </td>

                                            <td style={{ padding: '12px 8px' }}>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={entry.interestAmount !== undefined ? entry.interestAmount : ""}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            m.id,
                                                            "interestAmount",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{ fontSize: '0.875rem', padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                                                />
                                            </td>

                                            <td style={{ padding: '12px 8px' }}>
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
                                                    style={{ fontSize: '0.875rem', padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="online">Online</option>
                                                </Form.Select>
                                            </td>

                                            <td style={{ padding: '12px 8px' }}>
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
                                                        style={{ fontSize: '0.875rem', padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
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
                                                    <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>-</span>
                                                )}
                                            </td>

                                            <td style={{ fontSize: '0.875rem', color: '#28a745', fontWeight: '600', padding: '16px 8px' }}>
                                                {principal > 0 ? `₹${total.toLocaleString()}` : "-"}
                                            </td>

                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    disabled={!principal}
                                                    onClick={() => handleSave(m.id)}
                                                    style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '4px' }}
                                                >
                                                  <FaSave/>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: '#f8f9fa', zIndex: 10, borderTop: '2px solid #dee2e6' }}>
                                <tr>
                                    <td colSpan={3} style={{ fontSize: '0.875rem', fontWeight: '700', textAlign: 'right', padding: '16px 8px' }}>Grand Total:</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px' }}>₹{totalDemandPrincipal.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px' }}>₹{totalDemandInterest.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px' }}>₹{(totalDemandPrincipal + totalDemandInterest).toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0d6efd', padding: '16px 8px' }}>₹{totalCollectionPrincipal.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px' }}>₹{totalCollectionInterest.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', padding: '16px 8px' }}>-</td>
                                    <td style={{ fontSize: '0.875rem', padding: '16px 8px' }}>-</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', color: '#28a745', padding: '16px 8px' }}>₹{(totalCollectionPrincipal + totalCollectionInterest).toLocaleString()}</td>
                                    <td style={{ padding: '16px 8px' }}></td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
            {/* Loan Request Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create Loan Request</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
 <Col md={4} className="text-end">
                            <Form.Group className="mb-0" style={{ display: 'inline-block', width: 'auto', minWidth: '180px' }}>
                                <Form.Select
                                    size="sm"
                                    value={repaymentGroup}
                                    onChange={(e) => setRepaymentGroup(e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    <option value="">All Groups</option>
                                    {myGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                            <Col md={6}>
                                {selectedGroup && (
                                    <Form.Group>
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
                                            <option value="">
                                                Choose member...
                                            </option>
                                            {groupMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} (Balance: ₹
                                                    {getMemberSavingsBalance(
                                                        m.id
                                                    )}
                                                    )
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}
                            </Col>
                        </Row>

                        {formData.memberId && (
                            <>
                                <Form.Group>
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
                                        <option value="">
                                            Choose product
                                        </option>
                                        {loanProducts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.interestRate}% - Max:
                                                ₹{p.maxAmount})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Loan Amount *
                                            </Form.Label>
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
                                        <Form.Group>
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

                                <Form.Group>
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

                                <Alert variant="info" className="mt-3">
                                    Member must have minimum 10% of loan amount
                                    in savings balance.
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
                        <Button type="submit" variant="success">
                            Submit Request
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
