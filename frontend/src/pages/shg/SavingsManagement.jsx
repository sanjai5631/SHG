import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Modal } from 'react-bootstrap';
import DataTable from '../../components/DataTable';
import { useApp } from '../../context/AppContext';
import { FaMoneyBillWave, FaCalculator, FaPencilAlt, FaToggleOn, FaTrash } from 'react-icons/fa';

export default function SavingsManagement() {
    const { data, addItem, currentUser } = useApp();

    // Financial year and month selection
    const [selectedFY, setSelectedFY] = useState('2024-2025');
    const [selectedMonth, setSelectedMonth] = useState('December');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDenominationModal, setShowDenominationModal] = useState(false);

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
                demand: 1000,
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

    // Define columns for custom DataTable
    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'NAME',
            sortable: true,
            render: (value, row) => (
                <div className="py-2">
                    <div className="fw-medium">{row.name}</div>
                    <div className="text-muted small">{row.memberCode}</div>
                </div>
            )
        },
        {
            key: 'outstanding',
            label: 'OUTSTANDING',
            render: (value, row) => (
                <div className="text-end fw-bold text-danger">
                    {(row.totalAmount || 0).toLocaleString('en-IN')}
                </div>
            )
        },
        {
            key: 'demand',
            label: 'DEMAND',
            render: (value, row) => (
                <Form.Control
                    type="text"
                    size="sm"
                    value={row.demand || 0}
                    readOnly
                    className="text-end border fw-medium bg-light"
                    style={{
                        borderColor: '#dee2e6',
                        minWidth: '80px',
                        padding: '0.375rem 0.5rem'
                    }}
                />
            )
        },
        {
            key: 'collect',
            label: 'ACT.COLLECT',
            render: (value, row) => (
                <Form.Control
                    type="text"
                    size="sm"
                    value={row.collect || ''}
                    onChange={(e) => handleDataChange(row.id, 'collect', e.target.value)}
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
                    className="text-end border fw-medium"
                    style={{
                        backgroundColor: '#fff',
                        borderColor: '#dee2e6',
                        minWidth: '80px',
                        padding: '0.375rem 0.5rem'
                    }}
                />
            )
        },
        {
            key: 'totalAmount',
            label: 'TOTAL',
            render: (value) => <div className="text-end fw-bold">{value?.toLocaleString('en-IN')}</div>
        },
        {
            key: 'withdrawal',
            label: 'WITHDRAWAL',
            render: (value, row) => (
                <Form.Control
                    type="text"
                    size="sm"
                    value={row.withdrawal || ''}
                    onChange={(e) => handleDataChange(row.id, 'withdrawal', e.target.value)}
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
                    className="text-end border fw-medium"
                    style={{
                        backgroundColor: '#fff',
                        borderColor: '#dee2e6',
                        minWidth: '80px',
                        padding: '0.375rem 0.5rem'
                    }}
                />
            )
        },
        {
            key: 'paymentMode',
            label: 'PAYMENT MODE',
            render: (value, row) => (
                <Form.Select
                    size="sm"
                    value={row.paymentMode}
                    onChange={(e) => handlePaymentModeChange(row.id, e.target.value)}
                    style={{ minWidth: '100px' }}
                >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                </Form.Select>
            )
        },
        {
            key: 'selectedPerson',
            label: 'SELECT PERSON',
            render: (value, row) => (
                row.paymentMode === 'online' && (
                    <Form.Select
                        size="sm"
                        value={row.selectedPerson}
                        onChange={(e) => handlePersonChange(row.id, e.target.value)}
                        style={{ minWidth: '120px' }}
                    >
                        <option value="">Select Person</option>
                        {activeMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </Form.Select>
                )
            )
        }
    ], [activeMembers, currentGroup]);

    const handleToggleStatus = (row) => {
        // Add your toggle status logic here
        console.log('Toggle status for member:', row);
    };

    const handleDelete = (row) => {
        if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
            // Add your delete logic here
            console.log('Delete member:', row);
        }
    };

    const actionRenderer = (row) => (
        <div className="d-flex gap-2 align-items-center">
            <Button
                variant="light"
                size="sm"
                className="text-primary border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#f0f4ff' }}
                onClick={() => {
                    // Add your edit logic here
                    console.log('Edit member:', row);
                }}
                title="Edit"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>
            </Button>
            <Button
                variant="light"
                size="sm"
                className="text-success border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#f0fff4' }}
                onClick={() => setShowDenominationModal(true)}
                title="Cash Denomination"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z" />
                </svg>
            </Button>
            <Button
                variant="light"
                size="sm"
                className="text-danger border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#fff0f0' }}
                onClick={() => handleDelete(row)}
                title="Delete"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                </svg>
            </Button>
        </div>
    );

    const footerRenderer = (currentData) => {
        const totalOutstanding = currentData.reduce((sum, row) => sum + (parseFloat(row.totalAmount) || 0), 0);
        const totalDemand = currentData.reduce((sum, row) => sum + (parseFloat(row.demand) || 0), 0);
        const totalCollect = currentData.reduce((sum, row) => sum + (parseFloat(row.collect) || 0), 0);
        const totalAmount = currentData.reduce((sum, row) => sum + (parseFloat(row.totalAmount) || 0), 0);
        const totalWithdrawal = currentData.reduce((sum, row) => sum + (parseFloat(row.withdrawal) || 0), 0);

        return (
            <tfoot style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                <tr>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 fw-bold">Total:</td>
                    <td className="py-3 px-3 text-end text-danger">
                        {totalOutstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-end text-success">
                        {totalDemand.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-end text-success">
                        {totalCollect.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-end text-primary fw-bold">
                        {totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-end text-warning">
                        {totalWithdrawal.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                </tr>
            </tfoot>
        );
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-0">Savings Management</h1>
                </div>
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
                        initialColumns={columns}
                        data={membersData}
                        enableFilter={true}
                        enablePagination={true}
                        enableSort={false}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        footerRenderer={footerRenderer}
                        actionRenderer={actionRenderer}
                    />
                </Card.Body>
                <Card.Footer className="bg-white py-3">
                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="success"
                            onClick={handleSave}
                            disabled={membersData.length === 0}
                            className="px-4"
                        >
                            Save
                        </Button>
                    </div>
                </Card.Footer>
            </Card>

            {/* Cash Denomination Modal */}
            <Modal
                show={showDenominationModal}
                onHide={() => setShowDenominationModal(false)}
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title className="h6 fw-bold">Cash Denomination Calculator</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive">
                        <table className="table table-sm table-borderless mb-0">
                            <tbody>
                                {Object.keys(denominations).sort((a, b) => b - a).map(denom => (
                                    <tr key={denom}>
                                        <td className="align-middle fw-medium">₹{denom}</td>
                                        <td className="align-middle text-center">x</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={denominations[denom] || ''}
                                                onChange={(e) => handleDenominationChange(denom, e.target.value)}
                                                className="text-center"
                                                style={{ width: '80px' }}
                                            />
                                        </td>
                                        <td className="align-middle text-end fw-bold">
                                            ₹{(parseInt(denom) * denominations[denom]).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-top">
                                    <td colSpan="3" className="pt-2 fw-bold">Physical Cash Total</td>
                                    <td className="pt-2 text-end fw-bold text-primary">
                                        ₹{totalCashCalculated.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="fw-bold">System Cash Total</td>
                                    <td className="text-end fw-bold text-success">
                                        ₹{totalSystemCash.toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="4">
                                        {totalCashCalculated === totalSystemCash ? (
                                            <Alert variant="success" className="mb-0 py-2 small text-center fw-bold">
                                                ✓ Tally Matched
                                            </Alert>
                                        ) : (
                                            <Alert variant="danger" className="mb-0 py-2 small text-center fw-bold">
                                                ⚠ Mismatch: ₹{(totalCashCalculated - totalSystemCash).toLocaleString()}
                                            </Alert>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDenominationModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
