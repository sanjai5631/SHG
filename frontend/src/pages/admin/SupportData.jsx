import { useState, useMemo } from 'react';
import { Card, Tabs, Tab, Button, Modal, Form, Badge, InputGroup } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useApp } from '../../context/AppContext';

export default function SupportData() {
    const { data, addItem, updateItem } = useApp();
    const [activeTab, setActiveTab] = useState('savingProducts');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    const tabs = [
        { id: 'savingProducts', label: 'Saving Products', icon: '💰' },
        { id: 'loanProducts', label: 'Loan Products', icon: '💳' },
        { id: 'meetingTypes', label: 'Meeting Types', icon: '📝' },
        { id: 'financialYears', label: 'Financial Years', icon: '📅' },
    ];

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
        ]
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            const initialData = { status: 'active' };
            fields[activeTab].forEach(field => {
                initialData[field.name] = '';
            });
            setFormData(initialData);
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingItem) {
            updateItem(activeTab, editingItem.id, formData);
        } else {
            addItem(activeTab, formData);
        }

        setShowModal(false);
        setEditingItem(null);
    };

    const handleToggleStatus = (item) => {
        updateItem(activeTab, item.id, {
            status: item.status === 'active' ? 'inactive' : 'active'
        });
    };

    const currentData = data[activeTab] || [];

    // Define columns dynamically based on active tab - wrapped in useMemo
    const columns = useMemo(() => [
        ...fields[activeTab].map(field => ({
            name: field.label,
            selector: row => row[field.name],
            sortable: true,
            cell: row => {
                const value = row[field.name];
                if (field.type === 'number' && field.name.includes('Rate')) {
                    return `${value}%`;
                } else if (field.type === 'number' && field.name.includes('Amount')) {
                    return `₹${value.toLocaleString()}`;
                }
                return value;
            },
            minWidth: field.name === 'name' ? '200px' : '150px',
        })),
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
                        id={`custom-switch-${row.id}-${activeTab}`}
                        checked={row.status === 'active'}
                        onChange={() => handleToggleStatus(row)}
                        className="d-inline-block"
                        title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                    />
                </div>
            ),
            right: true,
            minWidth: '120px',
        },
    ], [activeTab]);

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
                    <h1 className="h4 fw-bold mb-1">Support Data Management</h1>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    ➕ Add New
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom-0 pt-2 px-2">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-0"
                        variant="tabs"
                    >
                        {tabs.map(tab => (
                            <Tab
                                key={tab.id}
                                eventKey={tab.id}
                                title={<span>{tab.icon} {tab.label}</span>}
                            />
                        ))}
                    </Tabs>
                </Card.Header>
                <Card.Body className="p-4">
                    <DataTable
                        columns={columns}
                        data={currentData}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                        highlightOnHover
                        pointerOnHover
                        fixedHeader
                        fixedHeaderScrollHeight="400px"
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="text-center text-muted py-5">
                                <div className="mb-2">📭</div>
                                No data found for {tabs.find(t => t.id === activeTab)?.label}
                            </div>
                        }
                    />
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingItem ? 'Edit' : 'Add New'} {tabs.find(t => t.id === activeTab)?.label}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {fields[activeTab].map(field => (
                            <Form.Group key={field.name} className="mb-3">
                                <Form.Label>
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
                                />
                            </Form.Group>
                        ))}

                        <Form.Group className="mb-3">
                            <Form.Label>Status *</Form.Label>
                            <Form.Select
                                value={formData.status || 'active'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                        <Button variant="success" type="submit">
                            {editingItem ? 'Update' : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
