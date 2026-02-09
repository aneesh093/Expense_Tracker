import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Transaction, Account, Category, Event, EventLog } from '../types';

interface ReportData {
    title: string;
    period: string;
    totalIncome: number;
    totalExpense: number;
    totalInvestment: number;
    manualTotalExpense?: number;
    totalTransferIn?: number;
    totalTransferOut?: number;
    totalCreditCardPayment?: number;
    totalLoanRepayment?: number;
    transactions: Transaction[];
    eventLogs: EventLog[];
    accounts: Account[];
    allAccounts?: Account[]; // Added for name lookup of excluded accounts
    categories: Category[]; // To look up names if needed
    events: Event[];
    chartData: { name: string; value: number; color: string }[];
    manualChartData?: { name: string; value: number; color: string }[];
    openingBalances: Record<string, number>;
    exportOptions?: {
        includeCharts: boolean;
        includeAccountSummary: boolean;
        includeTransactions: boolean;
        includeEventSummary: boolean;
    };
}

const drawBarChart = (doc: jsPDF, data: { name: string; value: number; color: string }[], startX: number, startY: number, width: number, title: string = 'Expense Breakdown') => {
    let currentY = startY;

    // Check if title and at least one bar can fit, else add page
    if (currentY > 260) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55); // Gray 800
    doc.text(title, startX, currentY - 5);

    const maxValue = Math.max(...data.map(d => d.value));

    data.forEach(item => {
        // Check if this specific bar fits
        if (currentY > 280) {
            doc.addPage();
            currentY = 20;
            // Redraw title on new page if it's the same chart continuing
            doc.setFontSize(10);
            doc.setTextColor(31, 41, 55);
            doc.text(`${title} (cont.)`, startX, currentY - 5);
        }

        const barWidth = maxValue > 0 ? (item.value / maxValue) * (width - 60) : 0;

        // Label
        doc.setFontSize(8);
        doc.setTextColor(75, 85, 99); // Gray 600
        doc.text(item.name, startX, currentY + 4);

        // Bar
        doc.setFillColor(item.color);
        doc.rect(startX + 40, currentY, Math.max(0.5, barWidth), 5, 'F');

        // Value
        doc.setTextColor(31, 41, 55);
        doc.text(item.value.toLocaleString('en-IN'), startX + 40 + barWidth + 2, currentY + 4);

        currentY += 8;
    });

    return currentY + 10; // Return new Y position
};

