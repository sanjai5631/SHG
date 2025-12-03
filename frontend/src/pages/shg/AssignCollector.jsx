import { useState, useMemo } from "react";
import {
    Card,
    Button,
    Modal,
    Form,
    Badge,
    InputGroup,
    Alert
} from "react-bootstrap";
import DataTable from '../../components/DataTable';
import { useApp } from "../../context/AppContext";
import { FaEdit, FaUserTie, FaCreditCard } from "react-icons/fa";

export default function AssignCollector() {
    const { data, updateItem } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [formData, setFormData] = useState({
        assignedTo: "",
        onlineCollectionId: "",
    });

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setFormData({
            assignedTo: group.assignedTo || "",
            onlineCollectionId: group.onlineCollectionId || "",
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedGroup) {
            updateItem("shgGroups", selectedGroup.id, {
                assignedTo: parseInt(formData.assignedTo),
                onlineCollectionId: formData.onlineCollectionId ? parseInt(formData.onlineCollectionId) : null,
            });
            setShowModal(false);
        }
    };

    const getCollectorName = (id) => {
        const user = data.users.find(u => u.id === id);
        return user ? user.name : <span className="text-muted fst-italic">Unassigned</span>;
    };

    const getMemberName = (id) => {
        const member = data.members.find(m => m.id === id);
        return member ? member.name : <span className="text-muted fst-italic">Not Set</span>;
    };

    // Filter for SHG Team members (Staff) for Group Incharge
    const shgTeamMembers = useMemo(() => {
        const systemUsers = data.users
            .filter(u => u.role === 'shg_team' && u.status === 'active')
            .map(u => ({ ...u, source: 'system' }));

        const memberUsers = data.members
            .filter(m => m.roleType === 'shg_team' && m.status === 'active')
            .map(m => ({ ...m, source: 'member' }));

        return [...systemUsers, ...memberUsers];
    }, [data.users, data.members]);

    // Get members of the selected group for Online Collection Account
    const groupMembers = useMemo(() => {
        if (!selectedGroup) return [];
        return data.members.filter(m => m.groupId === selectedGroup.id && m.status === 'active');
    }, [selectedGroup, data.members]);

    // Define columns for custom DataTable
    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'GROUP DETAILS',
            sortable: true,
            render: (value, row) => (
                <div className="py-2">
                    <div className="fw-bold text-dark">{row.name}</div>
                    <div className="small text-muted">{row.code}</div>
                </div>
            )
        },
        {
            key: 'assignedTo',
            label: 'ASSIGNED COLLECTOR',
            sortable: true,
            render: (value) => (
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <FaUserTie size={14} />
                    </div>
                    <span className="fw-medium">{getCollectorName(value)}</span>
                </div>
            )
        },
        {
            key: 'onlineCollectionId',
            label: 'ONLINE COLLECTION ACCOUNT',
            sortable: true,
            render: (value) => (
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <FaCreditCard size={14} />
                    </div>
                    <span className="fw-medium">{getMemberName(value)}</span>
                </div>
            )
        }
    ], [data.users, data.members]);

    // Action renderer for custom DataTable
    const actionRenderer = (row) => (
        <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleEdit(row)}
            className="d-inline-flex align-items-center gap-1"
        >
            <FaEdit /> Assign
        </Button>
    );

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-1">Assign Collector</h1>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <DataTable
                        initialColumns={columns}
                        data={data.shgGroups}
                        actionRenderer={actionRenderer}
                        enableFilter={true}
                        enablePagination={true}
                        enableSort={true}
                        rowsPerPageOptions={[10, 20, 30, 50]}
                    />
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Assign Collector & Online Account</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Alert variant="info" className="mb-3 py-2 small">
                            <div className="fw-bold">{selectedGroup?.name} ({selectedGroup?.code})</div>
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label>Assign Collector (Group Incharge)</Form.Label>
                            <Form.Select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                required
                            >
                                <option value="">Select Collector</option>
                                {shgTeamMembers.map(member => (
                                    <option key={`${member.source}-${member.id}`} value={member.id}>
                                        {member.name} {member.memberCode ? `(${member.memberCode})` : member.email ? `(${member.email})` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Online Collection Account</Form.Label>
                            <Form.Select
                                value={formData.onlineCollectionId}
                                onChange={(e) => setFormData({ ...formData, onlineCollectionId: e.target.value })}
                            >
                                <option value="">Select Member (Optional)</option>
                                {groupMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} ({member.memberCode})
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Select a group member who will receive online payments.
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
