import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

export default function SHGLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useApp();

    const [expanded, setExpanded] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/shg', label: 'Dashboard', icon: '📊' },
        { path: '/shg/savings', label: 'Savings Management', icon: '💰' },
        { path: '/shg/loans', label: 'Loan Management', icon: '💳' },
        { path: '/shg/collections', label: 'Collection & Payment', icon: '💵' },
        { path: '/shg/meetings', label: 'Meeting Summary', icon: '📝' }
    ];

    return (
        <div className="d-flex flex-column min-vh-100">

            {/* FULL TOP NAVBAR */}
            <Navbar
                bg="white"
                expand="lg"
                expanded={expanded}
                className="border-bottom shadow-sm sticky-top px-3 px-lg-4"
            >
                {/* Brand */}
                <Navbar.Brand as={Link} to="/shg" className="fw-bold text-gradient fs-4">
                    MicroFund
                </Navbar.Brand>

                {/* Mobile Toggle */}
                <Navbar.Toggle
                    aria-controls="shg-navbar"
                    onClick={() => setExpanded(!expanded)}
                />

                <Navbar.Collapse id="shg-navbar">

                    {/* Horizontal Menu */}
                    <Nav className="me-auto mt-2 mt-lg-0">
                        {navItems.map((item) => (
                            <Nav.Link
                                key={item.path}
                                as={Link}
                                to={item.path}
                                onClick={() => setExpanded(false)}
                                className={`px-3 py-2 rounded-3 me-2 ${
                                    isActive(item.path)
                                        ? 'bg-success text-white'
                                        : 'text-dark'
                                }`}
                            >
                                <span className="me-2">{item.icon}</span>
                                {item.label}
                            </Nav.Link>
                        ))}
                    </Nav>

                    {/* User Profile */}
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            className="text-decoration-none text-dark p-0"
                        >
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    <span className="fw-semibold">
                                        {currentUser?.name?.charAt(0) || 'S'}
                                    </span>
                                </div>
                                <div className="d-none d-md-block text-start">
                                    <div className="fw-semibold small">
                                        {currentUser?.name || 'SHG Member'}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        SHG Team Member
                                    </div>
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item disabled>
                                <div className="small">
                                    <div className="fw-semibold">{currentUser?.name}</div>
                                    <div className="text-muted">{currentUser?.email}</div>
                                </div>
                            </Dropdown.Item>

                            <Dropdown.Divider />

                            <Dropdown.Item
                                onClick={handleLogout}
                                className="text-danger"
                            >
                                🚪 Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Navbar.Collapse>
            </Navbar>

            {/* PAGE CONTENT */}
            <div className="flex-grow-1 overflow-auto">
                <Container fluid className="p-3 p-lg-4">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
}
