/**
 * Gold Price Calculator - Professional JavaScript Implementation
 * 
 * This script handles all calculations for gold price calculator including:
 * - Karat price calculations (24, 22, 21, 18, 14)
 * - Piece price calculations
 * - Additional calculations (ounce, gold lira, etc.)
 * - Currency conversion (old/new Syrian Pounds)
 * - Real-time updates
 */

// ==================== DOM Elements ====================
const xauPriceInput = document.getElementById('xauPrice');
const exchangeRateTypeSelect = document.getElementById('exchangeRateType');
const exchangeRateInput = document.getElementById('exchangeRate');
const exchangeRateLabel = document.getElementById('exchangeRateLabel');
const goldPriceInput = document.getElementById('goldPrice');
const transactionTypeSelect = document.getElementById('transactionType');
const weightInput = document.getElementById('weight');
const manufacturingCurrencySelect = document.getElementById('manufacturingCurrency');
const manufacturingInput = document.getElementById('manufacturing');
const manufacturingLabel = document.getElementById('manufacturingLabel');
const resetBtn = document.getElementById('resetBtn');

// Karat price elements
const price24 = document.getElementById('price24');
const price22 = document.getElementById('price22');
const price21 = document.getElementById('price21');
const price18 = document.getElementById('price18');
const price14 = document.getElementById('price14');

// Karat currency labels
const currency24 = document.getElementById('currency24');
const currency22 = document.getElementById('currency22');
const currency21 = document.getElementById('currency21');
const currency18 = document.getElementById('currency18');
const currency14 = document.getElementById('currency14');

// Karat currency switch
const karatCurrencyNew = document.getElementById('karatCurrencyNew');
const karatCurrencyOld = document.getElementById('karatCurrencyOld');

// Piece calculation elements
const totalPrice = document.getElementById('totalPrice');
const totalPriceCurrency = document.getElementById('totalPriceCurrency');
const goldPriceResult = document.getElementById('goldPriceResult');
const manufacturingResult = document.getElementById('manufacturingResult');

// Piece currency switch
const pieceCurrencyNew = document.getElementById('pieceCurrencyNew');
const pieceCurrencyOld = document.getElementById('pieceCurrencyOld');

// Currency display state
let karatDisplayCurrency = 'new'; // 'new' or 'old'
let pieceDisplayCurrency = 'new'; // 'new' or 'old'

// Additional calculations elements
const ouncePrice = document.getElementById('ouncePrice');
const liraPrice = document.getElementById('liraPrice');
const tenGramPrice = document.getElementById('tenGramPrice');
const hundredGramPrice = document.getElementById('hundredGramPrice');

// ==================== Constants ====================
const OUNCE_GRAMS = 31.1035; // Weight of one troy ounce in grams
const GOLD_LIRA_GRAMS = 6; // Weight of Syrian Gold Lira
const CURRENCY_CONVERSION = 100; // 100 old SYP = 1 new SYP
const KARAT_24 = 24;
const KARAT_22 = 22;
const KARAT_21 = 21;
const KARAT_18 = 18;
const KARAT_14 = 14;

// ==================== Utility Functions ====================

/**
 * Format number with thousands separator (Arabic style)
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(value) {
    // Convert to fixed decimal places to avoid floating point errors
    const rounded = Math.round(value * 100) / 100;
    
    const parts = rounded.toFixed(2).split('.');
    
    // Add thousands separator using dot (.) for Arabic style
    let integerPart = parseInt(parts[0]);
    integerPart = integerPart.toLocaleString('en-US'); // Uses comma
    
    // Replace comma with dot for Arabic thousands separator
    integerPart = integerPart.replace(/,/g, '.');
    
    const decimalPart = parts[1];
    
    // Remove .00 if no decimals
    if (decimalPart === '00') {
        return integerPart;
    }
    
    // Return with Arabic decimal separator (comma)
    return integerPart + ',' + decimalPart;
}

/**
 * Calculate price for a specific karat
 * @param {number} price24 - Price of 24 karat gold per gram
 * @param {number} karat - Target karat value
 * @returns {number} Price per gram for target karat
 */
function calculateKaratPrice(price24, karat) {
    return (price24 * karat) / KARAT_24;
}

