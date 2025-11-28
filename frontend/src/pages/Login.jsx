import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

export default function Login() {
    const navigate = useNavigate();
    const { login, resetData } = useApp();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

            const response = login(formData.email, formData.password);

            if (response.success) {
                const user = response.user;
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'shg_member' || user.role === 'shg_team') {
                    navigate('/shg');
                }
            } else {
                setError(response.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = async (email, password) => {
        setError('');
        setLoading(true);
        setFormData({ email, password });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const response = login(email, password);
            if (response.success) {
                const user = response.user;
                if (user.role === 'admin') {
                    navigate('/admin');
                } else if (user.role === 'shg_member' || user.role === 'shg_team') {
                    navigate('/shg');
                }
            } else {
                setError(response.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleResetData = () => {
        if (window.confirm('This will reset all data to default. Are you sure?')) {
            resetData();
            setError('');
            setFormData({ email: '', password: '' });
            alert('Data has been reset! You can now login with the default credentials.');
            window.location.reload();
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center position-relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
            {/* Animated Background Circles */}
            <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 25%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 25%)',
                animation: 'pulse 4s ease-in-out infinite'
            }}></div>

            <Container fluid className="position-relative">
                <Row className="justify-content-center align-items-center min-vh-100 g-0">
                    {/* Left Side - Branding */}
                    <Col lg={6} className="d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-5">
                        <div className="text-center slide-up">
                            <div className="mb-4 d-inline-block p-4 rounded-circle" style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                            }}>
                                <span className="fs-1">🌱</span>
                            </div>
                            <h1 className="display-2 fw-bold mb-3" style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                letterSpacing: '-1px'
                            }}>MicroFund</h1>
                            <p className="fs-5 fw-light mb-5 opacity-90" style={{ maxWidth: '500px', lineHeight: '1.8' }}>
                                Empowering communities through transparent and efficient financial management.
                            </p>

                            {/* Stats */}
                            <div className="d-flex gap-5 justify-content-center mt-5">
                                <div className="text-center">
                                    <div className="h2 fw-bold mb-1">50+</div>
                                    <small className="opacity-75">Active Groups</small>
                                </div>
                                <div className="vr bg-white opacity-25"></div>
                                <div className="text-center">
                                    <div className="h2 fw-bold mb-1">₹25L+</div>
                                    <small className="opacity-75">Total Savings</small>
                                </div>
                                <div className="vr bg-white opacity-25"></div>
                                <div className="text-center">
                                    <div className="h2 fw-bold mb-1">100%</div>
                                    <small className="opacity-75">Transparency</small>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Right Side - Login Form */}
                    <Col lg={6} md={8} sm={10} xs={12} className="px-4 px-lg-5">
                        <div className="bg-white rounded-4 shadow-lg p-4 p-md-5 slide-up" style={{
                            maxWidth: '500px',
                            margin: '0 auto',
                            animationDelay: '0.2s'
                        }}>
                            {/* Mobile Logo */}
                            <div className="text-center mb-4 d-lg-none">
                                <h2 className="fw-bold" style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>MicroFund</h2>
                            </div>

                            {/* Welcome Header */}
                            <div className="mb-4">
                                <h3 className="fw-bold mb-2">Welcome Back! 👋</h3>
                                <p className="text-muted mb-0">Please sign in to your account</p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert
                                    variant="danger"
                                    dismissible
                                    onClose={() => setError('')}
                                    className="border-0 shadow-sm mb-4"
                                    style={{
                                        backgroundColor: '#fee',
                                        borderLeft: '4px solid #dc3545'
                                    }}
                                >
                                    <div className="d-flex align-items-center">
                                        <span className="me-2">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                </Alert>
                            )}

                            {/* Login Form */}
                            <Form onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium text-dark mb-2">Email Address</Form.Label>
                                    <div className="position-relative">
                                        <span className="position-absolute top-50 translate-middle-y ms-3 text-muted">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                                            </svg>
                                        </span>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="sunita@example.com"
                                            required
                                            className="ps-5 py-3 border-2"
                                            style={{
                                                borderRadius: '12px',
                                                backgroundColor: '#f8f9fa',
                                                border: '2px solid #e9ecef',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.backgroundColor = '#fff';
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(102, 126, 234, 0.15)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.backgroundColor = '#f8f9fa';
                                                e.target.style.borderColor = '#e9ecef';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                </Form.Group>

                                {/* Password Field */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium text-dark mb-2">Password</Form.Label>
                                    <div className="position-relative">
                                        <span className="position-absolute top-50 translate-middle-y ms-3 text-muted" style={{ zIndex: 5 }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                                            </svg>
                                        </span>
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            required
                                            className="ps-5 pe-5 py-3 border-2"
                                            style={{
                                                borderRadius: '12px',
                                                backgroundColor: '#f8f9fa',
                                                border: '2px solid #e9ecef',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.backgroundColor = '#fff';
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(102, 126, 234, 0.15)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.backgroundColor = '#f8f9fa';
                                                e.target.style.borderColor = '#e9ecef';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="position-absolute top-50 translate-middle-y end-0 me-3 border-0 bg-transparent text-muted"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ zIndex: 5 }}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                                                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                                                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </Form.Group>

                                {/* Sign In Button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-100 mb-4 border-0 fw-semibold py-3"
                                    disabled={loading}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                                    }}
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

                                {/* Divider */}
                                <div className="position-relative mb-4">
                                    <hr className="text-muted" style={{ opacity: 0.2 }} />
                                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                                        Quick Access (Demo)
                                    </span>
                                </div>

                                {/* Quick Access Buttons */}
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <Button
                                            variant="outline-secondary"
                                            className="w-100 py-3 border-2 fw-medium"
                                            onClick={() => quickLogin('admin@microfund.com', 'admin123')}
                                            disabled={loading}
                                            style={{
                                                borderRadius: '12px',
                                                transition: 'all 0.3s ease',
                                                borderColor: '#e9ecef'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#667eea';
                                                e.target.style.borderColor = '#667eea';
                                                e.target.style.color = '#fff';
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.borderColor = '#e9ecef';
                                                e.target.style.color = '#6c757d';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div className="d-flex flex-column align-items-center gap-1">
                                                <span style={{ fontSize: '1.5rem' }}>👨‍💼</span>
                                                <span className="small">Admin</span>
                                            </div>
                                        </Button>
                                    </Col>
                                    <Col xs={6}>
                                        <Button
                                            variant="outline-secondary"
                                            className="w-100 py-3 border-2 fw-medium"
                                            onClick={() => quickLogin('sunita@example.com', 'member123')}
                                            disabled={loading}
                                            style={{
                                                borderRadius: '12px',
                                                transition: 'all 0.3s ease',
                                                borderColor: '#e9ecef'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#764ba2';
                                                e.target.style.borderColor = '#764ba2';
                                                e.target.style.color = '#fff';
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.borderColor = '#e9ecef';
                                                e.target.style.color = '#6c757d';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div className="d-flex flex-column align-items-center gap-1">
                                                <span style={{ fontSize: '1.5rem' }}>👩‍🌾</span>
                                                <span className="small">Member</span>
                                            </div>
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>

                            {/* Footer */}
                            <div className="text-center mt-4 pt-3 border-top">
                                <p className="text-muted small mb-2">
                                    © 2024 MicroFund. Secure & Transparent.
                                </p>
                                <button
                                    onClick={handleResetData}
                                    className="btn btn-link btn-sm text-muted text-decoration-none p-0"
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    Having login issues? Reset Data
                                </button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>

            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.6;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                .slide-up {
                    animation: slide-up 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
