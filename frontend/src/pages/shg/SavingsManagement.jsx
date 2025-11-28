import { useState } from 'react';
import { Card, Table, Form, Button, Row, Col } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function SavingsManagement() {
    const { data, addItem, currentUser } = useApp();

    // Financial year and month selection
    const [selectedFY, setSelectedFY] = useState('2025-2026');
    const [selectedMonth, setSelectedMonth] = useState('December');
    const [selectedGroup, setSelectedGroup] = useState('');

    const financialYears = ['2024-2025', '2025-2026', '2026-2027'];
    const months = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

    // Sample members data with demand and collect (NO currentAmount)
    const [membersData, setMembersData] = useState([
        { id: 1, name: 'Sanjay', demand: 3000, collect: 3000, totalAmount: 36000, shareAmount: 2611, closing2025: 38611, withdrawal: 36000, paymentMode: 'cash', selectedPerson: '' },
        { id: 2, name: 'Lavanya Shree', demand: 500, collect: 500, totalAmount: 37847, shareAmount: 2273, closing2025: 40120, withdrawal: 37000, paymentMode: 'online', selectedPerson: '' },
        { id: 3, name: 'Rahul', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 0, paymentMode: 'cash', selectedPerson: '' },
        { id: 4, name: 'Jayasree', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 24000, paymentMode: 'cash', selectedPerson: '' },
        { id: 5, name: 'Priya Dharshini', demand: 1500, collect: 1500, totalAmount: 17500, shareAmount: 1269, closing2025: 18769, withdrawal: 0, paymentMode: 'online', selectedPerson: '' },
        { id: 1, name: 'Sanjay', demand: 3000, collect: 3000, totalAmount: 36000, shareAmount: 2611, closing2025: 38611, withdrawal: 36000, paymentMode: 'cash', selectedPerson: '' },
        { id: 2, name: 'Lavanya Shree', demand: 500, collect: 500, totalAmount: 37847, shareAmount: 2273, closing2025: 40120, withdrawal: 37000, paymentMode: 'online', selectedPerson: '' },
        { id: 3, name: 'Rahul', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 0, paymentMode: 'cash', selectedPerson: '' },
        { id: 4, name: 'Jayasree', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 24000, paymentMode: 'cash', selectedPerson: '' },
        { id: 5, name: 'Priya Dharshini', demand: 1500, collect: 1500, totalAmount: 17500, shareAmount: 1269, closing2025: 18769, withdrawal: 0, paymentMode: 'online', selectedPerson: '' },
        { id: 1, name: 'Sanjay', demand: 3000, collect: 3000, totalAmount: 36000, shareAmount: 2611, closing2025: 38611, withdrawal: 36000, paymentMode: 'cash', selectedPerson: '' },
        { id: 2, name: 'Lavanya Shree', demand: 500, collect: 500, totalAmount: 37847, shareAmount: 2273, closing2025: 40120, withdrawal: 37000, paymentMode: 'online', selectedPerson: '' },
        { id: 3, name: 'Rahul', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 0, paymentMode: 'cash', selectedPerson: '' },
        { id: 4, name: 'Jayasree', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 24000, paymentMode: 'cash', selectedPerson: '' },
        { id: 5, name: 'Priya Dharshini', demand: 1500, collect: 1500, totalAmount: 17500, shareAmount: 1269, closing2025: 18769, withdrawal: 0, paymentMode: 'online', selectedPerson: '' },
        { id: 1, name: 'Sanjay', demand: 3000, collect: 3000, totalAmount: 36000, shareAmount: 2611, closing2025: 38611, withdrawal: 36000, paymentMode: 'cash', selectedPerson: '' },
        { id: 2, name: 'Lavanya Shree', demand: 500, collect: 500, totalAmount: 37847, shareAmount: 2273, closing2025: 40120, withdrawal: 37000, paymentMode: 'online', selectedPerson: '' },
        { id: 3, name: 'Rahul', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 0, paymentMode: 'cash', selectedPerson: '' },
        { id: 4, name: 'Jayasree', demand: 2000, collect: 2000, totalAmount: 24000, shareAmount: 1740, closing2025: 25740, withdrawal: 24000, paymentMode: 'cash', selectedPerson: '' },
        { id: 5, name: 'Priya Dharshini', demand: 1500, collect: 1500, totalAmount: 17500, shareAmount: 1269, closing2025: 18769, withdrawal: 0, paymentMode: 'online', selectedPerson: '' },
    ]);

    // Get all active members for person dropdown
    const activeMembers = data.members.filter(m => m.status === 'active');

    const handleGroupChange = (e) => {
        const groupId = e.target.value;
        setSelectedGroup(groupId);

        if (groupId) {
            const groupMembers = data.members.filter(m => m.groupId === parseInt(groupId) && m.status === 'active');
            const newMembersData = groupMembers.map(m => ({
                id: m.id,
                name: m.name,
                demand: 0,
                collect: 0,
                totalAmount: 0,
                shareAmount: 0,
                closing2025: 0,
                withdrawal: 0,
                paymentMode: 'cash',
                selectedPerson: ''
            }));
            setMembersData(newMembersData);
        } else {
            // Reset to empty or keep previous? Resetting to empty for now as per "fetch" logic
            setMembersData([]);
        }
    };

    const handleDataChange = (id, field, value) => {
        setMembersData(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: parseFloat(value) || 0 } : m
        ));
    };

    const handlePaymentModeChange = (id, mode) => {
        setMembersData(prev => prev.map(m =>
            m.id === id ? { ...m, paymentMode: mode, selectedPerson: mode === 'cash' ? '' : m.selectedPerson } : m
        ));
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

        // Save each member's savings
        membersData.forEach(member => {
            if (member.collect > 0) {
                // Add savings transaction
                addItem('savings', {
                    memberId: member.id,
                    productId: 1, // Default to first savings product
                    amount: member.collect,
                    date: new Date().toISOString().split('T')[0],
                    collectedBy: currentUser?.id || 1
                });
            }
        });

        alert(`Saved ${membersData.filter(m => m.collect > 0).length} savings transactions for ${selectedMonth} ${selectedFY}`);

        // Reset collect amounts after saving
        setMembersData(prev => prev.map(m => ({ ...m, collect: 0 })));
    };

    // Filter members based on search
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = membersData.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="h4 fw-bold mb-1">Savings</h1>
            </div>

            {/* Financial Year and Month Selection */}
            <Card className="border-0 shadow-sm mb-3 bg-white">
                <Card.Body className="p-2">
                    <div className="d-flex gap-2 align-items-center">
                        <Form.Select
                            size="sm"
                            value={selectedFY}
                            onChange={(e) => setSelectedFY(e.target.value)}
                            className="border-secondary-subtle fw-medium"
                            style={{ fontSize: '0.85rem', width: 'auto', minWidth: '120px' }}
                        >
                            {financialYears.map(fy => (
                                <option key={fy} value={fy}>{fy}</option>
                            ))}
                        </Form.Select>

                        <Form.Select
                            size="sm"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border-secondary-subtle fw-medium"
                            style={{ fontSize: '0.85rem', width: 'auto', minWidth: '120px' }}
                        >
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </Form.Select>

                        <Form.Select
                            size="sm"
                            value={selectedGroup}
                            onChange={handleGroupChange}
                            className="border-secondary-subtle fw-medium"
                            style={{ fontSize: '0.85rem', width: 'auto', minWidth: '200px' }}
                        >
                            <option value="">Select Group</option>
                            {data.shgGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-2 border-bottom d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <h6 className="mb-0 fw-bold text-dark">Member Savings Overview</h6>
                        <span className="badge bg-light text-dark border">{filteredMembers.length} Members</span>
                    </div>
                    <div style={{ width: '250px' }}>
                        <div className="position-relative">
                            <Form.Control
                                type="text"
                                size="sm"
                                placeholder="Search member..."
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
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <Table className="mb-0 align-middle savings-table table-hover" style={{ minWidth: '1200px' }}>
                        <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                            <tr>
                                <th className="text-center py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '50px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Sno</th>
                                <th className="py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '150px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Name</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '100px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Demand</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '100px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Act.Collect</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '110px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Total<br />Amount</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '100px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Share<br />Amount</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '110px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>2025<br />Closing</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '110px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Withdrawal<br />Amount</th>
                                <th className="text-end py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '110px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>2026<br />Opening</th>
                                <th className="py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ width: '130px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Payment<br />Mode</th>
                                <th className="py-2 text-secondary text-uppercase small fw-bold border-bottom-0" style={{ minWidth: '180px', backgroundColor: '#f8f9fa', fontSize: '0.75rem' }}>Select Person</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member, index) => (
                                <tr key={member.id}>
                                    <td className="text-center fw-medium text-muted small">{index + 1}</td>
                                    <td className="fw-semibold text-dark small">{member.name}</td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.demand || ''}
                                            onChange={(e) => handleDataChange(member.id, 'demand', e.target.value)}
                                            className="text-end border-0 bg-light"
                                            style={{ fontSize: '0.85rem', fontWeight: '500' }}
                                        />
                                    </td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.collect || ''}
                                            onChange={(e) => handleDataChange(member.id, 'collect', e.target.value)}
                                            className="text-end border-primary-subtle"
                                            style={{ fontSize: '0.85rem', fontWeight: '600' }}
                                        />
                                    </td>
                                    <td className="text-end text-muted small">₹{member.totalAmount.toLocaleString()}</td>
                                    <td className="text-end text-muted small">{member.shareAmount}</td>
                                    <td className="text-end text-muted small">₹{member.closing2025.toLocaleString()}</td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.withdrawal || ''}
                                            onChange={(e) => handleDataChange(member.id, 'withdrawal', e.target.value)}
                                            className="text-end border-success-subtle"
                                            style={{ fontSize: '0.85rem', background: '#e8f5e9' }}
                                        />
                                    </td>
                                    <td className="text-end fw-bold text-success small" style={{ background: '#f1f8e9' }}>
                                        {calculateOpening2026(member).toLocaleString()}
                                    </td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={member.paymentMode}
                                            onChange={(e) => handlePaymentModeChange(member.id, e.target.value)}
                                            style={{ fontSize: '0.8rem' }}
                                            className="border-secondary-subtle"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="online">Online</option>
                                        </Form.Select>
                                    </td>
                                    <td>
                                        {member.paymentMode === 'online' ? (
                                            <Form.Select
                                                size="sm"
                                                value={member.selectedPerson}
                                                onChange={(e) => handlePersonChange(member.id, e.target.value)}
                                                style={{ fontSize: '0.8rem' }}
                                                className="border-secondary-subtle"
                                            >
                                                <option value="">Select Person...</option>
                                                {activeMembers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <div className="text-center text-muted small">-</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-footer bg-light sticky-bottom" style={{ zIndex: 1, borderTop: '2px solid #dee2e6' }}>
                            <tr>
                                <td colSpan="2" className="fw-bold text-end pe-3 py-2 small">Total</td>
                                <td className="fw-bold text-end py-2 small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + (m.demand || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-primary small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + (m.collect || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-muted small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + m.totalAmount, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-muted small">
                                    {filteredMembers.reduce((sum, m) => sum + m.shareAmount, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-muted small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + m.closing2025, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-success small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + (m.withdrawal || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end py-2 text-success small">
                                    ₹{filteredMembers.reduce((sum, m) => sum + calculateOpening2026(m), 0).toLocaleString()}
                                </td>
                                <td colSpan="2" className="text-center py-2">
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-success fw-bold px-5 py-2"
                                        style={{
                                            backgroundColor: '#198754',
                                            border: 'black',
                                            borderRadius: '4px',
                                            color: 'black',
                                            fontSize: '0.9rem',
                                            letterSpacing: '1px',
                                            cursor: 'pointer',
                                            pointerEvents: 'auto'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#198754'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#198754'}
                                        onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#198754'}
                                        onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#198754'}
                                    >
                                        SAVE
                                    </button>
                                </td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
