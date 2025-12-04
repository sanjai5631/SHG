import { useState, useMemo } from 'react';
import { Card, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import DataTable from '../../components/DataTable';
import { useApp } from '../../context/AppContext';
import { FaPrint, FaFileExcel, FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

export default function SupportData() {
    const { data, addItem, updateItem } = useApp();
    const [activeItem, setActiveItem] = useState('savingProducts');
    const [expandedNodes, setExpandedNodes] = useState(['supportData', 'general']);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Tree Structure
    const treeData = [
        {
            id: 'supportData',
            label: 'Support Data',
            children: [
                {
                    id: 'general',
                    label: 'General',
                    children: [
                        { id: 'savingProducts', label: 'Saving Settings' },
                        { id: 'loanProducts', label: 'Loan Settings' },
                        { id: 'meetingTypes', label: 'Meeting Types' },
                        { id: 'financialYears', label: 'Financial Years' },
                    ]
                }
            ]
        }
    ];

    // Field Configurations
    const fields = {
        savingProducts: [
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
        ],
        loanProducts: [
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
            { name: 'maxAmount', label: 'Max Amount', type: 'number', required: true },
        ],
        meetingTypes: [
            { name: 'name', label: 'Meeting Type', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
        ],
        financialYears: [
            { name: 'name', label: 'Year Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true },
            { name: 'endDate', label: 'End Date', type: 'date', required: true },
        ],
        default: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: false },
        ]
    };

    const getFields = (key) => fields[key] || fields.default;

    const toggleNode = (nodeId) => {
        if (expandedNodes.includes(nodeId)) {
            setExpandedNodes(expandedNodes.filter(id => id !== nodeId));
        } else {
            setExpandedNodes([...expandedNodes, nodeId]);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            const initialData = { status: 'active' };
            getFields(activeItem).forEach(field => {
                initialData[field.name] = '';
            });
            setFormData(initialData);
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            updateItem(activeItem, editingItem.id, formData);
        } else {
            addItem(activeItem, formData);
        }
        setShowModal(false);
        setEditingItem(null);
    };

    // Get current data
    const currentData = data[activeItem] || [];

    const handleToggleStatus = (item) => {
        updateItem(activeItem, item.id, {
            status: item.status === 'active' ? 'inactive' : 'active'
        });
    };

    const columns = useMemo(() => [
        {
            key: 'actions',
            label: 'ACTIONS',
            sortable: false,
            render: (_, row) => (
                <div className="d-flex gap-2 align-items-center">
                    <Button
                        variant="light"
                        size="sm"
                        className="text-primary border-0 p-1"
                        onClick={() => handleOpenModal(row)}
                        title="Edit"
                    >
                        <FaEdit size={14} />
                    </Button>
                    <Form.Check
                        type="switch"
                        id={`switch-${activeItem}-${row.id}`}
                        checked={row.status === 'active'}
                        onChange={() => handleToggleStatus(row)}
                        className="d-inline-block"
                    />
                </div>
            )
        },
        ...getFields(activeItem).map(field => ({
            key: field.name,
            label: field.label.toUpperCase(),
            sortable: true,
            render: (value) => {
                if (field.type === 'number' && field.name.includes('Rate')) return `${value}%`;
                if (field.type === 'number' && field.name.includes('Amount')) return `₹${value.toLocaleString()}`;
                return value;
            }
        })),
        {
            key: 'status',
            label: 'STATUS',
            sortable: true,
            render: (status) => (
                <span
                    className="badge text-white px-3 py-1"
                    style={{
                        backgroundColor: status === 'active' ? '#28a745' : '#6c757d',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '12px'
                    }}
                >
                    {status === 'active' ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ], [activeItem]);

    const renderTree = (nodes, level = 0) => {
        return nodes.map(node => {
            const isExpanded = expandedNodes.includes(node.id);
            const isSelected = activeItem === node.id;
            const hasChildren = node.children && node.children.length > 0;

            return (
                <div key={node.id} style={{ marginLeft: level * 12 }}>
                    <div
                        className={`d-flex align-items-center py-1 px-2 mb-1 cursor-pointer ${isSelected ? 'fw-bold text-dark' : 'text-dark'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => hasChildren ? toggleNode(node.id) : setActiveItem(node.id)}
                    >
                        {hasChildren && (
                            <span className="me-2 text-muted" style={{ fontSize: '0.8rem' }}>
                                {isExpanded ? <FaMinus size={10} /> : <FaPlus size={10} />}
                            </span>
                        )}
                        {!hasChildren && <span className="me-3"></span>}
                        <span style={{ fontSize: '0.9rem', textDecoration: isSelected ? 'underline' : 'none' }}>{node.label}</span>
                    </div>
                    {hasChildren && isExpanded && (
                        <div className="border-start ms-2 ps-1" style={{ borderColor: '#dee2e6' }}>
                            {renderTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const activeLabel = treeData[0].children[0].children.find(c => c.id === activeItem)?.label ||
        treeData[0].children[0].label === activeItem ? 'General' :
        'Support Data';

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="mb-4">
                <h1 className="h4 fw-bold mb-0">Support Data</h1>
            </div>

            <Card className="border-0 shadow-sm" style={{ minHeight: '600px' }}>
                <Card.Body className="p-0">
                    <Row className="g-0 h-100">
                        {/* Sidebar Tree View */}
                        <Col md={3} className="border-end bg-white p-3" style={{ minHeight: '600px' }}>

                            <div className="tree-view">
                                {renderTree(treeData)}
                            </div>
                        </Col>

                        {/* Content Area */}
                        <Col md={9} className="p-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                <h5 className="fw-bold mb-0">
                                    {treeData[0].children[0].children.find(c => c.id === activeItem)?.label || 'Support Data'} Details
                                </h5>
                                <Button
                                    variant="warning"
                                    className="text-white fw-medium px-4"
                                    onClick={() => handleOpenModal()}
                                    style={{ backgroundColor: '#f0ad4e', borderColor: '#eea236' }}
                                >
                                    Add Data
                                </Button>
                            </div>

                            <DataTable
                                key={activeItem}
                                initialColumns={columns}
                                data={currentData}
                                enableFilter={true}
                                enableExport={true}
                                enablePagination={true}
                                enableSort={true}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                headerStyle={{
                                    backgroundColor: '#f8f9fa',
                                    color: '#6c757d',
                                    fontWeight: '600',
                                    fontSize: '0.7rem'
                                }}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-2">
                    <Modal.Title className="fw-bold fs-5">
                        {editingItem ? 'Edit' : 'Add '} {treeData[0].children[0].children.find(c => c.id === activeItem)?.label || activeLabel}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="px-3 py-3">
                        {getFields(activeItem).map(field => (
                            <Form.Group key={field.name} className="mb-3">
                                <Form.Label className="fw-medium text-dark mb-2">
                                    {field.label} {field.required && <span className="text-danger">*</span>}
                                </Form.Label>
                                <Form.Control
                                    type={field.type}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [field.name]: field.type === 'number'
                                            ? parseFloat(e.target.value) || 0
                                            : e.target.value
                                    })}
                                    required={field.required}
                                    step={field.type === 'number' ? '0.01' : undefined}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    className="py-2"
                                    style={{
                                        borderRadius: '8px',
                                        border: '1px solid #dee2e6',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </Form.Group>
                        ))}

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-medium text-dark mb-2">
                                Status <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                                value={formData.status || 'active'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="py-2"
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #dee2e6',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 px-3 pb-3 pt-2">
                        <Button
                            variant="light"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2"
                            style={{
                                borderRadius: '8px',
                                border: '1px solid #dee2e6',
                                fontWeight: '500'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="px-4 py-2 text-white"
                            style={{
                                backgroundColor: '#28a745',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '500'
                            }}
                        >
                            Save
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
