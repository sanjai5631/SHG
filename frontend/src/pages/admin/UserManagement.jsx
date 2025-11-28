import { useState, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Badge, InputGroup, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function UserManagement() {
    const { data, addItem, updateItem, deleteItem, currentUser } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [userType, setUserType] = useState('system'); // 'system' or 'member'

    const [formData, setFormData] = useState({
        // System User Fields
        name: '',
        email: '',
        phone: '',
        role: 'shg_member',
        status: 'active',

        // Member Fields
        memberCode: '',
        groupId: '',
        gender: '',
        dateOfBirth: '',
        joinYear: new Date().getFullYear(),
        memberType: 'primary'
    });

    const roles = [
        { value: 'admin', label: 'Admin', color: 'danger' },
        { value: 'shg_team', label: 'SHG Team', color: 'info' },
        { value: 'member', label: 'SHG Member', color: 'success' }
    ];

    // Get groups based on user role
    const availableGroups = useMemo(() => {
        if (currentUser?.role === 'admin') {
            return data.shgGroups.filter(g => g.status === 'active');
        } else if (currentUser?.role === 'shg_member') {
            return data.shgGroups.filter(g => g.assignedTo === currentUser.id && g.status === 'active');
        }
        return [];
    }, [data.shgGroups, currentUser]);

    const handleOpenModal = (user = null, type = 'system') => {
        setError('');
        setUserType(type);

        if (user) {
            setEditingUser(user);
            if (user.role === 'member' || user.memberCode) {
                // It's a member
                setUserType('member');
                setFormData({
                    ...user,
                    groupId: user.groupId || '',
                    email: user.email || '',
                    dateOfBirth: user.dateOfBirth || '',
                    gender: user.gender || '',
                    memberType: user.memberType || 'primary',
                    roleType: user.roleType || 'member',
                    joinYear: user.joinYear || new Date().getFullYear(),
                    role: 'member'
                });
            } else {
                // It's a system user
                setFormData({
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                    role: user.role,
                    status: user.status || 'active'
                });
            }
        } else {
            setEditingUser(null);
            if (type === 'member') {
                setFormData({
                    name: '',
                    memberCode: '',
                    groupId: availableGroups.length > 0 ? availableGroups[0].id : '',
                    phone: '',
                    email: '',
                    dateOfBirth: '',
                    gender: '',
                    joinYear: new Date().getFullYear(),
                    memberType: 'primary',
                    role: 'member',
                    status: 'active'
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    role: 'shg_member',
                    status: 'active'
                });
            }
        }
        setShowModal(true);
    };

    const generateMemberCode = (groupId) => {
        const group = data.shgGroups.find(g => g.id === parseInt(groupId));
        if (!group) return '';

        const groupMembers = data.members.filter(m => m.groupId === parseInt(groupId));
        const nextNumber = String(groupMembers.length + 1).padStart(3, '0');
        return `${group.code}-${nextNumber}`;
    };

    const handleGroupChange = (groupId) => {
        setFormData({
            ...formData,
            groupId,
            memberCode: editingUser ? formData.memberCode : generateMemberCode(groupId)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (userType === 'member') {
            // Member validation
            if (!formData.groupId) {
                setError('Please select a group');
                return;
            }

            // Check for duplicate member code
            const duplicateCode = data.members.find(
                m => m.memberCode && m.memberCode.toLowerCase() === formData.memberCode.toLowerCase() &&
                    (!editingUser || m.id !== editingUser.id)
            );

            if (duplicateCode) {
                setError('Member code already exists. Please use a unique code.');
                return;
            }
        } else {
            // System user validation
            const duplicateEmail = data.users.find(
                u => u.email.toLowerCase() === formData.email.toLowerCase() &&
                    (!editingUser || u.id !== editingUser.id)
            );

            if (duplicateEmail) {
                setError('Email already exists. Please use a different email.');
                return;
            }
        }

        // Check for duplicate phone
        if (formData.phone) {
            const duplicatePhone = (userType === 'member' ? data.members : data.users).find(
                u => u.phone === formData.phone &&
                    (!editingUser || u.id !== editingUser.id)
            );

            if (duplicatePhone) {
                setError('Phone number already exists.');
                return;
            }
        }

        const dataToSave = {
            ...formData,
            groupId: formData.groupId ? parseInt(formData.groupId) : undefined,
            joinYear: parseInt(formData.joinYear)
        };

        if (userType === 'member') {
            // Generate employeeCode for new members
            if (!editingUser) {
                const allMembers = data.members || [];
                const maxEmpCode = allMembers.reduce((max, m) => {
                    if (m.employeeCode) {
                        const num = parseInt(m.employeeCode.replace('EMP', ''));
                        return num > max ? num : max;
                    }
                    return max;
                }, 0);
                dataToSave.employeeCode = `EMP${String(maxEmpCode + 1).padStart(3, '0')}`;
            }

            if (editingUser) {
                updateItem('members', editingUser.id, dataToSave);
            } else {
                addItem('members', {
                    ...dataToSave,
                    status: 'active'
                });
            }
        } else {
            // System user
            if (editingUser) {
                updateItem('users', editingUser.id, dataToSave);
            } else {
                addItem('users', {
                    ...dataToSave,
                    createdAt: new Date().toISOString().split('T')[0]
                });
            }
        }

        setShowModal(false);
    };

    const handleToggleStatus = (user) => {
        updateItem('users', user.id, {
            status: user.status === 'active' ? 'inactive' : 'active'
        });
    };

    const handleDelete = (userId) => {
        const user = data.users.find(u => u.id === userId);

        if (user.role === 'member') {
            // Check if member has savings or loans
            const hasSavings = data.savings.some(s => s.memberId === userId);
            const hasLoans = data.loans.some(l => l.memberId === userId);

            if (hasSavings || hasLoans) {
                if (!window.confirm('This member has savings/loans. Are you sure you want to delete?')) {
                    return;
                }
            }
        } else {
            // Check if user is assigned to any groups
            const assignedGroups = data.shgGroups.filter(g => g.assignedTo === userId);

            if (assignedGroups.length > 0) {
                if (!window.confirm(`This user is assigned to ${assignedGroups.length} group(s). Are you sure you want to delete?`)) {
                    return;
                }
            }
        }

        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        deleteItem('users', userId);
    };

    const filteredUsers = useMemo(() => {
        let users = data.users;

        // Filter by user role for SHG members
        if (currentUser?.role === 'shg_member') {
            const myGroupIds = availableGroups.map(g => g.id);
            users = users.filter(u => {
                if (u.role === 'member') {
                    return myGroupIds.includes(u.groupId);
                }
                return u.id === currentUser.id; // Only see themselves for system users
            });
        }

        // Filter by search term
        if (searchTerm) {
            users = users.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm)) ||
                (user.memberCode && user.memberCode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by role
        if (filterRole) {
            users = users.filter(u => u.role === filterRole);
        }

        // Filter by group
        if (filterGroup) {
            users = users.filter(u => u.groupId === parseInt(filterGroup));
        }

        return users;
    }, [data.users, searchTerm, filterRole, filterGroup, currentUser, availableGroups]);

    const getRoleInfo = (roleValue) => {
        return roles.find(r => r.value === roleValue) || { label: roleValue, color: 'secondary' };
    };

    const getAssignedGroupsCount = (userId) => {
        return data.shgGroups.filter(g => g.assignedTo === userId && g.status === 'active').length;
    };

    const getGroupName = (groupId) => {
        const group = data.shgGroups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown';
    };

    const getMemberSavings = (userId) => {
        return data.savings
            .filter(s => s.memberId === userId)
            .reduce((sum, s) => sum + s.amount, 0);
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-0">User Management</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => handleOpenModal(null, 'member')}
                    disabled={availableGroups.length === 0}
                >
                    ➕ Register Member
                </Button>
            </div>

            {availableGroups.length === 0 && currentUser?.role !== 'admin' && (
                <Alert variant="warning">
                    ⚠️ No active groups available. Please create or get assigned to a group first.
                </Alert>
            )}

            {/* Users Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    {/* Filters */}
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white">🔍</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, email, phone, or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="">All User Types</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                value={filterGroup}
                                onChange={(e) => setFilterGroup(e.target.value)}
                            >
                                <option value="">All Groups</option>
                                {availableGroups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} ({group.code})
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                    <div className="table-responsive">
                        <Table className="mb-0" hover>
                            <thead>
                                <tr className="text-muted text-uppercase small" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                    <th className="fw-semibold border-0 bg-light py-3 ps-4">Name</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Code/Email</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Phone</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Type</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Group/Assigned</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Savings</th>
                                    <th className="fw-semibold border-0 bg-light py-3">Status</th>
                                    <th className="fw-semibold border-0 bg-light py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const roleInfo = getRoleInfo(user.role);
                                        const isMember = user.role === 'member';
                                        return (
                                            <tr key={user.id} className="align-middle">
                                                <td className="fw-medium ps-4">{user.name}</td>
                                                <td className="text-muted small">
                                                    {isMember ? (
                                                        <Badge bg="light" text="dark" className="fw-normal border">
                                                            {user.memberCode}
                                                        </Badge>
                                                    ) : (
                                                        user.email
                                                    )}
                                                </td>
                                                <td className="text-muted small">{user.phone || '-'}</td>
                                                <td>
                                                    <Badge bg={roleInfo.color} className="fw-normal">
                                                        {roleInfo.label}
                                                    </Badge>
                                                    {isMember && user.memberType && (
                                                        <Badge
                                                            bg={user.memberType === 'primary' ? 'primary' : 'info'}
                                                            className="fw-normal ms-1"
                                                        >
                                                            {user.memberType}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="text-muted small">
                                                    {isMember ? (
                                                        getGroupName(user.groupId)
                                                    ) : user.role === 'shg_member' ? (
                                                        <Badge bg="info" className="fw-normal">
                                                            {getAssignedGroupsCount(user.id)} groups
                                                        </Badge>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {isMember ? (
                                                        <span className="text-success fw-medium">
                                                            ₹{getMemberSavings(user.id).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={user.status === 'active' ? 'success' : 'secondary'}
                                                        className="fw-normal"
                                                    >
                                                        {user.status || 'active'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-end align-items-center pe-3">
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="text-primary border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                                                            style={{ width: '32px', height: '32px', backgroundColor: '#f0f4ff' }}
                                                            onClick={() => handleOpenModal(user)}
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                            </svg>
                                                        </Button>
                                                        <Form.Check
                                                            type="switch"
                                                            id={`custom-switch-${user.id}`}
                                                            checked={user.status === 'active'}
                                                            onChange={() => handleToggleStatus(user)}
                                                            className="d-inline-block pt-1"
                                                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        />
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="text-danger border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                                                            style={{ width: '32px', height: '32px', backgroundColor: '#fff0f0' }}
                                                            onClick={() => handleDelete(user.id)}
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingUser
                            ? (userType === 'member' ? 'Edit Member' : 'Edit System User')
                            : (userType === 'member' ? 'Register Member' : 'Create New System User')
                        }
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        {userType === 'system' ? (
                            // System User Form
                            <>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="10-digit mobile number"
                                                pattern="[0-9]{10}"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Role *</Form.Label>
                                            <Form.Select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                            >
                                                {roles.filter(r => r.value !== 'member').map(role => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                {formData.role === 'admin' && 'Full system access'}
                                                {formData.role === 'shg_member' && 'Manage assigned SHG groups'}
                                                {formData.role === 'shg_team' && 'Collect savings and loan repayments'}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
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
                                    </Col>
                                </Row>
                            </>
                        ) : (
                            // Member Registration Form
                            <>
                                <h6 className="fw-semibold mb-3 text-primary">Basic Information</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Gender *</Form.Label>
                                            <Form.Select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="female">Female</option>
                                                <option value="male">Male</option>
                                                <option value="other">Other</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date of Birth</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Select Group *</Form.Label>
                                            <Form.Select
                                                value={formData.groupId}
                                                onChange={(e) => handleGroupChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Group</option>
                                                {availableGroups.map(group => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.name} ({group.code})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Member Type *</Form.Label>
                                            <Form.Select
                                                value={formData.memberType}
                                                onChange={(e) => setFormData({ ...formData, memberType: e.target.value })}
                                                required
                                            >
                                                <option value="primary">Primary</option>
                                                <option value="associate">Associate</option>
                                                <option value="nominated">Nominated</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Role Type *</Form.Label>
                                            <Form.Select
                                                value={formData.roleType}
                                                onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                                required
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="shgteam">SHG Team</option>
                                                <option value="shgmember">SHG Member</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number *</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="10-digit mobile number"
                                                pattern="[0-9]{10}"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Membership Details</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Join Year *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.joinYear}
                                                onChange={(e) => setFormData({ ...formData, joinYear: e.target.value })}
                                                required
                                                min="1900"
                                                max="2099"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status *</Form.Label>
                                            <Form.Select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                required
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="closed">Closed</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit">
                            {editingUser
                                ? (userType === 'member' ? 'Update' : 'Update User')
                                : (userType === 'member' ? 'Save' : 'Create User')
                            }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div >
    );
}
