import { create } from 'zustand';
import { type Account, type AccountType, type Transaction, type Category, type Event, type Mandate, type AuditTrail, type InvestmentLog, type EventLog, type EventPlan } from '../types';
import { db, dbHelpers, migrateFromLocalStorage } from '../lib/db';

interface FinanceState {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    events: Event[];
    isInitialized: boolean;
    isBalanceHidden: boolean;
    isAccountsBalanceHidden: boolean;
    auditTrails: AuditTrail[];
    investmentLogs: InvestmentLog[];
    eventLogs: EventLog[];
    eventPlans: EventPlan[];
    showEventsInReport: boolean;
    showManualInReport: boolean;
    pdfIncludeCharts: boolean;
    pdfIncludeAccountSummary: boolean;
    pdfIncludeTransactions: boolean;
    pdfIncludeEventSummary: boolean;

    // Initialize store from IndexedDB
    initialize: () => Promise<void>;

    addInvestmentLog: (log: InvestmentLog) => void;
    deleteInvestmentLog: (id: string, reason?: string) => void;

    addEventLog: (log: EventLog) => void;
    updateEventLog: (id: string, updates: Partial<EventLog>) => void;
    deleteEventLog: (id: string) => void;

    addEventPlan: (plan: EventPlan) => void;
    updateEventPlan: (id: string, updates: Partial<EventPlan>) => void;
    deleteEventPlan: (id: string) => void;

    toggleBalanceHidden: () => void;
    setBalanceHidden: (hidden: boolean) => void;
    toggleAccountsBalanceHidden: () => void;
    toggleAccountReportInclusion: (id: string) => void;
    toggleEventReportInclusion: (id: string) => void;

    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    deleteAccount: (id: string) => void;

    addTransaction: (transaction: Transaction) => void;
    editTransaction: (id: string, updatedTransaction: Transaction) => void;
    deleteTransaction: (id: string) => void;

    getAccountBalance: (accountId: string) => number;

    addCategory: (category: Category) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    addEvent: (event: Event) => void;
    updateEvent: (id: string, updates: Partial<Event>) => void;
    deleteEvent: (id: string) => void;

    getCreditCardStats: (accountId: string) => { unbilled: number; billed: number; totalDue: number };

    importData: (data: { accounts: Account[], transactions: Transaction[], categories: Category[], events?: Event[], mandates?: Mandate[], auditTrails?: AuditTrail[], investmentLogs?: InvestmentLog[], eventLogs?: EventLog[], eventPlans?: EventPlan[] }) => void;

    // Mandates
    mandates: Mandate[];
    addMandate: (mandate: Mandate) => void;
    updateMandate: (id: string, updates: Partial<Mandate>) => void;
    deleteMandate: (id: string) => void;
    runMandate: (id: string) => Promise<void>;
    skipMandate: (id: string) => Promise<void>;
    checkAndRunMandates: () => Promise<void>;
    reorderList: (type: 'accounts' | 'categories' | 'events' | 'mandates', newOrderIds: string[]) => void;

    // Account Type Visibility for Net Worth
    // Stores type keys like "credit", "land", "banking-other", "investment-other"
    hiddenAccountTypes: string[];
    toggleAccountTypeVisibility: (type: AccountType, group?: 'banking' | 'investment') => void;
    isAccountTypeHidden: (type: AccountType, group?: 'banking' | 'investment') => boolean;

    reportSortBy: 'date' | 'amount';
    setReportSortBy: (sortBy: 'date' | 'amount') => void;
    setShowEventsInReport: (show: boolean) => void;
    setShowManualInReport: (show: boolean) => void;
    setPdfIncludeCharts: (show: boolean) => void;
    setPdfIncludeAccountSummary: (show: boolean) => void;
    setPdfIncludeTransactions: (show: boolean) => void;
    setPdfIncludeEventSummary: (show: boolean) => void;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
    accounts: [],
    transactions: [],
    categories: [],
    events: [],
    mandates: [],
    auditTrails: [],
    investmentLogs: [],
    eventLogs: [],
    eventPlans: [],
    isInitialized: false,
    isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false', // Default to true if not set
    isAccountsBalanceHidden: localStorage.getItem('finance-accounts-privacy-mode') === 'true', // Default to false
    hiddenAccountTypes: JSON.parse(localStorage.getItem('finance-hidden-account-types') || '["credit","land","insurance"]'),
    reportSortBy: (localStorage.getItem('finance-report-sort-by') as 'date' | 'amount') || 'date',
    showEventsInReport: localStorage.getItem('finance-show-events-in-report') !== 'false',
    showManualInReport: localStorage.getItem('finance-show-manual-in-report') !== 'false',
    pdfIncludeCharts: localStorage.getItem('finance-pdf-include-charts') !== 'false',
    pdfIncludeAccountSummary: localStorage.getItem('finance-pdf-include-account-summary') !== 'false',
    pdfIncludeTransactions: localStorage.getItem('finance-pdf-include-transactions') !== 'false',
    pdfIncludeEventSummary: localStorage.getItem('finance-pdf-include-event-summary') !== 'false',

