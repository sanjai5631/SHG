import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useApp();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Simulate network delay for better UX feel
            await new Promise(resolve => setTimeout(resolve, 800));

            const user = login(formData.email, formData.password);

            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'shg_member') {
                    navigate('/shg');
                }
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (email, password) => {
        setFormData({ email, password });
        const user = login(email, password);
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'shg_member') {
                navigate('/shg');
            }
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center bg-light">
            <Container fluid className="p-0 h-100">
                <Row className="g-0 h-100 min-vh-100">
                    {/* Left Side - Branding */}
                    <Col md={6} lg={7} className="d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5 position-relative overflow-hidden" style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    }}>
                        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)',
                            opacity: 0.6
                        }}></div>

                        <div className="position-relative z-1 text-center slide-up">
                            <div className="mb-4 d-inline-block p-3 rounded-circle bg-white bg-opacity-25 backdrop-blur">
                                <span className="fs-1">🌱</span>
                            </div>
                            <h1 className="display-3 fw-bold mb-3">MicroFund</h1>
                            <p className="fs-4 fw-light opacity-75 mb-5" style={{ maxWidth: '500px' }}>
                                Empowering communities through transparent and efficient financial management.
                            </p>

                            <div className="d-flex gap-4 justify-content-center opacity-50">
                                <div className="text-center">
                                    <div className="h3 fw-bold mb-0">50+</div>
                                    <small>Active Groups</small>
                                </div>
                                <div className="vr bg-white"></div>
                                <div className="text-center">
                                    <div className="h3 fw-bold mb-0">₹25L+</div>
                                    <small>Total Savings</small>
                                </div>
                                <div className="vr bg-white"></div>
                                <div className="text-center">
                                    <div className="h3 fw-bold mb-0">100%</div>
                                    <small>Transparency</small>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Right Side - Login Form */}
                    <Col md={6} lg={5} className="d-flex align-items-center justify-content-center bg-white p-4 p-md-5">
                        <div className="w-100 slide-up" style={{ maxWidth: '450px', animationDelay: '0.1s' }}>
                            <div className="text-center mb-5 d-md-none">
                                <h1 className="fw-bold text-primary">MicroFund</h1>
                                <p className="text-muted">SHG Management System</p>
                            </div>

                            <div className="mb-4">
                                <h2 className="fw-bold mb-1">Welcome Back! 👋</h2>
                                <p className="text-muted">Please sign in to your account</p>
                            </div>

                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError('')} className="border-0 shadow-sm">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2">⚠️</span>
                                        {error}
                                    </div>
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium">Email Address</Form.Label>
                                    <InputGroup size="lg">
                                        <InputGroup.Text className="bg-light border-end-0 text-muted">✉️</InputGroup.Text>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="name@example.com"
                                            required
                                            className="border-start-0 bg-light"
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium">Password</Form.Label>
                                    <InputGroup size="lg">
                                        <InputGroup.Text className="bg-light border-end-0 text-muted">🔒</InputGroup.Text>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            required
                                            className="border-start-0 bg-light"
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="lg"
                                    className="w-100 mb-4 shadow-sm"
                                    disabled={loading}
                                    style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', border: 'none' }}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>

                                <div className="position-relative mb-4">
                                    <hr className="text-muted opacity-25" />
                                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                                        Quick Access (Demo)
                                    </span>
                                </div>

                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Button
                                            variant="outline-light"
                                            className="w-100 text-dark border-2 d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => quickLogin('admin@microfund.com', 'admin123')}
                                        >
                                            <span>👨‍💼</span> Admin
                                        </Button>
                                    </Col>
                                    <Col xs={6}>
                                        <Button
                                            variant="outline-light"
                                            className="w-100 text-dark border-2 d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => quickLogin('priya@microfund.com', 'priya123')}
                                        >
                                            <span>👩‍🌾</span> Member
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>

                            <div className="text-center mt-5 text-muted small">
                                &copy; 2024 MicroFund. Secure & Transparent.
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