export const generateReportPDF = (data: ReportData) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text(`${data.title} - ${data.period}`, 14, 22);

    // Summary Section
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 28);

    // Summary boxes
    const boxWidth = 60;
    const boxHeight = 22;
    const startY = 32;

    // Income
    doc.setFillColor(240, 253, 244);
    doc.rect(14, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(9);
    doc.text('Total Income', 20, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalIncome.toLocaleString('en-IN')}`, 20, startY + 16);

    // Expense
    doc.setFillColor(254, 242, 242);
    doc.rect(77, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(9);
    doc.text('Total Expense', 83, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalExpense.toLocaleString('en-IN')}`, 83, startY + 16);

    // Investment
    doc.setFillColor(250, 245, 255);
    doc.rect(140, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(107, 33, 168);
    doc.setFontSize(9);
    doc.text('Total Invested', 146, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalInvestment.toLocaleString('en-IN')}`, 146, startY + 16);

    let summaryEndY = startY + boxHeight + 5;

    // Second Row for Manual Expenses, Credit Card Payments & Loan Repayments (if applicable)
    if ((data.manualTotalExpense && data.manualTotalExpense > 0) ||
        (data.totalCreditCardPayment && data.totalCreditCardPayment > 0) ||
        (data.totalLoanRepayment && data.totalLoanRepayment > 0)) {
        const secondRowY = summaryEndY;
        let currentX = 14;

        // Manual Expenses
        if (data.manualTotalExpense && data.manualTotalExpense > 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(currentX, secondRowY, boxWidth, boxHeight, 'F');
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(9);
            doc.text('Manual Expense', currentX + 6, secondRowY + 7);
            doc.setFontSize(12);
            doc.text(`INR ${data.manualTotalExpense.toLocaleString('en-IN')}`, currentX + 6, secondRowY + 16);
            currentX += boxWidth + 3;
        }

        // Credit Card Payments
        if (data.totalCreditCardPayment && data.totalCreditCardPayment > 0) {
            doc.setFillColor(238, 242, 255);
            doc.rect(currentX, secondRowY, boxWidth, boxHeight, 'F');
            doc.setTextColor(67, 56, 202);
            doc.setFontSize(9);
            doc.text('Credit Card Payments', currentX + 6, secondRowY + 7);
            doc.setFontSize(12);
            doc.text(`INR ${data.totalCreditCardPayment.toLocaleString('en-IN')}`, currentX + 6, secondRowY + 16);
            currentX += boxWidth + 3;
        }

        // Loan Repayments
        if (data.totalLoanRepayment && data.totalLoanRepayment > 0) {
            doc.setFillColor(204, 251, 241); // Teal 100
            doc.rect(currentX, secondRowY, boxWidth, boxHeight, 'F');
            doc.setTextColor(15, 118, 110); // Teal 800
            doc.setFontSize(9);
            doc.text('Loan Repayments', currentX + 6, secondRowY + 7);
            doc.setFontSize(12);
            doc.text(`INR ${data.totalLoanRepayment.toLocaleString('en-IN')}`, currentX + 6, secondRowY + 16);
        }

        summaryEndY = secondRowY + boxHeight + 5;
    }

    // Core chart
    let currentY = summaryEndY + 10;
    if (data.exportOptions?.includeCharts !== false && data.chartData && data.chartData.length > 0) {
        currentY = drawBarChart(doc, data.chartData, 14, currentY, 180, 'Expense Breakdown');
    }

    // Account Summary Table (New Section)
    if (data.exportOptions?.includeAccountSummary) {
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY += 10;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Account Summary', 14, currentY);
        currentY += 10;

        const groups = ['banking', 'investment'] as const;
        groups.forEach(groupName => {
            const groupAccounts = data.accounts.filter(acc => {
                if (acc.group) return acc.group === groupName;
                const isInvestmentType = ['stock', 'mutual-fund', 'land', 'insurance'].includes(acc.type);
                const derivedGroup = isInvestmentType ? 'investment' : 'banking';
                return derivedGroup === groupName;
            });

            if (groupAccounts.length === 0) return;

            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            doc.text(`${groupName.charAt(0).toUpperCase() + groupName.slice(1)} Summary`, 14, currentY);
            currentY += 5;

            const groupSummaryBody = groupAccounts.map(acc => {
                const accTransactions = data.transactions.filter(t =>
                    !t.excludeFromBalance && (t.accountId === acc.id || t.toAccountId === acc.id)
                );

                const initialAmount = data.openingBalances[acc.id] || 0;
                const income = accTransactions.reduce((sum, t) => t.accountId === acc.id && t.type === 'income' ? sum + t.amount : sum, 0);
                const expense = accTransactions.reduce((sum, t) => t.accountId === acc.id && t.type === 'expense' ? sum + t.amount : sum, 0);
                const transfers = accTransactions.reduce((sum, t) => {
                    if (t.type === 'transfer') {
                        if (t.accountId === acc.id) return sum - t.amount;
                        if (t.toAccountId === acc.id) return sum + t.amount;
                    }
                    return sum;
                }, 0);

                const balance = initialAmount + income - expense + transfers;

                return [
                    acc.name,
                    initialAmount.toLocaleString('en-IN'),
                    income > 0 ? income.toLocaleString('en-IN') : '-',
                    expense > 0 ? expense.toLocaleString('en-IN') : '-',
                    { content: transfers !== 0 ? transfers.toLocaleString('en-IN') : '-', styles: { textColor: [67, 56, 202] } as any },
                    { content: balance.toLocaleString('en-IN'), styles: { textColor: balance >= 0 ? [22, 101, 52] : [153, 27, 27], fontStyle: 'bold' } as any }
                ];
            });

            // Add Total Row for Group
            const totalInitial = groupSummaryBody.reduce((sum, row) => sum + (typeof row[1] === 'string' ? parseFloat(row[1].replace(/,/g, '')) : 0), 0);
            const totalIncome = groupSummaryBody.reduce((sum, row) => sum + (typeof row[2] === 'string' && row[2] !== '-' ? parseFloat(row[2].replace(/,/g, '')) : 0), 0);
            const totalExpense = groupSummaryBody.reduce((sum, row) => sum + (typeof row[3] === 'string' && row[3] !== '-' ? parseFloat(row[3].replace(/,/g, '')) : 0), 0);
            const totalTransfers = groupSummaryBody.reduce((sum, row) => sum + (typeof row[4] === 'object' && row[4].content !== '-' ? parseFloat(row[4].content.replace(/,/g, '')) : 0), 0);
            const totalBalance = groupSummaryBody.reduce((sum, row) => sum + (typeof row[5] === 'object' ? parseFloat(row[5].content.replace(/,/g, '')) : 0), 0);

            groupSummaryBody.push([
                { content: 'TOTAL', styles: { fontStyle: 'bold' } as any },
                { content: totalInitial.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } as any },
                { content: totalIncome.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } as any },
                { content: totalExpense.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } as any },
                { content: totalTransfers.toLocaleString('en-IN'), styles: { fontStyle: 'bold', textColor: [67, 56, 202] } as any },
                { content: totalBalance.toLocaleString('en-IN'), styles: { fontStyle: 'bold', textColor: totalBalance >= 0 ? [22, 101, 52] : [153, 27, 27] } as any }
            ]);

            autoTable(doc, {
                head: [['Account', 'Initial Amount', 'Income', 'Expense', 'Transfer', 'Balance']],
                body: groupSummaryBody as any,
                startY: currentY,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [55, 65, 81] },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 25, halign: 'right' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 30, halign: 'right' },
                    5: { cellWidth: 30, halign: 'right' },
                }
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 10;
        });
    }

    // Event Performance Summary (Independent Section)
    if (data.exportOptions?.includeEventSummary !== false) {
        const eventTransactions = data.transactions.filter(t => {
            if (!t.eventId) return false;
            const event = data.events.find(e => e.id === t.eventId);
            return event && event.showTransactions !== false;
        });
        const eventManualLogs = data.eventLogs.filter(l => {
            if (!l.eventId) return true;
            const event = data.events.find(e => e.id === l.eventId);
            return event && event.showLogs !== false;
        });

        if (eventTransactions.length > 0 || eventManualLogs.length > 0) {
            // Group everything by eventId
            const groupedEvents = {} as Record<string, { trans: Transaction[], logs: EventLog[] }>;

            eventTransactions.forEach(t => {
                if (t.eventId) {
                    if (!groupedEvents[t.eventId]) groupedEvents[t.eventId] = { trans: [], logs: [] };
                    groupedEvents[t.eventId].trans.push(t);
                }
            });

            eventManualLogs.forEach(l => {
                const key = l.eventId || 'standalone';
                if (!groupedEvents[key]) groupedEvents[key] = { trans: [], logs: [] };
                groupedEvents[key].logs.push(l);
            });

            // Dynamic page break for Event Summary
            if (currentY > 200) {
                doc.addPage();
                currentY = 20;
            } else {
                currentY += 15;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text('Event Performance Summary', 14, currentY);
            currentY += 10;

            // Calculate Grand Totals for Events
            let totalEventIncome = 0;
            let totalEventExpense = 0;

            Object.values(groupedEvents).forEach(group => {
                group.trans.forEach(t => {
                    if (t.type === 'income') totalEventIncome += t.amount;
                    if (t.type === 'expense') totalEventExpense += t.amount;
                });
                group.logs.forEach(l => {
                    if (l.type === 'income') totalEventIncome += l.amount;
                    if (l.type === 'expense') totalEventExpense += l.amount;
                });
            });

            const totalEventNet = totalEventIncome - totalEventExpense;

            // Draw Event Summary Boxes
            const eventBoxWidth = 55;
            const eventBoxHeight = 20;

            // Income Box
            doc.setFillColor(240, 253, 244); // Green 50
            doc.rect(14, currentY, eventBoxWidth, eventBoxHeight, 'F');
            doc.setTextColor(22, 101, 52); // Green 800
            doc.setFontSize(8);
            doc.text('Event Income', 18, currentY + 6);
            doc.setFontSize(11);
            doc.text(`INR ${totalEventIncome.toLocaleString('en-IN')}`, 18, currentY + 14);

            // Expense Box
            doc.setFillColor(254, 242, 242); // Red 50
            doc.rect(14 + eventBoxWidth + 5, currentY, eventBoxWidth, eventBoxHeight, 'F');
            doc.setTextColor(153, 27, 27); // Red 800
            doc.setFontSize(8);
            doc.text('Event Expense', 18 + eventBoxWidth + 5, currentY + 6);
            doc.setFontSize(11);
            doc.text(`INR ${totalEventExpense.toLocaleString('en-IN')}`, 18 + eventBoxWidth + 5, currentY + 14);

            // Net Box
            const netColor = totalEventNet >= 0 ? [22, 101, 52] : [153, 27, 27];
            const netBg = totalEventNet >= 0 ? [240, 253, 244] : [254, 242, 242];
            doc.setFillColor(netBg[0], netBg[1], netBg[2]);
            doc.rect(14 + (eventBoxWidth + 5) * 2, currentY, eventBoxWidth, eventBoxHeight, 'F');
            doc.setTextColor(netColor[0], netColor[1], netColor[2]);
            doc.setFontSize(8);
            doc.text('Net Event Impact', 18 + (eventBoxWidth + 5) * 2, currentY + 6);
            doc.setFontSize(11);
            const netPrefix = totalEventNet < 0 ? '-' : '+';
            doc.text(`${netPrefix} INR ${Math.abs(totalEventNet).toLocaleString('en-IN')}`, 18 + (eventBoxWidth + 5) * 2, currentY + 14);

            currentY += eventBoxHeight + 10;

            const summaryData = Object.entries(groupedEvents).map(([eventId, groupData]) => {
                let eventName = '';
                if (eventId === 'standalone') {
                    eventName = 'Independent Logs';
                } else {
                    const event = data.events.find(e => e.id === eventId);
                    eventName = event ? event.name : 'Unknown Event';
                }

                // Calculate totals per event
                let income = 0;
                let expense = 0;

                groupData.trans.forEach(t => {
                    if (t.type === 'income') income += t.amount;
                    if (t.type === 'expense') expense += t.amount;
                });

                groupData.logs.forEach(l => {
                    if (l.type === 'income') income += l.amount;
                    if (l.type === 'expense') expense += l.amount;
                });

                const net = income - expense;
                return { name: eventName, income, expense, net, isStandalone: eventId === 'standalone' };
            });

            // Sort summary data by net (ascending - most negative first)
            summaryData.sort((a, b) => a.net - b.net);

            const summaryTableBody = summaryData.map(item => {
                return [
                    item.name,
                    item.income > 0 ? item.income.toLocaleString('en-IN') : '-',
                    item.expense > 0 ? item.expense.toLocaleString('en-IN') : '-',
                    {
                        content: item.net >= 0 ? `+${item.net.toLocaleString('en-IN')}` : item.net.toLocaleString('en-IN'),
                        styles: {
                            textColor: item.net >= 0 ? [22, 101, 52] : [220, 38, 38],
                            fontStyle: 'bold'
                        } as any
                    }
                ];
            });

            autoTable(doc, {
                head: [['Event Name', 'Total Income', 'Total Expense', 'Net Impact']],
                body: summaryTableBody as any,
                startY: currentY,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }, // Indigo 600
                columnStyles: {
                    0: { cellWidth: 'auto', fontStyle: 'bold' },
                    1: { cellWidth: 35, halign: 'right', textColor: [22, 101, 52] },
                    2: { cellWidth: 35, halign: 'right', textColor: [185, 28, 28] },
                    3: { cellWidth: 40, halign: 'right' },
                },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });
        }
    }


    // Loan Repayments Breakdown (New Section)
    if (data.totalLoanRepayment && data.totalLoanRepayment > 0) {
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY += 10;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Loan Repayments Breakdown', 14, currentY);
        currentY += 10;

        const loanTransactions = data.transactions.filter(t => {
            if (t.type !== 'transfer' || !t.toAccountId) return false;
            const toAccount = (data.allAccounts || data.accounts).find(a => a.id === t.toAccountId);
            return toAccount?.type === 'loan';
        });

        const loanTableBody = loanTransactions.map(t => {
            const fromAccount = (data.allAccounts || data.accounts).find(a => a.id === t.accountId);
            const toAccount = (data.allAccounts || data.accounts).find(a => a.id === t.toAccountId);
            return [
                format(new Date(t.date), 'MMM dd, yyyy'),
                fromAccount?.name || 'Unknown',
                toAccount?.name || 'Unknown',
                t.note || '-',
                t.amount.toLocaleString('en-IN')
            ];
        });

        autoTable(doc, {
            head: [['Date', 'From Account', 'Loan Account', 'Note', 'Amount (INR)']],
            body: loanTableBody,
            startY: currentY,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 118, 110] }, // Teal 800
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 40 },
                2: { cellWidth: 40 },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 30, halign: 'right' },
            }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 10;
    }

    // Stop here if detailed transactions are excluded
    if (data.exportOptions?.includeTransactions === false) {
        doc.save(`${data.title.replace(/\s+/g, '_')}_${data.period}.pdf`);
        return;
    }

    // Add a new page for account transactions
    if (currentY > 200) {
        doc.addPage();
        currentY = 10;
    } else {
        currentY += 10;
    }

    // Transactions Grouped by Account (Excluding Manual Transactions)
    let tableStartY = currentY + 10;
    const reportTransactions = data.transactions.filter(t => !t.excludeFromBalance);

    // Group transactions by accountId (include transfers in both source and target)
    const groupedTransactions = reportTransactions.reduce((acc, t) => {
        // Add to source account if it's in our relevant accounts
        if (data.accounts.some(a => a.id === t.accountId)) {
            if (!acc[t.accountId]) acc[t.accountId] = [];
            acc[t.accountId].push(t);
        }

        // Add to destination account if it's a transfer and destination is in our relevant accounts
        if (t.type === 'transfer' && t.toAccountId && data.accounts.some(a => a.id === t.toAccountId)) {
            if (!acc[t.toAccountId]) acc[t.toAccountId] = [];
            acc[t.toAccountId].push(t);
        }
        return acc;
    }, {} as Record<string, Transaction[]>);

    // Sort accounts by type priority
    const typePriority: Record<string, number> = {
        'savings': 1,
        'online-wallet': 1,
        'fixed-deposit': 1,
        'other-banking': 1,
        'credit': 2,
        'cash': 3,
        'stock': 4,
        'mutual-fund': 4,
        'investment-other': 4,
        'loan': 5,
        'other': 6
    };

    const sortedAccountEntries = Object.entries(groupedTransactions).sort(([idA], [idB]) => {
        const accA = data.accounts.find(a => a.id === idA);
        const accB = data.accounts.find(a => a.id === idB);
        const priorityA = typePriority[accA?.type || 'other'] || 6;
        const priorityB = typePriority[accB?.type || 'other'] || 6;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (accA?.name || '').localeCompare(accB?.name || '');
    });

    sortedAccountEntries.forEach(([accountId, accountTransactions]) => {
        const account = data.accounts.find(a => a.id === accountId);
        const accountName = account?.name || 'Unknown Account';

        // Check if we need a new page
        if (tableStartY > 250) {
            doc.addPage();
            tableStartY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text(accountName, 14, tableStartY);

        // Display Opening Balance
        const openingBalance = data.openingBalances[accountId] || 0;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Opening Balance: INR ${openingBalance.toLocaleString('en-IN')}`, 14, tableStartY + 5);

        tableStartY += 10;

        const tableBody = accountTransactions.map(t => {
            const lookUpAccounts = data.allAccounts || data.accounts;
            const fromAccountName = lookUpAccounts.find(a => a.id === t.accountId)?.name || 'Unknown';
            const toAccountName = t.toAccountId ? (lookUpAccounts.find(a => a.id === t.toAccountId)?.name || 'Other Account') : '';

            let displayDetails = t.category;
            let displayType = t.type.toUpperCase();

            if (t.type === 'transfer') {
                if (t.accountId === accountId) {
                    displayDetails = `Transfer to ${toAccountName}`;
                    displayType = 'TRANSFER (OUT)';
                } else {
                    displayDetails = `Transfer from ${fromAccountName}`;
                    displayType = 'TRANSFER (IN)';
                }
            }
            if (t.note) displayDetails += ` (${t.note})`;

            return [
                format(new Date(t.date), 'MMM dd, yyyy'),
                displayType,
                displayDetails,
                t.amount.toLocaleString('en-IN')
            ];
        });

        autoTable(doc, {
            head: [['Date', 'Type', 'Details', 'Amount (INR)']],
            body: tableBody,
            startY: tableStartY,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] },
            didParseCell: (cellData) => {
                if (cellData.section === 'body') {
                    const type = cellData.row.cells[1].raw as string;
                    if (type.includes('TRANSFER')) {
                        cellData.cell.styles.textColor = [67, 56, 202]; // Indigo 700
                    } else if (type === 'EXPENSE') {
                        cellData.cell.styles.textColor = [153, 27, 27]; // Red 800
                    } else if (type === 'INCOME') {
                        cellData.cell.styles.textColor = [22, 101, 52]; // Green 800
                    }
                }
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 20 },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 25, halign: 'right' },
            }
        });

        // @ts-ignore - finalY exists on lastAutoTable
        tableStartY = doc.lastAutoTable.finalY + 10;

        // Display Account Sum
        const accountSum = accountTransactions.reduce((sum, t) => {
            if (t.type === 'income') return sum + t.amount;
            if (t.type === 'expense') return sum - t.amount;
            if (t.type === 'transfer') {
                if (t.accountId === accountId) return sum - t.amount;
                if (t.toAccountId === accountId) return sum + t.amount;
            }
            return sum;
        }, 0);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);

        const sumLabel = `Net for period:`;
        const sumValue = `INR ${accountSum.toLocaleString('en-IN')}`;
        doc.text(sumLabel, 14, tableStartY - 3);
        doc.text(sumValue, 196, tableStartY - 3, { align: 'right' });

        const closingBalance = openingBalance + accountSum;
        const closingLabel = `Ending Balance:`;
        const closingValue = `INR ${closingBalance.toLocaleString('en-IN')}`;
        doc.text(closingLabel, 14, tableStartY + 2);
        doc.text(closingValue, 196, tableStartY + 2, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        tableStartY += 15;
    });

    // Manual Expenses Section (NEW PAGE)
    if (data.manualTotalExpense && data.manualTotalExpense > 0) {
        doc.addPage();
        let manualY = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Manual Expenses Report', 14, manualY);
        manualY += 10;

        doc.setFillColor(243, 244, 246);
        doc.rect(14, manualY, 60, 22, 'F');
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.text('Total Manual Expenses', 20, manualY + 7);
        doc.setFontSize(12);
        doc.text(`INR ${data.manualTotalExpense.toLocaleString('en-IN')}`, 20, manualY + 16);
        manualY += 32;

        if (data.manualChartData && data.manualChartData.length > 0 && data.exportOptions?.includeCharts !== false) {
            manualY = drawBarChart(doc, data.manualChartData, 14, manualY, 180, 'Manual Expenses Breakdown');
        }

        const manualTransactions = data.transactions.filter(t => t.excludeFromBalance);
        if (manualTransactions.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(31, 41, 55);
            doc.text('Manual Transactions Details', 14, manualY);
            manualY += 5;

            const manualTableBody = manualTransactions.map(t => [
                format(new Date(t.date), 'MMM dd, yyyy'),
                data.accounts.find(a => a.id === t.accountId)?.name || 'Unknown',
                t.note || t.category,
                t.amount.toLocaleString('en-IN')
            ]);

            autoTable(doc, {
                head: [['Date', 'Account', 'Details', 'Amount (INR)']],
                body: manualTableBody,
                startY: manualY,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [107, 114, 128] },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 25, halign: 'right' },
                }
            });

            // @ts-ignore
            tableStartY = doc.lastAutoTable.finalY + 10;
        } else {
            tableStartY = manualY;
        }
    } else {
        tableStartY += 10;
    }

    // Event/Log Breakdown Details (After Account Transactions)
    if (data.exportOptions?.includeTransactions) {
        const eventTransactions = data.transactions.filter(t => {
            if (!t.eventId) return false;
            const event = data.events.find(e => e.id === t.eventId);
            return event && event.showTransactions !== false;
        });
        const eventManualLogs = data.eventLogs.filter(l => {
            if (!l.eventId) return true;
            const event = data.events.find(e => e.id === l.eventId);
            return event && event.showLogs !== false;
        });

        if (eventTransactions.length > 0 || eventManualLogs.length > 0) {
            // Group everything by eventId
            const groupedEvents = {} as Record<string, { trans: Transaction[], logs: EventLog[] }>;

            eventTransactions.forEach(t => {
                if (t.eventId) {
                    if (!groupedEvents[t.eventId]) groupedEvents[t.eventId] = { trans: [], logs: [] };
                    groupedEvents[t.eventId].trans.push(t);
                }
            });

            eventManualLogs.forEach(l => {
                const key = l.eventId || 'standalone';
                if (!groupedEvents[key]) groupedEvents[key] = { trans: [], logs: [] };
                groupedEvents[key].logs.push(l);
            });

            // Add a new page for Event Breakdown
            doc.addPage();
            tableStartY = 20;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text('Event/Log Breakdown Details', 14, tableStartY);
            tableStartY += 10;

            const today = new Date();
            const sortedEvents = Object.entries(groupedEvents).sort(([idA], [idB]) => {
                const eventA = data.events.find(e => e.id === idA);
                const eventB = data.events.find(e => e.id === idB);
                if (!eventA || !eventB) return 0;

                const isActiveA = !eventA.endDate || new Date(eventA.endDate) >= today;
                const isActiveB = !eventB.endDate || new Date(eventB.endDate) >= today;

                if (isActiveA && !isActiveB) return -1;
                if (!isActiveA && isActiveB) return 1;

                // If both same status, sort by startDate descending
                return new Date(eventB.startDate).getTime() - new Date(eventA.startDate).getTime();
            });

            sortedEvents.forEach(([eventId]) => {
                let event = data.events.find(e => e.id === eventId);
                let eventName = '';
                let isActive = false;

                if (eventId === 'standalone') {
                    eventName = 'Independent Logs';
                    isActive = true;
                } else if (event) {
                    isActive = !event.endDate || new Date(event.endDate) >= today;
                    eventName = `${event.name}${isActive ? ' (Active)' : ' (Past)'}`;
                } else {
                    return;
                }

                if (tableStartY > 250) {
                    doc.addPage();
                    tableStartY = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(31, 41, 55);
                doc.text(eventName, 14, tableStartY);
                tableStartY += 10;
                doc.setTextColor(31, 41, 55); // Reset

                const eventItems = [
                    ...groupedEvents[eventId].trans.map(t => ({
                        date: t.date,
                        account: data.accounts.find(a => a.id === t.accountId)?.name || 'Unknown',
                        details: t.note || t.category,
                        type: t.type.toUpperCase(),
                        amount: t.amount,
                        isLog: false
                    })),
                    ...groupedEvents[eventId].logs.map(l => ({
                        date: l.date,
                        account: 'Manual Log',
                        details: `[LOG] ${l.description}`,
                        type: l.type.toUpperCase(),
                        amount: l.amount,
                        isLog: true
                    }))
                ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                const eventTableBody = eventItems.map(item => [
                    format(new Date(item.date), 'MMM dd, yyyy'),
                    item.account,
                    item.details,
                    item.type,
                    item.amount.toLocaleString('en-IN')
                ]);

                autoTable(doc, {
                    head: [['Date', 'Account/Source', 'Details', 'Type', 'Amount (INR)']],
                    body: eventTableBody,
                    startY: tableStartY,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [44, 44, 44] },
                    didParseCell: (cellData) => {
                        if (cellData.section === 'body') {
                            const rowIndex = cellData.row.index;
                            const item = eventItems[rowIndex];
                            const type = item.type;

                            // Color coding
                            if (type === 'EXPENSE') {
                                cellData.cell.styles.textColor = [153, 27, 27];
                            } else if (type === 'INCOME') {
                                cellData.cell.styles.textColor = [22, 101, 52];
                            }

                            // Bold for logs
                            if (item.isLog) {
                                cellData.cell.styles.fontStyle = 'bold';
                            }
                        }
                    },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: 'auto' },
                        3: { cellWidth: 20 },
                        4: { cellWidth: 25, halign: 'right' },
                    }
                });

                // @ts-ignore
                tableStartY = doc.lastAutoTable.finalY;

                // Event Summary
                const eventSum = [
                    ...groupedEvents[eventId].trans,
                    ...groupedEvents[eventId].logs
                ].reduce((sum, item) => {
                    if (item.type === 'income') return sum + item.amount;
                    if (item.type === 'expense') return sum - item.amount;
                    return sum;
                }, 0);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(`Net for ${eventName}:`, 14, tableStartY + 7);
                doc.text(`INR ${eventSum.toLocaleString('en-IN')}`, 196, tableStartY + 7, { align: 'right' });

                tableStartY += 20;
                doc.setFont('helvetica', 'normal');
            });
        }
    }

    doc.save(`${data.title.replace(/\s+/g, '_')}_${data.period}.pdf`);
};
