import { useState } from "react";
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Table,
    Spinner
} from "react-bootstrap";
import {
    FaSearch,
    FaFileExcel,
    FaCalendarAlt,
    FaFileAlt,
    FaRupeeSign
} from "react-icons/fa";
import * as XLSX from "xlsx";

export default function MonthlyReport({ data }) {
    const [isLoading, setIsLoading] = useState(false);
    const [localDateRange, setLocalDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [reportData, setReportData] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // ----------------------------------------
    // FORMAT HELPERS
    // ----------------------------------------
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })
            .format(amount)
            .replace("₹", "₹ ");
    };

    // ----------------------------------------
    // SEARCH ACTION
    // ----------------------------------------
    const handleSearch = async () => {
        if (!localDateRange.startDate || !localDateRange.endDate) return;

        const endDate = new Date(localDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);

        const searchRange = {
            startDate: localDateRange.startDate,
            endDate: endDate.toISOString().split("T")[0]
        };

        setDateRange(searchRange);

        const { transactions, total } = await getReportData(searchRange);
        setReportData(transactions);
        setTotalAmount(total);
    };

    // ----------------------------------------
    // REPORT LOGIC
    // ----------------------------------------
    const getReportData = (range) => {
        const { startDate, endDate } = range;
        if (!data) return { transactions: [], total: 0 };

        setIsLoading(true);

        return new Promise((resolve) => {
            setTimeout(() => {
                const transactions = [];
                let slNo = 1;

                const isDateInRange = (dateString) => {
                    if (!dateString) return false;
                    const date = new Date(dateString);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return date >= start && date <= end;
                };

                // SAVINGS
                (data.savings || []).forEach((s) => {
                    if (isDateInRange(s.date)) {
                        const member = (data.members || []).find(
                            (m) => m.id === s.memberId
                        );
                        const group = (data.shgGroups || []).find(
                            (g) => g.id === member?.groupId
                        );
                        const product = (data.savingProducts || []).find(
                            (p) => p.id === s.productId
                        );

                        transactions.push({
                            slNo: slNo++,
                            areaName: group?.area || "N/A",
                            groupName: group?.name || "N/A",
                            shareNo: member?.shareNo || "-",
                            transactionDate: s.date,
                            mobileNo: member?.phone || "-",
                            transactionNo: `S${s.id}`,
                            product: product?.name || "Savings",
                            amount: s.amount,
                            paymentType: "Cash",
                            memberName: member?.name || "Unknown",
                            memberCode: member?.employeeCode || "-"
                        });
                    }
                });

                // LOAN REPAYMENTS
                (data.loanRepayments || []).forEach((r) => {
                    if (isDateInRange(r.date)) {
                        const loan = (data.loans || []).find(
                            (l) => l.id === r.loanId
                        );
                        const member = loan
                            ? (data.members || []).find(
                                (m) => m.id === loan.memberId
                            )
                            : null;
                        const group = member
                            ? (data.shgGroups || []).find(
                                (g) => g.id === member.groupId
                            )
                            : null;

                        transactions.push({
                            slNo: slNo++,
                            areaName: group?.area || "N/A",
                            groupName: group?.name || "N/A",
                            shareNo: member?.shareNo || "-",
                            transactionDate: r.date,
                            mobileNo: member?.phone || "-",
                            transactionNo: `LR${r.id}`,
                            product: "Loan Repayment",
                            amount: r.amount,
                            paymentType: r.paymentType || "Cash",
                            memberName: member?.name || "Unknown",
                            memberCode: member?.employeeCode || "-"
                        });
                    }
                });

                // LOAN DISBURSEMENTS
                (data.loans || []).forEach((l) => {
                    if (
                        l.approvedDate &&
                        l.status === "approved" &&
                        isDateInRange(l.approvedDate)
                    ) {
                        const member = (data.members || []).find(
                            (m) => m.id === l.memberId
                        );
                        const group = member
                            ? (data.shgGroups || []).find(
                                (g) => g.id === member.groupId
                            )
                            : null;

                        transactions.push({
                            slNo: slNo++,
                            areaName: group?.area || "N/A",
                            groupName: group?.name || "N/A",
                            shareNo: member?.shareNo || "-",
                            transactionDate: l.approvedDate,
                            mobileNo: member?.phone || "-",
                            transactionNo: `LD${l.id}`,
                            product: "Loan Disbursement",
                            amount: l.amount,
                            paymentType: "Bank Transfer",
                            memberName: member?.name || "Unknown",
                            memberCode: member?.employeeCode || "-"
                        });
                    }
                });

                // SORT BY DATE
                transactions.sort(
                    (a, b) =>
                        new Date(a.transactionDate) -
                        new Date(b.transactionDate)
                );

                // RENUMBER
                transactions.forEach((t, index) => {
                    t.slNo = index + 1;
                });

                const total = transactions.reduce(
                    (sum, t) => sum + t.amount,
                    0
                );

                setIsLoading(false);
                resolve({ transactions, total });
            }, 400);
        });
    };

    // ----------------------------------------
    // EXPORT TO EXCEL
    // ----------------------------------------
    const exportToExcel = () => {
        if (reportData.length === 0) return;

        const wb = XLSX.utils.book_new();

        const wsData = [
            [
                "Sl. No",
                "Area Name",
                "Group Name",
                "Share No",
                "Transaction Date",
                "Mobile No",
                "Transaction No",
                "Product",
                "Amount",
                "Payment Type",
                "Member Name",
                "Member Code"
            ],
            ...reportData.map((item) => [
                item.slNo,
                item.areaName,
                item.groupName,
                item.shareNo,
                formatDate(item.transactionDate),
                item.mobileNo,
                item.transactionNo,
                item.product,
                item.amount,
                item.paymentType,
                item.memberName,
                item.memberCode
            ]),
            ["", "", "", "", "", "", "", "Total:", totalAmount, "", "", ""]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");

        const fileName = `Monthly_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // ----------------------------------------
    // UI SECTION
    // ----------------------------------------
    return (
        <div className="fade-in">
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <h4 className="mb-4">
                        <FaFileAlt className="me-2 text-primary" />
                        Monthly Collection Report
                    </h4>

                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted mb-1">
                                    <FaCalendarAlt className="me-2" /> From
                                    Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={localDateRange.startDate}
                                    onChange={(e) =>
                                        setLocalDateRange({
                                            ...localDateRange,
                                            startDate: e.target.value
                                        })
                                    }
                                />
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-muted mb-1">
                                    <FaCalendarAlt className="me-2" /> To Date
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={localDateRange.endDate}
                                    onChange={(e) =>
                                        setLocalDateRange({
                                            ...localDateRange,
                                            endDate: e.target.value
                                        })
                                    }
                                    min={localDateRange.startDate}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={3} className="d-flex align-items-end">
                            <Button
                                variant="primary"
                                className="w-100"
                                onClick={handleSearch}
                                disabled={
                                    !localDateRange.startDate ||
                                    !localDateRange.endDate ||
                                    isLoading
                                }
                            >
                                {isLoading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <FaSearch className="me-2" /> Search
                                    </>
                                )}
                            </Button>
                        </Col>

                        {reportData.length > 0 && (
                            <Col
                                md={3}
                                className="d-flex align-items-end justify-content-end"
                            >
                                <Button
                                    variant="success"
                                    onClick={exportToExcel}
                                >
                                    <FaFileExcel className="me-2" /> Export to
                                    Excel
                                </Button>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            {isLoading ? (
                <div className="text-center py-5">
                    <Spinner
                        animation="border"
                        variant="primary"
                        className="me-2"
                    />
                    <span>Loading report data...</span>
                </div>
            ) : reportData.length > 0 ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center">Sl. No</th>
                                        <th>Area Name</th>
                                        <th>Group Name</th>
                                        <th>Share No</th>
                                        <th>Transaction Date</th>
                                        <th>Mobile No</th>
                                        <th>Transaction No</th>
                                        <th>Product</th>
                                        <th className="text-end">Amount (₹)</th>
                                        <th>Payment Type</th>
                                        <th>
                                            Member Name / Description
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {reportData.map((item) => (
                                        <tr key={item.transactionNo}>
                                            <td className="text-center">
                                                {item.slNo}
                                            </td>
                                            <td>{item.areaName}</td>
                                            <td>{item.groupName}</td>
                                            <td>{item.shareNo}</td>
                                            <td>
                                                {formatDate(
                                                    item.transactionDate
                                                )}
                                            </td>
                                            <td>{item.mobileNo}</td>
                                            <td>{item.transactionNo}</td>
                                            <td>{item.product}</td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td>{item.paymentType}</td>
                                            <td>
                                                {item.memberName} (
                                                {item.memberCode})
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot className="table-light">
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-end fw-bold"
                                        >
                                            Total:
                                        </td>
                                        <td
                                            colSpan="4"
                                            className="text-end fw-bold text-primary"
                                        >
                                            <FaRupeeSign className="me-1" />{" "}
                                            {formatCurrency(totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            ) : dateRange.startDate && dateRange.endDate ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <FaFileAlt className="display-4 text-muted mb-3" />
                        <h5 className="text-muted mb-3">No Data Found</h5>
                        <p className="text-muted mb-0">
                            No transactions found for this period.
                        </p>
                    </Card.Body>
                </Card>
            ) : null}
        </div>
    );
}
