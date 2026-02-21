export type AccountType = 'fixed-deposit' | 'savings' | 'credit' | 'cash' | 'stock' | 'mutual-fund' | 'other' | 'loan' | 'land' | 'insurance' | 'online-wallet';

export interface Holding {
    id: string;
    name: string;
    quantity: number;
    purchaseRate: number;
    purchasePrice: number; // calculated as quantity * purchaseRate
}

export interface LoanDetails {
    principalAmount: number;
    interestRate: number; // Annual interest rate in %
    monthlyEmi: number;
    emisLeft: number;
}

export interface InsuranceDetails {
    policyNumber: string;
    premiumAmount: number;
    renewalDate: string; // YYYY-MM-DD
}

export interface CreditCardDetails {
    statementDate: number; // Day of month
    dueDate: number;       // Day of month
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    color: string;
    // Specific fields
    accountNumber?: string;
    customerId?: string;
    dmatId?: string;
    holdings?: Holding[];
    loanDetails?: LoanDetails;
    insuranceDetails?: InsuranceDetails;
    creditCardDetails?: CreditCardDetails;
    subName?: string;
    isPrimary?: boolean;
    order?: number;
    includeInNetWorth?: boolean;
    includeInReports?: boolean;
    group?: 'banking' | 'investment';
    logsRequired?: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
    id: string;
    accountId: string;
    toAccountId?: string; // For transfers
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    note?: string;
    eventId?: string; // For event-based tracking
    excludeFromBalance?: boolean;
}

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    order?: number;
    limit?: number;
    ccLimit?: number;
}

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    color: string;
    icon: string;
    order?: number;
    includeInReports?: boolean;
    showLogs?: boolean;
    showTransactions?: boolean;
    showPlans?: boolean;
}

export interface Mandate {
    id: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    dayOfMonth: number; // 1-31
    description: string;
    isEnabled: boolean;
    lastRunDate?: string; // YYYY-MM-DD
    lastSkippedDate?: string; // YYYY-MM-DD
    order?: number;
}

export interface AuditTrail {
    id: string;
    timestamp: string;
    action: 'create' | 'update' | 'delete';
    entityType: 'transaction' | 'investment-log';
    entityId: string;
    details: {
        previous?: any;
        current?: any;
    };
    note?: string;
}

export interface InvestmentLog {
    id: string;
    accountId: string;
    date: string;
    type: 'value' | 'profit';
    amount: number;
    note?: string;
}
export interface EventLog {
    id: string;
    eventId?: string;
    amount: number;
    type: 'expense' | 'income';
    description: string;
    date: string;
}

export interface EventPlan {
    id: string;
    eventId: string;
    amount: number;
    description: string;
    date: string;
}
export interface FinanceSettings {
    isBalanceHidden?: boolean;
    isAccountsBalanceHidden?: boolean;
    hiddenAccountTypes?: string[];
    reportSortBy?: 'date' | 'amount';
    showEventsInReport?: boolean;
    showLogsInReport?: boolean;
    showManualInReport?: boolean;
    pdfIncludeCharts?: boolean;
    pdfIncludeAccountSummary?: boolean;
    pdfIncludeTransactions?: boolean;
    pdfIncludeEventSummary?: boolean;
    autoBackupEnabled?: boolean;
    showInvestmentAccounts?: boolean;
    showAuditTrail?: boolean;
    passcode?: string;
    useBiometrics?: boolean;
}
