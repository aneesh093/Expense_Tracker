import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Transaction, Account, Category } from '../types';

interface ReportData {
    title: string;
    period: string;
    totalIncome: number;
    totalExpense: number;
    totalInvestment: number;
    manualTotalExpense?: number;
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[]; // To look up names if needed
    chartData: { name: string; value: number; color: string }[];
    manualChartData?: { name: string; value: number; color: string }[];
}


// Re-thinking: Drawing a Pie Chart manually is brittle. 
// A Horizontal Bar Chart is very professional for PDFs.
// Let's implement a nice Horizontal Bar Chart instead of a jagged Pie.

const drawBarChart = (doc: jsPDF, data: { name: string; value: number; color: string }[], startX: number, startY: number, width: number, title: string = 'Expense Breakdown') => {
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55); // Gray 800
    doc.text(title, startX, startY - 5);

    let currentY = startY;
    const maxValue = Math.max(...data.map(d => d.value));

    data.forEach(item => {
        const barWidth = maxValue > 0 ? (item.value / maxValue) * (width - 60) : 0; // Leave space for labels and values

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

// Use native toLocaleString with INR instead of a helper if needed or just remove if unused

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

    // Three summary boxes
    const boxWidth = 60;
    const boxHeight = 22;
    const startY = 32;

    // Income Box
    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(14, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(22, 101, 52); // Dark green text
    doc.setFontSize(9);
    doc.text('Total Income', 20, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalIncome.toLocaleString('en-IN')}`, 20, startY + 16);

    // Expense Box
    doc.setFillColor(254, 242, 242); // Light red background
    doc.rect(77, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(153, 27, 27); // Dark red text
    doc.setFontSize(9);
    doc.text('Total Expense', 83, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalExpense.toLocaleString('en-IN')}`, 83, startY + 16);

    // Investment Box
    doc.setFillColor(250, 245, 255); // Light purple background
    doc.rect(140, startY, boxWidth, boxHeight, 'F');
    doc.setTextColor(107, 33, 168); // Dark purple text
    doc.setFontSize(9);
    doc.text('Total Invested', 146, startY + 7);
    doc.setFontSize(12);
    doc.text(`INR ${data.totalInvestment.toLocaleString('en-IN')}`, 146, startY + 16);

    // Manual Expenses Box (if any)
    let summaryEndY = startY + boxHeight + 5;
    if (data.manualTotalExpense && data.manualTotalExpense > 0) {
        const manualBoxY = startY + boxHeight + 5;
        doc.setFillColor(243, 244, 246); // Light gray background
        doc.rect(14, manualBoxY, boxWidth, boxHeight, 'F');
        doc.setTextColor(55, 65, 81); // Dark gray text
        doc.setFontSize(9);
        doc.text('Manual Expenses', 20, manualBoxY + 7);
        doc.setFontSize(12);
        doc.text(`INR ${data.manualTotalExpense.toLocaleString('en-IN')}`, 20, manualBoxY + 16);
        summaryEndY = manualBoxY + boxHeight + 5;
    }

    // Reset text color for table
    doc.setTextColor(0);

    // Chart Section - Horizontal Bar Chart Representation
    let chartY = summaryEndY + 10;
    if (data.chartData && data.chartData.length > 0) {
        chartY = drawBarChart(doc, data.chartData, 14, chartY, 180, 'Expense Breakdown');
    }

    // Manual Chart Section
    if (data.manualChartData && data.manualChartData.length > 0) {
        chartY = drawBarChart(doc, data.manualChartData, 14, chartY + 5, 180, 'Manual Expenses Breakdown (Non-Impacting)');
    }

    const tableStartY = chartY + 10;

    // Table Data Preparation
    const tableBody = data.transactions.map(t => {
        const accountName = data.accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
        const toAccountName = t.toAccountId ? data.accounts.find(a => a.id === t.toAccountId)?.name : '';

        let displayDetails = t.category;
        if (t.type === 'transfer') {
            displayDetails = `Transfer to ${toAccountName}`;
        }
        if (t.note) displayDetails += ` (${t.note})`;

        return [
            format(new Date(t.date), 'MMM dd, yyyy'),
            t.type.toUpperCase(),
            accountName,
            displayDetails,
            t.amount.toLocaleString('en-IN')
        ];
    });

    // Transactions Table
    autoTable(doc, {
        head: [['Date', 'Type', 'Account', 'Details', 'Amount (INR)']],
        body: tableBody,
        startY: tableStartY,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 25, halign: 'right' },
        }
    });

    // Save
    doc.save(`${data.title.replace(/\s+/g, '_')}_${data.period}.pdf`);
};
