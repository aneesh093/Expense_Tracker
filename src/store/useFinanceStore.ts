import { create } from 'zustand';
import { type Account, type Transaction, type Category, type Event } from '../types';
import { db, dbHelpers, migrateFromLocalStorage } from '../lib/db';

interface FinanceState {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    events: Event[];
    isInitialized: boolean;
    isBalanceHidden: boolean;

    // Initialize store from IndexedDB
    initialize: () => Promise<void>;

    toggleBalanceHidden: () => void;
    setBalanceHidden: (hidden: boolean) => void;

    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    deleteAccount: (id: string) => void;

    addTransaction: (transaction: Transaction) => void;
    editTransaction: (id: string, updatedTransaction: Transaction) => void;
    deleteTransaction: (id: string) => void;

    getAccountBalance: (accountId: string) => number;

    addCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;

    addEvent: (event: Event) => void;
    updateEvent: (id: string, updates: Partial<Event>) => void;
    deleteEvent: (id: string) => void;

    importData: (data: { accounts: Account[], transactions: Transaction[], categories: Category[], events?: Event[] }) => void;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
    accounts: [],
    transactions: [],
    categories: [],
    events: [],
    isInitialized: false,
    isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false', // Default to true if not set

    // Initialize: Load data from IndexedDB and migrate from localStorage if needed
    initialize: async () => {
        try {
            // First, try to migrate from localStorage
            await migrateFromLocalStorage();

            // Load all data from IndexedDB
            const [accounts, transactions, categories, events] = await Promise.all([
                dbHelpers.getAllAccounts(),
                dbHelpers.getAllTransactions(),
                dbHelpers.getAllCategories(),
                dbHelpers.getAllEvents()
            ]);

            set({
                accounts,
                transactions,
                categories,
                events,
                isInitialized: true,
                isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false'
            });

            console.log('Store initialized from IndexedDB');
        } catch (error) {
            console.error('Error initializing store:', error);
            set({ isInitialized: true }); // Mark as initialized even on error
        }
    },

    toggleBalanceHidden: () => {
        set((state) => {
            const newState = !state.isBalanceHidden;
            localStorage.setItem('finance-privacy-mode', newState.toString());
            return { isBalanceHidden: newState };
        });
    },

    setBalanceHidden: (hidden: boolean) => {
        localStorage.setItem('finance-privacy-mode', hidden.toString());
        set({ isBalanceHidden: hidden });
    },

    addAccount: (account) => {
        set((state) => ({ accounts: [...state.accounts, account] }));
        dbHelpers.addAccount(account).catch(console.error);
    },

    updateAccount: (id, updates) => {
        set((state) => ({
            accounts: state.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
        }));
        dbHelpers.updateAccount(id, updates).catch(console.error);
    },

    deleteAccount: (id) => {
        set((state) => ({
            accounts: state.accounts.filter((acc) => acc.id !== id),
            transactions: state.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
        }));
        dbHelpers.deleteAccount(id).catch(console.error);
        // Also delete related transactions
        db.transactions.where('accountId').equals(id).delete().catch(console.error);
        db.transactions.where('toAccountId').equals(id).delete().catch(console.error);
    },

    addTransaction: (transaction) => {
        set((state) => {
            const newTransactions = [...state.transactions, transaction];
            const updatedAccounts = state.accounts.map((acc) => {
                if (acc.id === transaction.accountId) {
                    const newBalance =
                        transaction.type === 'income'
                            ? acc.balance + transaction.amount
                            : transaction.type === 'expense'
                                ? acc.balance - transaction.amount
                                : acc.balance - transaction.amount;
                    return { ...acc, balance: newBalance };
                }
                if (transaction.type === 'transfer' && acc.id === transaction.toAccountId) {
                    return { ...acc, balance: acc.balance + transaction.amount };
                }
                return acc;
            });

            // Update account balances in IndexedDB
            updatedAccounts.forEach(acc => {
                if (acc.id === transaction.accountId || acc.id === transaction.toAccountId) {
                    dbHelpers.updateAccount(acc.id, { balance: acc.balance }).catch(console.error);
                }
            });

            return { transactions: newTransactions, accounts: updatedAccounts };
        });
        dbHelpers.addTransaction(transaction).catch(console.error);
    },

