import { useState, useMemo } from 'react';
import { Card, Button, Modal, Form, Badge, InputGroup, Row, Col, Alert } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
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
        { value: 'shg_member', label: 'SHG Member', color: 'success' }
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

    // Calculate max date for 18 years age limit
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const maxDateString = maxDate.toISOString().split('T')[0];

    const handleOpenModal = (user = null, type = 'system') => {
        setError('');
        setUserType(type);

        if (user) {
            setEditingUser(user);
            if (user.role === 'shg_member' || user.memberCode) {
                // It's a member
                setUserType('member');
                setFormData({
                    ...user,
                    groupId: user.groupId || '',
                    email: user.email || '',
                    dateOfBirth: user.dateOfBirth || '',
                    gender: user.gender || '',
                    memberType: user.memberType || 'leader',
                    roleType: user.roleType || 'shg_member',
                    joinYear: user.joinYear || new Date().getFullYear(),
                    role: 'shg_member'
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
                    memberType: 'leader',
                    roleType: 'shg_member',
                    role: 'shg_member',
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

            // Age validation - must be at least 18 years old
            if (formData.dateOfBirth) {
                const today = new Date();
                const birthDate = new Date(formData.dateOfBirth);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                // Adjust age if birthday hasn't occurred this year
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                if (age < 18) {
                    setError('Member must be at least 18 years old.');
                    return;
                }
            }

            // Check for duplicate member code
            if (formData.memberCode) {
                const duplicateCode = data.members.find(
                    m => m.memberCode && m.memberCode.toLowerCase() === formData.memberCode.toLowerCase() &&
                        (!editingUser || m.id !== editingUser.id)
                );

                if (duplicateCode) {
                    setError('Member code already exists. Please use a unique code.');
                    return;
                }
            }
        } else {
            // System user validation
            if (formData.email) {
                const duplicateEmail = data.users.find(
                    u => u.email && u.email.toLowerCase() === formData.email.toLowerCase() &&
                        (!editingUser || u.id !== editingUser.id)
                );

                if (duplicateEmail) {
                    setError('Email already exists. Please use a different email.');
                    return;
                }
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
        const collection = user.recordType === 'member' ? 'members' : 'users';
        updateItem(collection, user.id, {
            status: user.status === 'active' ? 'inactive' : 'active'
        });
    };

    const handleDelete = (user) => {
        if (user.recordType === 'member') {
            // Check if member has savings or loans
            const hasSavings = data.savings.some(s => s.memberId === user.id);
            const hasLoans = data.loans.some(l => l.memberId === user.id);

            if (hasSavings || hasLoans) {
                if (!window.confirm('This member has savings/loans. Are you sure you want to delete?')) {
                    return;
                }
            }
            if (window.confirm('Are you sure you want to delete this member?')) {
                deleteItem('members', user.id);
            }
        } else {
            // Check if user is assigned to any groups
            const assignedGroups = data.shgGroups.filter(g => g.assignedTo === user.id);

            if (assignedGroups.length > 0) {
                if (!window.confirm(`This user is assigned to ${assignedGroups.length} group(s). Are you sure you want to delete?`)) {
                    return;
                }
            }
            if (window.confirm('Are you sure you want to delete this user?')) {
                deleteItem('users', user.id);
            }
        }
    };

    const filteredUsers = useMemo(() => {
        // Combine system users and members
        let allItems = [
            ...data.users.map(u => ({ ...u, recordType: 'system' })),
            ...data.members.map(m => ({ ...m, recordType: 'member', role: m.roleType || 'shg_member', email: m.email || '' }))
        ];

        // Filter by user role for SHG members
        if (currentUser?.role === 'shg_member') {
            const myGroupIds = availableGroups.map(g => g.id);
            allItems = allItems.filter(u => {
                if (u.recordType === 'member') {
                    return myGroupIds.includes(u.groupId);
                }
                return u.id === currentUser.id; // Only see themselves for system users
            });
        }

        // Filter by search term
        if (searchTerm) {
            allItems = allItems.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm)) ||
                (user.memberCode && user.memberCode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by role
        if (filterRole) {
            allItems = allItems.filter(u => u.role === filterRole);
        }

        // Filter by group
        if (filterGroup) {
            const groupId = parseInt(filterGroup);
            allItems = allItems.filter(u => {
                if (u.recordType === 'system') return false; // Hide system users when filtering by group
                return u.groupId === groupId;
            });
        }

        return allItems;
    }, [data.users, data.members, searchTerm, filterRole, filterGroup, currentUser, availableGroups]);

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

    // Define columns for DataTable
    const columns = [
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="py-2">
                    <div className="fw-medium">{row.name}</div>
                    {row.role === 'member' && row.memberCode && (
                        <div className="mt-1">
                            <Badge bg="light" text="dark" className="fw-normal border small">
                                {row.memberCode}
                            </Badge>
                        </div>
                    )}
                </div>
            ),
            width: '250px',
        },
        {
            name: 'Phone',
            selector: row => row.phone,
            sortable: true,
            cell: row => <span className="text-muted small">{row.phone || '-'}</span>,
            width: '160px',
        },
        {
            name: 'Type',
            selector: row => row.role,
            sortable: true,
            cell: row => {
                const roleInfo = getRoleInfo(row.role);
                const isMember = row.recordType === 'member';
                return (
                    <div className="d-flex flex-wrap gap-1 align-items-center">
                        <Badge bg={roleInfo.color} className="fw-normal" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                            {roleInfo.label}
                        </Badge>
                        {isMember && row.memberType && (
                            <Badge
                                bg={row.memberType === 'leader' ? 'primary' : row.memberType === 'member' ? 'info' : 'warning'}
                                className="fw-normal"
                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            >
                                {row.memberType}
                            </Badge>
                        )}
                    </div>
                );
            },
            width: '220px',
        },
        {
            name: 'Group/Assigned',
            selector: row => row.groupId,
            sortable: true,
            cell: row => {
                const isMember = row.recordType === 'member';
                return (
                    <span className="text-muted small">
                        {isMember ? (
                            getGroupName(row.groupId)
                        ) : row.role === 'shg_member' ? (
                            <Badge bg="info" className="fw-normal" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                {getAssignedGroupsCount(row.id)} groups
                            </Badge>
                        ) : (
                            '-'
                        )}
                    </span>
                );
            },
            width: '220px',
        },
        {
            name: 'Savings',
            selector: row => row.id,
            sortable: true,
            cell: row => {
                const isMember = row.recordType === 'member';
                return isMember ? (
                    <span className="text-success fw-medium">
                        ₹{getMemberSavings(row.id).toLocaleString()}
                    </span>
                ) : (
                    <span className="text-muted">-</span>
                );
            },
            width: '150px',
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
                    {row.status || 'active'}
                </Badge>
            ),
            width: '120px',
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
                        onClick={() => handleOpenModal(row, row.recordType)}
                        title="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                        </svg>
                    </Button>
                    <Form.Check
                        type="switch"
                        id={`custom-switch-${row.id}-${row.recordType}`}
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
                        onClick={() => handleDelete(row)}
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
            width: '180px',
        },
    ];

    // Custom styles for DataTable with alternating row colors
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


                    <DataTable
                        columns={columns}
                        data={filteredUsers}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                        paginationResetDefaultPage={searchTerm !== ''}
                        highlightOnHover
                        pointerOnHover
                        fixedHeader
                        fixedHeaderScrollHeight="600px"
                        customStyles={customStyles}
                        subHeader
                        subHeaderComponent={
                            <div className="d-flex justify-content-end w-100 mb-3">
                                <InputGroup style={{ maxWidth: '350px' }}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Filter By Name"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-end-0"
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={() => setSearchTerm('')}
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                    >
                                        {searchTerm ? '✕' : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                                        </svg>}
                                    </Button>
                                </InputGroup>
                            </div>
                        }
                        noDataComponent={
                            <div className="text-center text-muted py-4">
                                No users found
                            </div>
                        }
                    />
                </Card.Body>
            </Card>

            {/* Modal */}
            < Modal show={showModal} onHide={() => setShowModal(false)
            } centered size="xl" >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingUser
                            ? (userType === 'member' ? 'Update Member' : 'Update User')
                            : (userType === 'member' ? 'Register Member' : 'Create User')
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow only letters and spaces
                                                    if (/^[a-zA-Z\s]*$/.test(value)) {
                                                        setFormData({ ...formData, name: value });
                                                    }
                                                }}
                                                required
                                                placeholder="Enter full name"
                                                pattern="[a-zA-Z\s]+"
                                                title="Please enter letters only"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow only numbers and limit to 10 digits
                                                    if (/^[0-9]{0,10}$/.test(value)) {
                                                        setFormData({ ...formData, phone: value });
                                                    }
                                                }}
                                                placeholder="10-digit mobile number"
                                                pattern="[0-9]{10}"
                                                minLength="10"
                                                maxLength="10"
                                                title="Please enter exactly 10 digits"
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow only letters and spaces
                                                    if (/^[a-zA-Z\s]*$/.test(value)) {
                                                        setFormData({ ...formData, name: value });
                                                    }
                                                }}
                                                placeholder="Enter full name"
                                                required
                                                pattern="[a-zA-Z\s]+"
                                                title="Please enter letters only"
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
                                                max={maxDateString}
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
                                                <option value="leader">Leader</option>
                                                <option value="member">Member</option>
                                                <option value="nominee">Nominee</option>
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
                                                <option value="shg_team">SHG Team</option>
                                                <option value="shg_member">SHG Member</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Enter email address"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number *</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow only numbers and limit to 10 digits
                                                    if (/^[0-9]{0,10}$/.test(value)) {
                                                        setFormData({ ...formData, phone: value });
                                                    }
                                                }}
                                                placeholder="10-digit mobile number"
                                                pattern="[0-9]{10}"
                                                minLength="10"
                                                maxLength="10"
                                                required
                                                title="Please enter exactly 10 digits"
                                            />
                                        </Form.Group>
                                    </Col>
                                    {!editingUser && (
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Password *</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    value={formData.password || ''}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    placeholder="Enter password"
                                                    minLength="6"
                                                    title="Password must be at least 6 characters"
                                                />
                                                <Form.Text className="text-muted">
                                                    Min 6 chars
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>

                                <h6 className="fw-semibold mb-3 text-primary mt-4">Membership Details</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Join Year *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.joinYear}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow only numbers and limit to 4 digits
                                                    if (/^[0-9]{0,4}$/.test(value)) {
                                                        setFormData({ ...formData, joinYear: value });
                                                    }
                                                }}
                                                required
                                                placeholder="Enter year (e.g., 2024)"
                                                pattern="[0-9]{4}"
                                                minLength="4"
                                                maxLength="4"
                                                title="Please enter exactly 4 digits for the year"
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
            </Modal >
        </div >
    );
}
