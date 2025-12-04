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
import DataTable from "../../components/DataTable";
import { FaSave, FaMoneyBillWave } from "react-icons/fa";

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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [entries, setEntries] = useState({});
    const [totalCashCalculated, setTotalCashCalculated] = useState(0);
    const [showCashModal, setShowCashModal] = useState(false);

    const [formData, setFormData] = useState({
        memberId: "",
        productId: "",
        amount: "",
        tenor: "",
        purpose: "",
    });
    // Cash Denomination State
    const [denominations, setDenominations] = useState({
        500: 0,
        200: 0,
        100: 0,
        50: 0,
        20: 0,
        10: 0
    });


    const handleDenominationChange = (value, count) => {
        const newDenominations = {
            ...denominations,
            [value]: parseInt(count) || 0
        };
        setDenominations(newDenominations);

        // Calculate total cash
        const total = Object.entries(newDenominations).reduce((sum, [val, cnt]) => sum + (parseInt(val) * cnt), 0);
        setTotalCashCalculated(total);
    };

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

    // Calculate total system cash for denomination matching
    const totalSystemCash = membersWithLoans.reduce((sum, m) => {
        const entry = entries[m.id] || {};
        if (entry.paymentType === 'cash') {
            return sum + (Number(entry.collectionAmount) || 0) + (Number(entry.interestAmount) || 0);
        }
        return sum;
    }, 0);

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

    const footerRenderer = (currentData) => {
        return (
            <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: '#f8f9fa', zIndex: 10, borderTop: '2px solid #dee2e6' }}>
                <tr>
                    <td colSpan={3} style={{ fontSize: '0.875rem', fontWeight: '700', textAlign: 'right', color: '#049bffff', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>Grand Total:</td>
                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalDemandPrincipal.toLocaleString()}</td>
                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalDemandInterest.toLocaleString()}</td>
                    <td style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0d6efd', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalCollectionPrincipal.toLocaleString()}</td>
                    <td style={{ fontSize: '0.875rem', fontWeight: '700', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{totalCollectionInterest.toLocaleString()}</td>
                    <td colSpan={2} style={{ padding: '12px 16px', borderRight: '1px solid #dee2e6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '700', color: '#28a745', }}>
                                ₹{(totalCollectionPrincipal + totalCollectionInterest).toLocaleString()}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => {
                                        // Save all entries logic here
                                        alert('Saving all collections...');
                                    }}
                                    className="shadow-sm"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontWeight: '600'
                                    }}
                                >
                                    <FaSave size={14} />
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => setShowCashModal(true)}
                                    className="shadow-sm ms-3"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px 12px',
                                        borderRadius: '8px'
                                    }}
                                    title="Cash Denomination"
                                >
                                    <FaMoneyBillWave size={16} />
                                </Button>
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot>
        );
    };

    // ===========================
    // UI
    // ===========================

    // Styles matching DataTable.jsx
    const headerStyle = {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: '#6c757d',
        backgroundColor: '#f8f9fa',
        padding: '16px 16px', // py-3 px-3
        borderBottom: '0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        textAlign: 'left',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap'
    };

    return (
        <div className="fade-in">
            {/* Table */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fw-bold mb-4 text-dark">Loan Repayment Collection</h3>
                <Form.Group className="mb-0" style={{ width: 'auto', minWidth: '180px' }}>
                    <Form.Select
                        size="sm"
                        value={repaymentGroup}
                        onChange={(e) => {
                            setRepaymentGroup(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on filter change
                        }}
                        style={{ fontSize: '0.875rem', borderRadius: '6px' }}
                    >
                        <option value="">All Groups</option>
                        {myGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </div>

            {/* Table */}
            <Card className="border-1 shadow-sm">
                <Card.Body className="p-0">

                    <DataTable
                        key={repaymentGroup}
                        data={membersWithLoans.map(m => {
                            const loan = getActiveLoan(m.id);
                            const repaid = getAmountRepaid(m.id);
                            const balance = getLoanBalance(m.id);
                            const demandP = Math.round(loan.amount / 5);
                            const demandI = Math.round(demandP * 0.01);
                            const entry = entries[m.id] || {};
                            const principal = Number(entry.collectionAmount || 0);
                            const intr = Math.round(principal * 0.01);
                            const total = principal + intr;

                            return {
                                ...m,
                                loanId: loan.id, // For key
                                balance,
                                demandP,
                                demandI,
                                totalDemand: demandP + demandI,
                                entry, // Pass entry for renderers
                                principal,
                                intr,
                                total
                            };
                        })}
                        initialColumns={[
                            { key: 'employeeCode', label: 'ID', sortable: true, render: (val) => <span style={{ color: '#6c757d' }}>{val || '-'}</span> },
                            { key: 'name', label: 'NAME', sortable: true, render: (val) => <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{val}</span> },
                            {
                                key: 'balance', label: 'PENDING LOAN', sortable: true,
                                render: (val) => <span style={{ color: '#dc3545', fontWeight: '600' }}>₹{val.toLocaleString()}</span>
                            },
                            { key: 'demandP', label: 'DEMAND PRINCIPAL', sortable: true, render: (val) => `₹${val.toLocaleString()}` },
                            {
                                key: 'demandInterest',
                                label: 'DEMAND INT',
                                sortable: true,
                                render: (_, row) => {
                                    const demandInt = row.entry.demandInterest !== undefined ? row.entry.demandInterest : Math.round(row.demandP * 0.01);
                                    return `₹${demandInt.toLocaleString()}`;
                                }
                            },

                            {
                                key: 'collectionAmount', label: 'COLLECTION', sortable: false,
                                render: (_, row) => (
                                    <div style={{ width: '100px' }}>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={row.entry.collectionAmount || ""}
                                            onChange={(e) => handleInputChange(row.id, "collectionAmount", e.target.value)}
                                            onKeyPress={(e) => {
                                                if (!/[0-9]/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            style={{ width: '100px', minWidth: '100px', textAlign: 'right' }}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'interestAmount', label: 'INTREST', sortable: false,
                                render: (_, row) => (
                                    <div style={{ width: '80px' }}>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={row.entry.interestAmount !== undefined ? row.entry.interestAmount : ""}
                                            onChange={(e) => handleInputChange(row.id, "interestAmount", e.target.value)}
                                            onKeyPress={(e) => {
                                                if (!/[0-9]/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            style={{ width: '80px', minWidth: '80px', maxWidth: '80px', fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', textAlign: 'right', backgroundColor: '#fff' }}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'paymentType', label: 'PAYMENT TYPE', sortable: false,
                                render: (_, row) => (
                                    <div style={{ width: '100px' }}>
                                        <Form.Select
                                            size="sm"
                                            value={row.entry.paymentType || "cash"}
                                            onChange={(e) => handleInputChange(row.id, "paymentType", e.target.value)}
                                            style={{ width: '100px', minWidth: '100px', maxWidth: '100px', fontSize: '0.890rem', padding: '8px', border: 'transparent', borderRadius: '8px', backgroundColor: 'transparent' }}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="online">Online</option>
                                        </Form.Select>
                                    </div>
                                )
                            },
                            {
                                key: 'onlinePerson', label: 'ONLINE PERSON', sortable: false,
                                render: (_, row) => row.entry.paymentType === "online" ? (
                                    <div style={{ width: '130px' }}>
                                        <Form.Select
                                            size="sm"
                                            value={row.entry.onlinePerson || ""}
                                            onChange={(e) => handleInputChange(row.id, "onlinePerson", e.target.value)}
                                            style={{ width: '130px', minWidth: '130px', maxWidth: '130px', fontSize: '0.875rem', padding: '8px', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#fff' }}
                                        >
                                            <option value="">Select</option>
                                            {data.members
                                                .filter((x) => x.id !== row.id)
                                                .map((x) => (
                                                    <option key={x.id} value={x.id}>{x.name}</option>
                                                ))}
                                        </Form.Select>
                                    </div>
                                ) : <span className="text-muted small">-</span>
                            }
                        ]}
                        enableFilter={true}
                        enablePagination={true}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        footerRenderer={footerRenderer}
                    />
                </Card.Body>
            </Card>

            {/* Loan Request Modal */}
            < Modal
                show={showModal}
                onHide={() => setShowModal(false)
                }
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
            </Modal >



            {/* Cash Denomination Modal */}
            <Modal
                show={showCashModal}
                onHide={() => setShowCashModal(false)}
                centered
                dialogClassName="modal-360w"
            >
                <style type="text/css">
                    {`
                        .modal-360w {
                            max-width: 360px;
                        }
                    `}
                </style>
                <Modal.Header closeButton className="bg-white border-bottom py-2 px-3">
                    <Modal.Title className="fw-bold fs-6">Cash Denomination</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <Table className="mb-0 align-middle" size="sm" hover>
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-3 py-2" style={{ width: '30%', fontSize: '0.8rem' }}>Denomination</th>
                                <th className="text-center py-2" style={{ width: '30%', fontSize: '0.8rem' }}>Count</th>
                                <th className="text-end pe-3 py-2" style={{ width: '40%', fontSize: '0.8rem' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[500, 200, 100, 50, 20, 10].map((val) => (
                                <tr key={val}>
                                    <td className="ps-3 fw-medium" style={{ fontSize: '0.85rem' }}>₹{val}</td>
                                    <td className="text-center py-1">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={denominations[val] || ''}
                                            onChange={(e) => handleDenominationChange(val, e.target.value)}
                                            className="text-center mx-auto p-0"
                                            style={{ width: '60px', fontSize: '0.85rem', height: '24px' }}
                                        />
                                    </td>
                                    <td className="text-end pe-3 fw-medium" style={{ fontSize: '0.85rem' }}>
                                        ₹{(val * (denominations[val] || 0)).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-light">
                            <tr>
                                <td className="ps-3 fw-bold" style={{ fontSize: '0.85rem' }}>Total</td>
                                <td className="text-center fw-bold" style={{ fontSize: '0.85rem' }}>
                                    {Object.values(denominations).reduce((a, b) => a + b, 0)}
                                </td>
                                <td className="text-end pe-3 fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                    ₹{totalCashCalculated.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="ps-3 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>System Cash</td>
                                <td className="text-end pe-3 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>
                                    ₹{totalSystemCash.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="ps-3 fw-bold" style={{ fontSize: '0.85rem' }}>Difference</td>
                                <td className={`text-end pe-3 fw-bold ${totalCashCalculated - totalSystemCash === 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem' }}>
                                    ₹{(totalCashCalculated - totalSystemCash).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </Table>
                </Modal.Body>
            </Modal>
        </div >
    );
}
