import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Form, Button, Toast, ToastContainer, Row, Col } from "react-bootstrap";

export default function LoanIssue() {
    const { data, addItem } = useApp();

    const [groupId, setGroupId] = useState("");
    const [memberId, setMemberId] = useState("");
    const [productId, setProductId] = useState("");
    const [amount, setAmount] = useState("");
    const [interest, setInterest] = useState("");
    const [tenor, setTenor] = useState("");
    const [emi, setEmi] = useState("");
    const [purpose, setPurpose] = useState("");
    const [date, setDate] = useState("");

    const [showToast, setShowToast] = useState(false);

    // Filter members based on group
    const filteredMembers = data.members.filter(
        (m) => !groupId || m.groupId === parseInt(groupId)
    );

    // When product selected → load interest rate automatically
    const handleProductChange = (id) => {
        setProductId(id);

        const product = data.loanProducts.find((p) => p.id === parseInt(id));

        if (product) {
            setInterest(product.interestRate);
        }
    };

    // Auto-calculate EMI
    const calculateEMI = (loanAmount, rate, months) => {
        if (!loanAmount || !rate || !months) return "";

        const monthlyRate = rate / (12 * 100);
        const emiValue =
            (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);

        return Math.round(emiValue);
    };

    // Update EMI dynamically whenever amount/interest/tenor changes
    const updateEMI = (newAmount, newInterest, newTenor) => {
        const result = calculateEMI(newAmount, newInterest, newTenor);
        setEmi(result);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();

        const newLoanIssue = {
            id: Date.now(),
            groupId: parseInt(groupId),
            memberId: parseInt(memberId),
            productId: parseInt(productId),
            amount: parseFloat(amount),
            interestRate: parseFloat(interest),
            tenor: parseInt(tenor),
            emi: parseInt(emi),
            purpose,
            issuedDate: date,
            status: "approved",
        };

        addItem("loans", newLoanIssue);

        setShowToast(true);

        // Clear inputs
        setGroupId("");
        setMemberId("");
        setProductId("");
        setAmount("");
        setInterest("");
        setTenor("");
        setEmi("");
        setPurpose("");
        setDate("");
    };

    return (
        <div>
            {/* TITLE */}
            <div className="mb-3">
                <h4 className="fw-bold mb-0">Loan Issue</h4>
            </div>

            {/* CARD */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    {/* Toast */}
                    <ToastContainer position="top-end" className="p-3">
                        <Toast
                            bg="success"
                            show={showToast}
                            autohide
                            delay={2000}
                            onClose={() => setShowToast(false)}
                        >
                            <Toast.Body className="text-white fw-bold">
                                Loan Issued Successfully!
                            </Toast.Body>
                        </Toast>
                    </ToastContainer>

                    <Form onSubmit={handleSubmit}>
                        {/* ---------------- ROW 1 — Group / Member / Product ---------------- */}
                        <Row className="g-3 mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Group</Form.Label>
                                    <Form.Select
                                        value={groupId}
                                        onChange={(e) => {
                                            setGroupId(e.target.value);
                                            setMemberId("");
                                        }}
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {data.shgGroups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Member</Form.Label>
                                    <Form.Select
                                        value={memberId}
                                        onChange={(e) => setMemberId(e.target.value)}
                                        disabled={!groupId}
                                        required
                                    >
                                        <option value="">Select Member</option>
                                        {filteredMembers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Loan Product</Form.Label>
                                    <Form.Select
                                        value={productId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {data.loanProducts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- ROW 2 — Amount / Interest / Tenor ---------------- */}
                        <Row className="g-3 mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Loan Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            updateEMI(e.target.value, interest, tenor);
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Interest (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={interest}
                                        readOnly
                                        style={{ backgroundColor: '#f8f9fa' }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Tenor (Months)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Months"
                                        value={tenor}
                                        onChange={(e) => {
                                            setTenor(e.target.value);
                                            updateEMI(amount, interest, e.target.value);
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- ROW 3 — EMI / Purpose / Issue Date ---------------- */}
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">EMI</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={emi}
                                        readOnly
                                        style={{ backgroundColor: '#f8f9fa' }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Purpose</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Purpose"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Issue Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ---------------- SUBMIT BUTTON ---------------- */}
                        <div className="text-end">
                            <Button
                                type="submit"
                                variant="primary"
                                className="px-4"
                            >
                                Issue Loan
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
