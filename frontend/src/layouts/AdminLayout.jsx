import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";
import { useApp } from "../context/AppContext";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useApp();
    const [expanded, setExpanded] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;
    const isReportsActive = () => location.pathname.startsWith('/admin/reports');

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: "📊" },
        { path: "/admin/users", label: "User Management", icon: "👥" },
        { path: "/admin/support-data", label: "Support Data", icon: "📋" },
        { path: "/admin/shg-groups", label: "SHG Groups", icon: "🏘️" }
    ];

    const reportItems = [
        { path: "/admin/reports?type=memberwise", label: "Memberwise Report", icon: "👥" },
        { path: "/admin/reports?type=daywise", label: "Daywise Report", icon: "📅" },
        { path: "/admin/reports?type=monthly", label: "Monthly Report", icon: "📊" },
        { path: "/admin/reports?type=annual", label: "Annual Report", icon: "📈" }
    ];

    return (
        <div className="d-flex flex-column min-vh-100">

            {/* TOP NAVBAR */}
            <Navbar
                bg="white"
                expand="lg"
                expanded={expanded}
                className="border-bottom shadow-sm sticky-top px-3 px-lg-4"
            >
                <Navbar.Brand
                    as={Link}
                    to="/admin"
                    className="fw-bold text-gradient fs-4"
                >
                    MicroFund
                </Navbar.Brand>

                <Navbar.Toggle
                    aria-controls="admin-navbar"
                    onClick={() => setExpanded(!expanded)}
                />

                <Navbar.Collapse id="admin-navbar">

                    {/* Navigation Menu */}
                    <Nav className="me-auto mt-2 mt-lg-0">
                        {navItems.map((item) => (
                            <Nav.Link
                                key={item.path}
                                as={Link}
                                to={item.path}
                                onClick={() => setExpanded(false)}
                                className={`px-3 py-2 rounded-3 me-2 ${isActive(item.path)
                                        ? "bg-primary text-white"
                                        : "text-dark"
                                    }`}
                            >
                                <span className="me-2">{item.icon}</span>
                                {item.label}
                            </Nav.Link>
                        ))}

                        {/* Reports Dropdown */}
                        <Dropdown className="d-inline">
                            <Dropdown.Toggle
                                variant="link"
                                className={`px-3 py-2 rounded-3 me-2 text-decoration-none ${isReportsActive()
                                        ? "bg-primary text-white"
                                        : "text-dark"
                                    }`}
                                style={{ border: 'none' }}
                            >
                                <span className="me-2">📑</span>
                                Reports
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {reportItems.map((item) => (
                                    <Dropdown.Item
                                        key={item.path}
                                        as={Link}
                                        to={item.path}
                                        onClick={() => setExpanded(false)}
                                    >
                                        <span className="me-2">{item.icon}</span>
                                        {item.label}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>

                    {/* User Dropdown */}
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            className="text-decoration-none text-dark p-0"
                        >
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: "40px", height: "40px" }}
                                >
                                    <span className="fw-semibold">
                                        {currentUser?.name?.charAt(0) || "A"}
                                    </span>
                                </div>

                                <div className="d-none d-md-block text-start">
                                    <div className="fw-semibold small">
                                        {currentUser?.name || "Admin"}
                                    </div>
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: "0.75rem" }}
                                    >
                                        Administrator
                                    </div>
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item disabled>
                                <div className="small">
                                    <div className="fw-semibold">
                                        {currentUser?.name}
                                    </div>
                                    <div className="text-muted">
                                        {currentUser?.email}
                                    </div>
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

            {/* MAIN CONTENT */}
            <div className="flex-grow-1 overflow-auto">
                <Container fluid className="p-3 p-lg-4">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
}
