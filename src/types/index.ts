export type AccountType = 'fixed-deposit' | 'savings' | 'credit' | 'cash' | 'stock' | 'mutual-fund' | 'other' | 'loan';

export interface Holding {
    id: string;
    name: string;
    quantity: number;
    purchaseRate: number;
    purchasePrice: number; // calculated as quantity * purchaseRate
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
}

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
}
