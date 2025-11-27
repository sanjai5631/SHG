import { useState, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Badge, InputGroup, Row, Col, Alert } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function SHGGroupManagement() {
    const { data, addItem, updateItem, deleteItem } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        area: '',
        meetingDay: 'Monday',
        meetingTime: '10:00 AM',
        assignedTo: '',
        status: 'active'
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Fix: Changed u.isActive to u.status === 'active'
    const shgMembers = useMemo(() =>
        data.users.filter(u => u.role === 'shg_member' && u.status === 'active'),
        [data.users]
    );

    const handleOpenModal = (group = null) => {
        setError('');
        if (group) {
            setEditingGroup(group);
            setFormData({
                ...group,
                assignedTo: group.assignedTo || ''
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: '',
                code: '',
                area: '',
                meetingDay: 'Monday',
                meetingTime: '10:00 AM',
                assignedTo: shgMembers.length > 0 ? shgMembers[0].id : '',
                status: 'active'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.assignedTo) {
            setError('Please select a Group Incharge');
            return;
        }

        // Check for duplicate code
        const duplicateCode = data.shgGroups.find(
            g => g.code.toLowerCase() === formData.code.toLowerCase() &&
                (!editingGroup || g.id !== editingGroup.id)
        );

        if (duplicateCode) {
            setError('Group code already exists. Please use a unique code.');
            return;
        }

        const dataToSave = {
            ...formData,
            assignedTo: parseInt(formData.assignedTo)
        };

        if (editingGroup) {
            updateItem('shgGroups', editingGroup.id, dataToSave);
        } else {
            addItem('shgGroups', {
                ...dataToSave,
                createdAt: new Date().toISOString().split('T')[0]
            });
        }

        setShowModal(false);
    };

    const handleToggleStatus = (group) => {
        updateItem('shgGroups', group.id, {
            status: group.status === 'active' ? 'inactive' : 'active'
        });
    };

    const handleDelete = (groupId) => {
        // Check if group has members
        const memberCount = data.members.filter(m => m.groupId === groupId).length;

        if (memberCount > 0) {
            if (!window.confirm(`This group has ${memberCount} member(s). Are you sure you want to delete it?`)) {
                return;
            }
        } else {
            if (!window.confirm('Are you sure you want to delete this group?')) {
                return;
            }
        }

        deleteItem('shgGroups', groupId);
    };

    const filteredGroups = useMemo(() =>
        data.shgGroups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.area.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [data.shgGroups, searchTerm]
    );

    const getAssignedUserName = (userId) => {
        const user = data.users.find(u => u.id === userId);
        return user ? user.name : 'Unassigned';
    };

    const getMemberCount = (groupId) => {
        return data.members.filter(m => m.groupId === groupId && m.status === 'active').length;
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bold mb-1">SHG Group Management</h1>
                    <p className="text-muted mb-0">Create and manage Self-Help Groups</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    ➕ Create SHG Group
                </Button>
            </div>

            {/* Search Bar */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white">🔍</InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Search groups by name, code, or area..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            {/* Groups Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="mb-0" hover>
                            <thead>
                                <tr>
                                    <th>Group Name</th>
                                    <th>Code</th>
                                    <th>Area</th>
                                    <th>Members</th>
                                    <th>Meeting Schedule</th>
                                    <th>Group Incharge</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.length > 0 ? (
                                    filteredGroups.map((group) => (
                                        <tr key={group.id}>
                                            <td className="fw-medium">{group.name}</td>
                                            <td>
                                                <Badge bg="light" text="dark" className="fw-normal border">
                                                    {group.code}
                                                </Badge>
                                            </td>
                                            <td>{group.area}</td>
                                            <td>
                                                <Badge bg="info" className="fw-normal">
                                                    {getMemberCount(group.id)} members
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <div className="fw-medium">{group.meetingDay}</div>
                                                    <div className="text-muted">{group.meetingTime}</div>
                                                </div>
                                            </td>
                                            <td className="text-muted">
                                                {getAssignedUserName(group.assignedTo)}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={group.status === 'active' ? 'success' : 'secondary'}
                                                    className="fw-normal"
                                                >
                                                    {group.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenModal(group)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </Button>
                                                    <Button
                                                        variant={group.status === 'active' ? 'outline-warning' : 'outline-success'}
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(group)}
                                                        title={group.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {group.status === 'active' ? '🔒' : '🔓'}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(group.id)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            No groups found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingGroup ? 'Edit SHG Group' : 'Create New SHG Group'}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        {shgMembers.length === 0 && (
                            <Alert variant="warning">
                                ⚠️ No active SHG team members found. Please create team members first.
                            </Alert>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Group Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Mahila Mandal A"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Group Code *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., MMA001"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Must be unique
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Area/Zone *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                placeholder="e.g., North Zone"
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Meeting Day *</Form.Label>
                                    <Form.Select
                                        value={formData.meetingDay}
                                        onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                                        required
                                    >
                                        {days.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Meeting Time *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.meetingTime}
                                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                        placeholder="e.g., 10:00 AM or 2:30 PM"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Format: HH:MM AM/PM
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Group Incharge *</Form.Label>
                            <Form.Select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                required
                                disabled={shgMembers.length === 0}
                            >
                                <option value="">Select Team Member</option>
                                {shgMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status *</Form.Label>
                            <Form.Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={shgMembers.length === 0}
                        >
                            {editingGroup ? 'Update Group' : 'Create Group'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
