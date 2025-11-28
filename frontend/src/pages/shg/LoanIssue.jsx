import React from 'react';
import { Card } from 'react-bootstrap';

export default function LoanIssue() {
    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="h2 fw-bold mb-1">Loan Issue</h1>
                <p className="text-muted mb-0">Process and issue approved loans</p>
            </div>

            <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                    <div className="display-1 mb-3">💸</div>
                    <h3 className="fw-bold">Under Development</h3>
                    <p className="text-muted">This feature is coming soon.</p>
                </Card.Body>
            </Card>
        </div>
    );
}
