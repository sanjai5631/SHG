import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useApp } from '../../context/AppContext';

export default function SavingsManagement() {
    const { data, addItem, currentUser } = useApp();

    // Financial year and month selection
    const [selectedFY, setSelectedFY] = useState('2024-2025');
    const [selectedMonth, setSelectedMonth] = useState('December');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const financialYears = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
    const months = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

    // Members data state
    const [membersData, setMembersData] = useState([]);

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
        setDenominations(prev => ({
            ...prev,
            [value]: parseInt(count) || 0
        }));
    };

    const totalCashCalculated = Object.entries(denominations).reduce((sum, [val, count]) => sum + (parseInt(val) * count), 0);

    const totalSystemCash = membersData
        .filter(m => m.paymentMode === 'cash')
        .reduce((sum, m) => sum + (m.collect || 0), 0);

    // Get all active members for person dropdown
    const activeMembers = useMemo(() =>
        data.members.filter(m => m.status === 'active'),
        [data.members]
    );

    // Get groups based on user role
    const availableGroups = useMemo(() => {
        if (currentUser?.role === 'admin') {
            return data.shgGroups.filter(g => g.status === 'active');
        } else if (currentUser?.role === 'shg_team') {
            return data.shgGroups.filter(g => g.assignedTo === currentUser.id && g.status === 'active');
        } else if (currentUser?.role === 'shg_member') {
            if (currentUser.groupId) {
                return data.shgGroups.filter(g => g.id === currentUser.groupId && g.status === 'active');
            }
            return data.shgGroups.filter(g => g.assignedTo === currentUser.id && g.status === 'active');
        }
        return [];
    }, [data.shgGroups, currentUser]);

    // Calculate total savings for a member
    const getMemberTotalSavings = useCallback((memberId) => {
        return data.savings
            .filter(s => s.memberId === memberId)
            .reduce((sum, s) => sum + s.amount, 0);
    }, [data.savings]);

    // Get savings for specific month and year
    const getMemberSavingsForMonth = useCallback((memberId, month, fy) => {
        return data.savings
            .filter(s => s.memberId === memberId && s.month === month && s.financialYear === fy)
            .reduce((sum, s) => sum + s.amount, 0);
    }, [data.savings]);

    // Calculate opening balance (total savings before current month)
    const getOpeningBalance = useCallback((memberId) => {
        const totalSavings = getMemberTotalSavings(memberId);
        const currentMonthSavings = getMemberSavingsForMonth(memberId, selectedMonth, selectedFY);
        return totalSavings - currentMonthSavings;
    }, [getMemberTotalSavings, getMemberSavingsForMonth, selectedMonth, selectedFY]);

    // Load members data
    const loadGroupData = useCallback((groupId) => {
        if (!groupId) {
            setMembersData([]);
            return;
        }

        const groupMembers = data.members.filter(m => m.groupId === parseInt(groupId) && m.status === 'active');
        const newMembersData = groupMembers.map(m => {
            const openingBalance = getOpeningBalance(m.id);
            const dbTotalSavings = getMemberTotalSavings(m.id);

            // Initial calculations based on DB data
            const totalAmount = dbTotalSavings;
            const shareAmount = Math.round(totalAmount * 0.0725); // 7.25% share
            const closing2025 = totalAmount + shareAmount;

            return {
                id: m.id,
                name: m.name,
                memberCode: m.memberCode,
                demand: 0,
                collect: 0,
                openingBalance: openingBalance,
                dbTotalAmount: dbTotalSavings, // Store DB total for calculations
                totalAmount: totalAmount,
                shareAmount: shareAmount,
                closing2025: closing2025,
                withdrawal: 0,
                paymentMode: 'cash',
                selectedPerson: ''
            };
        });
        setMembersData(newMembersData);
    }, [data.members, getOpeningBalance, getMemberTotalSavings]);

    // Handle group selection change
    const handleGroupChange = (e) => {
        const groupId = e.target.value;
        setSelectedGroup(groupId);
        setSuccessMessage('');
    };

    // Get current group details
    const currentGroup = useMemo(() =>
        data.shgGroups.find(g => g.id === parseInt(selectedGroup)),
        [data.shgGroups, selectedGroup]
    );

    // Reload data when group, month, FY, or savings data changes
    useEffect(() => {
        loadGroupData(selectedGroup);
    }, [selectedGroup, selectedMonth, selectedFY, data.savings, loadGroupData]);

    const handleDataChange = (id, field, value) => {
        // Allow empty string to let user clear the input
        if (value === '') {
            setMembersData(prev => prev.map(m => {
                if (m.id === id) {
                    return { ...m, [field]: 0 };
                }
                return m;
            }));
            return;
        }

        const numValue = parseFloat(value);

        // Only allow positive values
        if (numValue < 0) return;

        setMembersData(prev => prev.map(m => {
            if (m.id === id) {
                const updatedMember = { ...m, [field]: numValue || 0 };

                // Recalculate totals based on DB total + new collection
                const newTotal = updatedMember.dbTotalAmount + updatedMember.collect;
                updatedMember.totalAmount = newTotal;
                updatedMember.shareAmount = Math.round(newTotal * 0.0725);

                // Closing balance = Total + Share
                updatedMember.closing2025 = newTotal + updatedMember.shareAmount;

                return updatedMember;
            }
            return m;
        }));
    };

    const handlePaymentModeChange = (id, mode) => {
        setMembersData(prev => prev.map(m => {
            if (m.id === id) {
                let selectedPerson = '';
                if (mode === 'online') {
                    // Auto-select the assigned online collection account if available
                    if (currentGroup?.onlineCollectionId) {
                        selectedPerson = currentGroup.onlineCollectionId;
                    } else {
                        // Keep existing selection if any, or default to empty
                        selectedPerson = m.selectedPerson;
                    }
                }
                return { ...m, paymentMode: mode, selectedPerson };
            }
            return m;
        }));
    };

    const handlePersonChange = (id, personId) => {
        setMembersData(prev => prev.map(m =>
            m.id === id ? { ...m, selectedPerson: personId } : m
        ));
    };

    // Calculate opening 2026 balance: Closing 2025 - Withdrawal
    const calculateOpening2026 = (member) => {
        return member.closing2025 - (member.withdrawal || 0);
    };

    const handleSave = () => {
        if (!selectedGroup) {
            alert('Please select a group first');
            return;
        }

        if (membersData.length === 0) {
            alert('No members to save');
            return;
        }

        let savedCount = 0;
        let errors = [];

        // Validate online payments have a person selected
        membersData.forEach(member => {
            if (member.collect > 0 && member.paymentMode === 'online' && !member.selectedPerson) {
                errors.push(`${member.name}: Please select a person for online payment`);
            }
        });

        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        // Save each member's savings
        membersData.forEach(member => {
            if (member.collect > 0) {
                addItem('savings', {
                    memberId: member.id,
                    productId: 1,
                    amount: member.collect,
                    date: new Date().toISOString().split('T')[0],
                    collectedBy: currentUser?.id || 1,
                    month: selectedMonth,
                    financialYear: selectedFY,
                    paymentMode: member.paymentMode,
                    paidBy: member.paymentMode === 'online' ? parseInt(member.selectedPerson) : null
                });
                savedCount++;
            }

            if (member.withdrawal > 0) {
                addItem('savings', {
                    memberId: member.id,
                    productId: 1,
                    amount: -member.withdrawal,
                    date: new Date().toISOString().split('T')[0],
                    collectedBy: currentUser?.id || 1,
                    month: selectedMonth,
                    financialYear: selectedFY,
                    type: 'withdrawal'
                });
                savedCount++;
            }
        });

        if (savedCount > 0) {
            setSuccessMessage(`Saved ${savedCount} savings transactions for ${selectedMonth} ${selectedFY}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } else {
            alert('No collections to save.');
        }
    };

    // Filter members based on search
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = membersData.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-0">Savings Management</h1>
                </div>
                {/* Optional: Add button here if needed in future, currently empty to match layout */}
            </div>

            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="mb-3">
                    ✓ {successMessage}
                </Alert>
            )}

            {/* Filters Card */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-medium small text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Financial Year</Form.Label>
                                <Form.Select
                                    value={selectedFY}
                                    onChange={(e) => setSelectedFY(e.target.value)}
                                    className="border-secondary-subtle"
                                >
                                    {financialYears.map(fy => (
                                        <option key={fy} value={fy}>{fy}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-medium small text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Month</Form.Label>
                                <Form.Select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border-secondary-subtle"
                                >
                                    {months.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-medium small text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Group Name</Form.Label>
                                <Form.Select
                                    value={selectedGroup}
                                    onChange={handleGroupChange}
                                    className="border-secondary-subtle"
                                >
                                    <option value="">Select Group</option>
                                    {availableGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name} ({group.code})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Savings Table Card */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-bold h6">Member Savings Overview - {selectedMonth} {selectedFY}</h5>
                </Card.Header>
                <Card.Body className="p-4">
                    <DataTable
                        columns={[
                            {
                                name: 'SNO',
                                selector: (row, index) => index + 1,
                                cell: (row, index) => <div className="text-center">{index + 1}</div>,
                                width: '60px',
                            },
                            {
                                name: 'NAME',
                                selector: row => row.name,
                                cell: row => (
                                    <div className="py-2">
                                        <div className="fw-medium">{row.name}</div>
                                        <div className="text-muted small">{row.memberCode}</div>
                                    </div>
                                ),
                                width: '175px',
                            },
                            {
                                name: 'DEMAND',
                                cell: row => (
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        size="sm"
                                        value={row.demand || ''}
                                        onChange={(e) => handleDataChange(row.id, 'demand', e.target.value)}
                                        className="text-end border fw-medium"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderColor: '#dee2e6',
                                            minWidth: '80px',
                                            padding: '0.375rem 0.5rem'
                                        }}
                                    />
                                ),
                                width: '110px',
                            },
                            {
                                name: 'ACT.COLLECT',
                                cell: row => (
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        size="sm"
                                        value={row.collect || ''}
                                        onChange={(e) => handleDataChange(row.id, 'collect', e.target.value)}
                                        className="text-end border fw-medium"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderColor: '#dee2e6',
                                            minWidth: '90px',
                                            padding: '0.375rem 0.5rem'
                                        }}
                                    />
                                ),
                                width: '120px',
                            },
                            {
                                name: 'TOTAL AMOUNT',
                                selector: row => row.totalAmount,
                                cell: row => <div className="text-end"><span className="fw-medium text-dark">₹{row.totalAmount.toLocaleString()}</span></div>,
                                width: '105px',
                            },
                            {
                                name: 'SHARE AMOUNT',
                                selector: row => row.shareAmount,
                                cell: row => <div className="text-end"><span className="text-muted">{row.shareAmount.toLocaleString()}</span></div>,
                                width: '95px',
                            },
                            {
                                name: '2025 CLOSING',
                                selector: row => row.closing2025,
                                cell: row => <div className="text-end"><span className="text-muted">₹{row.closing2025.toLocaleString()}</span></div>,
                                width: '105px',
                            },
                            {
                                name: 'WITHDRAWAL',
                                cell: row => (
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        size="sm"
                                        value={row.withdrawal || ''}
                                        onChange={(e) => handleDataChange(row.id, 'withdrawal', e.target.value)}
                                        className="text-end border fw-medium"
                                        style={{
                                            backgroundColor: '#fff',
                                            borderColor: '#dee2e6',
                                            minWidth: '90px',
                                            padding: '0.375rem 0.5rem'
                                        }}
                                    />
                                ),
                                width: '115px',
                            },
                            {
                                name: '2026 OPENING',
                                selector: row => calculateOpening2026(row),
                                cell: row => <div className="text-end"><span className="fw-medium text-dark">₹{calculateOpening2026(row).toLocaleString()}</span></div>,
                                width: '130px',
                            },
                            {
                                name: 'PAYMENT MODE',
                                cell: row => (
                                    <Form.Select
                                        size="sm"
                                        value={row.paymentMode}
                                        onChange={(e) => handlePaymentModeChange(row.id, e.target.value)}
                                        className="border-0 bg-transparent text-muted"
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="online">Online</option>
                                    </Form.Select>
                                ),
                                width: '120px',
                            },
                            {
                                name: 'SELECT PERSON',
                                cell: row => (
                                    row.paymentMode === 'online' ? (
                                        <Form.Select
                                            size="sm"
                                            value={row.selectedPerson}
                                            onChange={(e) => handlePersonChange(row.id, e.target.value)}
                                            className={`border ${!row.selectedPerson && row.collect > 0 ? 'text-danger fw-bold' : 'text-dark'}`}
                                            style={{ fontSize: '0.8rem', backgroundColor: '#fff', borderColor: '#dee2e6' }}
                                        >
                                            <option value="">Select Person...</option>
                                            {activeMembers.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </Form.Select>
                                    ) : (
                                        <div className="text-center text-muted small w-100">-</div>
                                    )
                                ),
                                width: '200px',
                            },
                        ]}
                        data={membersData}
                        highlightOnHover
                        pointerOnHover
                        dense
                        fixedHeader
                        fixedHeaderScrollHeight="600px"
                        customStyles={{
                            responsiveWrapper: {
                                style: {
                                    overflowX: 'visible',
                                },
                            },
                            rows: {
                                style: {
                                    minHeight: '48px',
                                    fontSize: '0.875rem',
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: '#bbdefb',
                                    },
                                    '&:nth-of-type(even)': {
                                        backgroundColor: '#ffffff',
                                    },
                                },
                            },
                            headCells: {
                                style: {
                                    paddingLeft: '12px',
                                    paddingRight: '12px',
                                    paddingTop: '10px',
                                    paddingBottom: '10px',
                                    fontWeight: '600',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    color: '#6c757d',
                                    backgroundColor: '#f8f9fa',
                                },
                            },
                            cells: {
                                style: {
                                    paddingLeft: '12px',
                                    paddingRight: '12px',
                                    paddingTop: '8px',
                                    paddingBottom: '8px',
                                },
                            },
                        }}
                        noDataComponent={
                            <div className="text-center text-muted py-4">
                                {selectedGroup ? 'No members found in this group' : 'Please select a group to view members'}
                            </div>
                        }
                    />

                    {/* Totals Footer */}
                    {membersData.length > 0 && (
                        <div className="bg-light border-top p-3 mt-3 rounded">
                            <div className="d-flex fw-bold text-dark small text-uppercase align-items-center" style={{ fontSize: '1rem' }}>
                                <div style={{ width: '55px', textAlign: 'center' }}></div>
                                <div style={{ width: '170px', paddingLeft: '12px' }}>TOTAL</div>
                                <div style={{ width: '110px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + (m.demand || 0), 0).toLocaleString()}</div>
                                <div style={{ width: '120px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + (m.collect || 0), 0).toLocaleString()}</div>
                                <div style={{ width: '105px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + m.totalAmount, 0).toLocaleString()}</div>
                                <div style={{ width: '95px', textAlign: 'right', paddingRight: '12px' }}>{membersData.reduce((sum, m) => sum + m.shareAmount, 0).toLocaleString()}</div>
                                <div style={{ width: '105px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + m.closing2025, 0).toLocaleString()}</div>
                                <div style={{ width: '110px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + (m.withdrawal || 0), 0).toLocaleString()}</div>
                                <div style={{ width: '130px', textAlign: 'right', paddingRight: '12px' }}>₹{membersData.reduce((sum, m) => sum + calculateOpening2026(m), 0).toLocaleString()}</div>
                                <div style={{ width: '120px', textAlign: 'center' }}></div>
                                <div style={{ width: '190px', textAlign: 'center', paddingRight: '12px' }}>
                                    <Button variant="success" onClick={handleSave} className="fw-medium" size="sm">
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
            {/* Cash Denomination Calculator */}
            {membersData.length > 0 && (
                <div className="d-flex justify-content-end mt-3">
                    <Card className="border-0 shadow-sm w-25">
                        <Card.Body className="p-3">
                            <h6 className="fw-bold mb-3 text-uppercase text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>Cash Denomination</h6>
                            <div className="d-flex justify-content-end">
                                <Table bordered size="sm" className="mb-0" style={{ fontSize: '0.875rem', width: 'auto' }}>
                                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                                        <tr>
                                            <th className="text-center py-2 fw-semibold">Cash</th>
                                            <th className="text-center py-2 fw-semibold" style={{ width: '100px' }}></th>
                                            <th className="text-end py-2 fw-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[500, 200, 100, 50, 20, 10].map(val => (
                                            <tr key={val}>
                                                <td className="text-end align-middle py-1 px-2">{val}</td>
                                                <td className="py-1 px-1">
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        size="sm"
                                                        className="text-center"
                                                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                                        value={denominations[val] || ''}
                                                        onChange={(e) => handleDenominationChange(val, e.target.value)}
                                                    />
                                                </td>
                                                <td className="text-end align-middle py-1 px-2">{(val * (denominations[val] || 0)).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ backgroundColor: '#ff00ff' }}>
                                            <td colSpan={2} className="text-end fw-bold py-2 px-2">Total</td>
                                            <td className="text-end fw-bold py-2 px-2">{totalCashCalculated.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-top border-2">
                                            <td colSpan={2} className="text-end fw-semibold py-2 px-2 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Cash Total</td>
                                            <td className="text-end fw-bold py-2 px-2 text-primary">₹{totalSystemCash.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="text-end fw-semibold py-2 px-2 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Physical Cash Total</td>
                                            <td className={`text-end fw-bold py-2 px-2 ${totalCashCalculated === totalSystemCash ? 'text-success' : 'text-danger'}`}>
                                                ₹{totalCashCalculated.toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="text-end fw-semibold py-2 px-2 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</td>
                                            <td className="text-end fw-bold py-2 px-2">
                                                {totalCashCalculated === totalSystemCash ? (
                                                    <span className="text-success">✓ Matched</span>
                                                ) : (
                                                    <span className="text-danger">⚠ Diff: ₹{Math.abs(totalCashCalculated - totalSystemCash).toLocaleString()}</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            )}
        </div>
    );
}
