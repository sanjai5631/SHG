import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useApp } from '../context/AppContext';
import LogoutIcon from '../components/Icons/LogoutIcon';

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
    const isDropdownActive = (paths) => paths.some(path => location.pathname.startsWith(path));

    return (
        <div className="d-flex flex-column min-vh-100">

            {/* TOP HEADER (Brand + User) */}
            <div className="bg-white py-2 py-md-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center">
                <Link to="/shg" className="text-decoration-none">
                    <div className="d-flex flex-column">
                        <span className="fw-bold text-dark h5 h4-md mb-0" style={{ letterSpacing: '1px', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>MICROFUND</span>
                        <span className="text-muted small d-none d-sm-block" style={{ fontSize: '0.7rem', letterSpacing: '2px' }}></span>
                    </div>
                </Link>

                <div className="d-flex align-items-center gap-2 gap-md-3">
                    <Dropdown align="end" style={{ zIndex: 1050 }}>
                        <Dropdown.Toggle variant="link" className="text-dark p-0 text-decoration-none" id="user-dropdown">
                            <div className="d-flex align-items-center gap-1 gap-md-2">
                                <div className="d-none d-md-block text-end">
                                    <div className="fw-semibold small">{currentUser?.name || 'User'}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>SHG Team Member</div>
                                </div>
                                <div className="rounded-circle border d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                    <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{currentUser?.name?.charAt(0) || 'U'}</span>
                                </div>
                            </div>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={handleLogout} className="text-danger">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="red"
                                    className="me-2"
                                    viewBox="0 0 16 16"
                                    style={{ marginBottom: '2px' }}
                                >
                                    <path d="M7.5 1v7h1V1h-1z" />
                                    <path d="M3 8.812a4.999 4.999 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812z" />
                                </svg>
                                Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            {/* MAIN NAVBAR (Dark) */}
            <Navbar
                expand="lg"
                className="px-0 py-0 sticky-top"
                style={{ backgroundColor: '#1a1a2e', minHeight: '50px' }}
                expanded={expanded}
            >
                <Container fluid className="px-4">
                    <Navbar.Toggle
                        aria-controls="shg-navbar"
                        onClick={() => setExpanded(!expanded)}
                        className="bg-light my-2"
                    />

                    <Navbar.Collapse id="shg-navbar">
                        <Nav className="me-auto">
                            {/* Dashboard */}
                            <Nav.Link
                                as={Link}
                                to="/shg"
                                onClick={() => setExpanded(false)}
                                className="px-4 py-3 text-uppercase fw-bold small text-white"
                                style={{
                                    fontSize: '0.8rem',
                                    letterSpacing: '1px',
                                    borderRadius: 0,
                                    borderBottom: (isActive('/shg') && location.pathname === '/shg') ? '3px solid white' : '3px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!(isActive('/shg') && location.pathname === '/shg')) {
                                        e.currentTarget.style.color = '#f0c040';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!(isActive('/shg') && location.pathname === '/shg')) {
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                            >
                                Dashboard
                            </Nav.Link>

                            {/* Collection Dropdown */}
                            <Dropdown as={Nav.Item}>
                                <Dropdown.Toggle
                                    as={Nav.Link}
                                    className="px-4 py-3 text-uppercase fw-bold small text-white"
                                    style={{
                                        fontSize: '0.8rem',
                                        letterSpacing: '1px',
                                        borderRadius: 0,
                                        borderBottom: isDropdownActive(['/shg/savings', '/shg/collection-loan', '/shg/collection-memberwise', '/shg/assign-collector']) ? '3px solid white' : '3px solid transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDropdownActive(['/shg/savings', '/shg/collection-loan', '/shg/collection-memberwise', '/shg/assign-collector'])) {
                                            e.currentTarget.style.color = '#f0c040';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDropdownActive(['/shg/savings', '/shg/collection-loan', '/shg/collection-memberwise', '/shg/assign-collector'])) {
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                >
                                    Collection
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to="/shg/savings" onClick={() => setExpanded(false)}>Savings</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/collection-loan" onClick={() => setExpanded(false)}>Loan</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/collection-memberwise" onClick={() => setExpanded(false)}>Memberwise</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/assign-collector" onClick={() => setExpanded(false)}>Assign Collector</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Loan Dropdown */}
                            <Dropdown as={Nav.Item}>
                                <Dropdown.Toggle
                                    as={Nav.Link}
                                    className="px-4 py-3 text-uppercase fw-bold small text-white"
                                    style={{
                                        fontSize: '0.8rem',
                                        letterSpacing: '1px',
                                        borderRadius: 0,
                                        borderBottom: isDropdownActive(['/shg/repayment-schedule', '/shg/loan-request', '/shg/loan-issue']) ? '3px solid white' : '3px solid transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDropdownActive(['/shg/repayment-schedule', '/shg/loan-request', '/shg/loan-issue'])) {
                                            e.currentTarget.style.color = '#f0c040';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDropdownActive(['/shg/repayment-schedule', '/shg/loan-request', '/shg/loan-issue'])) {
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                >
                                    Loan
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to="/shg/repayment-schedule" onClick={() => setExpanded(false)}>Repayment Schedule</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/loan-request" onClick={() => setExpanded(false)}>Loan Request</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/loan-issue" onClick={() => setExpanded(false)}>Loan Issue</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Report Dropdown */}
                            <Dropdown as={Nav.Item}>
                                <Dropdown.Toggle
                                    as={Nav.Link}
                                    className="px-4 py-3 text-uppercase fw-bold small text-white"
                                    style={{
                                        fontSize: '0.8rem',
                                        letterSpacing: '1px',
                                        borderRadius: 0,
                                        borderBottom: isDropdownActive(['/shg/memberwise-report', '/shg/daywise-report', '/shg/monthly-report', '/shg/annual-report']) ? '3px solid white' : '3px solid transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDropdownActive(['/shg/memberwise-report', '/shg/daywise-report', '/shg/monthly-report', '/shg/annual-report'])) {
                                            e.currentTarget.style.color = '#f0c040';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDropdownActive(['/shg/memberwise-report', '/shg/daywise-report', '/shg/monthly-report', '/shg/annual-report'])) {
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                >
                                    Report
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to="/shg/memberwise-report" onClick={() => setExpanded(false)}>Memberwise Report</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/daywise-report" onClick={() => setExpanded(false)}>Daywise Report</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/monthly-report" onClick={() => setExpanded(false)}>Monthly Report</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/shg/annual-report" onClick={() => setExpanded(false)}>Annual Report</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* PAGE CONTENT */}
            <div className="flex-grow-1 overflow-auto bg-light">
                <Container fluid className="p-4">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
}
