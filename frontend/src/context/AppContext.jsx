import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

// Initial mock data
const initialData = {
    users: [
        { id: 1, name: 'Admin User', email: 'admin@microfund.com', password: 'admin123', role: 'admin', status: 'active', createdAt: '2024-01-15' },
        { id: 2, name: 'Priya Sharma', email: 'priya@microfund.com', password: 'priya123', role: 'shg_member', status: 'active', createdAt: '2024-02-01' },
        { id: 3, name: 'Rajesh Kumar', email: 'rajesh@microfund.com', password: 'rajesh123', role: 'shg_member', status: 'active', createdAt: '2024-02-10' },
        { id: 4, name: 'Kavita Singh', email: 'kavita@microfund.com', password: 'kavita123', role: 'shg_member', status: 'active', createdAt: '2024-02-15' },
        { id: 5, name: 'Amit Patel', email: 'amit@microfund.com', password: 'amit123', role: 'shg_member', status: 'active', createdAt: '2024-02-20' },
        { id: 6, name: 'Suresh Raina', email: 'suresh@microfund.com', password: 'suresh123', role: 'shg_team', status: 'active', createdAt: '2024-01-25' },
    ],
    savingProducts: [
        { id: 1, name: 'General Savings', code: 'GEN', interestRate: 4.0, status: 'active' },
        { id: 2, name: 'Compulsory Savings', code: 'COMP', interestRate: 5.0, status: 'active' },
        { id: 3, name: 'Recurring Deposit', code: 'RD', interestRate: 6.0, status: 'active' },
        { id: 4, name: 'Fixed Deposit', code: 'FD', interestRate: 7.0, status: 'active' },
        { id: 5, name: 'Festival Fund', code: 'FEST', interestRate: 4.5, status: 'active' },
        { id: 6, name: 'Education Fund', code: 'EDU', interestRate: 5.5, status: 'active' },
        { id: 7, name: 'Health Fund', code: 'HLTH', interestRate: 4.0, status: 'active' },
        { id: 8, name: 'Marriage Fund', code: 'MARR', interestRate: 6.5, status: 'active' },
    ],
    loanProducts: [
        { id: 1, name: 'Personal Loan', code: 'PL', interestRate: 12.0, maxAmount: 50000, status: 'active' },
        { id: 2, name: 'Business Loan', code: 'BL', interestRate: 10.0, maxAmount: 100000, status: 'active' },
        { id: 3, name: 'Emergency Loan', code: 'EL', interestRate: 15.0, maxAmount: 25000, status: 'active' },
        { id: 4, name: 'Agriculture Loan', code: 'AGRI', interestRate: 7.0, maxAmount: 150000, status: 'active' },
        { id: 5, name: 'Housing Repair Loan', code: 'HRL', interestRate: 9.0, maxAmount: 200000, status: 'active' },
        { id: 6, name: 'Education Loan', code: 'EDL', interestRate: 8.5, maxAmount: 300000, status: 'active' },
        { id: 7, name: 'Livestock Loan', code: 'LIVE', interestRate: 8.0, maxAmount: 75000, status: 'active' },
        { id: 8, name: 'Festival Advance', code: 'FADV', interestRate: 12.0, maxAmount: 10000, status: 'active' },
    ],
    meetingTypes: [
        { id: 1, name: 'Weekly Meeting', code: 'WM', status: 'active' },
        { id: 2, name: 'Monthly Meeting', code: 'MM', status: 'active' },
        { id: 3, name: 'Special Meeting', code: 'SM', status: 'active' },
    ],
    occupations: [
        { id: 1, name: 'Agriculture', status: 'active' },
        { id: 2, name: 'Small Business', status: 'active' },
        { id: 3, name: 'Daily Wage', status: 'active' },
        { id: 4, name: 'Self Employed', status: 'active' },
    ],
    financialYears: [
        { id: 1, name: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', status: 'active' },
        { id: 2, name: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', status: 'closed' },
    ],
    shgGroups: [
        { id: 1, name: 'Mahila Mandal A', code: 'MMA001', area: 'North Zone', meetingDay: 'Monday', meetingTime: '10:00 AM', assignedTo: 2, status: 'active', createdAt: '2024-01-20' },
        { id: 2, name: 'Shakti Group', code: 'SHK002', area: 'South Zone', meetingDay: 'Wednesday', meetingTime: '2:00 PM', assignedTo: 3, status: 'active', createdAt: '2024-02-05' },
        { id: 3, name: 'Pragati Samuh', code: 'PRG003', area: 'East Zone', meetingDay: 'Friday', meetingTime: '11:00 AM', assignedTo: 2, status: 'active', createdAt: '2024-02-15' },
        { id: 4, name: 'Unnati Mahila Mandal', code: 'UMM004', area: 'West Zone', meetingDay: 'Tuesday', meetingTime: '3:00 PM', assignedTo: 4, status: 'active', createdAt: '2024-02-20' },
        { id: 5, name: 'Swarojgar Group', code: 'SWR005', area: 'Central Zone', meetingDay: 'Thursday', meetingTime: '1:00 PM', assignedTo: 5, status: 'active', createdAt: '2024-03-01' },
        { id: 6, name: 'Vikas Samiti', code: 'VKS006', area: 'North Zone', meetingDay: 'Saturday', meetingTime: '10:30 AM', assignedTo: 3, status: 'active', createdAt: '2024-03-05' },
        { id: 7, name: 'Bosco Group', code: 'BSC007', area: 'Central Zone', meetingDay: 'Monday', meetingTime: '2:00 PM', assignedTo: 2, status: 'active', createdAt: '2024-03-10' },
    ],
    members: [
        { id: 1, groupId: 1, employeeCode: 'EMP001', name: 'Sunita Devi', memberCode: 'MMA001-001', phone: '9876543210', email: 'sunita@example.com', password: 'member123', gender: 'female', dateOfBirth: '1985-05-15', address: 'Village Rampur, District North', occupation: 'Agriculture', monthlyIncome: 15000, aadharNumber: '123456789012', panNumber: '', bankName: 'SBI', bankAccountNumber: '12345678901', ifscCode: 'SBIN0001234', nomineeName: 'Ramesh Devi', nomineeRelation: 'spouse', nomineePhone: '9876543299', joinDate: '2024-01-25', memberType: 'primary', status: 'active' },
        { id: 2, groupId: 1, employeeCode: 'EMP002', name: 'Geeta Sharma', memberCode: 'MMA001-002', phone: '9876543211', email: '', gender: 'female', dateOfBirth: '1990-08-20', address: 'Village Rampur', occupation: 'Small Business', monthlyIncome: 20000, aadharNumber: '234567890123', panNumber: '', bankName: 'HDFC', bankAccountNumber: '23456789012', ifscCode: 'HDFC0001234', nomineeName: 'Suresh Sharma', nomineeRelation: 'son', nomineePhone: '9876543298', joinDate: '2024-01-25', memberType: 'primary', status: 'active' },
        { id: 3, groupId: 1, employeeCode: 'EMP003', name: 'Rekha Patel', memberCode: 'MMA001-003', phone: '9876543212', email: '', gender: 'female', dateOfBirth: '1988-03-10', address: 'Village Rampur', occupation: 'Daily Wage', monthlyIncome: 10000, aadharNumber: '345678901234', panNumber: '', bankName: 'PNB', bankAccountNumber: '34567890123', ifscCode: 'PUNB0001234', nomineeName: 'Mohan Patel', nomineeRelation: 'spouse', nomineePhone: '9876543297', joinDate: '2024-01-26', memberType: 'associate', status: 'active' },
        { id: 4, groupId: 2, employeeCode: 'EMP004', name: 'Anita Singh', memberCode: 'SHK002-001', phone: '9876543213', email: 'anita@example.com', gender: 'female', dateOfBirth: '1987-11-25', address: 'Village Shaktipur, South Zone', occupation: 'Self Employed', monthlyIncome: 25000, aadharNumber: '456789012345', panNumber: 'ABCDE1234F', bankName: 'ICICI', bankAccountNumber: '45678901234', ifscCode: 'ICIC0001234', nomineeName: 'Vijay Singh', nomineeRelation: 'spouse', nomineePhone: '9876543296', joinDate: '2024-02-10', memberType: 'primary', status: 'active' },
        { id: 5, groupId: 2, employeeCode: 'EMP005', name: 'Meena Verma', memberCode: 'SHK002-002', phone: '9876543214', email: '', gender: 'female', dateOfBirth: '1992-06-18', address: 'Village Shaktipur', occupation: 'Agriculture', monthlyIncome: 12000, aadharNumber: '567890123456', panNumber: '', bankName: 'SBI', bankAccountNumber: '56789012345', ifscCode: 'SBIN0001234', nomineeName: 'Rajesh Verma', nomineeRelation: 'father', nomineePhone: '9876543295', joinDate: '2024-02-10', memberType: 'primary', status: 'active' },
        { id: 6, groupId: 3, employeeCode: 'EMP006', name: 'Lakshmi Rao', memberCode: 'PRG003-001', phone: '9876543215', email: '', gender: 'female', dateOfBirth: '1986-09-05', address: 'Village Pragati Nagar, East Zone', occupation: 'Small Business', monthlyIncome: 18000, aadharNumber: '678901234567', panNumber: '', bankName: 'Canara', bankAccountNumber: '67890123456', ifscCode: 'CNRB0001234', nomineeName: 'Krishna Rao', nomineeRelation: 'daughter', nomineePhone: '9876543294', joinDate: '2024-02-16', memberType: 'primary', status: 'active' },
        { id: 7, groupId: 3, employeeCode: 'EMP007', name: 'Radha Kumari', memberCode: 'PRG003-002', phone: '9876543216', email: '', gender: 'female', dateOfBirth: '1991-12-30', address: 'Village Pragati Nagar', occupation: 'Daily Wage', monthlyIncome: 8000, aadharNumber: '789012345678', panNumber: '', bankName: 'BOI', bankAccountNumber: '78901234567', ifscCode: 'BKID0001234', nomineeName: 'Shyam Kumari', nomineeRelation: 'mother', nomineePhone: '9876543293', joinDate: '2024-02-16', memberType: 'associate', status: 'active' },
        { id: 8, groupId: 4, employeeCode: 'EMP008', name: 'Savita Gupta', memberCode: 'UMM004-001', phone: '9876543217', email: 'savita@example.com', gender: 'female', dateOfBirth: '1989-04-12', address: 'Village Unnati, West Zone', occupation: 'Self Employed', monthlyIncome: 22000, aadharNumber: '890123456789', panNumber: '', bankName: 'Axis', bankAccountNumber: '89012345678', ifscCode: 'UTIB0001234', nomineeName: 'Amit Gupta', nomineeRelation: 'spouse', nomineePhone: '9876543292', joinDate: '2024-02-22', memberType: 'primary', status: 'active' },
        { id: 9, groupId: 4, employeeCode: 'EMP009', name: 'Pooja Reddy', memberCode: 'UMM004-002', phone: '9876543218', email: '', gender: 'female', dateOfBirth: '1993-07-22', address: 'Village Unnati', occupation: 'Agriculture', monthlyIncome: 14000, aadharNumber: '901234567890', panNumber: '', bankName: 'SBI', bankAccountNumber: '90123456789', ifscCode: 'SBIN0001234', nomineeName: 'Ravi Reddy', nomineeRelation: 'brother', nomineePhone: '9876543291', joinDate: '2024-02-22', memberType: 'nominated', status: 'active' },
        { id: 10, groupId: 5, employeeCode: 'EMP010', name: 'Kamala Devi', memberCode: 'SWR005-001', phone: '9876543219', email: '', gender: 'female', dateOfBirth: '1984-02-28', address: 'Village Swarojgar, Central Zone', occupation: 'Small Business', monthlyIncome: 19000, aadharNumber: '012345678901', panNumber: '', bankName: 'HDFC', bankAccountNumber: '01234567890', ifscCode: 'HDFC0001234', nomineeName: 'Gopal Devi', nomineeRelation: 'spouse', nomineePhone: '9876543290', joinDate: '2024-03-02', memberType: 'primary', status: 'active' },
        { id: 11, groupId: 5, employeeCode: 'EMP011', name: 'Usha Rani', memberCode: 'SWR005-002', phone: '9876543220', email: '', gender: 'female', dateOfBirth: '1995-10-15', address: 'Village Swarojgar', occupation: 'Daily Wage', monthlyIncome: 9000, aadharNumber: '123450987654', panNumber: '', bankName: 'PNB', bankAccountNumber: '12345098765', ifscCode: 'PUNB0001234', nomineeName: 'Sita Rani', nomineeRelation: 'sister', nomineePhone: '9876543289', joinDate: '2024-03-02', memberType: 'associate', status: 'inactive' },
        { id: 12, groupId: 6, employeeCode: 'EMP012', name: 'Shanti Bai', memberCode: 'VKS006-001', phone: '9876543221', email: '', gender: 'female', dateOfBirth: '1987-01-08', address: 'Village Vikas, North Zone', occupation: 'Agriculture', monthlyIncome: 13000, aadharNumber: '234561098765', panNumber: '', bankName: 'BOB', bankAccountNumber: '23456109876', ifscCode: 'BARB0001234', nomineeName: 'Ram Bai', nomineeRelation: 'mother', nomineePhone: '9876543288', joinDate: '2024-03-06', memberType: 'primary', status: 'active' },
        { id: 13, groupId: 7, employeeCode: 'EMP013', name: 'Maria D\'Souza', memberCode: 'BSC007-001', phone: '9876543222', email: 'maria@example.com', gender: 'female', dateOfBirth: '1988-06-12', address: 'Bosco Nagar, Central Zone', occupation: 'Small Business', monthlyIncome: 18000, aadharNumber: '345612098765', panNumber: '', bankName: 'SBI', bankAccountNumber: '34561209876', ifscCode: 'SBIN0001234', nomineeName: 'Joseph D\'Souza', nomineeRelation: 'spouse', nomineePhone: '9876543287', joinDate: '2024-03-11', memberType: 'primary', status: 'active' },
        { id: 14, groupId: 7, employeeCode: 'EMP014', name: 'Rita Fernandes', memberCode: 'BSC007-002', phone: '9876543223', email: '', gender: 'female', dateOfBirth: '1990-09-20', address: 'Bosco Nagar', occupation: 'Agriculture', monthlyIncome: 15000, aadharNumber: '456723109876', panNumber: '', bankName: 'HDFC', bankAccountNumber: '45672310987', ifscCode: 'HDFC0001234', nomineeName: 'Peter Fernandes', nomineeRelation: 'father', nomineePhone: '9876543286', joinDate: '2024-03-11', memberType: 'primary', status: 'active' },
        { id: 15, groupId: 7, employeeCode: 'EMP015', name: 'Stella Rodrigues', memberCode: 'BSC007-003', phone: '9876543224', email: '', gender: 'female', dateOfBirth: '1992-03-15', address: 'Bosco Nagar', occupation: 'Daily Wage', monthlyIncome: 12000, aadharNumber: '567834210987', panNumber: '', bankName: 'Canara', bankAccountNumber: '56783421098', ifscCode: 'CNRB0001234', nomineeName: 'Anthony Rodrigues', nomineeRelation: 'spouse', nomineePhone: '9876543285', joinDate: '2024-03-12', memberType: 'associate', status: 'active' },
        { id: 16, groupId: 1, employeeCode: 'EMP016', name: 'Sanjay Kumar', memberCode: 'MMA001-004', phone: '9876543225', email: 'sanjay@example.com', gender: 'male', dateOfBirth: '1990-01-15', address: 'Village Rampur, District North', occupation: 'Self Employed', monthlyIncome: 25000, aadharNumber: '678945210987', panNumber: 'ABCDE5678G', bankName: 'SBI', bankAccountNumber: '67894521098', ifscCode: 'SBIN0001234', nomineeName: 'Priya Kumar', nomineeRelation: 'spouse', nomineePhone: '9876543284', joinDate: '2024-01-25', memberType: 'primary', status: 'active' },
    ],
    savings: [
        { id: 1, memberId: 1, productId: 1, amount: 500, date: '2024-03-01', collectedBy: 2 },
        { id: 2, memberId: 1, productId: 2, amount: 200, date: '2024-03-01', collectedBy: 2 },
        { id: 3, memberId: 2, productId: 1, amount: 300, date: '2024-03-01', collectedBy: 2 },
        { id: 4, memberId: 3, productId: 1, amount: 400, date: '2024-03-02', collectedBy: 2 },
        { id: 5, memberId: 4, productId: 1, amount: 600, date: '2024-03-03', collectedBy: 3 },
        { id: 6, memberId: 5, productId: 2, amount: 250, date: '2024-03-03', collectedBy: 3 },
        { id: 7, memberId: 6, productId: 1, amount: 450, date: '2024-03-04', collectedBy: 2 },
        { id: 8, memberId: 7, productId: 1, amount: 350, date: '2024-03-04', collectedBy: 2 },
        { id: 9, memberId: 8, productId: 1, amount: 550, date: '2024-03-05', collectedBy: 4 },
        { id: 10, memberId: 9, productId: 2, amount: 300, date: '2024-03-05', collectedBy: 4 },
        { id: 11, memberId: 10, productId: 1, amount: 400, date: '2024-03-06', collectedBy: 5 },
        { id: 12, memberId: 12, productId: 1, amount: 500, date: '2024-03-07', collectedBy: 3 },
        { id: 13, memberId: 16, productId: 1, amount: 50000, date: '2024-03-10', collectedBy: 2 },
    ],
    loans: [
        { id: 1, memberId: 1, productId: 1, amount: 10000, interestRate: 12, tenor: 12, purpose: 'Business expansion', status: 'approved', appliedDate: '2024-02-15', approvedDate: '2024-02-20', emi: 888 },
        { id: 2, memberId: 2, productId: 2, amount: 25000, interestRate: 10, tenor: 24, purpose: 'Shop renovation', status: 'approved', appliedDate: '2024-02-20', approvedDate: '2024-02-25', emi: 1154 },
        { id: 3, memberId: 4, productId: 3, amount: 5000, interestRate: 15, tenor: 6, purpose: 'Medical emergency', status: 'pending', appliedDate: '2024-03-01', emi: 879 },
        { id: 4, memberId: 6, productId: 4, amount: 50000, interestRate: 7, tenor: 36, purpose: 'Agriculture equipment', status: 'approved', appliedDate: '2024-02-25', approvedDate: '2024-03-01', emi: 1544 },
        { id: 5, memberId: 8, productId: 1, amount: 15000, interestRate: 12, tenor: 18, purpose: 'Home repair', status: 'approved', appliedDate: '2024-03-02', approvedDate: '2024-03-05', emi: 907 },
        { id: 6, memberId: 10, productId: 2, amount: 30000, interestRate: 10, tenor: 24, purpose: 'Business startup', status: 'pending', appliedDate: '2024-03-08', emi: 1385 },
        { id: 7, memberId: 13, productId: 1, amount: 20000, interestRate: 12, tenor: 15, purpose: 'Shop expansion', status: 'approved', appliedDate: '2024-03-12', approvedDate: '2024-03-15', emi: 1417 },
        { id: 8, memberId: 14, productId: 4, amount: 35000, interestRate: 7, tenor: 24, purpose: 'Farm equipment purchase', status: 'approved', appliedDate: '2024-03-13', approvedDate: '2024-03-16', emi: 1562 },
    ],
    loanRepayments: [
        { id: 1, loanId: 1, amount: 888, date: '2024-03-01', type: 'emi', collectedBy: 2 },
        { id: 2, loanId: 2, amount: 1154, date: '2024-03-01', type: 'emi', collectedBy: 3 },
        { id: 3, loanId: 4, amount: 1544, date: '2024-03-02', type: 'emi', collectedBy: 2 },
        { id: 4, loanId: 5, amount: 907, date: '2024-03-06', type: 'emi', collectedBy: 4 },
    ],
    meetings: [
        { id: 1, groupId: 1, date: '2024-03-04', type: 1, attendees: [1, 2, 3], remarks: 'Regular weekly meeting. Discussed new loan applications.', createdBy: 2 },
        { id: 2, groupId: 2, date: '2024-03-06', type: 1, attendees: [4, 5], remarks: 'Weekly meeting. Collected savings and EMI.', createdBy: 3 },
        { id: 3, groupId: 3, date: '2024-03-08', type: 1, attendees: [6, 7], remarks: 'Weekly meeting. Reviewed member attendance.', createdBy: 2 },
        { id: 4, groupId: 4, date: '2024-03-05', type: 1, attendees: [8, 9], remarks: 'Weekly meeting. Discussed savings goals.', createdBy: 4 },
    ],
};

export const AppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('microfund_data');
        return saved ? JSON.parse(saved) : initialData;
    });

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('microfund_data', JSON.stringify(data));
    }, [data]);

    // Authentication
    const login = (email, password) => {
        // Check system users first
        let user = data.users.find(u => u.email === email && u.status === 'active');

        // If not found, check members
        if (!user) {
            const member = data.members.find(m => m.email === email && m.status === 'active');
            if (member) {
                // Assign shg_member role to members for routing
                user = { ...member, role: 'shg_member' };
            }
        }

        if (user) {
            // Simple password check if password exists on user object
            if (user.password && user.password !== password) {
                return { success: false, message: 'Invalid credentials' };
            }

            setCurrentUser(user);
            localStorage.setItem('microfund_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('microfund_user');
    };

    // Check for saved user on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('microfund_user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
    }, []);

    // Generic CRUD operations
    const addItem = (collection, item) => {
        const newId = Math.max(...data[collection].map(i => i.id), 0) + 1;
        const newItem = { ...item, id: newId };
        setData(prev => ({
            ...prev,
            [collection]: [...prev[collection], newItem]
        }));
        return newItem;
    };

    const updateItem = (collection, id, updates) => {
        setData(prev => ({
            ...prev,
            [collection]: prev[collection].map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }));
    };

    const deleteItem = (collection, id) => {
        setData(prev => ({
            ...prev,
            [collection]: prev[collection].filter(item => item.id !== id)
        }));
    };

    const getItem = (collection, id) => {
        return data[collection].find(item => item.id === id);
    };

    const getItems = (collection, filter = null) => {
        if (!filter) return data[collection];
        return data[collection].filter(filter);
    };

    // Calculate member savings balance
    const getMemberSavingsBalance = (memberId) => {
        return data.savings
            .filter(s => s.memberId === memberId)
            .reduce((sum, s) => sum + s.amount, 0);
    };

    // Calculate loan outstanding
    const getLoanOutstanding = (loanId) => {
        const loan = data.loans.find(l => l.id === loanId);
        if (!loan) return 0;

        const totalAmount = loan.amount + (loan.amount * loan.interestRate * loan.tenor) / (100 * 12);
        const paid = data.loanRepayments
            .filter(r => r.loanId === loanId)
            .reduce((sum, r) => sum + r.amount, 0);

        return totalAmount - paid;
    };

    // Get member loans
    const getMemberLoans = (memberId) => {
        return data.loans.filter(l => l.memberId === memberId);
    };

    // Reset data (for testing)
    const resetData = () => {
        setData(initialData);
        localStorage.setItem('microfund_data', JSON.stringify(initialData));
    };

    const value = {
        currentUser,
        data,
        login,
        logout,
        addItem,
        updateItem,
        deleteItem,
        getItem,
        getItems,
        getMemberSavingsBalance,
        getLoanOutstanding,
        getMemberLoans,
        resetData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
