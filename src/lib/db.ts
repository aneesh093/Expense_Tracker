import Dexie, { type Table } from 'dexie';
import { type Account, type Transaction, type Category } from '../types';

export class FinanceDatabase extends Dexie {
    accounts!: Table<Account, string>;
    transactions!: Table<Transaction, string>;
    categories!: Table<Category, string>;

    constructor() {
        super('FinanceDB');

        this.version(1).stores({
            accounts: 'id, name, type, balance',
            transactions: 'id, date, accountId, toAccountId, type, category',
            categories: 'id, name, type'
        });
    }
}

export const db = new FinanceDatabase();

// Migration helper: Import data from localStorage
export async function migrateFromLocalStorage() {
    try {
        const localStorageKey = 'finance-storage';
        const existingData = localStorage.getItem(localStorageKey);

        if (!existingData) {
            console.log('No localStorage data to migrate');
            return false;
        }

        const data = JSON.parse(existingData);
        const state = data.state;

        if (!state) {
            console.log('No state data found in localStorage');
            return false;
        }

        // Check if already migrated
        const migrationFlag = localStorage.getItem('indexeddb-migrated');
        if (migrationFlag === 'true') {
            console.log('Data already migrated to IndexedDB');
            return false;
        }

        console.log('Starting migration from localStorage to IndexedDB...');

        // Migrate accounts
        if (state.accounts && state.accounts.length > 0) {
            await db.accounts.bulkPut(state.accounts);
            console.log(`Migrated ${state.accounts.length} accounts`);
        }

        // Migrate transactions
        if (state.transactions && state.transactions.length > 0) {
            await db.transactions.bulkPut(state.transactions);
            console.log(`Migrated ${state.transactions.length} transactions`);
        }

        // Migrate categories
        if (state.incomeCategories && state.incomeCategories.length > 0) {
            await db.categories.bulkPut(state.incomeCategories);
            console.log(`Migrated ${state.incomeCategories.length} income categories`);
        }

        if (state.expenseCategories && state.expenseCategories.length > 0) {
            await db.categories.bulkPut(state.expenseCategories);
            console.log(`Migrated ${state.expenseCategories.length} expense categories`);
        }

        // Set migration flag
        localStorage.setItem('indexeddb-migrated', 'true');
        console.log('Migration completed successfully!');

        return true;
    } catch (error) {
        console.error('Error during migration:', error);
        return false;
    }
}

// Helper functions for common operations
export const dbHelpers = {
    // Accounts
    async getAllAccounts(): Promise<Account[]> {
        return await db.accounts.toArray();
    },

    async getAccountById(id: string): Promise<Account | undefined> {
        return await db.accounts.get(id);
    },

    async addAccount(account: Account): Promise<string> {
        return await db.accounts.add(account);
    },

    async updateAccount(id: string, updates: Partial<Account>): Promise<number> {
        return await db.accounts.update(id, updates);
    },

    async deleteAccount(id: string): Promise<void> {
        await db.accounts.delete(id);
    },

    // Transactions
    async getAllTransactions(): Promise<Transaction[]> {
        return await db.transactions.orderBy('date').reverse().toArray();
    },

    async getTransactionById(id: string): Promise<Transaction | undefined> {
        return await db.transactions.get(id);
    },

    async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
        return await db.transactions
            .where('accountId').equals(accountId)
            .or('toAccountId').equals(accountId)
            .reverse()
            .sortBy('date');
    },

    async addTransaction(transaction: Transaction): Promise<string> {
        return await db.transactions.add(transaction);
    },

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<number> {
        return await db.transactions.update(id, updates);
    },

    async deleteTransaction(id: string): Promise<void> {
        await db.transactions.delete(id);
    },

    // Categories
    async getAllCategories(): Promise<Category[]> {
        return await db.categories.toArray();
    },

    async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
        return await db.categories.where('type').equals(type).toArray();
    },

    async addCategory(category: Category): Promise<string> {
        return await db.categories.add(category);
    },

    async updateCategory(id: string, updates: Partial<Category>): Promise<number> {
        return await db.categories.update(id, updates);
    },

    async deleteCategory(id: string): Promise<void> {
        await db.categories.delete(id);
    }
};
