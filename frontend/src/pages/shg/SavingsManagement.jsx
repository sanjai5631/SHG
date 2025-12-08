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
        .reduce((sum, m) => sum + (m.total || 0), 0);

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
                d500: 0,
                d200: 0,
                d100: 0,
                d50: 0,
                d20: 0,
                d10: 0,
                others: 0,
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
                    const updated = { ...m, [field]: 0 };
                    // Only recalculate total if a denomination field was changed, not if total itself was cleared
                    if (field !== 'total') {
                        updated.total = (updated.d500 * 500) + (updated.d200 * 200) +
                            (updated.d100 * 100) + (updated.d50 * 50) +
                            (updated.d20 * 20) + (updated.d10 * 10) +
                            (updated.others || 0);
                    }
                    return updated;
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

                // Only calculate total from denominations if a denomination field was changed
                // If 'total' field itself is being edited, don't recalculate
                if (field !== 'total') {
                    updatedMember.total = (updatedMember.d500 * 500) +
                        (updatedMember.d200 * 200) +
                        (updatedMember.d100 * 100) +
                        (updatedMember.d50 * 50) +
                        (updatedMember.d20 * 20) +
                        (updatedMember.d10 * 10) +
                        (updatedMember.others || 0);
                }

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
            if (member.total > 0 && member.paymentMode === 'online' && !member.selectedPerson) {
                errors.push(`${member.name}: Please select a person for online payment`);
            }
        });

        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        // Save each member's savings
        membersData.forEach(member => {
            if (member.total > 0) {
                addItem('savings', {
                    memberId: member.id,
                    productId: 1,
                    amount: member.total,
                    date: new Date().toISOString().split('T')[0],
                    collectedBy: currentUser?.id || 1,
                    month: selectedMonth,
                    financialYear: selectedFY,
                    paymentMode: member.paymentMode,
                    paidBy: member.paymentMode === 'online' ? parseInt(member.selectedPerson) : null,
                    denominations: {
                        d500: member.d500,
                        d200: member.d200,
                        d100: member.d100,
                        d50: member.d50,
                        d20: member.d20,
                        d10: member.d10,
                        others: member.others
                    }
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

    // Helper function to create denomination input
    const createDenominationInput = (row, field, width = '55px') => {
        const isOnline = row.paymentMode === 'online';
        return (
            <Form.Control
                type="text"
                size="sm"
                value={row[field] || ''}
                onChange={(e) => handleDataChange(row.id, field, e.target.value)}
                disabled={isOnline}
                onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter
                    if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                        return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                    }
                }}
                className="text-center border fw-medium"
                style={{
                    backgroundColor: isOnline ? '#f8f9fa' : '#fff',
                    borderColor: '#dee2e6',
                    width: width,
                    padding: '0.375rem 0.15rem',
                    cursor: isOnline ? 'not-allowed' : 'text'
                }}
            />
        );
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
                        width: '65px',
                        padding: '0.375rem 0.25rem'
                    }}
                />
            )
        },
        {
            key: 'collectedAmount',
            label: 'COLLECTED AMOUNT',
            render: (value, row) => (
                <Form.Control
                    type="text"
                    size="sm"
                    value={row.total || ''}
                    onChange={(e) => handleDataChange(row.id, 'total', e.target.value)}
                    maxLength={6}
                    onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter
                        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
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
                        width: '85px',
                        padding: '0.375rem 0.25rem'
                    }}
                />
            )
        },
        {
            key: 'd500',
            label: '500',
            render: (value, row) => createDenominationInput(row, 'd500')
        },
        {
            key: 'd200',
            label: '200',
            render: (value, row) => createDenominationInput(row, 'd200')
        },
        {
            key: 'd100',
            label: '100',
            render: (value, row) => createDenominationInput(row, 'd100')
        },
        {
            key: 'd50',
            label: '50',
            render: (value, row) => createDenominationInput(row, 'd50')
        },
        {
            key: 'd20',
            label: '20',
            render: (value, row) => createDenominationInput(row, 'd20')
        },
        {
            key: 'd10',
            label: '10',
            render: (value, row) => createDenominationInput(row, 'd10')
        },
        {
            key: 'others',
            label: 'OTHERS',
            render: (value, row) => createDenominationInput(row, 'others')
        },
        {
            key: 'paymentMode',
            label: 'PAYMENT MODE',
            render: (value, row) => (
                <Form.Select
                    size="sm"
                    value={row.paymentMode}
                    onChange={(e) => handlePaymentModeChange(row.id, e.target.value)}
                    style={{
                        width: '80px',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderColor: '#dee2e6'
                    }}
                >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                </Form.Select>
            )
        },
        {
            key: 'selectedPerson',
            label: 'ASSIGN PERSON',
            render: (value, row) => (
                row.paymentMode === 'online' && (
                    <Form.Select
                        size="sm"
                        value={row.selectedPerson}
                        onChange={(e) => handlePersonChange(row.id, e.target.value)}
                        style={{
                            width: '95px',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderColor: '#dee2e6'
                        }}
                    >
                        <option value="">Select</option>
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
        const totalDemand = currentData.reduce((sum, row) => sum + (parseFloat(row.demand) || 0), 0);
        const totalCollection = currentData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
        const total500 = currentData.reduce((sum, row) => sum + (parseFloat(row.d500) || 0), 0);
        const total200 = currentData.reduce((sum, row) => sum + (parseFloat(row.d200) || 0), 0);
        const total100 = currentData.reduce((sum, row) => sum + (parseFloat(row.d100) || 0), 0);
        const total50 = currentData.reduce((sum, row) => sum + (parseFloat(row.d50) || 0), 0);
        const total20 = currentData.reduce((sum, row) => sum + (parseFloat(row.d20) || 0), 0);
        const total10 = currentData.reduce((sum, row) => sum + (parseFloat(row.d10) || 0), 0);
        const totalOthers = currentData.reduce((sum, row) => sum + (parseFloat(row.others) || 0), 0);
        const grandTotal = currentData.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);

        // Calculate total from denominations
        const denominationTotal = (total500 * 500) + (total200 * 200) + (total100 * 100) +
            (total50 * 50) + (total20 * 20) + (total10 * 10) + totalOthers;

        return (
            <tfoot style={{
                backgroundColor: '#f8f9fa',
                fontWeight: 'bold',
                position: 'sticky',
                bottom: 0,
                zIndex: 10
            }}>
                <tr>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 fw-bold">Total:</td>
                    <td className="py-3 px-3 text-end text-success">
                        ₹{totalDemand.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-start fw-bold" style={{ color: '#198754' }}>
                        ₹{totalCollection.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total500}</div>
                        <small className="text-muted">₹{(total500 * 500).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total200}</div>
                        <small className="text-muted">₹{(total200 * 200).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total100}</div>
                        <small className="text-muted">₹{(total100 * 100).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total50}</div>
                        <small className="text-muted">₹{(total50 * 50).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total20}</div>
                        <small className="text-muted">₹{(total20 * 20).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{total10}</div>
                        <small className="text-muted">₹{(total10 * 10).toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3 text-center">
                        <div>{totalOthers}</div>
                        <small className="text-muted">₹{totalOthers.toLocaleString('en-IN')}</small>
                    </td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 text-end fw-bold" style={{ color: '#198754' }}>
                        ₹{denominationTotal.toLocaleString('en-IN')}
                    </td>
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