/**
 * Convert new Syrian Pounds to old Syrian Pounds
 * @param {number} newAmount - Amount in new SYP
 * @returns {number} Equivalent amount in old SYP
 */
function convertToOldCurrency(newAmount) {
    return newAmount * CURRENCY_CONVERSION;
}

/**
 * Convert old Syrian Pounds to new Syrian Pounds
 * @param {number} oldAmount - Amount in old SYP
 * @returns {number} Equivalent amount in new SYP
 */
function convertToNewCurrency(oldAmount) {
    return oldAmount / CURRENCY_CONVERSION;
}

/**
 * Convert manufacturing fee to new SYP
 * @param {number} amount - Manufacturing fee amount
 * @param {string} currency - Currency type ('syp_new', 'syp_old', 'usd')
 * @param {number} exchangeRate - Exchange rate (SYP per USD)
 * @param {string} exchangeType - Exchange rate type ('new' or 'old')
 * @returns {number} Manufacturing fee in new SYP
 */
function convertManufacturingToNewSYP(amount, currency, exchangeRate, exchangeType) {
    switch (currency) {
        case 'syp_new':
            return amount;
        case 'syp_old':
            return convertToNewCurrency(amount);
        case 'usd':
            let exchangeRateInNew = exchangeRate;
            if (exchangeType === 'old') {
                exchangeRateInNew = convertToNewCurrency(exchangeRate);
            }
            return amount * exchangeRateInNew;
        default:
            return amount;
    }
}

/**
 * Validate and parse input value
 * @param {HTMLInputElement} input - Input element
 * @returns {number} Parsed numeric value or 0
 */
function parseInputValue(input) {
    const value = parseFloat(input.value);
    return isNaN(value) || value < 0 ? 0 : value;
}

/**
 * Calculate gold price per gram from XAUUSD
 * @param {number} xauPrice - Price of one ounce in USD
 * @param {number} exchangeRate - Exchange rate (SYP per USD)
 * @param {string} exchangeType - Type of exchange rate ('new' or 'old')
 * @returns {number} Price per gram in new SYP
 */
function calculateGoldPriceFromXAU(xauPrice, exchangeRate, exchangeType) {
    // Always work with new currency for consistency
    let exchangeRateInNew = exchangeRate;
    
    // If user provided old currency rate, convert to new
    if (exchangeType === 'old') {
        exchangeRateInNew = convertToNewCurrency(exchangeRate);
    }
    
    // Calculate price: ounce price in USD × exchange rate in new SYP / grams per ounce
    const gramPrice = (xauPrice * exchangeRateInNew) / OUNCE_GRAMS;
    return gramPrice;
}

/**
 * Update exchange rate label based on selection
 */
function updateExchangeRateLabel() {
    if (exchangeRateLabel) {
        const exchangeType = exchangeRateTypeSelect.value;
        exchangeRateLabel.textContent = exchangeType === 'old' ? 'ل.س قديم / $' : 'ل.س جديد / $';
    }
}

/**
 * Update manufacturing label based on currency selection
 */
function updateManufacturingLabel() {
    if (manufacturingLabel) {
        const currency = manufacturingCurrencySelect.value;
        switch (currency) {
            case 'syp_new':
                manufacturingLabel.textContent = 'ل.س جديد';
                break;
            case 'syp_old':
                manufacturingLabel.textContent = 'ل.س قديم';
                break;
            case 'usd':
                manufacturingLabel.textContent = '$ USD';
                break;
        }
    }
}

/**
 * Update all karat prices
 * @param {number} price24Value - Price of 24 karat gold per gram (in new SYP)
 */
function updateKaratPrices(price24Value) {
    // Calculate prices for each karat
    const price22Value = calculateKaratPrice(price24Value, KARAT_22);
    const price21Value = calculateKaratPrice(price24Value, KARAT_21);
    const price18Value = calculateKaratPrice(price24Value, KARAT_18);
    const price14Value = calculateKaratPrice(price24Value, KARAT_14);

    // Determine display currency
    const displayInOld = karatDisplayCurrency === 'old';
    const currencyText = displayInOld ? 'ل.س قديم' : 'ل.س جديد';

    // Update prices based on selected currency
    price24.textContent = formatNumber(displayInOld ? convertToOldCurrency(price24Value) : price24Value);
    price22.textContent = formatNumber(displayInOld ? convertToOldCurrency(price22Value) : price22Value);
    price21.textContent = formatNumber(displayInOld ? convertToOldCurrency(price21Value) : price21Value);
    price18.textContent = formatNumber(displayInOld ? convertToOldCurrency(price18Value) : price18Value);
    price14.textContent = formatNumber(displayInOld ? convertToOldCurrency(price14Value) : price14Value);

    // Update currency labels
    currency24.textContent = currencyText;
    currency22.textContent = currencyText;
    currency21.textContent = currencyText;
    currency18.textContent = currencyText;
    currency14.textContent = currencyText;
}

