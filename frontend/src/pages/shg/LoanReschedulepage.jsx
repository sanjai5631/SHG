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
            <Table bordered hover size="sm">
              <thead className="table-light">
                <tr>
                  <th>Action</th>
                  <th>Member Code</th>
                  <th>Member Name</th>
                  <th>Group</th>
                  <th>Requested On</th>
                  <th>Loan Type</th>
                  <th>Loan Term</th>
                  <th>Amount</th>
                  <th>Installments</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-3 text-muted">
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Button size="sm" variant="outline-primary">
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                      <td>{row.memberCode}</td>
                      <td>{row.memberName}</td>
                      <td>{row.cigName}</td>
                      <td>{row.requestedOn}</td>
                      <td>{row.loanType}</td>
                      <td>{row.loanTerm}</td>
                      <td>₹{row.amount.toLocaleString()}</td>
                      <td>{row.installments}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
