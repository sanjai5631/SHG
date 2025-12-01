import { useState, useMemo } from "react";
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Alert,
    Row,
    Col,
    Badge,
    Pagination,
} from "react-bootstrap";

import { useApp } from "../../context/AppContext";
import { FaSave } from "react-icons/fa";

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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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

    // Get current group details for repayment section (moved up for scope)
    const currentRepaymentGroup = useMemo(() =>
        data.shgGroups.find(g => g.id === parseInt(repaymentGroup)),
        [data.shgGroups, repaymentGroup]
    );

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

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedMembers = membersWithLoans.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(membersWithLoans.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // ... (keep existing helper functions)
    // Get total repaid amount
    const getAmountRepaid = (memberId) => {
        const repayments =
            data.transactions?.filter(
                (t) => t.memberId === memberId && t.type === "repayment"
            ) || [];

        return repayments.reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    // Get active approved loan
    const getActiveLoan = (memberId) => {
        return (
            data.loans.find(
                (loan) => loan.memberId === memberId && loan.status === "approved"
            ) || null
        );
    };

    // Get outstanding loan balance
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

            if (field === "paymentType" && value === "online") {
                // Auto-select the assigned online collection account if available
                if (currentRepaymentGroup?.onlineCollectionId) {
                    updates.onlinePerson = currentRepaymentGroup.onlineCollectionId;
                }
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
            {/* Table */}
            <Card className="border-1 shadow-sm" style={{ height: '10px' }}>
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
                                    onChange={(e) => {
                                        setRepaymentGroup(e.target.value);
                                        setCurrentPage(1); // Reset to page 1 on filter change
                                    }}
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
                        <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                <tr>
                                    <th style={{ width: '7%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>EMP<br />CODE</th>
                                    <th style={{ width: '10%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>NAME</th>
                                    <th style={{ width: '10%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>OUTSTANDING</th>
                                    <th style={{ width: '8%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>PRINCIPAL</th>
                                    <th style={{ width: '7%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>1% INT.</th>
                                    <th style={{ width: '8%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TOTAL<br />DEMAND</th>
                                    <th style={{ width: '10%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>COLLECTION</th>
                                    <th style={{ width: '8%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>INT.</th>
                                    <th style={{ width: '8%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TYPE</th>
                                    <th style={{ width: '10%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>PERSON</th>
                                    <th style={{ width: '8%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>TOTAL</th>
                                    <th style={{ width: '6%', fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', padding: '14px 10px', borderBottom: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedMembers.map((m, index) => {
                                    const loan = getActiveLoan(m.id);
                                    const repaid = getAmountRepaid(m.id);
                                    const balance = getLoanBalance(m.id);

                                    const demandP = Math.round(loan.amount / 5);
                                    const demandI = Math.round(demandP * 0.01);

                                    const entry = entries[m.id] || {};
                                    const principal = Number(entry.collectionAmount || 0);
                                    const intr = Math.round(principal * 0.01);
                                    const total = principal + intr;
                                    const rowBg = index % 2 === 0 ? "#bbdefb" : "#ffffff";

                                    return (
                                        <tr
                                            key={m.id}
                                            style={{
                                                backgroundColor: rowBg,
                                                borderBottom: "1px solid #dee2e6"
                                            }}
                                        >
                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#6c757d', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{m.employeeCode || '-'}</td>
                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{m.name}</td>
                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#dc3545', fontWeight: '600', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>
                                                ₹{balance.toLocaleString()}
                                            </td>
                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{demandP.toLocaleString()}</td>
                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', borderRight: '1px solid #dee2e6' }}>
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
                                                    style={{ fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
                                                />
                                            </td>
                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>
                                                ₹{(demandP + demandI).toLocaleString()}
                                            </td>

                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', borderRight: '1px solid #dee2e6' }}>
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
                                                    style={{ minWidth: '90px', fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
                                                />
                                            </td>

                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', borderRight: '1px solid #dee2e6' }}>
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
                                                    style={{ fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
                                                />
                                            </td>

                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', borderRight: '1px solid #dee2e6' }}>
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
                                                    style={{ minWidth: '80px', fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="online">Online</option>
                                                </Form.Select>
                                            </td>

                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', borderRight: '1px solid #dee2e6' }}>
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
                                                        style={{ minWidth: '110px', fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
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

                                            <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#28a745', fontWeight: '600', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>
                                                {principal > 0 ? `₹${total.toLocaleString()}` : "-"}
                                            </td>

                                            <td style={{ backgroundColor: rowBg, padding: '12px 8px', textAlign: 'center' }}>
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    disabled={!principal}
                                                    onClick={() => handleSave(m.id)}
                                                    style={{
                                                        backgroundColor: '#10b981',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <FaSave />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: '#f8f9fa', zIndex: 10, borderTop: '2px solid #dee2e6' }}>
                                <tr>
                                    <td colSpan={3} style={{ fontSize: '0.875rem', fontWeight: '700', textAlign: 'right', color: '#049bffff', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>Grand Total:</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalDemandPrincipal.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalDemandInterest.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{(totalDemandPrincipal + totalDemandInterest).toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0d6efd', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalCollectionPrincipal.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalCollectionInterest.toLocaleString()}</td>
                                    <td style={{ fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>-</td>
                                    <td style={{ fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>-</td>
                                    <td style={{ fontSize: '0.875rem', fontWeight: '700', color: '#28a745', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{(totalCollectionPrincipal + totalCollectionInterest).toLocaleString()}</td>
                                    <td style={{ padding: '16px 8px' }}></td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                </Card.Body>
                {/* Pagination Controls */}
                {totalPages > 1 && (
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
                )}
            </Card>

            {/* Loan Request Modal */}
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