/**
 * Calculate and display piece price
 * @param {number} goldPrice - Price per gram (assumed 24 karat, in new SYP)
 * @param {number} weight - Weight in grams
 * @param {number} manufacturing - Manufacturing fee in selected currency
 * @param {string} manufacturingCurrency - Currency type for manufacturing fee
 * @param {number} exchangeRate - Exchange rate (SYP per USD)
 * @param {string} exchangeType - Exchange rate type ('new' or 'old')
 * @param {string} transactionType - Transaction type ('buyer' or 'seller')
 */
function updatePiecePrice(goldPrice, weight, manufacturing, manufacturingCurrency, exchangeRate, exchangeType, transactionType) {
    // Convert manufacturing fee to new SYP
    const manufacturingInNewSYP = convertManufacturingToNewSYP(manufacturing, manufacturingCurrency, exchangeRate, exchangeType);

    // Calculate total gold price
    const totalGoldPrice = goldPrice * weight;

    // Calculate total price based on transaction type
    let totalNew;
    let operationText;
    
    if (transactionType === 'seller') {
        // For seller: Add manufacturing fee
        totalNew = totalGoldPrice + manufacturingInNewSYP;
        operationText = '+';
    } else {
        // For buyer: Subtract manufacturing fee
        totalNew = totalGoldPrice - manufacturingInNewSYP;
        operationText = '-';
    }

    // Ensure price doesn't go negative
    if (totalNew < 0) {
        totalNew = 0;
    }

    // Determine display currency
    const displayInOld = pieceDisplayCurrency === 'old';
    const currencyText = displayInOld ? 'ل.س قديم' : 'ل.س جديد';
    const displayPrice = displayInOld ? convertToOldCurrency(totalNew) : totalNew;

    // Update DOM elements
    totalPrice.textContent = formatNumber(displayPrice);
    totalPriceCurrency.textContent = currencyText;
    goldPriceResult.textContent = formatNumber(displayInOld ? convertToOldCurrency(totalGoldPrice) : totalGoldPrice) + ' ' + currencyText;
    manufacturingResult.textContent = formatNumber(displayInOld ? convertToOldCurrency(manufacturingInNewSYP) : manufacturingInNewSYP) + ' ' + currencyText + ' (' + operationText + ')';
}

/**
 * Update additional calculations
 * @param {number} price24 - Price of 24 karat gold per gram
 */
function updateAdditionalCalculations(price24) {
    // Calculate ounce price
    const ounceValue = price24 * OUNCE_GRAMS;

    // Calculate gold lira price (6 grams)
    const liraValue = price24 * GOLD_LIRA_GRAMS;

    // Calculate 10 grams price
    const tenGramValue = price24 * 10;

    // Calculate 100 grams price
    const hundredGramValue = price24 * 100;

    // Update DOM elements
    ouncePrice.textContent = formatNumber(ounceValue);
    liraPrice.textContent = formatNumber(liraValue);
    tenGramPrice.textContent = formatNumber(tenGramValue);
    hundredGramPrice.textContent = formatNumber(hundredGramValue);
}

/**
 * Main calculation function - updates all calculations
 */
