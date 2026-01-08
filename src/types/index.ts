export type AccountType = 'fixed-deposit' | 'savings' | 'credit' | 'cash' | 'stock' | 'mutual-fund' | 'other' | 'loan' | 'land' | 'insurance';

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
    subName?: string;
    isPrimary?: boolean;
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
}

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    color: string;
    icon: string;
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
}
