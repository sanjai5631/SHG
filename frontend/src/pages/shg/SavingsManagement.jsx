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

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="h2 fw-bold mb-1">Savings Management</h1>
                <p className="text-muted mb-0">Track member savings and monthly collections</p>
            </div>

            {/* Financial Year and Month Selection */}
            <Card className="border-0 shadow-sm mb-3">
                <Card.Body className="p-3">
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium small">Financial Year</Form.Label>
                                <Form.Select
                                    value={selectedFY}
                                    onChange={(e) => setSelectedFY(e.target.value)}
                                    size="sm"
                                >
                                    {financialYears.map(fy => (
                                        <option key={fy} value={fy}>{fy}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium small">Month</Form.Label>
                                <Form.Select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    size="sm"
                                >
                                    {months.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium small">Group Name</Form.Label>
                                <Form.Select
                                    value={selectedGroup}
                                    onChange={handleGroupChange}
                                    size="sm"
                                >
                                    <option value="">Select Group</option>
                                    {data.shgGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Button variant="primary" size="sm" onClick={handleSave} className="w-100">
                                💾 Save Changes
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-semibold">Member Savings Overview - {selectedMonth} {selectedFY}</h5>
                </Card.Header>
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <Table className="mb-0 align-middle savings-table">
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '60px' }}>Sno</th>
                                <th style={{ minWidth: '120px' }}>Name</th>
                                <th className="text-end" style={{ width: '100px' }}>Demand</th>
                                <th className="text-end" style={{ width: '100px' }}>Act.Collect</th>
                                <th className="text-end" style={{ width: '110px' }}>Total<br />Amount</th>
                                <th className="text-end" style={{ width: '100px' }}>Share<br />Amount</th>
                                <th className="text-end" style={{ width: '110px' }}>2025<br />Closing</th>
                                <th className="text-end" style={{ width: '110px' }}>Withdrawal<br />Amount</th>
                                <th className="text-end" style={{ width: '110px' }}>2026<br />Opening</th>
                                <th style={{ width: '130px' }}>Payment<br />Mode</th>
                                <th style={{ minWidth: '180px' }}>Select Person</th>
                            </tr>
                        </thead>
                        <tbody>
                            {membersData.map((member, index) => (
                                <tr key={member.id}>
                                    <td className="text-center fw-medium">{index + 1}</td>
                                    <td className="fw-medium">{member.name}</td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.demand || ''}
                                            onChange={(e) => handleDataChange(member.id, 'demand', e.target.value)}
                                            className="text-end"
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.collect || ''}
                                            onChange={(e) => handleDataChange(member.id, 'collect', e.target.value)}
                                            className="text-end"
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                    </td>
                                    <td className="text-end">₹{member.totalAmount.toLocaleString()}</td>
                                    <td className="text-end">{member.shareAmount}</td>
                                    <td className="text-end">₹{member.closing2025.toLocaleString()}</td>
                                    <td className="text-end">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={member.withdrawal || ''}
                                            onChange={(e) => handleDataChange(member.id, 'withdrawal', e.target.value)}
                                            className="text-end"
                                            style={{ fontSize: '0.875rem', background: '#d4edda' }}
                                        />
                                    </td>
                                    <td className="text-end fw-bold" style={{ background: '#d4edda' }}>
                                        {calculateOpening2026(member).toLocaleString()}
                                    </td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={member.paymentMode}
                                            onChange={(e) => handlePaymentModeChange(member.id, e.target.value)}
                                            style={{ fontSize: '0.875rem' }}
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
                                                style={{ fontSize: '0.875rem' }}
                                            >
                                                <option value="">Select Person...</option>
                                                {activeMembers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <div className="text-center text-muted">-</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-footer">
                            <tr>
                                <td colSpan="2" className="fw-bold">Total</td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + (m.demand || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + (m.collect || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + m.totalAmount, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    {membersData.reduce((sum, m) => sum + m.shareAmount, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + m.closing2025, 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + (m.withdrawal || 0), 0).toLocaleString()}
                                </td>
                                <td className="fw-bold text-end">
                                    ₹{membersData.reduce((sum, m) => sum + calculateOpening2026(m), 0).toLocaleString()}
                                </td>
                                <td colSpan="2" className="text-center">-</td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Card>
        </div >
    );
}
