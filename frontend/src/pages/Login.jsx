import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
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
            // Simulate network delay
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
        <>
            <style>{`
                body { overflow: hidden; }
                .login-page { height: 100vh; max-height: 100vh; background: white; overflow: hidden; }
                .login-page .h-100 { height: 100vh; max-height: 100vh; }
                .login-page .container-fluid { padding: 0; overflow: hidden; height: 100vh; max-height: 100vh; }
                .login-left { background: linear-gradient(135deg, #2dd4bf 0%, #10b981 50%, #059669 100%); align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 30px 20px; }
                .login-left::before { content: ''; position: absolute; bottom: -50%; right: -20%; width: 80%; height: 80%; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: rotate(-15deg); }
                .illustration-container { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 20px; max-width: 100%; }
                .brand-logo { animation: fadeInDown 0.8s ease-out; }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
                .logo-icon { font-size: 50px; animation: bounce 2s ease-in-out infinite; }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .brand-name { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); letter-spacing: 1px; font-size: 2.5rem; }
                .brand-tagline { opacity: 0.95; font-size: 0.9rem; }
                .phone-frame { width: 200px; height: 400px; background: #1e293b; border-radius: 30px; padding: 8px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); position: relative; animation: float 3s ease-in-out infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
                .phone-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 90px; height: 20px; background: #1e293b; border-radius: 0 0 15px 15px; z-index: 3; }
                .phone-screen { width: 100%; height: 100%; background: linear-gradient(180deg, #34d399 0%, #10b981 100%); border-radius: 24px; display: flex; align-items: center; justify-content: center; }
                .person-in-phone { display: flex; flex-direction: column; align-items: center; animation: personFloat 2s ease-in-out infinite; }
                @keyframes personFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                .person-head { width: 50px; height: 50px; background: #fbbf24; border-radius: 50%; margin-bottom: 6px; }
                .person-body { width: 65px; height: 80px; background: white; border-radius: 15px 15px 0 0; position: relative; }
                .tie { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 25px solid #dc2626; }
                .person-legs { display: flex; gap: 6px; }
                .leg { width: 24px; height: 50px; background: #475569; border-radius: 0 0 6px 6px; }
                .leaf { position: absolute; font-size: 30px; animation: leafFloat 4s ease-in-out infinite; }
                .leaf-1 { top: 15%; left: 10%; }
                .leaf-2 { top: 25%; left: 20%; animation-delay: 1s; }
                @keyframes leafFloat { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(8px, -8px) rotate(5deg); } 50% { transform: translate(-4px, -15px) rotate(-5deg); } 75% { transform: translate(4px, -8px) rotate(3deg); } }
                .login-right { padding: 20px 15px; overflow: hidden; display: flex; align-items: center; }
                .login-form-wrapper { max-width: 450px; width: 100%; margin: 0 auto; animation: slideIn 0.6s ease-out; }
                @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
                .login-card { border-radius: 20px !important; }
                .mobile-brand-name { background: linear-gradient(135deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .mobile-logo-icon { font-size: 45px; }
                .user-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }
                .user-avatar svg { width: 40px; height: 40px; }
                .welcome-title { font-size: 1.75rem; }
                .welcome-subtitle { font-size: 0.9rem; }
                .input-icon { top: 50%; left: 16px; transform: translateY(-50%); color: #10b981; pointer-events: none; z-index: 5; }
                .form-input-custom { padding: 12px 16px 12px 46px !important; border: 2px solid #e5e7eb !important; border-radius: 10px !important; background: #f9fafb !important; transition: all 0.3s ease !important; font-size: 14px !important; }
                .form-input-custom:focus { background: white !important; border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important; }
                .password-toggle { top: 50%; right: 16px; transform: translateY(-50%); color: #6b7280; cursor: pointer; z-index: 5; padding: 4px; transition: all 0.2s ease; }
                .password-toggle:hover { color: #10b981; transform: translateY(-50%) scale(1.1); }
                .login-btn { background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; border: none !important; border-radius: 10px !important; letter-spacing: 0.5px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25) !important; transition: all 0.3s ease !important; font-size: 15px !important; padding: 14px !important; }
                .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(16, 185, 129, 0.35) !important; }
                .login-btn:active:not(:disabled) { transform: translateY(0); }
                .demo-btn { border-radius: 10px !important; transition: all 0.3s ease !important; border: 2px solid #e5e7eb !important; padding: 10px !important; }
                .demo-btn:hover:not(:disabled) { border-color: #10b981 !important; color: #10b981 !important; background-color: #f0fdf4 !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15) !important; }
                .demo-icon { font-size: 20px; }
                .login-card .card-body { padding: 2rem 1.5rem !important; }
                .login-footer { margin-top: 1.5rem; padding-top: 1rem; }
                .demo-section { margin-top: 1.5rem; padding-top: 1.5rem; }
                * { max-width: 100%; }
                .row { margin-left: 0 !important; margin-right: 0 !important; }
                .col, [class*="col-"] { padding-left: 0 !important; padding-right: 0 !important; }

                /* Large Desktop (1920px+) */
                @media (min-width: 1920px) {
                    .brand-name { font-size: 3.5rem; }
                    .brand-tagline { font-size: 1.2rem; }
                    .logo-icon { font-size: 70px; }
                    .phone-frame { width: 260px; height: 520px; }
                    .welcome-title { font-size: 2.25rem; }
                }

                /* Desktop (1200px - 1919px) */
                @media (min-width: 1200px) and (max-width: 1919px) {
                    .brand-name { font-size: 3rem; }
                    .phone-frame { width: 220px; height: 440px; }
                    .welcome-title { font-size: 2rem; }
                }

                /* Tablet Landscape & Small Desktop (992px - 1199px) */
                @media (min-width: 992px) and (max-width: 1199px) {
                    .brand-name { font-size: 2.5rem; }
                    .phone-frame { width: 200px; height: 400px; }
                    .login-card .card-body { padding: 1.75rem 1.5rem !important; }
                }

                /* Tablet Portrait (768px - 991px) */
                @media (max-width: 991.98px) { 
                    .login-right { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px 15px; } 
                    .brand-name { font-size: 2.2rem; }
                    .login-card .card-body { padding: 1.75rem 1.25rem !important; }
                }

                /* Mobile Landscape & Small Tablet (576px - 767px) */
                @media (max-width: 767.98px) { 
                    .login-right { padding: 15px; } 
                    .login-card .card-body { padding: 1.5rem 1rem !important; } 
                    .welcome-title { font-size: 1.5rem; }
                    .user-avatar { width: 70px; height: 70px; }
                    .user-avatar svg { width: 35px; height: 35px; }
                    .demo-section { margin-top: 1.25rem; padding-top: 1.25rem; }
                    .login-footer { margin-top: 1.25rem; }
                }

                /* Mobile Portrait (up to 575px) */
                @media (max-width: 575.98px) { 
                    .login-card { box-shadow: none !important; background: transparent !important; } 
                    .login-card .card-body { padding: 1.25rem 0.75rem !important; } 
                    .welcome-title { font-size: 1.35rem; } 
                    .welcome-subtitle { font-size: 0.85rem; }
                    .mobile-logo-icon { font-size: 40px; } 
                    .form-input-custom { padding: 11px 14px 11px 42px !important; font-size: 13px !important; } 
                    .input-icon { left: 14px; } 
                    .password-toggle { right: 14px; }
                    .demo-section { margin-top: 1rem; padding-top: 1rem; }
                    .login-footer { margin-top: 1rem; padding-top: 0.75rem; }
                    .login-btn { padding: 12px !important; }
                }

                /* Small Mobile (up to 380px) */
                @media (max-width: 380px) { 
                    .welcome-title { font-size: 1.2rem; }
                    .welcome-subtitle { font-size: 0.8rem; }
                    .login-btn { padding: 11px !important; font-size: 14px !important; }
                    .user-avatar { width: 65px; height: 65px; }
                    .user-avatar svg { width: 32px; height: 32px; }
                    .mobile-logo-icon { font-size: 35px; }
                    .demo-icon { font-size: 18px; }
                    .form-input-custom { padding: 10px 12px 10px 38px !important; font-size: 12px !important; }
                }

                /* Extra Small Mobile (up to 320px) */
                @media (max-width: 320px) {
                    .welcome-title { font-size: 1.1rem; }
                    .login-card .card-body { padding: 1rem 0.5rem !important; }
                    .user-avatar { width: 60px; height: 60px; }
                    .user-avatar svg { width: 30px; height: 30px; }
                    .demo-btn { padding: 8px !important; font-size: 12px !important; }
                }

                /* Landscape orientation handling */
                @media (max-height: 600px) and (orientation: landscape) {
                    .login-left { padding: 15px 10px; }
                    .illustration-container { gap: 10px; }
                    .brand-name { font-size: 1.75rem; }
                    .brand-tagline { font-size: 0.75rem; }
                    .logo-icon { font-size: 35px; }
                    .phone-frame { width: 150px; height: 300px; }
                    .login-right { padding: 10px; }
                    .login-card .card-body { padding: 1rem 0.75rem !important; }
                    .user-avatar { width: 50px; height: 50px; }
                    .user-avatar svg { width: 25px; height: 25px; }
                    .welcome-title { font-size: 1.25rem; }
                    .welcome-subtitle { font-size: 0.75rem; }
                    .demo-section { margin-top: 0.75rem; padding-top: 0.75rem; }
                    .login-footer { margin-top: 0.75rem; padding-top: 0.5rem; }
                }

                /* Very short screens */
                @media (max-height: 500px) {
                    .login-right { align-items: flex-start; padding-top: 10px; padding-bottom: 10px; }
                    .mobile-brand { margin-bottom: 0.5rem !important; }
                    .user-avatar { margin-bottom: 0.5rem !important; }
                }
            `}</style>

            <div className="login-page">
                <Container fluid className="h-100">
                    <Row className="h-100 g-0">
                        <Col lg={6} className="login-left d-none d-lg-flex">
                            <div className="illustration-container">
                                <div className="brand-logo text-center text-white mb-5">
                                    <div className="logo-icon mb-3">🌱</div>
                                    <h2 className="brand-name display-3 fw-bold mb-2">Bosco SHG</h2>
                                    <p className="brand-tagline fs-5">Empowering Communities Together</p>
                                </div>
                                <div className="phone-frame">
                                    <div className="phone-notch"></div>
                                    <div className="phone-screen">
                                        <div className="person-in-phone">
                                            <div className="person-head"></div>
                                            <div className="person-body">
                                                <div className="tie"></div>
                                            </div>
                                            <div className="person-legs">
                                                <div className="leg left"></div>
                                                <div className="leg right"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="leaf leaf-1">🌿</div>
                                <div className="leaf leaf-2">🍃</div>
                            </div>
                        </Col>

                        <Col lg={6} className="login-right d-flex align-items-center justify-content-center">
                            <div className="login-form-wrapper w-100">
                                <Card className="login-card border-0 shadow-lg">
                                    <Card.Body className="p-4 p-md-5">
                                        <div className="mobile-brand text-center mb-4 d-lg-none">
                                            <div className="mobile-logo-icon mb-2">🌱</div>
                                            <h2 className="mobile-brand-name h3 fw-bold">Bosco SHG</h2>
                                        </div>

                                        <div className="user-avatar mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                            </svg>
                                        </div>

                                        <h1 className="welcome-title text-center h2 fw-bold mb-2">Welcome Back!</h1>
                                        <p className="welcome-subtitle text-center text-muted mb-4">Sign in to continue to Bosco SHG</p>

                                        {error && (
                                            <Alert variant="danger" className="d-flex align-items-center">
                                                <span className="me-2">⚠️</span> {error}
                                            </Alert>
                                        )}

                                        <Form onSubmit={handleSubmit}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold small">Email Address</Form.Label>
                                                <div className="position-relative">
                                                    <svg className="input-icon position-absolute" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                                                    </svg>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your email"
                                                        required
                                                        className="form-input-custom ps-5"
                                                    />
                                                </div>
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-semibold small">Password</Form.Label>
                                                <div className="position-relative">
                                                    <svg className="input-icon position-absolute" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                                                    </svg>
                                                    <Form.Control
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Enter your password"
                                                        required
                                                        className="form-input-custom ps-5"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle position-absolute border-0 bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
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

                                            <div className="text-end mb-3">
                                                <Button
                                                    variant="link"
                                                    className="text-success p-0 text-decoration-none small fw-semibold"
                                                    onClick={handleResetData}
                                                >
                                                    Forgot Password?
                                                </Button>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-100 login-btn py-3 fw-bold"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    'Sign In'
                                                )}
                                            </Button>

                                            <div className="demo-section mt-4 pt-4 border-top">
                                                <p className="text-center text-muted small text-uppercase fw-semibold mb-3">Quick Access (Demo)</p>
                                                <Row className="g-3">
                                                    <Col xs={12} sm={6}>
                                                        <Button
                                                            variant="outline-secondary"
                                                            className="w-100 demo-btn py-3"
                                                            onClick={() => quickLogin('admin@microfund.com', 'admin123')}
                                                            disabled={loading}
                                                        >
                                                            <div className="demo-icon mb-1">👨‍💼</div>
                                                            <div className="fw-semibold">Admin</div>
                                                        </Button>
                                                    </Col>
                                                    <Col xs={12} sm={6}>
                                                        <Button
                                                            variant="outline-secondary"
                                                            className="w-100 demo-btn py-3"
                                                            onClick={() => quickLogin('sunita@example.com', 'member123')}
                                                            disabled={loading}
                                                        >
                                                            <div className="demo-icon mb-1">👩‍🌾</div>
                                                            <div className="fw-semibold">Member</div>
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Form>

                                        <div className="login-footer text-center mt-4 pt-3 border-top">
                                            <p className="text-muted small mb-0">© 2024 Bosco SHG. All rights reserved.</p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}
