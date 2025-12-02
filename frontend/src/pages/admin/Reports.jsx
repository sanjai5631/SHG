import { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { useApp } from '../../context/AppContext';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaChartBar, FaChartLine } from 'react-icons/fa';

// Import Report Components
import MemberwiseReport from './reports/MemberwiseReport';
import DaywiseReport from './reports/OverallReport';
import MonthlyReport from './reports/MonthlyReport';
import AnnualReport from './reports/AnnualReport';

export default function Reports() {
    const { data } = useApp();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [reportType, setReportType] = useState('memberwise'); // Default to memberwise

    // Read report type from URL query parameter or path
    useEffect(() => {
        const type = searchParams.get('type');
        let newReportType = reportType;

        if (type && ['memberwise', 'daywise', 'monthly', 'annual'].includes(type)) {
            newReportType = type;
        } else {
            // Check path
            if (location.pathname.includes('memberwise-report')) newReportType = 'memberwise';
            else if (location.pathname.includes('daywise-report')) newReportType = 'daywise';
            else if (location.pathname.includes('monthly-report')) newReportType = 'monthly';
            else if (location.pathname.includes('annual-report')) newReportType = 'annual';
        }

        // Only update state if the value has actually changed
        if (newReportType !== reportType) {
            setReportType(newReportType);
        }
    }, [searchParams, location.pathname, reportType]);

    const renderReportContent = () => {
        switch (reportType) {
            case 'memberwise':
                return <MemberwiseReport data={data} />;
            case 'daywise':
                return <DaywiseReport data={data} />;
            case 'monthly':
                return <MonthlyReport data={data} />;
            case 'annual':
                return <AnnualReport data={data} />;
            default:
                return (
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center py-5">
                            <div className="mb-3 opacity-25">
                                <FaChartBar size={60} />
                            </div>
                            <h5 className="text-muted mb-2">Select a Report Type</h5>
                            <p className="text-muted small mb-0">Choose a report type from the dropdown above to get started</p>
                        </Card.Body>
                    </Card>
                );
        }
    };

    return (
        <div className="fade-in">
            {/* Excel Table Styles */}
            <style>{`
                .excel-table {
                    border: 1px solid #d1d5db;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .excel-table thead th {
                    background-color: #f8f9fa;
                    border-bottom: 2px solid #d1d5db;
                    border-right: 1px solid #e5e7eb;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 0.85rem;
                    padding: 12px;
                    vertical-align: middle;
                }
                .excel-table tbody td {
                    border-bottom: 1px solid #e5e7eb;
                    border-right: 1px solid #e5e7eb;
                    padding: 10px 12px;
                    font-size: 0.9rem;
                    color: #1f2937;
                    vertical-align: middle;
                }
                .excel-table tbody tr:hover {
                    background-color: #f3f4f6;
                }
                .excel-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .excel-header {
                    background-color: #107c41;
                    color: white;
                    padding: 8px 16px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    border-radius: 4px 4px 0 0;
                }
            `}</style>

            {renderReportContent()}
        </div>
    );
}
