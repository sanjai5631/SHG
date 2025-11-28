import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Form, Button, Toast, ToastContainer, Row, Col } from "react-bootstrap";

export default function LoanRequestPage() {
    const { data, addLoanRequest } = useApp();

    const [groupId, setGroupId] = useState("");
    const [memberId, setMemberId] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [date, setDate] = useState("");

    const [showToast, setShowToast] = useState(false);

    const filteredMembers = data.members.filter(
        (m) => !groupId || m.groupId === parseInt(groupId)
    );

    const handleSubmit = (e) => {
        e.preventDefault();


        const newLoan = {
            id: Date.now(),
            groupId: parseInt(groupId),
            memberId: parseInt(memberId),
            amount: Number(amount),
            purpose,
            appliedDate: date,
            status: "requested",   // 🔥 Will show in approval page
        };

        // 🔥 Saves to Context State
        addLoanRequest(newLoan);
        setShowToast(true);

        // Clear form
        setGroupId("");
        setMemberId("");
        setAmount("");
        setPurpose("");
        setDate("");
    };

    return (
        <div className="container-fluid px-2 px-md-4 py-3">
            <div className="mb-3 mb-md-4">
                <h4 className="fw-bold text-dark mb-0">Loan Request</h4>
            </div>

            <Row className="justify-content-center">
                <Col xs={12} md={10} lg={8} xl={6}>
                    <Card className="shadow-sm border-0 rounded-4">
                        <Card.Body className="p-4 p-md-5">
                            <ToastContainer position="top-end" className="p-3">
                                <Toast bg="success" show={showToast} autohide delay={3000} onClose={() => setShowToast(false)}>
                                    <Toast.Header closeButton={false} className="text-success fw-bold">
                                        <strong className="me-auto">Success</strong>
                                    </Toast.Header>
                                    <Toast.Body className="text-white fw-medium">
                                        Loan Request Submitted Successfully!
                                    </Toast.Body>
                                </Toast>
                            </ToastContainer>

                            <h4 className="fw-bold mb-4 text-primary">Application Details</h4>

                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">SHG Group</Form.Label>
                                            <Form.Select
                                                value={groupId}
                                                onChange={(e) => { setGroupId(e.target.value); setMemberId(""); }}
                                                required
                                                className="form-select-lg fs-6"
                                            >
                                                <option value="">Select Group</option>
                                                {data.shgGroups.map((g) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">Member Name</Form.Label>
                                            <Form.Select
                                                value={memberId}
                                                onChange={(e) => setMemberId(e.target.value)}
                                                required
                                                className="form-select-lg fs-6"
                                                disabled={!groupId}
                                            >
                                                <option value="">Select Member</option>
                                                {filteredMembers.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">Loan Amount (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                                className="form-control-lg fs-6"
                                                min="1"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">Application Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                required
                                                className="form-control-lg fs-6"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium">Purpose of Loan</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Describe the purpose (e.g., Agriculture, Business, Medical)"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        required
                                        className="form-control-lg fs-6"
                                    />
                                </Form.Group>

                                <div className="d-grid">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="fw-bold py-3"
                                        style={{ transition: "all 0.3s" }}
                                    >
                                        Submit Loan Request
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
