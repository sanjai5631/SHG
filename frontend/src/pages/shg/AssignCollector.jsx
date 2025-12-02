import { useState } from "react";
import {
    Card,
    Button,
    Modal,
    Form,
    Badge,
    InputGroup
} from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { useApp } from "../../context/AppContext";
import { FaSearch, FaEdit, FaUserTie, FaCreditCard } from "react-icons/fa";

export default function AssignCollector() {
    const { data, updateItem } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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

    const filteredGroups = data.shgGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            name: 'GROUP DETAILS',
            selector: row => row.name,
            cell: row => (
                <div className="py-2">
                    <div className="fw-bold text-dark">{row.name}</div>
                    <div className="small text-muted">{row.code}</div>
                </div>
            ),
            sortable: true,
            grow: 2,
        },

        {
            name: 'ASSIGNED COLLECTOR',
            selector: row => getCollectorName(row.assignedTo),
            cell: row => (
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <FaUserTie size={14} />
                    </div>
                    <span className="fw-medium">{getCollectorName(row.assignedTo)}</span>
                </div>
            ),
            grow: 1.5,
        },
        {
            name: 'ONLINE COLLECTION ACCOUNT',
            selector: row => getMemberName(row.onlineCollectionId),
            cell: row => (
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        <FaCreditCard size={14} />
                    </div>
                    <span className="fw-medium">{getMemberName(row.onlineCollectionId)}</span>
                </div>
            ),
            grow: 1.5,
        },
        {
            name: 'ACTION',
            cell: row => (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEdit(row)}
                    className="d-inline-flex align-items-center gap-1"
                >
                    <FaEdit /> Assign
                </Button>
            ),
            button: true,
            width: '120px',
        },
    ];

    const customStyles = {
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
        rows: {
            style: {
                minHeight: '60px', // Slightly taller for group details
                fontSize: '0.875rem',
                '&:nth-of-type(odd)': {
                    backgroundColor: '#bbdefb',
                },
                '&:nth-of-type(even)': {
                    backgroundColor: '#ffffff',
                },
            },
        },
        cells: {
            style: {
                paddingLeft: '12px',
                paddingRight: '12px',
            },
        },
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h4 fw-bold mb-1">Assign Collector</h1>
                </div>
                <div style={{ width: '400px' }}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Filter By Name"
                            className="border-end-0"
                            style={{
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                fontSize: '0.95rem',
                                padding: '0.75rem 1rem'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button
                            variant="primary"
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                paddingLeft: '1.5rem',
                                paddingRight: '1.5rem'
                            }}
                        >
                            <FaSearch size={18} />
                        </Button>
                    </InputGroup>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredGroups}
                        customStyles={customStyles}
                        pagination
                        highlightOnHover
                        pointerOnHover
                        responsive
                    />
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Assign Collector</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <div className="mb-4">
                            <h6 className="fw-bold text-dark">{selectedGroup?.name}</h6>
                            <p className="text-muted small mb-0">Code: {selectedGroup?.code} • Area: {selectedGroup?.area}</p>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Collector</Form.Label>
                            <Form.Select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                required
                            >
                                <option value="">Select Collector</option>
                                {data.users.filter(u => u.status === 'active').map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role === 'shg_team' ? 'Team' : 'Member'})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Online Collection Account</Form.Label>
                            <Form.Text className="d-block text-muted small mb-2">
                                Select the member account where online payments will be collected.
                            </Form.Text>
                            <Form.Select
                                value={formData.onlineCollectionId}
                                onChange={(e) => setFormData({ ...formData, onlineCollectionId: e.target.value })}
                            >
                                <option value="">Select Account Holder</option>
                                {data.members.filter(m => m.status === 'active').map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} - {member.bankName} ({member.bankAccountNumber})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="success">
                            Save
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
