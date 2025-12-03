import React, { useState, useMemo, useCallback } from 'react';
import {
    FaChevronDown, FaChevronUp, FaAngleDoubleLeft, FaChevronLeft, FaChevronRight, FaAngleDoubleRight,
    FaSearch
} from 'react-icons/fa';
import { Form, Button, Table, InputGroup } from 'react-bootstrap';

// --- Icon Components for Sorting ---
const SortIcon = ({ sortDirection }) => {
    if (sortDirection === 'ascending') {
        return <FaChevronUp size={12} className="ms-1 text-primary" />;
    }
    if (sortDirection === 'descending') {
        return <FaChevronDown size={12} className="ms-1 text-primary" />;
    }
    return (
        <div className="ms-1 d-flex flex-column justify-content-center" style={{ opacity: 0.3 }}>
            <FaChevronUp size={8} />
            <FaChevronDown size={8} />
        </div>
    );
};

// --- Data Table Component ---

const DataTable = ({
    initialColumns,
    data,
    rowsPerPageOptions = [10, 25, 50],
    enableFilter = true,
    enableExport = true,
    enablePagination = true,
    enableSort = true,
    actionRenderer = null,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] || 10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // 1. Memoize Columns: Apply default sortable=true
    const columns = useMemo(() => {
        return initialColumns.map(col => ({
            ...col,
            sortable: enableSort ? (col.sortable !== undefined ? col.sortable : true) : false
        }));
    }, [initialColumns, enableSort]);

    // 2. Filter & Sort Data (Memoized)
    const sortedAndFilteredData = useMemo(() => {
        let sortableData = [...data];

        // --- Filtering (if enabled) ---
        if (enableFilter && searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            sortableData = sortableData.filter(row =>
                columns.some(col => {
                    const value = row[col.key];
                    return String(value).toLowerCase().includes(lowerCaseSearchTerm);
                })
            );
        }

        // --- Sorting (if enabled) ---
        if (enableSort && sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                // Ensure string comparison for generic keys
                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();

                if (aStr < bStr) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aStr > bStr) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        const newTotalPages = Math.ceil(sortableData.length / rowsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(Math.max(1, newTotalPages));
        }

        return sortableData;
    }, [data, enableFilter, searchTerm, enableSort, sortConfig, columns, rowsPerPage, currentPage]);

    // 3. Pagination Logic (Memoized)
    const totalItems = sortedAndFilteredData.length;
    const effectiveRowsPerPage = enablePagination ? rowsPerPage : totalItems;
    const totalPages = enablePagination ? Math.ceil(totalItems / effectiveRowsPerPage) : 1;
    const paginatedData = useMemo(() => {
        const startIndex = enablePagination ? (currentPage - 1) * rowsPerPage : 0;
        const endIndex = enablePagination ? startIndex + rowsPerPage : totalItems;
        return sortedAndFilteredData.slice(startIndex, endIndex);
    }, [sortedAndFilteredData, currentPage, rowsPerPage, enablePagination, totalItems]);

    // 4. Sorting Handler
    const handleSort = useCallback((key) => {
        if (!enableSort) return;

        setSortConfig(prevConfig => {
            let direction = 'ascending';
            if (prevConfig.key === key && prevConfig.direction === 'ascending') {
                direction = 'descending';
            } else if (prevConfig.key === key && prevConfig.direction === 'descending') {
                direction = 'ascending';
            }
            return { key, direction };
        });
    }, [enableSort]);

    // 5. Export Handlers
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Table</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
                    tr:nth-child(even) { background-color: #bbdefb; }
                    tr:nth-child(odd) { background-color: #ffffff; }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h2>Table Data</h2>
                <table>
                    <thead>
                        <tr>
                            ${actionRenderer ? '<th>Actions</th>' : ''}
                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedAndFilteredData.map(row => `
                            <tr>
                                ${actionRenderer ? '<td>-</td>' : ''}
                                ${columns.map(col => `<td>${row[col.key] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(tableHtml);
        printWindow.document.close();
    };

    const handleExportPDF = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Add title
            doc.setFontSize(16);
            doc.text('Table Data', 14, 15);

            // Prepare table data
            const headers = columns.map(col => col.label);
            const rows = sortedAndFilteredData.map(row =>
                columns.map(col => String(row[col.key] || '-'))
            );

            // Add table using autoTable
            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 25,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [100, 100, 100] }
            });

            doc.save('table-data.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please ensure jsPDF library is installed.');
        }
    };

    const handleExportExcel = async () => {
        try {
            const XLSX = await import('xlsx');

            // Prepare data for Excel
            const headers = columns.map(col => col.label);
            const rows = sortedAndFilteredData.map(row =>
                columns.map(col => row[col.key] || '-')
            );

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');

            // Save file
            XLSX.writeFile(wb, 'table-da00000000000000000000000000000000        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Error exporting Excel. Please ensure xlsx library is installed.');
        }
    };

    // 6. Pagination UI Handlers
    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const renderPaginationButton = (pageNumber, icon, disabled, label) => (
        <Button
            variant="light"
            size="sm"
            onClick={() => paginate(pageNumber)}
            disabled={disabled}
            title={label}
            className={`mx-1 ${disabled ? 'text-muted' : 'text-dark'}`}
            style={{ border: '1px solid #dee2e6' }}
        >
            {icon}
        </Button>
    );

    const getPaginationItems = () => {
        const items = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Button
                    key={i}
                    variant={i === currentPage ? "primary" : "light"}
                    size="sm"
                    onClick={() => paginate(i)}
                    className="mx-1"
                    style={i !== currentPage ? { border: '1px solid #dee2e6' } : {}}
                >
                    {i}
                </Button>
            );
        }
        return items;
    };

    const startRange = totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endRange = Math.min(currentPage * rowsPerPage, totalItems);

    return (
        <div className="w-100">
            {/* --- Toolbar --- */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                {/* Export Buttons */}
                <div className="d-flex align-items-center gap-3">
                    {enableExport && (
                        <>
                            <span className="text-dark small me-1" style={{ fontWeight: '500' }}>Export To:</span>
                            <button
                                onClick={handleExportPDF}
                                className="border-0 bg-transparent p-0"
                                style={{ cursor: 'pointer' }}
                                title="Export to PDF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 16 16">
                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="border-0 bg-transparent p-0"
                                style={{ cursor: 'pointer' }}
                                title="Export to Excel"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 16 16">
                                    <path d="M5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z" />
                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                </svg>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="border-0 bg-transparent p-0"
                                style={{ cursor: 'pointer' }}
                                title="Print"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 16 16">
                                    <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
                                    <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Search */}
                <div className="d-flex align-items-center">
                    {enableFilter && (
                        <InputGroup style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-white border-end-0">
                                <FaSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-start-0 ps-0"
                            />
                        </InputGroup>
                    )}
                </div>
            </div>

            {/* --- Table --- */}
            <div className="border rounded shadow-sm bg-white" style={{ maxHeight: '700px', overflow: 'hidden' }}>
                <div style={{ maxHeight: '600px', overflowY: 'auto', position: 'relative' }}>
                    <Table hover className="mb-0 align-middle">
                        <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                {actionRenderer && (
                                    <th className="py-3 px-3 border-bottom-0" style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#f8f9fa' }}>
                                        Actions
                                    </th>
                                )}
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        className={`py-3 px-3 border-bottom-0 ${col.sortable ? 'cursor-pointer user-select-none' : ''}`}
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            color: '#6c757d',
                                            cursor: col.sortable ? 'pointer' : 'default',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            backgroundColor: '#f8f9fa'
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {col.label}
                                            {col.sortable && (
                                                <SortIcon
                                                    sortDirection={
                                                        sortConfig.key === col.key ? sortConfig.direction : null
                                                    }
                                                />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row, rowIndex) => (
                                    <tr
                                        key={`${row.id}-${rowIndex}`}
                                        style={{
                                            backgroundColor: rowIndex % 2 === 0 ? '#bbdefb' : '#ffffff'
                                        }}
                                    >
                                        {actionRenderer && (
                                            <td className="py-3 px-3" style={{ fontSize: '0.875rem' }}>
                                                {actionRenderer(row)}
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={`${row.id}-${rowIndex}-${col.key}`} className="py-3 px-3" style={{ fontSize: '0.875rem' }}>
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (actionRenderer ? 1 : 0)} className="text-center py-5 text-muted">
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* --- Pagination and Info --- */}
            {enablePagination && totalPages > 1 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3">

                    {/* Rows Per Page / Info */}
                    <div className="d-flex align-items-center mb-3 mb-md-0 text-muted small">
                        <span className="me-2">Rows per page:</span>
                        <Form.Select
                            size="sm"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            style={{ minWidth: '70px', width: 'auto', display: 'inline-block' }}
                            className="me-3"
                        >
                            {rowsPerPageOptions.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </Form.Select>
                        <span>
                            Showing {startRange} - {endRange} of {totalItems} records
                        </span>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="d-flex align-items-center">
                        {renderPaginationButton(1, <FaAngleDoubleLeft />, currentPage === 1, 'First Page')}
                        {renderPaginationButton(currentPage - 1, <FaChevronLeft />, currentPage === 1, 'Previous Page')}

                        <div className="d-flex mx-2">
                            {getPaginationItems()}
                        </div>

                        {renderPaginationButton(currentPage + 1, <FaChevronRight />, currentPage === totalPages, 'Next Page')}
                        {renderPaginationButton(totalPages, <FaAngleDoubleRight />, currentPage === totalPages, 'Last Page')}
                    </div>
                </div>
            )}

            {/* Show only info if pagination is disabled */}
            {!enablePagination && (
                <div className="mt-3 text-muted small">
                    Showing all {totalItems} records.
                </div>
            )}
        </div>
    );
};

export default DataTable;