function calculateAll() {
    // Parse XAUUSD and exchange rate values
    const xauPrice = parseInputValue(xauPriceInput);
    const exchangeRate = parseInputValue(exchangeRateInput);
    const exchangeType = exchangeRateTypeSelect.value;
    const transactionType = transactionTypeSelect.value;
    const manufacturingCurrency = manufacturingCurrencySelect.value;

    // Update exchange rate label
    updateExchangeRateLabel();

    // Update manufacturing label
    updateManufacturingLabel();

    // Calculate gold price from XAUUSD if both values are provided
    if (xauPrice > 0 && exchangeRate > 0) {
        const calculatedPrice = calculateGoldPriceFromXAU(xauPrice, exchangeRate, exchangeType);
        goldPriceInput.value = calculatedPrice.toFixed(2);
    }

    // Parse gold price and other values
    const goldPrice = parseInputValue(goldPriceInput);
    const weight = parseInputValue(weightInput);
    const manufacturing = parseInputValue(manufacturingInput);

    // Update all calculation sections
    updateKaratPrices(goldPrice);
    updatePiecePrice(goldPrice, weight, manufacturing, manufacturingCurrency, exchangeRate, exchangeType, transactionType);
    updateAdditionalCalculations(goldPrice);
}

/**
 * Reset all calculations to zero
 */
function resetCalculations() {
    xauPriceInput.value = 0;
    exchangeRateInput.value = 0;
    goldPriceInput.value = 0;
    weightInput.value = 0;
    manufacturingInput.value = 0;
    exchangeRateTypeSelect.value = 'new';
    transactionTypeSelect.value = 'buyer';
    manufacturingCurrencySelect.value = 'syp_new';
    calculateAll();
}

/**
 * Prevent negative values in inputs
 * @param {Event} e - Keyboard event
 */
function preventNegativeValues(e) {
    if (e.key === '-' || e.key === 'e') {
        e.preventDefault();
    }
}

/**
 * Initialize calculator when page loads
 */
function initializeCalculator() {
    console.log('Gold Price Calculator initialized');
    
    // Perform initial calculation
    calculateAll();

    // Add loading animation complete
    document.body.classList.add('loaded');
}

// ==================== Event Listeners ====================

// List of all input elements that trigger calculations
const calculationTriggers = [
    xauPriceInput,
    exchangeRateTypeSelect,
    exchangeRateInput,
    transactionTypeSelect,
    weightInput,
    manufacturingCurrencySelect,
    manufacturingInput
];

// Add event listeners for real-time updates
calculationTriggers.forEach(element => {
    element.addEventListener('input', calculateAll);
    element.addEventListener('change', calculateAll);
});

// Prevent negative values for number inputs
const numberInputs = [xauPriceInput, exchangeRateInput, weightInput, manufacturingInput];
numberInputs.forEach(input => {
    input.addEventListener('keypress', preventNegativeValues);
});

// Reset button event listener
if (resetBtn) {
    resetBtn.addEventListener('click', resetCalculations);
}

// Karat currency switch event listeners
if (karatCurrencyNew) {
    karatCurrencyNew.addEventListener('change', function() {
        if (this.checked) {
            karatDisplayCurrency = 'new';
            calculateAll();
        }
    });
}

if (karatCurrencyOld) {
    karatCurrencyOld.addEventListener('change', function() {
        if (this.checked) {
            karatDisplayCurrency = 'old';
            calculateAll();
        }
    });
}

// Piece currency switch event listeners
if (pieceCurrencyNew) {
    pieceCurrencyNew.addEventListener('change', function() {
        if (this.checked) {
            pieceDisplayCurrency = 'new';
            calculateAll();
        }
    });
}

if (pieceCurrencyOld) {
    pieceCurrencyOld.addEventListener('change', function() {
        if (this.checked) {
            pieceDisplayCurrency = 'old';
            calculateAll();
        }
    });
}

// ==================== Keyboard Shortcuts ====================

document.addEventListener('keydown', function(e) {
    // Reset on Escape key
    if (e.key === 'Escape') {
        e.preventDefault();
        resetCalculations();
    }

    // Focus on XAU price input on Ctrl+G
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        xauPriceInput.focus();
    }

    // Focus on exchange rate input on Ctrl+E
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exchangeRateInput.focus();
    }

    // Focus on weight input on Ctrl+W
    if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        weightInput.focus();
    }
});

// ==================== Initialization ====================

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);

// Alternative initialization for older browsers
window.addEventListener('load', initializeCalculator);

// ==================== Export Functions (for potential future use) ====================

// Export main functions to global scope for testing or external use
if (typeof window !== 'undefined') {
    window.GoldCalculator = {
        calculateAll,
        resetCalculations,
        formatNumber,
        calculateKaratPrice,
        convertToOldCurrency
    };
}

console.log('Gold Price Calculator Script loaded successfully');