    isAccountTypeHidden: (type, group) => {
        const state = get();
        // For 'other' type, check group-specific key
        if (type === 'other' && group) {
            return state.hiddenAccountTypes.includes(`${group}-other`);
        }
        // For all other types, check the type directly
        return state.hiddenAccountTypes.includes(type);
    },

    toggleAccountTypeVisibility: (type, group) => {
        set((state) => {
            // For 'other' type, use group-specific key
            const key = (type === 'other' && group) ? `${group}-other` : type;
            const isHidden = state.hiddenAccountTypes.includes(key);
            const newHiddenTypes = isHidden
                ? state.hiddenAccountTypes.filter((t) => t !== key)
                : [...state.hiddenAccountTypes, key];

            localStorage.setItem('finance-hidden-account-types', JSON.stringify(newHiddenTypes));
            return { hiddenAccountTypes: newHiddenTypes };
        });
    },

    // Initialize: Load data from IndexedDB and migrate from localStorage if needed
    initialize: async () => {
        try {
            // First, try to migrate from localStorage
            await migrateFromLocalStorage();

            // Load all data from IndexedDB
            const [accounts, transactions, categories, events, mandates, auditTrails, investmentLogs, eventLogs, eventPlans] = await Promise.all([
                dbHelpers.getAllAccounts(),
                dbHelpers.getAllTransactions(),
                dbHelpers.getAllCategories(),
                dbHelpers.getAllEvents(),
                dbHelpers.getAllMandates(),
                dbHelpers.getAllAuditTrails(),
                dbHelpers.getInvestmentLogs(),
                dbHelpers.getAllEventLogs(),
                dbHelpers.getAllEventPlans()
            ]);

            set({
                accounts,
                transactions,
                categories,
                events,
                mandates,
                auditTrails,
                investmentLogs,
                eventLogs,
                eventPlans,
                isInitialized: true,
                isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false',
                isAccountsBalanceHidden: localStorage.getItem('finance-accounts-privacy-mode') === 'true',
                reportSortBy: (localStorage.getItem('finance-report-sort-by') as 'date' | 'amount') || 'date'
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

    toggleAccountsBalanceHidden: () => {
        set((state) => {
            const newState = !state.isAccountsBalanceHidden;
            localStorage.setItem('finance-accounts-privacy-mode', newState.toString());
            return { isAccountsBalanceHidden: newState };
        });
    },

    toggleAccountReportInclusion: (id: string) => {
        set((state) => {
            const updatedAccounts = state.accounts.map((acc) =>
                acc.id === id ? { ...acc, includeInReports: acc.includeInReports === false } : acc
            );
            const account = updatedAccounts.find(a => a.id === id);
            if (account) {
                dbHelpers.updateAccount(id, { includeInReports: account.includeInReports }).catch(console.error);
            }
            return { accounts: updatedAccounts };
        });
    },

    toggleEventReportInclusion: (id: string) => {
        set((state) => {
            const updatedEvents = state.events.map((ev) =>
                ev.id === id ? { ...ev, includeInReports: ev.includeInReports === false } : ev
            );
            const event = updatedEvents.find(e => e.id === id);
            if (event) {
                dbHelpers.updateEvent(id, { includeInReports: event.includeInReports }).catch(console.error);
            }
            return { events: updatedEvents };
        });
    },

    addAccount: (account) => {
        set((state) => {
            const order = state.accounts.length;
            const newAccount = { ...account, order };
            dbHelpers.addAccount(newAccount).catch(console.error);
            return { accounts: [...state.accounts, newAccount] };
        });
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

            // If transaction is excluded from balance, don't update accounts
            if (transaction.excludeFromBalance) {
                return { transactions: newTransactions };
            }

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

        // Audit Trail
        const auditTrail: AuditTrail = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'create',
            entityType: 'transaction',
            entityId: transaction.id,
            details: {
                current: transaction
            }
        };
        set((state) => ({ auditTrails: [auditTrail, ...state.auditTrails] }));
        dbHelpers.addAuditTrail(auditTrail).catch(console.error);

        dbHelpers.addTransaction(transaction).catch(console.error);
    },

    editTransaction: (id, updatedTransaction) => {
        const state = get();
        const oldTransaction = state.transactions.find((t) => t.id === id);
        if (!oldTransaction) return;

        // Revert old transaction effects if it was impacting balance
        let updatedAccounts = state.accounts;
        if (!oldTransaction.excludeFromBalance) {
            updatedAccounts = state.accounts.map((acc) => {
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
        }

        // Apply new transaction effects if it's impacting balance
        if (!updatedTransaction.excludeFromBalance) {
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
        }

        set({
            transactions: state.transactions.map((t) => (t.id === id ? updatedTransaction : t)),
            accounts: updatedAccounts,
        });

        // Audit Trail
        const auditTrail: AuditTrail = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'update',
            entityType: 'transaction',
            entityId: id,
            details: {
                previous: oldTransaction,
                current: updatedTransaction
            }
        };
        set((state) => ({ auditTrails: [auditTrail, ...state.auditTrails] }));
        dbHelpers.addAuditTrail(auditTrail).catch(console.error);

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
            // Only revert if transaction was impacting balance
            if (transaction.excludeFromBalance) return acc;

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

        // Audit Trail
        const auditTrail: AuditTrail = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'delete',
            entityType: 'transaction',
            entityId: id,
            details: {
                previous: transaction
            }
        };
        set((state) => ({ auditTrails: [auditTrail, ...state.auditTrails] }));
        dbHelpers.addAuditTrail(auditTrail).catch(console.error);

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
        set((state) => {
            const order = state.categories.length;
            const newCategory = { ...category, order };
            dbHelpers.addCategory(newCategory).catch(console.error);
            return { categories: [...state.categories, newCategory] };
        });
    },

    updateCategory: (id, updates) => {
        set((state) => ({
            categories: state.categories.map((cat) =>
                cat.id === id ? { ...cat, ...updates } : cat
            )
        }));
        dbHelpers.updateCategory(id, updates).catch(console.error);
    },

    deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((cat) => cat.id !== id) }));
        dbHelpers.deleteCategory(id).catch(console.error);
    },

    addEvent: (event) => {
        set((state) => {
            const order = state.events.length;
            const newEvent = { ...event, order };
            dbHelpers.addEvent(newEvent).catch(console.error);
            return { events: [...state.events, newEvent] };
        });
    },

    updateEvent: (id, updates) => {
        set((state) => ({
            events: state.events.map((evt) => (evt.id === id ? { ...evt, ...updates } : evt)),
        }));
        dbHelpers.updateEvent(id, updates).catch(console.error);
    },

    deleteEvent: (id) => {
        const state = get();
        const transactionsToUpdate = state.transactions.filter(t => t.eventId === id);

        set((state) => ({
            events: state.events.filter((evt) => evt.id !== id),
            transactions: state.transactions.map((t) =>
                t.eventId === id ? { ...t, eventId: undefined } : t
            ),
        }));

        dbHelpers.deleteEvent(id).catch(console.error);
        transactionsToUpdate.forEach((t) => {
            dbHelpers.updateTransaction(t.id, { eventId: undefined }).catch(console.error);
        });
    },

    getCreditCardStats: (accountId) => {
        const state = get();
        const account = state.accounts.find(a => a.id === accountId);
        if (!account || account.type !== 'credit' || !account.creditCardDetails) {
            return { unbilled: 0, billed: 0, totalDue: account?.balance || 0 };
        }

        const { statementDate } = account.creditCardDetails;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Calculate Last Statement Date
        let lastStatementDate = new Date(currentYear, currentMonth, statementDate, 23, 59, 59);
        if (today.getDate() < statementDate) {
            lastStatementDate = new Date(currentYear, currentMonth - 1, statementDate, 23, 59, 59);
        }

        const prevStatementDate = new Date(lastStatementDate.getFullYear(), lastStatementDate.getMonth() - 1, lastStatementDate.getDate(), 23, 59, 59);

        // Helper to get net impact on debt (positive = increases debt, negative = reduces debt)
        const getImpact = (t: Transaction) => {
            if (t.excludeFromBalance) return 0;
            if (t.accountId === accountId) {
                // Outgoing: Expense/Transfer increases debt, Income (Refund) reduces it
                return (t.type === 'expense' || t.type === 'transfer') ? t.amount : (t.type === 'income' ? -t.amount : 0);
            }
            if (t.toAccountId === accountId) {
                // Incoming: Transfer In reduces debt
                return -t.amount;
            }
            return 0;
        };

        // 1. Calculate Billed Balance: Net impact of transactions in the previous statement cycle
        const billedTransactions = state.transactions.filter(t => {
            const d = new Date(t.date);
            return d > prevStatementDate && d <= lastStatementDate;
        });

        const billedBalance = billedTransactions.reduce((sum, t) => sum + getImpact(t), 0);

        // 2. Separate Post-Statement Credits and Debits
        const postStatementTransactions = state.transactions.filter(t => new Date(t.date) > lastStatementDate);

        // Credits (Income/Transfers In) since statement
        const postCredits = postStatementTransactions.reduce((sum, t) => {
            const impact = getImpact(t);
            return impact < 0 ? sum + Math.abs(impact) : sum;
        }, 0);

        // Debits (Expenses/Transfers Out) since statement
        const postDebts = postStatementTransactions.reduce((sum, t) => {
            const impact = getImpact(t);
            return impact > 0 ? sum + impact : sum;
        }, 0);

        // 3. Final Calculation
        const remainingBilled = billedBalance - postCredits;
        const billed = Math.max(0, remainingBilled);
        const excessCredit = Math.max(0, -remainingBilled);

        // Apply any excess credit (overpayments or net refunds) to unbilled debits
        const unbilled = Math.max(0, postDebts - excessCredit);

        return {
            unbilled,
            billed,
            totalDue: account.balance
        };
    },

    importData: async (data: { accounts: Account[], transactions: Transaction[], categories: Category[], events?: Event[], mandates?: Mandate[], auditTrails?: AuditTrail[], investmentLogs?: InvestmentLog[], eventLogs?: EventLog[] }) => {
        try {
            // Clear existing data
            await db.accounts.clear();
            await db.transactions.clear();
            await db.categories.clear();
            await db.events.clear();
            await db.mandates.clear();
            await db.auditTrails.clear();
            await db.investmentLogs.clear();
            await db.eventLogs.clear();

            // Import new data
            if (data.accounts?.length) await db.accounts.bulkPut(data.accounts);
            if (data.transactions?.length) await db.transactions.bulkPut(data.transactions);
            if (data.categories?.length) await db.categories.bulkPut(data.categories);
            if (data.events?.length) await db.events.bulkPut(data.events);
            if (data.mandates?.length) await db.mandates.bulkPut(data.mandates);
            if (data.auditTrails?.length) await db.auditTrails.bulkPut(data.auditTrails);
            if (data.investmentLogs?.length) await db.investmentLogs.bulkPut(data.investmentLogs);
            if (data.eventLogs?.length) await db.eventLogs.bulkPut(data.eventLogs);

            // Update state
            set({
                accounts: data.accounts || [],
                transactions: data.transactions || [],
                categories: data.categories || [],
                events: data.events || [],
                mandates: data.mandates || [],
                auditTrails: data.auditTrails || [],
                investmentLogs: data.investmentLogs || [],
                eventLogs: data.eventLogs || []
            });

            console.log('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
        }
    },

    addMandate: (mandate) => {
        set((state) => {
            const order = state.mandates.length;
            const newMandate = { ...mandate, order };
            dbHelpers.addMandate(newMandate).catch(console.error);
            return { mandates: [...state.mandates, newMandate] };
        });
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
        const currentMonthYear = dateString.substring(0, 7); // YYYY-MM

        const mandatesToRun = state.mandates.filter(m =>
            m.isEnabled &&
            m.dayOfMonth === currentDay &&
            m.lastRunDate?.substring(0, 7) !== currentMonthYear &&
            m.lastSkippedDate?.substring(0, 7) !== currentMonthYear
        );

        if (mandatesToRun.length === 0) return;

        console.log(`Running ${mandatesToRun.length} mandates...`);

        for (const mandate of mandatesToRun) {
            await get().runMandate(mandate.id);
        }
    },

    runMandate: async (id) => {
        const state = get();
        const mandate = state.mandates.find(m => m.id === id);
        if (!mandate) return;

        const dateString = new Date().toISOString().split('T')[0];

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
    },

    skipMandate: async (id) => {
        const dateString = new Date().toISOString().split('T')[0];
        get().updateMandate(id, { lastSkippedDate: dateString });
    },

    addInvestmentLog: (log) => {
        set((state) => ({ investmentLogs: [log, ...state.investmentLogs] }));
        dbHelpers.addInvestmentLog(log).catch(console.error);
    },

    deleteInvestmentLog: (id, reason) => {
        const state = get();
        const log = state.investmentLogs.find(l => l.id === id);
        if (!log) return;

        // Remove from state
        set((state) => ({ investmentLogs: state.investmentLogs.filter(l => l.id !== id) }));

        // Create Audit Trail
        const auditTrail: AuditTrail = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action: 'delete',
            entityType: 'investment-log',
            entityId: id,
            details: { previous: log },
            note: reason
        };

        set((state) => ({ auditTrails: [auditTrail, ...state.auditTrails] }));
        dbHelpers.addAuditTrail(auditTrail).catch(console.error);

        // Remove from DB
        dbHelpers.deleteInvestmentLog(id).catch(console.error);
    },

    reorderList: (type, newOrderIds) => {
        const state = get();
        const items = state[type] as any[];

        // Create a map for O(1) lookups
        const idToOrder = new Map<string, number>();
        newOrderIds.forEach((id, index) => {
            idToOrder.set(id, index);
        });

        // Update items with new order values
        // We only update items that are part of the reordered list to avoid touching others
        // But for safety, if we are reordering a full list, we just map everything.
        // The previous logic was: "Only process items that are in the newOrderIds list"

        const updatedItems = items.map(item => {
            if (idToOrder.has(item.id)) {
                return { ...item, order: idToOrder.get(item.id) };
            }
            return item;
        });

        set({ [type]: updatedItems } as any);

        // Update DB
        newOrderIds.forEach((id, index) => {
            if (type === 'accounts') dbHelpers.updateAccount(id, { order: index }).catch(console.error);
            else if (type === 'categories') dbHelpers.updateCategory(id, { order: index }).catch(console.error);
            else if (type === 'events') dbHelpers.updateEvent(id, { order: index }).catch(console.error);
            else if (type === 'mandates') dbHelpers.updateMandate(id, { order: index }).catch(console.error);
        });
    },

    addEventLog: (log) => {
        set((state) => ({ eventLogs: [log, ...state.eventLogs] }));
        dbHelpers.addEventLog(log).catch(console.error);
    },

    updateEventLog: (id, updates) => {
        set((state) => ({
            eventLogs: state.eventLogs.map((log) => (log.id === id ? { ...log, ...updates } : log)),
        }));
        dbHelpers.updateEventLog(id, updates).catch(console.error);
    },

    deleteEventLog: (id) => {
        set((state) => ({ eventLogs: state.eventLogs.filter((log) => log.id !== id) }));
        dbHelpers.deleteEventLog(id).catch(console.error);
    },

    addEventPlan: (plan) => {
        set((state) => ({ eventPlans: [plan, ...state.eventPlans] }));
        dbHelpers.addEventPlan(plan).catch(console.error);
    },

    updateEventPlan: (id, updates) => {
        set((state) => ({
            eventPlans: state.eventPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        dbHelpers.updateEventPlan(id, updates).catch(console.error);
    },

    deleteEventPlan: (id) => {
        set((state) => ({ eventPlans: state.eventPlans.filter((p) => p.id !== id) }));
        dbHelpers.deleteEventPlan(id).catch(console.error);
    },

    setReportSortBy: (sortBy) => {
        localStorage.setItem('finance-report-sort-by', sortBy);
        set({ reportSortBy: sortBy });
    },

    setShowEventsInReport: (show) => {
        localStorage.setItem('finance-show-events-in-report', String(show));
        set({ showEventsInReport: show });
    },

    setShowManualInReport: (show) => {
        localStorage.setItem('finance-show-manual-in-report', String(show));
        set({ showManualInReport: show });
    },

    setPdfIncludeCharts: (show) => {
        localStorage.setItem('finance-pdf-include-charts', String(show));
        set({ pdfIncludeCharts: show });
    },

    setPdfIncludeAccountSummary: (show) => {
        localStorage.setItem('finance-pdf-include-account-summary', String(show));
        set({ pdfIncludeAccountSummary: show });
    },

    setPdfIncludeTransactions: (show) => {
        localStorage.setItem('finance-pdf-include-transactions', String(show));
        set({ pdfIncludeTransactions: show });
    },

    setPdfIncludeEventSummary: (show) => {
        localStorage.setItem('finance-pdf-include-event-summary', String(show));
        set({ pdfIncludeEventSummary: show });
    },
}));
