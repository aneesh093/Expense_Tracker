import { create } from 'zustand';
import { type Account, type Transaction, type Category, type Event, type Mandate } from '../types';
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

    importData: (data: { accounts: Account[], transactions: Transaction[], categories: Category[], events?: Event[], mandates?: Mandate[] }) => void;

    // Mandates
    mandates: Mandate[];
    addMandate: (mandate: Mandate) => void;
    updateMandate: (id: string, updates: Partial<Mandate>) => void;
    deleteMandate: (id: string) => void;
    checkAndRunMandates: () => Promise<void>;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
    accounts: [],
    transactions: [],
    categories: [],
    events: [],
    mandates: [],
    isInitialized: false,
    isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false', // Default to true if not set

    // Initialize: Load data from IndexedDB and migrate from localStorage if needed
    initialize: async () => {
        try {
            // First, try to migrate from localStorage
            await migrateFromLocalStorage();

            // Load all data from IndexedDB
            const [accounts, transactions, categories, events, mandates] = await Promise.all([
                dbHelpers.getAllAccounts(),
                dbHelpers.getAllTransactions(),
                dbHelpers.getAllCategories(),
                dbHelpers.getAllEvents(),
                dbHelpers.getAllMandates()
            ]);

            set({
                accounts,
                transactions,
                categories,
                events,
                mandates,
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
                    // Logic for the SOURCE account
                    const isLoan = acc.type === 'loan';

                    const newBalance =
                        transaction.type === 'income'
                            ? acc.balance + transaction.amount // Income always increases balance (reduces debt for loan? No, income to loan is weird. Let's assume income adds to balance)
                            : transaction.type === 'expense'
                                ? acc.balance + (isLoan ? transaction.amount : -transaction.amount) // Expense: Loan increases (more debt), Savings decreases
                                : acc.balance + (isLoan ? transaction.amount : -transaction.amount); // Transfer Out: Same as expense
                    return { ...acc, balance: newBalance };
                }
                if (transaction.type === 'transfer' && acc.id === transaction.toAccountId) {
                    // Logic for the DESTINATION account
                    const isLoan = acc.type === 'loan';
                    // Transfer IN: Savings increases, Loan decreases (Repayment)
                    return { ...acc, balance: acc.balance + (isLoan ? -transaction.amount : transaction.amount) };
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
                const isLoan = acc.type === 'loan';
                // Revert Source
                const revertedBalance =
                    oldTransaction.type === 'income'
                        ? acc.balance - oldTransaction.amount
                        : oldTransaction.type === 'expense'
                            ? acc.balance - (isLoan ? oldTransaction.amount : -oldTransaction.amount)
                            : acc.balance - (isLoan ? oldTransaction.amount : -oldTransaction.amount);
                return { ...acc, balance: revertedBalance };
            }
            if (oldTransaction.type === 'transfer' && acc.id === oldTransaction.toAccountId) {
                const isLoan = acc.type === 'loan';
                // Revert Destination
                return { ...acc, balance: acc.balance - (isLoan ? -oldTransaction.amount : oldTransaction.amount) };
            }
            return acc;
        });

        // Apply new transaction effects
        updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === updatedTransaction.accountId) {
                const isLoan = acc.type === 'loan';
                // Apply Source
                const newBalance =
                    updatedTransaction.type === 'income'
                        ? acc.balance + updatedTransaction.amount
                        : updatedTransaction.type === 'expense'
                            ? acc.balance + (isLoan ? updatedTransaction.amount : -updatedTransaction.amount)
                            : acc.balance + (isLoan ? updatedTransaction.amount : -updatedTransaction.amount);
                return { ...acc, balance: newBalance };
            }
            if (updatedTransaction.type === 'transfer' && acc.id === updatedTransaction.toAccountId) {
                const isLoan = acc.type === 'loan';
                // Apply Destination
                return { ...acc, balance: acc.balance + (isLoan ? -updatedTransaction.amount : updatedTransaction.amount) };
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
                const isLoan = acc.type === 'loan';
                // Revert Source (Same as Revert in edit)
                const newBalance =
                    transaction.type === 'income'
                        ? acc.balance - transaction.amount
                        : transaction.type === 'expense'
                            ? acc.balance - (isLoan ? transaction.amount : -transaction.amount) // Undo expense: Loan decreases, Savings increases
                            : acc.balance - (isLoan ? transaction.amount : -transaction.amount);
                return { ...acc, balance: newBalance };
            }
            if (transaction.type === 'transfer' && acc.id === transaction.toAccountId) {
                const isLoan = acc.type === 'loan';
                // Revert Destination (Same as Revert in edit)
                // Undo transfer in: Savings decreases, Loan increases (Debt returns)
                return { ...acc, balance: acc.balance - (isLoan ? -transaction.amount : transaction.amount) };
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
            await db.events.clear();
            await db.mandates.clear();

            // Import new data
            if (data.accounts?.length) await db.accounts.bulkPut(data.accounts);
            if (data.transactions?.length) await db.transactions.bulkPut(data.transactions);
            if (data.categories?.length) await db.categories.bulkPut(data.categories);
            if (data.events?.length) await db.events.bulkPut(data.events);
            if (data.mandates?.length) await db.mandates.bulkPut(data.mandates);

            // Update state
            set({
                accounts: data.accounts || [],
                transactions: data.transactions || [],
                categories: data.categories || [],
                events: data.events || [],
                mandates: data.mandates || []
            });

            console.log('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
        }
    },

    addMandate: (mandate) => {
        set((state) => ({ mandates: [...state.mandates, mandate] }));
        dbHelpers.addMandate(mandate).catch(console.error);
    },

    updateMandate: (id, updates) => {
        set((state) => ({
            mandates: state.mandates.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        dbHelpers.updateMandate(id, updates).catch(console.error);
    },

    deleteMandate: (id) => {
        set((state) => ({ mandates: state.mandates.filter((m) => m.id !== id) }));
        dbHelpers.deleteMandate(id).catch(console.error);
    },

    checkAndRunMandates: async () => {
        const state = get();
        const today = new Date();
        const currentDay = today.getDate();
        const dateString = today.toISOString().split('T')[0];

        const mandatesToRun = state.mandates.filter(m =>
            m.isEnabled &&
            m.dayOfMonth === currentDay &&
            m.lastRunDate !== dateString
        );

        if (mandatesToRun.length === 0) return;

        console.log(`Running ${mandatesToRun.length} mandates...`);

        for (const mandate of mandatesToRun) {
            // Create transaction
            const transaction: Transaction = {
                id: crypto.randomUUID(),
                accountId: mandate.sourceAccountId,
                toAccountId: mandate.destinationAccountId,
                amount: mandate.amount,
                type: 'transfer',
                category: 'Transfer',
                date: new Date().toISOString(),
                note: `Mandate: ${mandate.description}`,
            };

            // Add transaction (this handles balances)
            get().addTransaction(transaction);

            // Update mandate lastRunDate
            get().updateMandate(mandate.id, { lastRunDate: dateString });

            // If destination is a Loan account, reduce EMIs left
            const destAccount = get().accounts.find(a => a.id === mandate.destinationAccountId);
            if (destAccount?.type === 'loan' && destAccount.loanDetails) {
                const currentEmis = destAccount.loanDetails.emisLeft;
                if (currentEmis > 0) {
                    get().updateAccount(destAccount.id, {
                        loanDetails: {
                            ...destAccount.loanDetails,
                            emisLeft: currentEmis - 1
                        }
                    });
                }
            }
        }
    }
}));
