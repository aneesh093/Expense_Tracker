import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Transaction, Account, Category } from '../types';

interface ReportData {
    title: string;
    period: string;
    totalIncome: number;
    totalExpense: number;
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[]; // To look up names if needed
    chartData: { name: string; value: number; color: string }[];
}


// Re-thinking: Drawing a Pie Chart manually is brittle. 
// A Horizontal Bar Chart is very professional for PDFs.
// Let's implement a nice Horizontal Bar Chart instead of a jagged Pie.

const drawBarChart = (doc: jsPDF, data: { name: string; value: number; color: string }[], startX: number, startY: number, width: number) => {
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Expense Breakdown', startX, startY - 5);

    let currentY = startY;
    const maxValue = Math.max(...data.map(d => d.value));

    data.forEach(item => {
        const barWidth = (item.value / maxValue) * (width - 40); // Leave space for labels

        // Label
        doc.setFontSize(8);
        doc.text(item.name, startX, currentY + 4);

        // Bar
        doc.setFillColor(item.color);
        doc.rect(startX + 30, currentY, barWidth, 5, 'F');

        // Value
        doc.text(item.value.toLocaleString('en-IN'), startX + 30 + barWidth + 2, currentY + 4);

        currentY += 8;
    });

    return currentY + 10; // Return new Y position
};

export const generateReportPDF = (data: ReportData) => {
    const doc = new jsPDF();


    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(`${data.title} - ${data.period}`, 14, 22);

    // Summary Section
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30);

    doc.setFillColor(240, 253, 244); // Light green background
    doc.rect(14, 35, 90, 25, 'F');
    doc.setTextColor(22, 101, 52); // Dark green text
    doc.setFontSize(10);
    doc.text('Total Income', 20, 42);
    doc.setFontSize(14);
    doc.text(`INR ${data.totalIncome.toLocaleString('en-IN')}`, 20, 52);

    doc.setFillColor(254, 242, 242); // Light red background
    doc.rect(110, 35, 90, 25, 'F');
    doc.setTextColor(153, 27, 27); // Dark red text
    doc.setFontSize(10);
    doc.text('Total Expense', 116, 42);
    doc.setFontSize(14);
    doc.text(`INR ${data.totalExpense.toLocaleString('en-IN')}`, 116, 52);

    // Reset text color for table
    doc.setTextColor(0);

    // Chart Section - Horizontal Bar Chart Representation
    let currentY = 70;
    if (data.chartData && data.chartData.length > 0) {
        currentY = drawBarChart(doc, data.chartData, 14, 70, 180);
    }

    const tableStartY = currentY + 10;

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
