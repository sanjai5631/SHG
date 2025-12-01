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
import { FaFileExport, FaPrint } from "react-icons/fa";

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

  // === FILTER LOANS BY MEMBER ===
  const filteredLoans = useMemo(() => {
    if (!memberId) return [];

    return data.loans.filter(
      (loan) =>
        loan.status === "approved" &&
        loan.memberId === parseInt(memberId)
    );
  }, [data.loans, memberId]);

  // === ENRICH TABLE ROWS ===
  const rows = useMemo(() => {
    return filteredLoans.map((loan) => {
      const member = data.members.find((m) => m.id === loan.memberId) || {};
      const group = data.shgGroups.find((g) => g.id === member.groupId) || {};

      return {
        id: loan.id,
        memberCode: member.code || "",
        memberName: member.name || "",
        cigName: group.name || "",
        requestedOn: loan.requestedOn || "",
        loanType: loan.loanType || "Individual Loan",
        loanTerm: loan.term || "",
        amount: loan.amount || 0,
        installments: loan.installments || 0
      };
    });
  }, [filteredLoans, data.members, data.shgGroups]);

  // === SEARCH ===
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;

    return rows.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const handleShow = (e) => {
    e.preventDefault();
    setShowTable(true);
  };

  return (
    <div >
      <h4 className="fw-bold mb-1">Loan Repayment Scheduler</h4>


      {/* FILTERS CARD */}
      <Card className="shadow-sm border-0 w-100">
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
        <div
          className="d-flex justify-content-between align-items-center mt-3"
        >
          <div className="d-flex gap-2 ms-2">
            <Button variant="dark" style={{ background: '#54b4f8ff' }} size="sm">
              <FaPrint />
            </Button>
            <Button variant="dark" style={{ backgroundColor: '#069f53ff' }} size="sm">
              <FaFileExport />
            </Button>
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
        <Card
          className="shadow-sm border-0 mt-3"
        >
          <Card.Body style={{ padding: "20px" }}>
            <Table hover className="mb-0" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0, border: "1px solid #dee2e6" }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#d9d9d9ff', zIndex: 10 }}>
                <tr>
                  <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Action</th>
                  <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Member Code</th>
                  <th style={{ width: '15%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Member Name</th>
                  <th style={{ width: '15%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Group</th>
                  <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Requested On</th>
                  <th style={{ width: '12%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Loan Type</th>
                  <th style={{ width: '8%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Term</th>
                  <th style={{ width: '10%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', borderRight: '1px solid #dee2e6', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ width: '12%', fontSize: '0.65rem', fontWeight: '600', color: '#565151ff', padding: '14px 10px', borderBottom: '1px solid #c2c0c0ff', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>Installments</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const rowBg = index % 2 === 0 ? "#d2e6fcff" : "#f0f6fcff";
                    return (
                      <tr key={row.id} style={{ backgroundColor: rowBg, borderBottom: "1px solid #dee2e6" }}>
                        <td style={{ backgroundColor: rowBg, padding: '16px 8px', textAlign: 'center', borderRight: '1px solid #dee2e6' }}>
                          <Button size="sm" variant="outline-primary" className="py-0 px-2">
                            <i className="bi bi-eye"></i>
                          </Button>
                        </td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#6c757d', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.memberCode}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', fontWeight: '500', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.memberName}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.cigName}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.requestedOn}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.loanType}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>{row.loanTerm}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', color: '#28a745', fontWeight: '600', padding: '16px 8px', borderRight: '1px solid #dee2e6' }}>₹{row.amount.toLocaleString()}</td>
                        <td style={{ backgroundColor: rowBg, fontSize: '0.875rem', padding: '16px 8px' }}>{row.installments}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
