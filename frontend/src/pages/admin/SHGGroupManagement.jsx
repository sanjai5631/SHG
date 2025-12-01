import { useState, useMemo } from 'react';
import { Card, Button, Modal, Form, Badge, InputGroup, Row, Col, Alert } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
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
        meetingDay: 'January',
        assignedTo: '',
        status: 'active'
    });

    // Generate months for Meeting Month
    const meetingMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Filter for SHG Team members (Staff) for Group Incharge
    // Include both system users with role 'shg_team' and members with roleType 'shg_team'
    const shgTeamMembers = useMemo(() => {
        const systemUsers = data.users
            .filter(u => u.role === 'shg_team' && u.status === 'active')
            .map(u => ({ ...u, source: 'system' }));

        const memberUsers = data.members
            .filter(m => m.roleType === 'shg_team' && m.status === 'active')
            .map(m => ({ ...m, source: 'member' }));

        return [...systemUsers, ...memberUsers];
    }, [data.users, data.members]);

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
                meetingDay: 'January',
                assignedTo: shgTeamMembers.length > 0 ? shgTeamMembers[0].id : '',
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
            group.code.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Define columns for DataTable
    const columns = [
        {
            name: 'Group Name',
            selector: row => row.name,
            sortable: true,
            cell: row => <span className="fw-medium">{row.name}</span>,
            minWidth: '180px',
        },
        {
            name: 'Code',
            selector: row => row.code,
            sortable: true,
            cell: row => (
                <Badge bg="light" text="dark" className="fw-normal border" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                    {row.code}
                </Badge>
            ),
            minWidth: '100px',
        },
        {
            name: 'Members',
            selector: row => getMemberCount(row.id),
            sortable: true,
            cell: row => (
                <Badge bg="info" className="fw-normal" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                    {getMemberCount(row.id)} members
                </Badge>
            ),
            minWidth: '120px',
        },
        {
            name: 'Meeting Month',
            selector: row => row.meetingDay,
            sortable: true,
            cell: row => (
                <div className="small">
                    <span className="text-muted">Month: </span>
                    <span className="fw-medium">{row.meetingDay}</span>
                </div>
            ),
            minWidth: '150px',
        },
        {
            name: 'Group Incharge',
            selector: row => getAssignedUserName(row.assignedTo),
            sortable: true,
            cell: row => <span className="text-muted">{getAssignedUserName(row.assignedTo)}</span>,
            minWidth: '150px',
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => (
                <Badge
                    bg={row.status === 'active' ? 'success' : 'secondary'}
                    className="fw-normal"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                >
                    {row.status}
                </Badge>
            ),
            minWidth: '100px',
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        variant="light"
                        size="sm"
                        className="text-primary border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', backgroundColor: '#f0f4ff' }}
                        onClick={() => handleOpenModal(row)}
                        title="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                        </svg>
                    </Button>
                    <Form.Check
                        type="switch"
                        id={`custom-switch-${row.id}`}
                        checked={row.status === 'active'}
                        onChange={() => handleToggleStatus(row)}
                        className="d-inline-block"
                        title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                    />
                    <Button
                        variant="light"
                        size="sm"
                        className="text-danger border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px', backgroundColor: '#fff0f0' }}
                        onClick={() => handleDelete(row.id)}
                        title="Delete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                    </Button>
                </div>
            ),
            right: true,
            minWidth: '150px',
        },
    ];

    // Custom styles for DataTable
    const customStyles = {
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
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-1">SHG Group Management</h1>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    ➕ Create SHG Group
                </Button>
            </div>

            {/* Groups Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    {/* Search Bar - Right Aligned */}
                    <div className="d-flex justify-content-end mb-3">
                        <InputGroup style={{ maxWidth: '350px' }}>
                            <Form.Control
                                type="text"
                                placeholder="Filter By Name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-end-0"
                            />
                            {searchTerm && (
                                <Button
                                    variant="primary"
                                    onClick={() => setSearchTerm('')}
                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                >
                                    ✕
                                </Button>
                            )}
                        </InputGroup>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredGroups}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                        paginationResetDefaultPage={searchTerm !== ''}
                        highlightOnHover
                        pointerOnHover
                        fixedHeader
                        fixedHeaderScrollHeight="500px"
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-center text-muted py-4">
                                No groups found
                            </div>
                        }
                    />
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingGroup ? 'Edit SHG Group' : 'Create SHG Group'}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError('')}>
                                {error}
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
                            <Form.Label>Meeting Month *</Form.Label>
                            <Form.Select
                                value={formData.meetingDay}
                                onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                                required
                            >
                                {meetingMonths.map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Select the month for the meeting schedule
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Group Incharge *</Form.Label>
                            <Form.Select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                required
                                disabled={shgTeamMembers.length === 0}
                            >
                                <option value="">Select Team Member</option>
                                {shgTeamMembers.map(member => (
                                    <option key={`${member.source}-${member.id}`} value={member.id}>
                                        {member.name} {member.memberCode ? `(${member.memberCode})` : member.email ? `(${member.email})` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                            {shgTeamMembers.length === 0 && (
                                <Form.Text className="text-danger">
                                    No active SHG Team members found. Please create a user with 'SHG Team' role first.
                                </Form.Text>
                            )}
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
                            disabled={shgTeamMembers.length === 0}
                        >
                            {editingGroup ? 'Update' : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
