import { useApp } from '../context/AppContext';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useState } from 'react';

export default function ResetData() {
    const { resetData } = useApp();
    const [message, setMessage] = useState('');

    const handleReset = () => {
        resetData();
        setMessage('Data has been reset successfully! Please refresh the page and try logging in again.');
    };

    return (
        <Container className="min-vh-100 d-flex align-items-center justify-content-center">
            <Card className="shadow-lg p-4" style={{ maxWidth: '500px' }}>
                <Card.Body>
                    <h3 className="mb-4 text-center">Reset Application Data</h3>

                    {message && (
                        <Alert variant="success" className="mb-4">
                            {message}
                        </Alert>
                    )}

                    <p className="text-muted mb-4">
                        If you're experiencing login issues, click the button below to reset the application data to its initial state.
                        This will clear all cached data and reload the default settings.
                    </p>

                    <Button
                        variant="danger"
                        size="lg"
                        className="w-100"
                        onClick={handleReset}
                    >
                        Reset Data
                    </Button>

                    <div className="mt-4 text-center">
                        <a href="/" className="text-decoration-none">
                            ← Back to Login
                        </a>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}
