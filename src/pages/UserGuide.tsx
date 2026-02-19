import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, BookOpen, CreditCard, ArrowRightLeft, Calendar, FileText, Settings as InterfaceSettings, Clock } from 'lucide-react';

export function UserGuide() {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Dashboard',
            icon: <Home size={20} />,
            color: 'bg-blue-100 text-blue-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Net Worth:</strong> Your total financial health. Swipe or check settings to include/exclude specific assets (like Land or Insurance).</li>
                    <li><strong>Privacy Mode:</strong> Tap the eye icon to hide/show balances. This setting persists across the app.</li>
                    <li><strong>Quick Stats:</strong> View monthly Income, Expense, and Today's Spend at a glance.</li>
                    <li><strong>Recent Activity:</strong> Showing your latest 5 transactions.</li>
                </ul>
            )
        },
        {
            title: 'Accounts',
            icon: <CreditCard size={20} />,
            color: 'bg-green-100 text-green-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Manage Accounts:</strong> Add Bank Accounts, Wallets, Credit Cards, Loans, and Investments.</li>
                    <li><strong>Credit Cards:</strong> For credit cards, the displayed amount is the "Spent" amount (total debt), not available credit.</li>
                    <li><strong>Primary Accounts:</strong> Mark accounts as "Primary" to feature their transactions on the Dashboard.</li>
                    <li><strong>Hide Balances:</strong> You can hide specific account balances from the main list for privacy.</li>
                </ul>
            )
        },
        {
            title: 'Transactions',
            icon: <ArrowRightLeft size={20} />,
            color: 'bg-orange-100 text-orange-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Add New:</strong> Tap the "+" button to log Income, Expense, or Transfers.</li>
                    <li><strong>Transfers:</strong> Moving money between your own accounts (e.g., Bank to Wallet) doesn't affect your Net Worth.</li>
                    <li><strong>Categories:</strong> Organizes your spending. You can manage custom categories in Settings.</li>
                </ul>
            )
        },
        {
            title: 'Mandates',
            icon: <Clock size={20} />,
            color: 'bg-teal-100 text-teal-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Recurring Transactions:</strong> Set up automatic tracking for improved regularity (e.g., Rent, Netflix).</li>
                    <li><strong>Auto-Debit:</strong> Enable "Auto-Debit" to automatically deduct the amount from your chosen account on the due date.</li>
                    <li><strong>Smart Skipping:</strong> If you've already paid a bill manually, the system can prompt you to skip the upcoming mandate to avoid duplicates.</li>
                </ul>
            )
        },
        {
            title: 'Events & Plans',
            icon: <Calendar size={20} />,
            color: 'bg-purple-100 text-purple-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Events:</strong> Track spending for specific occasions like "Trip to Goa" or "Wedding".</li>
                    <li><strong>Budgeting:</strong> Set a budget for an event and track expenses against it.</li>
                    <li><strong>Event Plans:</strong> Create rudimentary plans or checklists associated with an event.</li>
                </ul>
            )
        },
        {
            title: 'Reports',
            icon: <FileText size={20} />,
            color: 'bg-pink-100 text-pink-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Monthly Reports:</strong> Select a month to see a breakdown of Income vs. Expense.</li>
                    <li><strong>Category Breakdown:</strong> See exactly where your money went (e.g., Food, Travel).</li>
                    <li><strong>PDF Export:</strong> Download detailed monthly reports including transaction lists and summaries.</li>
                </ul>
            )
        },
        {
            title: 'Settings & Backup',
            icon: <InterfaceSettings size={20} />,
            color: 'bg-gray-100 text-gray-600',
            content: (
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-1">
                    <li><strong>Display Settings:</strong> Customize what you see, such as hiding specific account types from Net Worth.</li>
                    <li><strong>Backup & Restore:</strong> Manually export your data to a JSON file or enable Auto-Backup.</li>
                    <li><strong>Restore:</strong> Import a previously saved backup file to restore your data. <strong>Warning:</strong> This overwrites current data.</li>
                </ul>
            )
        }
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-xl font-bold text-gray-900">User Guide</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                    <BookOpen className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-blue-800">Welcome to Finance App!</h3>
                        <p className="text-xs text-blue-600 mt-1">
                            Here is a quick overview of how to get the most out of your personal finance tracker.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <section key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${section.color}`}>
                                    {section.icon}
                                </div>
                                <h2 className="font-bold text-gray-800">{section.title}</h2>
                            </div>
                            <div className="p-4 bg-gray-50/50">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
