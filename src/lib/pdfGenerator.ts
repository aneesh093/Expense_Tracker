import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Transaction, Account, Category, Event } from '../types';

interface ReportData {
    title: string;
    period: string;
    totalIncome: number;
    totalExpense: number;
    totalInvestment: number;
    manualTotalExpense?: number;
    totalTransferIn?: number;
    totalTransferOut?: number;
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[]; // To look up names if needed
    events: Event[];
    chartData: { name: string; value: number; color: string }[];
    manualChartData?: { name: string; value: number; color: string }[];
    openingBalances: Record<string, number>;
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

    // Core chart
    let currentY = summaryEndY + 10;
    if (data.chartData && data.chartData.length > 0) {
        currentY = drawBarChart(doc, data.chartData, 14, currentY, 180, 'Expense Breakdown');
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
            const fromAccountName = data.accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
            const toAccountName = t.toAccountId ? data.accounts.find(a => a.id === t.toAccountId)?.name : '';

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
                    if (type === 'EXPENSE' || type === 'TRANSFER (OUT)') {
                        cellData.cell.styles.textColor = [153, 27, 27]; // Red 800
                    } else if (type === 'INCOME' || type === 'TRANSFER (IN)') {
                        cellData.cell.styles.textColor = [22, 101, 52]; // Green 800
                    } else if (type === 'TRANSFER') {
                        cellData.cell.styles.textColor = [67, 56, 202]; // Indigo 700
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

        if (data.manualChartData && data.manualChartData.length > 0) {
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

    // Events Detailed Breakdown
    const eventTransactions = data.transactions.filter(t => t.eventId && data.events.some(e => e.id === t.eventId));
    if (eventTransactions.length > 0) {
        // Group transactions by eventId
        const groupedEvents = eventTransactions.reduce((acc, t) => {
            if (t.eventId) {
                if (!acc[t.eventId]) acc[t.eventId] = [];
                acc[t.eventId].push(t);
            }
            return acc;
        }, {} as Record<string, Transaction[]>);

        // Add a new page for events if current space is tight
        if (tableStartY > 220) {
            doc.addPage();
            tableStartY = 20;
        } else {
            tableStartY += 10;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Event Breakdown', 14, tableStartY);
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

        sortedEvents.forEach(([eventId, transactions]) => {
            const event = data.events.find(e => e.id === eventId);
            if (!event) return; // Double check

            const isActive = !event.endDate || new Date(event.endDate) >= today;
            const eventName = `${event.name}${isActive ? ' (Active)' : ' (Past)'}`;

            if (tableStartY > 250) {
                doc.addPage();
                tableStartY = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text(eventName, 14, tableStartY);
            tableStartY += 5;
            doc.setTextColor(31, 41, 55); // Reset

            const eventTableBody = transactions.map(t => {
                const accountName = data.accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
                return [
                    format(new Date(t.date), 'MMM dd, yyyy'),
                    accountName,
                    t.note || t.category,
                    t.type.toUpperCase(),
                    t.amount.toLocaleString('en-IN')
                ];
            });

            autoTable(doc, {
                head: [['Date', 'Account', 'Details', 'Type', 'Amount (INR)']],
                body: eventTableBody,
                startY: tableStartY,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [44, 44, 44] },
                didParseCell: (cellData) => {
                    if (cellData.section === 'body') {
                        const type = cellData.row.cells[3].raw as string;
                        if (type === 'EXPENSE') {
                            cellData.cell.styles.textColor = [153, 27, 27];
                        } else if (type === 'INCOME') {
                            cellData.cell.styles.textColor = [22, 101, 52];
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
            const eventSum = transactions.reduce((sum, t) => {
                if (t.type === 'income') return sum + t.amount;
                if (t.type === 'expense') return sum - t.amount;
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

    doc.save(`${data.title.replace(/\s+/g, '_')}_${data.period}.pdf`);
};
