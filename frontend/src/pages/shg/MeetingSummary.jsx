import { useState } from 'react';
import { Card, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';

export default function MeetingSummary() {
    const { data, currentUser, addItem } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        groupId: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        attendees: [],
        remarks: ''
    });

    // Get groups assigned to current user
    const myGroups = data.shgGroups.filter(g => g.assignedTo === currentUser.id && g.status === 'active');

    // Get meetings created by current user
    const myMeetings = data.meetings.filter(m => m.createdBy === currentUser.id);

    // Get meeting types
    const meetingTypes = data.meetingTypes.filter(t => t.status === 'active');

    // Get members from selected group
    const groupMembers = formData.groupId
        ? data.members.filter(m => m.groupId === parseInt(formData.groupId) && m.status === 'active')
        : [];

    const handleOpenModal = () => {
        setFormData({
            groupId: '',
            date: new Date().toISOString().split('T')[0],
            type: '',
            attendees: [],
            remarks: ''
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        addItem('meetings', {
            groupId: parseInt(formData.groupId),
            date: formData.date,
            type: parseInt(formData.type),
            attendees: formData.attendees,
            remarks: formData.remarks,
            createdBy: currentUser.id
        });

        setShowModal(false);
        alert('Meeting record created successfully!');
    };

    const handleAttendeeToggle = (memberId) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees.includes(memberId)
                ? prev.attendees.filter(id => id !== memberId)
                : [...prev.attendees, memberId]
        }));
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h2 fw-bold mb-1">Meeting Summary</h1>
                    <p className="text-muted mb-0">Record and manage SHG meeting details</p>
                </div>
                <Button variant="warning" onClick={handleOpenModal}>
                    ➕ Add Meeting
                </Button>
            </div>

            {/* Meetings List */}
            <div className="d-flex flex-column gap-4">
                {myMeetings.length > 0 ? (
                    myMeetings.reverse().map((meeting) => {
                        const group = data.shgGroups.find(g => g.id === meeting.groupId);
                        const meetingType = data.meetingTypes.find(t => t.id === meeting.type);

                        return (
                            <Card key={meeting.id} className="border-0 shadow-sm border-start border-4 border-primary">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h4 className="fw-bold mb-1">{group?.name}</h4>
                                            <div className="text-muted">
                                                {new Date(meeting.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <Badge bg="primary" className="fw-normal fs-6">
                                            {meetingType?.name}
                                        </Badge>
                                    </div>

                                    <div className="bg-light rounded-3 p-3 mb-3">
                                        <div className="text-muted small mb-2">Attendance</div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {meeting.attendees.map(attendeeId => {
                                                const member = data.members.find(m => m.id === attendeeId);
                                                return member ? (
                                                    <Badge key={attendeeId} bg="success" className="fw-normal">
                                                        ✓ {member.name}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                        <div className="text-muted small mt-2">
                                            {meeting.attendees.length} / {data.members.filter(m => m.groupId === meeting.groupId).length} members present
                                        </div>
                                    </div>

                                    <div>
                                        <div className="fw-semibold mb-1">Remarks:</div>
                                        <div className="text-muted">{meeting.remarks}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-5 text-muted">
                        <div className="fs-1 mb-2">📅</div>
                        <p>No meetings recorded yet</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Record Meeting</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Select SHG Group *</Form.Label>
                            <Form.Select
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value, attendees: [] })}
                                required
                            >
                                <option value="">Choose a group...</option>
                                {myGroups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} ({group.code})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Meeting Date *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Meeting Type *</Form.Label>
                                    <Form.Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="">Choose type...</option>
                                        {meetingTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {formData.groupId && (
                            <Form.Group className="mb-3">
                                <Form.Label>Mark Attendance *</Form.Label>
                                <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {groupMembers.map(member => (
                                        <Form.Check
                                            key={member.id}
                                            type="checkbox"
                                            id={`member-${member.id}`}
                                            label={`${member.name} (${member.memberCode})`}
                                            checked={formData.attendees.includes(member.id)}
                                            onChange={() => handleAttendeeToggle(member.id)}
                                            className="mb-2"
                                        />
                                    ))}
                                </div>
                                <div className="text-muted small mt-1">
                                    {formData.attendees.length} / {groupMembers.length} members marked present
                                </div>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Meeting Remarks *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Enter meeting details, discussions, decisions, loan approvals, etc."
                                required
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit">
                            Save Meeting
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