    editTransaction: (id, updatedTransaction) => {
        const state = get();
        const oldTransaction = state.transactions.find((t) => t.id === id);
        if (!oldTransaction) return;

        // Revert old transaction effects
        let updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === oldTransaction.accountId) {
                const revertedBalance =
                    oldTransaction.type === 'income'
                        ? acc.balance - oldTransaction.amount
                        : oldTransaction.type === 'expense'
                            ? acc.balance + oldTransaction.amount
                            : acc.balance + oldTransaction.amount;
                return { ...acc, balance: revertedBalance };
            }
            if (oldTransaction.type === 'transfer' && acc.id === oldTransaction.toAccountId) {
                return { ...acc, balance: acc.balance - oldTransaction.amount };
            }
            return acc;
        });

        // Apply new transaction effects
        updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === updatedTransaction.accountId) {
                const newBalance =
                    updatedTransaction.type === 'income'
                        ? acc.balance + updatedTransaction.amount
                        : updatedTransaction.type === 'expense'
                            ? acc.balance - updatedTransaction.amount
                            : acc.balance - updatedTransaction.amount;
                return { ...acc, balance: newBalance };
            }
            if (updatedTransaction.type === 'transfer' && acc.id === updatedTransaction.toAccountId) {
                return { ...acc, balance: acc.balance + updatedTransaction.amount };
            }
            return acc;
        });

        set({
            transactions: state.transactions.map((t) => (t.id === id ? updatedTransaction : t)),
            accounts: updatedAccounts,
        });

        // Update in IndexedDB
        dbHelpers.updateTransaction(id, updatedTransaction).catch(console.error);
        updatedAccounts.forEach(acc => {
            if (acc.id === updatedTransaction.accountId || acc.id === updatedTransaction.toAccountId ||
                acc.id === oldTransaction.accountId || acc.id === oldTransaction.toAccountId) {
                dbHelpers.updateAccount(acc.id, { balance: acc.balance }).catch(console.error);
            }
        });
    },

    deleteTransaction: (id) => {
        const state = get();
        const transaction = state.transactions.find((t) => t.id === id);
        if (!transaction) return;

        const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === transaction.accountId) {
                const newBalance =
                    transaction.type === 'income'
                        ? acc.balance - transaction.amount
                        : transaction.type === 'expense'
                            ? acc.balance + transaction.amount
                            : acc.balance + transaction.amount;
                return { ...acc, balance: newBalance };
            }
            if (transaction.type === 'transfer' && acc.id === transaction.toAccountId) {
                return { ...acc, balance: acc.balance - transaction.amount };
            }
            return acc;
        });

        set({
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
        });

        // Update in IndexedDB
        dbHelpers.deleteTransaction(id).catch(console.error);
        updatedAccounts.forEach(acc => {
            if (acc.id === transaction.accountId || acc.id === transaction.toAccountId) {
                dbHelpers.updateAccount(acc.id, { balance: acc.balance }).catch(console.error);
            }
        });
    },

    getAccountBalance: (accountId) => {
        const account = get().accounts.find((acc) => acc.id === accountId);
        return account?.balance || 0;
    },

    addCategory: (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        dbHelpers.addCategory(category).catch(console.error);
    },

    deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((cat) => cat.id !== id) }));
        dbHelpers.deleteCategory(id).catch(console.error);
    },

    addEvent: (event) => {
        set((state) => ({ events: [...state.events, event] }));
        dbHelpers.addEvent(event).catch(console.error);
    },

    updateEvent: (id, updates) => {
        set((state) => ({
            events: state.events.map((evt) => (evt.id === id ? { ...evt, ...updates } : evt)),
        }));
        dbHelpers.updateEvent(id, updates).catch(console.error);
    },

    deleteEvent: (id) => {
        set((state) => ({
            events: state.events.filter((evt) => evt.id !== id),
            // Remove eventId from transactions when event is deleted
            transactions: state.transactions.map((t) =>
                t.eventId === id ? { ...t, eventId: undefined } : t
            ),
        }));
        dbHelpers.deleteEvent(id).catch(console.error);
        // Update transactions in DB to remove eventId
        get().transactions
            .filter((t) => t.eventId === id)
            .forEach((t) => {
                dbHelpers.updateTransaction(t.id, { eventId: undefined }).catch(console.error);
            });
    },

    importData: async (data) => {
        try {
            // Clear existing data
            await db.accounts.clear();
            await db.transactions.clear();
            await db.categories.clear();

            // Import new data
            if (data.accounts?.length) await db.accounts.bulkPut(data.accounts);
            if (data.transactions?.length) await db.transactions.bulkPut(data.transactions);
            if (data.categories?.length) await db.categories.bulkPut(data.categories);
            if (data.events?.length) await db.events.bulkPut(data.events);

            // Update state
            set({
                accounts: data.accounts || [],
                transactions: data.transactions || [],
                categories: data.categories || [],
                events: data.events || []
            });

            console.log('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
        }
    },
}));
