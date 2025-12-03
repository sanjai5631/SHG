import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function EasyEntry() {
    const { data, getMemberSavingsBalance } = useApp();

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedMember, setSelectedMember] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactions, setTransactions] = useState([]);
    const [openingBalance, setOpeningBalance] = useState({ cash: 0, bank: 0 });
    const [closingBalance, setClosingBalance] = useState({ cash: 0, bank: 0 });

    // Get active groups
    const activeGroups = data.shgGroups.filter(g => g.status === 'active');

    // Get members for selected group
    const groupMembers = selectedGroup
        ? data.members.filter(m => m.groupId === parseInt(selectedGroup) && m.status === 'active')
        : [];

    // Calculate overall cash in hand
    useEffect(() => {
        if (data) {
            // Total Savings Collected
            const totalSavings = (data.savings || []).reduce((sum, s) => sum + s.amount, 0);

            // Total Loan Repayments Collected
            const totalRepayments = (data.loanRepayments || []).reduce((sum, r) => sum + r.amount, 0);

            // Total Loans Disbursed
            const totalDisbursed = (data.loans || [])
                .filter(l => l.status === 'approved')
                .reduce((sum, l) => sum + l.amount, 0);

            const cashInHand = totalSavings + totalRepayments - totalDisbursed;

            setOpeningBalance(prev => ({
                ...prev,
                cash: cashInHand
            }));
        }
    }, [data]);

    // Load member's accounts when member is selected
    useEffect(() => {
        if (selectedMember) {
            const member = data.members.find(m => m.id === parseInt(selectedMember));
            if (member) {
                const memberTransactions = [];

                // Add Savings Account
                const savingsBalance = getMemberSavingsBalance(member.id);
                memberTransactions.push({
                    id: 'savings-' + member.id,
                    accountType: 'Savings',
                    head: 'Savings Deposit',
                    outstanding: savingsBalance,
                    demand: 0,
                    collection: ''
                });

                // Add Loan Accounts (if member has active loans)
                const memberLoans = data.loans.filter(
                    l => l.memberId === member.id && l.status === 'approved'
                );

                memberLoans.forEach(loan => {
                    const loanProduct = data.loanProducts.find(p => p.id === loan.productId);
                    // Use loanRepayments instead of transactions
                    const repaid = (data.loanRepayments || [])
                        .filter(r => r.loanId === loan.id)
                        .reduce((sum, r) => sum + r.amount, 0);
                    const outstanding = loan.amount - repaid;

                    if (outstanding > 0) {
                        // Add Principal row
                        memberTransactions.push({
                            id: 'loan-principal-' + loan.id,
                            loanId: loan.id,
                            accountType: 'Loan',
                            head: `${loanProduct?.name || 'Loan'} - Principal`,
                            outstanding: outstanding,
                            demand: loan.emi || 0,
                            collection: ''
                        });

                        // Add Interest row
                        memberTransactions.push({
                            id: 'loan-interest-' + loan.id,
                            loanId: loan.id,
                            accountType: 'Loan',
                            head: `${loanProduct?.name || 'Loan'} - Interest`,
                            outstanding: 0,
                            demand: 0,
                            collection: ''
                        });
                    }
                });

                setTransactions(memberTransactions);
            }
        } else {
            setTransactions([]);
        }
    }, [selectedMember, data, getMemberSavingsBalance]);

    // Calculate totals
    const calculateTotal = () => {
        return transactions.reduce((sum, t) => {
            return sum + (parseFloat(t.collection) || 0);
        }, 0);
    };

    // Auto-update closing balance when transactions change
    useEffect(() => {
        const total = calculateTotal();
        setClosingBalance({
            cash: openingBalance.cash + total,
            bank: openingBalance.bank
        });
    }, [transactions, openingBalance]);

    // Handle collection change
    const handleCollectionChange = (index, value) => {
        const newTransactions = [...transactions];
        newTransactions[index].collection = value;
        setTransactions(newTransactions);
    };

    const handleSave = () => {
        // Implement save logic here
        console.log('Saving transactions:', transactions);
        alert('Transaction saved successfully!');
    };

    const handleCancel = () => {
        setSelectedGroup('');
        setSelectedMember('');
        setTransactions([]);
    };

    return (
        <div className="fade-in">
            <div className="d-flex align-items-center mb-3">
                <div className="vr me-2 text-success" style={{ width: '4px', height: '24px', opacity: 1 }}></div>
                <h5 className="mb-0 fw-bold">Easy Entry - Memberwise Collection</h5>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    {/* Form Fields */}
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Group Name<span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={selectedGroup}
                                    onChange={(e) => {
                                        setSelectedGroup(e.target.value);
                                        setSelectedMember('');
                                        setTransactions([]);
                                    }}
                                >
                                    <option value="">Select Group</option>
                                    {activeGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Member Name<span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    disabled={!selectedGroup}
                                >
                                    <option value="">Select Member</option>
                                    {groupMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Transaction Date<span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Opening Balance */}
                    <div className="d-flex justify-content-between align-items-center mb-3 small fw-bold">
                        <div>Opening Balance</div>
                        <div className="d-flex gap-5">
                            <div>Cash ₹ {openingBalance.cash.toLocaleString()} DR</div>
                            <div>Bank ₹ {openingBalance.bank.toLocaleString()} CR</div>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="table-responsive mb-4">
                        <Table bordered hover size="sm" className="align-middle">
                            <thead className="bg-secondary text-white small">
                                <tr>
                                    <th>Account Type</th>
                                    <th>Transaction Head</th>
                                    <th>Outstanding</th>
                                    <th>Demand</th>
                                    <th style={{ width: '150px' }}>Collection</th>
                                </tr>
                            </thead>
                            <tbody className="small">
                                {transactions.length > 0 ? (
                                    transactions.map((t, index) => (
                                        <tr key={t.id}>
                                            <td className="fw-semibold">{t.accountType}</td>
                                            <td>{t.head}</td>
                                            <td className="text-end">₹{t.outstanding.toLocaleString()}</td>
                                            <td className="text-end">₹{t.demand.toLocaleString()}</td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    type="text"
                                                    value={t.collection}
                                                    onChange={(e) => handleCollectionChange(index, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        // Allow: backspace, delete, tab, escape, enter
                                                        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                                                            // Allow: Ctrl+A
                                                            (e.keyCode === 65 && e.ctrlKey === true) ||
                                                            // Allow: home, end, left, right
                                                            (e.keyCode >= 35 && e.keyCode <= 39)) {
                                                            return;
                                                        }
                                                        // Ensure that it is a number and stop the keypress
                                                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    placeholder="Amount"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-4">
                                            {selectedMember ? 'No accounts found for this member' : 'Please select a group and member'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div className="small text-muted mb-4">
                        Showing {transactions.length} account(s)
                    </div>

                    <div className="d-flex justify-content-end mb-4 fw-bold">
                        Total Collection: ₹ {calculateTotal().toLocaleString()}
                    </div>

                    {/* Closing Balance */}
                    <div className="d-flex justify-content-between align-items-center mb-4 small fw-bold border-top pt-3">
                        <div>Closing Balance</div>
                        <div className="d-flex gap-5">
                            <div>Cash ₹ {closingBalance.cash.toLocaleString()} DR</div>
                            <div>Bank ₹ {closingBalance.bank.toLocaleString()} CR</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-center gap-2">
                        <Button
                            variant="success"
                            className="px-4"
                            onClick={handleSave}
                            disabled={transactions.length === 0 || calculateTotal() === 0}
                        >
                            Save
                        </Button>
                        <Button
                            variant="secondary"
                            className="px-4"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </div>

                </Card.Body>
            </Card>
        </div>
    );
}
