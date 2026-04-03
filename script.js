// ============================================
// Single Page Application - Loan/Deposit Calculator
// ============================================

class FinancialCalculator {
    constructor() {
        this.currentMode = 'loan';
        this.results = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mode selector buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Form submission
        document.getElementById('calculatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculate();
        });

        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveResults());
        document.getElementById('printBtn').addEventListener('click', () => this.printResults());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetCalculator());
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Reset form
        this.resetForm();
        
        // Update labels
        const modeText = mode === 'loan' ? 'Кредит' : 'Депозит';
        console.log(`Режим змінено на: ${modeText}`);
    }

    resetForm() {
        document.getElementById('calculatorForm').reset();
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }

    calculate() {
        const amount = parseFloat(document.getElementById('amount').value);
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const period = parseInt(document.getElementById('period').value);
        const compounding = document.getElementById('compounding').value;

        // Validate inputs
        if (!this.validateInputs(amount, interestRate, period)) {
            alert('Будь ласка, перевірте введені дані!');
            return;
        }

        // Calculate based on mode
        if (this.currentMode === 'loan') {
            this.results = this.calculateLoan(amount, interestRate, period, compounding);
        } else {
            this.results = this.calculateDeposit(amount, interestRate, period, compounding);
        }

        this.displayResults();
    }

    validateInputs(amount, rate, period) {
        return amount > 0 && rate >= 0 && period > 0 && !isNaN(amount) && !isNaN(rate) && !isNaN(period);
    }

    calculateLoan(principal, annualRate, months, compounding) {
        const monthlyRate = annualRate / 100 / 12;
        
        // Monthly payment calculation (annuity formula)
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = principal / months;
        } else {
            monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
        }

        const totalAmount = monthlyPayment * months;
        const interest = totalAmount - principal;

        // Generate schedule
        const schedule = this.generateLoanSchedule(principal, monthlyRate, monthlyPayment, months);

        return {
            type: 'loan',
            principal,
            annualRate,
            months,
            monthlyPayment,
            totalAmount,
            interest,
            compounding,
            schedule
        };
    }

    calculateDeposit(principal, annualRate, months, compounding) {
        let balance = principal;
        let totalInterest = 0;

        // Get compounding frequency
        const compoundingFrequency = {
            'monthly': 12,
            'quarterly': 4,
            'annual': 1
        }[compounding] || 12;

        const periodsPerYear = compoundingFrequency;
        const ratePerPeriod = annualRate / 100 / periodsPerYear;
        const totalPeriods = (months / 12) * periodsPerYear;

        // Compound interest formula
        balance = principal * Math.pow(1 + ratePerPeriod, totalPeriods);
        totalInterest = balance - principal;

        // Generate schedule
        const schedule = this.generateDepositSchedule(
            principal, 
            ratePerPeriod, 
            months, 
            compoundingFrequency
        );

        return {
            type: 'deposit',
            principal,
            annualRate,
            months,
            monthlyPayment: balance / months,
            totalAmount: balance,
            interest: totalInterest,
            compounding,
            schedule
        };
    }

    generateLoanSchedule(principal, monthlyRate, monthlyPayment, months) {
        let balance = principal;
        const schedule = [];

        for (let i = 1; i <= Math.min(months, 24); i++) { // Show max 24 months
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;

            schedule.push({
                period: i,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance)
            });
        }

        return schedule;
    }

    generateDepositSchedule(principal, ratePerPeriod, months, compoundingFrequency) {
        let balance = principal;
        let monthCount = 0;
        const schedule = [];
        const monthsPerPeriod = 12 / compoundingFrequency;

        for (let i = 1; i <= Math.min(compoundingFrequency * (months / 12), 24); i++) {
            monthCount += monthsPerPeriod;
            if (monthCount > months) monthCount = months;

            const interest = balance * ratePerPeriod;
            balance += interest;

            schedule.push({
                period: Math.round(monthCount),
                principal: 0,
                interest: interest,
                balance: balance
            });

            if (monthCount >= months) break;
        }

        return schedule;
    }

    displayResults() {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';

        // Format currency
        const formatCurrency = (value) => {
            return value.toFixed(2).replace('.', ',') + ' грн';
        };

        // Update result cards
        document.getElementById('initialAmount').textContent = 
            formatCurrency(this.results.principal);
        document.getElementById('interestAmount').textContent = 
            formatCurrency(this.results.interest);
        document.getElementById('totalAmount').textContent = 
            formatCurrency(this.results.totalAmount);
        document.getElementById('monthlyPayment').textContent = 
            formatCurrency(this.results.monthlyPayment);

        // Update breakdown table
        this.updateBreakdownTable();

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    updateBreakdownTable() {
        const tbody = document.getElementById('breakdownBody');
        tbody.innerHTML = '';

        const formatCurrency = (value) => {
            return value.toFixed(2).replace('.', ',') + ' грн';
        };

        this.results.schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.period} ${this.results.months > 12 && row.period === 1 ? 'місяць' : 'місяці'}</td>
                <td>${formatCurrency(row.principal)}</td>
                <td>${formatCurrency(row.interest)}</td>
                <td><strong>${formatCurrency(row.balance)}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    saveResults() {
        if (!this.results) {
            alert('Спочатку розрахуйте результати!');
            return;
        }

        const content = this.generateReport();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        
        const timestamp = new Date().toLocaleString('uk-UA');
        const filename = `Розрахунок_${this.results.type === 'loan' ? 'кредиту' : 'депозиту'}_${Date.now()}.txt`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        alert(`✅ Результати збережені у файл:\n${filename}`);
    }

    generateReport() {
        const formatCurrency = (value) => {
            return value.toFixed(2).replace('.', ',') + ' грн';
        };

        const timestamp = new Date().toLocaleString('uk-UA');
        const title = this.results.type === 'loan' ? 'РОЗРАХУНОК КРЕДИТУ' : 'РОЗРАХУНОК ДЕПОЗИТУ';

        let report = `
╔════════════════════════════════════════════════════════════╗
║                  ${title.padEnd(56)}║
║                 Калькулятор кредита та депозиту             ║
╚════════════════════════════════════════════════════════════╝

Дата та час: ${timestamp}
────────────────────────────────────────────────────────────

📊 ОСНОВНІ ПАРАМЕТРИ:
────────────────────────────────────────────────────────────
Сума:                    ${formatCurrency(this.results.principal)}
Річна процентна ставка:  ${this.results.annualRate.toFixed(2)}%
Період:                  ${this.results.months} місяців (${(this.results.months / 12).toFixed(2)} років)
Період капіталізації:    ${this.getCompoundingLabel(this.results.compounding)}

💰 РЕЗУЛЬТАТИ РОЗРАХУНКУ:
────────────────────────────────────────────────────────────
Початкова сума:          ${formatCurrency(this.results.principal)}
Нараховані відсотки:     ${formatCurrency(this.results.interest)}
Загальна сума:           ${formatCurrency(this.results.totalAmount)}
Місячний платіж:         ${formatCurrency(this.results.monthlyPayment)}

📋 ДЕТАЛІЗОВАНИЙ РОЗРАХУНОК:
────────────────────────────────────────────────────────────
Період    | Основна сума | Нараховані відсотки | Залишок
────────────────────────────────────────────────────────────
`;

        this.results.schedule.forEach(row => {
            const period = String(row.period).padEnd(9);
            const principal = formatCurrency(row.principal).padEnd(13);
            const interest = formatCurrency(row.interest).padEnd(20);
            const balance = formatCurrency(row.balance);
            report += `${period}| ${principal}| ${interest}| ${balance}\n`;
        });

        report += `
────────────────────────────────────────────────────────────

Лабораторна робота 6 - Single Page Application
Розроблено: ${new Date().getFullYear()}
────────────────────────────────────────────────────────────
`;

        return report;
    }

    getCompoundingLabel(type) {
        const labels = {
            'monthly': 'Щомісячна',
            'quarterly': 'Щоквартальна',
            'annual': 'Щорічна'
        };
        return labels[type] || type;
    }

    printResults() {
        if (!this.results) {
            alert('Спочатку розрахуйте результати!');
            return;
        }

        window.print();
    }

    resetCalculator() {
        this.results = null;
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FinancialCalculator();
    console.log('✅ Калькулятор завантажено успішно!');
});
