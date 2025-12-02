import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Table,
  InputGroup,
  FormControl
} from "react-bootstrap";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LoanRepaymentSchedulerPage() {
  const { data } = useApp();

  const [groupId, setGroupId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [search, setSearch] = useState("");
  const [showTable, setShowTable] = useState(false);

  // === FILTER MEMBERS BY GROUP ===
  const filteredMembers = useMemo(
    () =>
      data.members.filter(
        (m) => !groupId || m.groupId === parseInt(groupId)
      ),
    [data.members, groupId]
  );

  // === GET ACTIVE LOAN & GENERATE SCHEDULE ===
  const scheduleData = useMemo(() => {
    if (!memberId || !showTable) return [];

    const activeLoan = data.loans.find(
      (l) => l.memberId === parseInt(memberId) && l.status === "approved"
    );

    if (!activeLoan) return [];

    const rows = [];
    const startDate = new Date(activeLoan.appliedDate || new Date()); // Fallback to today
    const amount = activeLoan.amount;
    const tenor = activeLoan.tenor;
    const interestRate = activeLoan.interestRate;

    // Calculations (Assuming Flat Rate as per LoanCollection logic)
    const monthlyPrincipal = Math.round(amount / tenor);
    const monthlyInterest = Math.round((amount * interestRate) / 1200);
    const totalAmount = monthlyPrincipal + monthlyInterest;

    // Get repayments for this loan
    const repayments = data.transactions?.filter(
      t => t.memberId === parseInt(memberId) && t.type === 'repayment'
    ) || [];

    let currentOs = amount;

    for (let i = 0; i < tenor; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      const monthStr = dueDate.toLocaleString('default', { month: '2-digit', year: 'numeric' }); // MM/YYYY

      // Find payment in this month
      const payment = repayments.find(r => {
        const rDate = new Date(r.date);
        return rDate.getMonth() === dueDate.getMonth() && rDate.getFullYear() === dueDate.getFullYear();
      });

      rows.push({
        sNo: i + 1,
        date: monthStr,
        loanOs: currentOs,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        totalAmount: totalAmount,
        collectionDate: payment ? payment.date : '-',
        collectionAmount: payment ? payment.amount : '-'
      });

      currentOs -= monthlyPrincipal;
      if (currentOs < 0) currentOs = 0;
    }

    return rows;
  }, [memberId, showTable, data.loans, data.transactions]);

  const handleShow = (e) => {
    e.preventDefault();
    setShowTable(true);
  };

  // === EXPORT FUNCTIONS ===
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      scheduleData.map(t => ({
        'S.No': t.sNo,
        'Date': t.date,
        'Loan Os': t.loanOs,
        'Principal': t.principal,
        'Interest Amount': t.interest,
        'Total Amount': t.totalAmount,
        'Collection Date': t.collectionDate,
        'Collection Amount': t.collectionAmount
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repayment Schedule');
    XLSX.writeFile(wb, 'repayment_schedule.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Loan Repayment Schedule", 14, 15);

    const tableColumn = ["S.No", "Date", "Loan Os", "Principal", "Interest", "Total", "Coll. Date", "Coll. Amount"];
    const tableRows = [];

    scheduleData.forEach(row => {
      const rowData = [
        row.sNo,
        row.date,
        row.loanOs.toLocaleString(),
        row.principal.toLocaleString(),
        row.interest.toLocaleString(),
        row.totalAmount.toLocaleString(),
        row.collectionDate,
        row.collectionAmount !== '-' ? Number(row.collectionAmount).toLocaleString() : '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("repayment_schedule.pdf");
  };

  // Styles matching SavingsManagement.jsx
  const headerStyle = {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: '10px 12px',
    borderBottom: '1px solid #dee2e6',
    borderRight: '1px solid #dee2e6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'left',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap'
  };

  const cellStyle = {
    fontSize: '0.875rem',
    padding: '8px 12px',
    borderRight: '1px solid #dee2e6',
    verticalAlign: 'middle'
  };

  return (
    <div className="fade-in">
      <h4 className="fw-bold mb-3">Loan Repayment Scheduler</h4>

      {/* FILTERS CARD */}
      <Card className="shadow-sm border-0 w-100 mb-3">
        <Card.Body style={{ padding: "30px" }}>
          <Form onSubmit={handleShow}>
            <Row className="gx-4 gy-4">

              {/* GROUP FILTER */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Group</Form.Label>
                  <Form.Select
                    value={groupId}
                    onChange={(e) => {
                      setGroupId(e.target.value);
                      setMemberId("");
                      setShowTable(false);
                    }}
                    required
                  >
                    <option value="">Select Group</option>
                    {data.shgGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* MEMBER FILTER */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Member</Form.Label>
                  <Form.Select
                    value={memberId}
                    onChange={(e) => {
                      setMemberId(e.target.value);
                      setShowTable(false);
                    }}
                    disabled={!groupId}
                    required
                  >
                    <option value="">Select Member</option>
                    {filteredMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* SHOW BUTTON */}
              <Col md={4} className="d-flex align-items-end">
                <Button type="submit" size="sm" className="w-30 mb-1 ms-3">
                  Show
                </Button>
              </Col>

            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* SEARCH + BUTTONS */}
      {showTable && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex justify-content-end gap-4">
            {/* PDF Button */}
            <span
              onClick={exportToPDF}
              style={{
                cursor: showTable && scheduleData.length > 0 ? "pointer" : "default",
                color: "#dc3545",
                fontWeight: "500",
                opacity: showTable && scheduleData.length > 0 ? 1 : 0.5,
                padding: "4px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (showTable && scheduleData.length > 0) {
                  e.currentTarget.style.backgroundColor = "#e30719ff"; // red bg
                  e.currentTarget.style.color = "#fff"; // white text
                }
              }}
              onMouseLeave={(e) => {
                if (showTable && scheduleData.length > 0) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#dc3545"; // back to red text
                }
              }}
            >
              <FaFilePdf size={18} /> PDF
            </span>

            {/* Excel Button */}
            <span
              onClick={exportToExcel}
              style={{
                cursor: showTable && scheduleData.length > 0 ? "pointer" : "default",
                color: "#198754",
                fontWeight: "500",
                opacity: showTable && scheduleData.length > 0 ? 1 : 0.5,
                padding: "4px 10px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (showTable && scheduleData.length > 0) {
                  e.currentTarget.style.backgroundColor = "#007842ff"; // green bg
                  e.currentTarget.style.color = "#fff"; // white text
                }
              }}
              onMouseLeave={(e) => {
                if (showTable && scheduleData.length > 0) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#198754"; // back to green text
                }
              }}
            >
              <FaFileExcel size={18} /> Excel
            </span>
          </div>


          <InputGroup style={{ maxWidth: "260px" }}>
            <FormControl
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      )}

      {/* TABLE */}
      {showTable && (
        <Card className="shadow-sm border-0 mt-3">
          <Card.Body style={{ padding: "0px" }}>
            <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
              <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                  <tr>
                    <th style={{ ...headerStyle, width: '60px', textAlign: 'center' }}>S.No</th>
                    <th style={{ ...headerStyle, width: '120px' }}>Date</th>
                    <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>Loan Os</th>
                    <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>Principal</th>
                    <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>Interest Amount</th>
                    <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ ...headerStyle, width: '120px' }}>Collection Date</th>
                    <th style={{ ...headerStyle, width: '120px', textAlign: 'right' }}>Collection Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {scheduleData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No active loan or schedule found for this member.
                      </td>
                    </tr>
                  ) : (
                    scheduleData.map((row, index) => {
                      // Matching SavingsManagement.jsx alternating colors
                      const rowBg = index % 2 === 0 ? "#bbdefb" : "#ffffff";
                      return (
                        <tr key={index} style={{ backgroundColor: rowBg }}>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'center' }}>{row.sNo}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg }}>{row.date}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, color: '#dc3545', fontWeight: '600', textAlign: 'right' }}>₹{row.loanOs.toLocaleString()}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right' }}>₹{row.principal.toLocaleString()}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, textAlign: 'right' }}>₹{row.interest.toLocaleString()}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, fontWeight: 'bold', textAlign: 'right' }}>₹{row.totalAmount.toLocaleString()}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg }}>{row.collectionDate}</td>
                          <td style={{ ...cellStyle, backgroundColor: rowBg, color: '#28a745', fontWeight: '600', textAlign: 'right' }}>
                            {row.collectionAmount !== '-' ? `₹${Number(row.collectionAmount).toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
