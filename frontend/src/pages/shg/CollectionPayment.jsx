import { useState, useEffect } from 'react';
import { Card, Tabs, Tab, Form, Button, Table, Badge, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import { useLocation } from 'react-router-dom';

export default function CollectionPayment() {
    const { data, currentUser, addItem, getMemberSavingsBalance, getLoanOutstanding, getMemberLoans } = useApp();
    const location = useLocation();

    // Determine initial tab based on path
    const getInitialTab = () => {
        if (location.pathname.includes('collection-loan')) return 'loan';
        if (location.pathname.includes('collection-memberwise')) return 'summary';
        return 'savings';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [selectedGroup, setSelectedGroup] = useState('');

    // Date Selection State
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

    // Savings State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [savingsData, setSavingsData] = useState({});
    const [defaultSavingsAmount, setDefaultSavingsAmount] = useState('');

    // Loan State
    const [loanRepaymentData, setLoanRepaymentData] = useState({});

    // Get groups assigned to current user
    const myGroups = data.shgGroups.filter(g => g.assignedTo === currentUser.id && g.status === 'active');

    // Get members from selected group
    const groupMembers = selectedGroup
        ? data.members.filter(m => m.groupId === parseInt(selectedGroup) && m.status === 'active')
        : [];

    // Get active saving products
    const savingProducts = data.savingProducts.filter(p => p.status === 'active');

    // Reset data when group changes
    useEffect(() => {
        setSavingsData({});
        setDefaultSavingsAmount('');
        setLoanRepaymentData({});
    }, [selectedGroup]);

    // Helper to get formatted date
    const getCollectionDate = () => {
        const collectionDate = new Date(selectedYear, selectedMonth, 1);
        return new Date(collectionDate.getTime() - (collectionDate.getTimezoneOffset() * 60000))
            .toISOString().split('T')[0];
    };

    // --- Savings Logic ---
    const handleSavingsAmountChange = (memberId, amount) => {
        setSavingsData(prev => ({ ...prev, [memberId]: amount }));
    };

    const handleDefaultSavingsChange = (amount) => {
        setDefaultSavingsAmount(amount);
        const newData = {};
        groupMembers.forEach(member => {
            newData[member.id] = amount;
        });
        setSavingsData(newData);
    };

    const handleSavingsSubmit = (e) => {
        e.preventDefault();
        const entries = Object.entries(savingsData).filter(([_, amount]) => amount && parseFloat(amount) > 0);

        if (entries.length === 0) {
            alert('Please enter at least one savings amount.');
            return;
        }
        if (!selectedProduct) {
            alert('Please select a saving product.');
            return;
        }

        const dateString = getCollectionDate();
        let count = 0;
        entries.forEach(([memberId, amount]) => {
            addItem('savings', {
                memberId: parseInt(memberId),
                productId: parseInt(selectedProduct),
                amount: parseFloat(amount),
                date: dateString,
                collectedBy: currentUser.id
            });
            count++;
        });

        setSavingsData({});
        setDefaultSavingsAmount('');
        alert(`Successfully recorded savings for ${count} members for ${months[selectedMonth]} ${selectedYear}!`);
    };

    const getTotalSavingsCollection = () => {
        return Object.values(savingsData).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    };

    // --- Loan Repayment Logic ---
    const handleLoanRepaymentChange = (loanId, amount) => {
        setLoanRepaymentData(prev => ({ ...prev, [loanId]: amount }));
    };

    const handleLoanRepaymentSubmit = (e) => {
        e.preventDefault();
        const entries = Object.entries(loanRepaymentData).filter(([_, amount]) => amount && parseFloat(amount) > 0);

        if (entries.length === 0) {
            alert('Please enter at least one repayment amount.');
            return;
        }

        const dateString = getCollectionDate();
        let count = 0;
        entries.forEach(([loanId, amount]) => {
            addItem('loanRepayments', {
                loanId: parseInt(loanId),
                amount: parseFloat(amount),
                date: dateString,
                type: 'emi',
                collectedBy: currentUser.id
            });
            count++;
        });

        setLoanRepaymentData({});
        alert(`Successfully recorded repayments for ${count} loans for ${months[selectedMonth]} ${selectedYear}!`);
    };

    const getTotalLoanCollection = () => {
        return Object.values(loanRepaymentData).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    };

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="h2 fw-bold mb-1">Collection Payment</h1>
                <p className="text-muted mb-0">Bulk collection for savings and loan repayments</p>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Select SHG Group</Form.Label>
                                <Form.Select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">Choose a group...</option>
                                    {myGroups.map(group => (
                                        <option key={group.id} value={group.id}>
                                            {group.name} ({group.code})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Collection Month</Form.Label>
                                <Row className="g-2">
                                    <Col xs={7}>
                                        <Form.Select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        >
                                            {months.map((month, index) => (
                                                <option key={index} value={index}>{month}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col xs={5}>
                                        <Form.Select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {selectedGroup ? (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k)}
                            className="mb-0"
                            variant="tabs"
                        >
                            <Tab eventKey="savings" title="💰 Savings Collection" />
                            <Tab eventKey="loan" title="💵 Loan Repayment" />
                            <Tab eventKey="summary" title="📊 Member Summary" />
                        </Tabs>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {/* SAVINGS TAB */}
                        {activeTab === 'savings' && (
                            <Form onSubmit={handleSavingsSubmit}>
                                <Row className="mb-4 g-3 align-items-end">
                                    <Col md={5}>
                                        <Form.Group>
                                            <Form.Label>Select Saving Product</Form.Label>
                                            <Form.Select
                                                value={selectedProduct}
                                                onChange={(e) => setSelectedProduct(e.target.value)}
                                                required
                                            >
                                                <option value="">Choose product...</option>
                                                {savingProducts.map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Default Amount</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>₹</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    placeholder="Apply to all"
                                                    value={defaultSavingsAmount}
                                                    onChange={(e) => handleDefaultSavingsChange(e.target.value)}
                                                    disabled={!selectedProduct}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} className="text-end">
                                        <Badge bg="success" className="fs-6 fw-normal p-2">
                                            Total: ₹{getTotalSavingsCollection().toLocaleString()}
                                        </Badge>
                                    </Col>
                                </Row>

                                {selectedProduct && (
                                    <>
                                        <div className="table-responsive mb-3">
                                            <Table hover className="mb-0 align-middle">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th style={{ width: '5%' }}>#</th>
                                                        <th style={{ width: '35%' }}>Member</th>
                                                        <th style={{ width: '20%' }}>Balance</th>
                                                        <th style={{ width: '40%' }}>Amount (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupMembers.map((member, index) => (
                                                        <tr key={member.id}>
                                                            <td className="text-muted">{index + 1}</td>
                                                            <td>
                                                                <div className="fw-medium">{member.name}</div>
                                                                <small className="text-muted">{member.memberCode}</small>
                                                            </td>
                                                            <td className="text-success fw-medium">
                                                                ₹{getMemberSavingsBalance(member.id).toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <InputGroup>
                                                                    <InputGroup.Text className="bg-light border-end-0">₹</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="0"
                                                                        value={savingsData[member.id] || ''}
                                                                        onChange={(e) => handleSavingsAmountChange(member.id, e.target.value)}
                                                                        className="border-start-0"
                                                                    />
                                                                </InputGroup>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                        <div className="d-flex justify-content-end">
                                            <Button type="submit" variant="primary" size="lg" disabled={getTotalSavingsCollection() === 0}>
                                                Save Savings Collection
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        )}

                        {/* LOAN TAB */}
                        {activeTab === 'loan' && (
                            <Form onSubmit={handleLoanRepaymentSubmit}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0">Active Loans</h5>
                                    <Badge bg="primary" className="fs-6 fw-normal p-2">
                                        Total Collection: ₹{getTotalLoanCollection().toLocaleString()}
                                    </Badge>
                                </div>

                                <div className="table-responsive mb-3">
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '25%' }}>Member</th>
                                                <th style={{ width: '20%' }}>Loan Product</th>
                                                <th style={{ width: '15%' }}>Outstanding</th>
                                                <th style={{ width: '15%' }}>EMI</th>
                                                <th style={{ width: '25%' }}>Repayment (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupMembers.flatMap(member => {
                                                const activeLoans = getMemberLoans(member.id).filter(l => l.status === 'approved');
                                                return activeLoans.map(loan => {
                                                    const product = data.loanProducts.find(p => p.id === loan.productId);
                                                    const outstanding = getLoanOutstanding(loan.id);
                                                    if (outstanding <= 0) return null; // Skip fully paid loans

                                                    return (
                                                        <tr key={loan.id}>
                                                            <td>
                                                                <div className="fw-medium">{member.name}</div>
                                                                <small className="text-muted">{member.memberCode}</small>
                                                            </td>
                                                            <td>
                                                                <div>{product?.name}</div>
                                                                <small className="text-muted">Total: ₹{loan.amount.toLocaleString()}</small>
                                                            </td>
                                                            <td className="text-danger fw-medium">
                                                                ₹{outstanding.toLocaleString()}
                                                            </td>
                                                            <td className="fw-medium">
                                                                ₹{loan.emi.toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <InputGroup>
                                                                    <InputGroup.Text className="bg-light border-end-0">₹</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="0"
                                                                        value={loanRepaymentData[loan.id] || ''}
                                                                        onChange={(e) => handleLoanRepaymentChange(loan.id, e.target.value)}
                                                                        className="border-start-0"
                                                                    />
                                                                </InputGroup>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })}
                                            {groupMembers.every(m => getMemberLoans(m.id).filter(l => l.status === 'approved' && getLoanOutstanding(l.id) > 0).length === 0) && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4 text-muted">
                                                        No active loans found for this group.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-flex justify-content-end">
                                    <Button type="submit" variant="primary" size="lg" disabled={getTotalLoanCollection() === 0}>
                                        Save Loan Repayments
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {/* SUMMARY TAB */}
                        {activeTab === 'summary' && (
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Member</th>
                                            <th>Savings Balance</th>
                                            <th>Active Loans</th>
                                            <th>Total Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupMembers.map(member => {
                                            const savingsBalance = getMemberSavingsBalance(member.id);
                                            const loans = getMemberLoans(member.id).filter(l => l.status === 'approved');
                                            const totalOutstanding = loans.reduce((sum, loan) => sum + getLoanOutstanding(loan.id), 0);

                                            return (
                                                <tr key={member.id}>
                                                    <td className="fw-medium">{member.name}</td>
                                                    <td className="text-success fw-semibold">
                                                        ₹{savingsBalance.toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <Badge bg="primary" pill>{loans.length}</Badge>
                                                    </td>
                                                    <td className="text-danger fw-semibold">
                                                        ₹{totalOutstanding.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            ) : (
                <div className="text-center py-5 text-muted">
                    <div className="fs-1 mb-3">👥</div>
                    <p className="fs-5">Select a SHG Group to start collection</p>
                </div>
            )}
        </div>
    );
}
