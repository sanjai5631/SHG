import { useState } from 'react';
import { Card, Tabs, Tab, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
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
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="mb-0" hover>
                            <thead>
                                <tr>
                                    {fields[activeTab].map(field => (
                                        <th key={field.name} className="bg-light border-bottom">
                                            {field.label}
                                        </th>
                                    ))}
                                    <th className="bg-light border-bottom">Status</th>
                                    <th className="bg-light border-bottom text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((item) => (
                                        <tr key={item.id}>
                                            {fields[activeTab].map(field => (
                                                <td key={field.name} className="align-middle">
                                                    {field.type === 'number' && field.name.includes('Rate')
                                                        ? `${item[field.name]}%`
                                                        : field.type === 'number' && field.name.includes('Amount')
                                                            ? `₹${item[field.name].toLocaleString()}`
                                                            : item[field.name]}
                                                </td>
                                            ))}
                                            <td className="align-middle">
                                                <Badge
                                                    bg={item.status === 'active' ? 'success' : 'secondary'}
                                                    className="fw-normal"
                                                >
                                                    {item.status}
                                                </Badge>
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenModal(item)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </Button>
                                                    <Button
                                                        variant={item.status === 'active' ? 'outline-warning' : 'outline-success'}
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(item)}
                                                        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {item.status === 'active' ? '🔒' : '🔓'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={fields[activeTab].length + 2}
                                            className="text-center text-muted py-5"
                                        >
                                            <div className="mb-2">📭</div>
                                            No data found for {tabs.find(t => t.id === activeTab)?.label}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
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
                        <Button variant="primary" type="submit">
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
