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
        address: '',
        occupation: '',
        monthlyIncome: '',
        aadharNumber: '',
        panNumber: '',
        bankAccountNumber: '',
        bankName: '',
        ifscCode: '',
        nomineeName: '',
        nomineeRelation: '',
        nomineePhone: '',
        joinDate: new Date().toISOString().split('T')[0],
        memberType: 'primary'
    });

    const roles = [
        { value: 'admin', label: 'Admin', color: 'danger' },
        { value: 'collector', label: 'Collector', color: 'info' },
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
                    address: user.address || '',
                    monthlyIncome: user.monthlyIncome || '',
                    aadharNumber: user.aadharNumber || '',
                    panNumber: user.panNumber || '',
                    bankAccountNumber: user.bankAccountNumber || '',
                    bankName: user.bankName || '',
                    ifscCode: user.ifscCode || '',
                    nomineeName: user.nomineeName || '',
                    nomineeRelation: user.nomineeRelation || '',
                    nomineePhone: user.nomineePhone || '',
                    memberType: user.memberType || 'primary',
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
                    address: '',
                    occupation: '',
                    monthlyIncome: '',
                    aadharNumber: '',
                    panNumber: '',
                    bankAccountNumber: '',
                    bankName: '',
                    ifscCode: '',
                    nomineeName: '',
                    nomineeRelation: '',
                    nomineePhone: '',
                    joinDate: new Date().toISOString().split('T')[0],
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
            monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : 0
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
                    <h1 className="h3 fw-bold mb-0">User Management</h1>
                    <p className="text-muted small">Manage system users and SHG members</p>
                </div>
                <Button
                    variant="warning"
                    onClick={() => handleOpenModal(null, 'member')}
                    disabled={availableGroups.length === 0}
                >
                    ➕ New Register Member
                </Button>
            </div>

            {availableGroups.length === 0 && currentUser?.role !== 'admin' && (
                <Alert variant="warning">
                    ⚠️ No active groups available. Please create or get assigned to a group first.
                </Alert>
            )}

            {/* Filters */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
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
                </Card.Body>
            </Card>

            {/* Users Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="mb-0" hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Code/Email</th>
                                    <th>Phone</th>
                                    <th>Type</th>
                                    <th>Group/Assigned</th>
                                    <th>Savings</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const roleInfo = getRoleInfo(user.role);
                                        const isMember = user.role === 'member';
                                        return (
                                            <tr key={user.id}>
                                                <td className="fw-medium">{user.name}</td>
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
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleOpenModal(user)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </Button>
                                                        <Button
                                                            variant={user.status === 'active' ? 'outline-warning' : 'outline-success'}
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(user)}
                                                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {user.status === 'active' ? '🔒' : '🔓'}
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id)}
                                                            title="Delete"
                                                        >
                                                            🗑️
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
                            : (userType === 'member' ? 'Register New Member' : 'Create New System User')
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

                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="Enter email address"
                                    />
                                    <Form.Text className="text-muted">
                                        Used for login and notifications
                                    </Form.Text>
                                </Form.Group>

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
                                                {formData.role === 'collector' && 'Collect savings and loan repayments'}
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
                                            <Form.Label>Member Code *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.memberCode}
                                                onChange={(e) => setFormData({ ...formData, memberCode: e.target.value.toUpperCase() })}
                                                placeholder="Auto-generated"
                                                required
                                                readOnly={!editingUser}
                                            />
                                            <Form.Text className="text-muted">
                                                {!editingUser && 'Auto-generated based on group'}
                                            </Form.Text>
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
                                </Row>

                                <Row>
                                    <Col md={6}>
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
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Optional"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter complete address"
                                    />
                                </Form.Group>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Occupation & Income</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Occupation *</Form.Label>
                                            <Form.Select
                                                value={formData.occupation}
                                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Occupation</option>
                                                {data.occupations.map(occ => (
                                                    <option key={occ.id} value={occ.name}>{occ.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Monthly Income (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={formData.monthlyIncome}
                                                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                                                placeholder="Approximate monthly income"
                                                min="0"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Identity Documents</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Aadhar Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.aadharNumber}
                                                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                                placeholder="12-digit Aadhar number"
                                                pattern="[0-9]{12}"
                                                maxLength="12"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>PAN Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.panNumber}
                                                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                                placeholder="10-character PAN"
                                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                                maxLength="10"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Bank Details</h6>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Bank Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.bankName}
                                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                                placeholder="e.g., SBI, HDFC"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Account Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.bankAccountNumber}
                                                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                                placeholder="Bank account number"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>IFSC Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.ifscCode}
                                                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                                                placeholder="11-character IFSC"
                                                pattern="[A-Z]{4}0[A-Z0-9]{6}"
                                                maxLength="11"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Nominee Details</h6>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nominee Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.nomineeName}
                                                onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                                                placeholder="Full name of nominee"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Relation</Form.Label>
                                            <Form.Select
                                                value={formData.nomineeRelation}
                                                onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                                            >
                                                <option value="">Select Relation</option>
                                                <option value="spouse">Spouse</option>
                                                <option value="son">Son</option>
                                                <option value="daughter">Daughter</option>
                                                <option value="father">Father</option>
                                                <option value="mother">Mother</option>
                                                <option value="brother">Brother</option>
                                                <option value="sister">Sister</option>
                                                <option value="other">Other</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nominee Phone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={formData.nomineePhone}
                                                onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                                                placeholder="10-digit number"
                                                pattern="[0-9]{10}"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Membership Details</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Join Date *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={formData.joinDate}
                                                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                                required
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
                                ? (userType === 'member' ? ' Member Update' : 'Save')
                                : (userType === 'member' ? 'Save' : 'Create User')
                            }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div >
    );
}
