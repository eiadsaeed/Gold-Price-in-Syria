/**
 * Gold Price Calculator - Professional JavaScript Implementation
 * 
 * This script handles all calculations for gold price calculator including:
 * - Karat price calculations (24, 22, 21, 18, 14)
 * - Piece price calculations
 * - Additional calculations (ounce, gold lira, etc.)
 * - Currency conversion (old/new Syrian Pounds, USD)
 * - Real-time updates
 * 
 * CRITICAL RULES:
 * 1. XAUUSD is SINGLE source of truth
 * 2. USD prices are ALWAYS calculated directly from XAUUSD (never from SYP)
 * 3. Old Syrian Pound is DISPLAY ONLY: oldSYP = newSYP × 100
 * 4. Troy ounce = EXACTLY 31.1035 grams
 */

// ==================== DOM Elements ====================
// CRITICAL: All DOM queries moved inside initializeCalculator() to ensure they run AFTER DOM is ready
let xauPriceInput = null;
let exchangeRateTypeSelect = null;
let exchangeRateInput = null;
let exchangeRateLabel = null;
let goldPriceInput = null;
let transactionTypeSelect = null;
let weightInput = null;
let manufacturingCurrencySelect = null;
let manufacturingInput = null;
let manufacturingLabel = null;
let resetBtn = null;

// Karat price elements
let price24 = null;
let price22 = null;
let price21 = null;
let price18 = null;
let price14 = null;

// Karat currency labels
let currency24 = null;
let currency22 = null;
let currency21 = null;
let currency18 = null;
let currency14 = null;

// Karat currency switch
let karatCurrencyNew = null;
let karatCurrencyOld = null;
let karatCurrencyUsd = null;

// Piece calculation elements
let totalPrice = null;
let totalPriceCurrency = null;
let goldPriceResult = null;
let manufacturingResult = null;

// Piece currency switch
let pieceCurrencyNew = null;
let pieceCurrencyOld = null;
let pieceCurrencyUsd = null;

// Additional calculations elements
let ouncePrice = null;
let liraPrice = null;
let tenGramPrice = null;
let hundredGramPrice = null;

// Additional currency labels
let tenGramCurrency = null;
let hundredGramCurrency = null;
let ounceCurrency = null;
let liraCurrency = null;

// Additional currency switch
let additionalCurrencyNew = null;
let additionalCurrencyOld = null;
let additionalCurrencyUsd = null;

// Lira type selector
let liraTypeSelect = null;
let liraLabel = null;

// Currency display state
let karatDisplayCurrency = 'new'; // 'new', 'old', or 'usd'
let pieceDisplayCurrency = 'new'; // 'new', 'old', or 'usd'
let additionalDisplayCurrency = 'new'; // 'new', 'old', or 'usd'

// ==================== Constants ====================
const OUNCE_GRAMS = 31.1035; // Weight of one troy ounce in grams (EXACT)
const CURRENCY_CONVERSION = 100; // 100 old SYP = 1 new SYP (DISPLAY ONLY)
const KARAT_24 = 24;
const KARAT_22 = 22;
const KARAT_21 = 21;
const KARAT_18 = 18;
const KARAT_14 = 14;

// Historical gold coins data (FIXED - immutable)
const HISTORICAL_COINS = {
    ottoman: {
        totalWeight: 7.216,
        karat: 22,
        pureGold: 6.61,
        label: 'الليرة العثمانية (تركية)',
        shortLabel: 'سعر الليرة العثمانية'
    },
    egyptian: {
        totalWeight: 7.988,
        karat: 22,
        pureGold: 7.322,
        label: 'الجنيه المصري',
        shortLabel: 'سعر الجنيه المصري'
    },
    british: {
        totalWeight: 7.988,
        karat: 22,
        pureGold: 7.322,
        label: 'الجنيه البريطاني',
        shortLabel: 'سعر الجنيه البريطاني'
    }
};

// ==================== Validation State ====================
let validationError = null;

// ==================== Core Calculation Functions ====================

/**
 * Calculate price per gram in USD directly from XAUUSD
 * CRITICAL: This is SINGLE source of truth for USD prices
 * @param {number} xauPrice - Price of one troy ounce in USD
 * @returns {number} Price per gram in USD
 */
function calculateGramPriceUSD(xauPrice) {
    // Prevent division by zero and invalid inputs
    if (!isFinite(xauPrice) || xauPrice <= 0) {
        return 0;
    }
    return xauPrice / OUNCE_GRAMS;
}

/**
 * Calculate price per gram in new SYP from USD gram price
 * @param {number} gramPriceUSD - Price per gram in USD
 * @param {number} exchangeRate - Exchange rate (SYP new per USD)
 * @param {string} exchangeType - 'new' or 'old'
 * @returns {number} Price per gram in new SYP
 */
function calculateGramPriceSYP(gramPriceUSD, exchangeRate, exchangeType) {
    // Convert exchange rate to new SYP if provided in old
    let exchangeRateInNew = exchangeRate;
    if (exchangeType === 'old') {
        exchangeRateInNew = exchangeRate / CURRENCY_CONVERSION;
    }
    
    if (!isFinite(exchangeRateInNew) || exchangeRateInNew <= 0) {
        return 0;
    }
    
    return gramPriceUSD * exchangeRateInNew;
}

/**
 * Calculate price for a specific karat
 * @param {number} price24USD - Price of 24 karat gold per gram in USD
 * @param {number} karat - Target karat value
 * @returns {number} Price per gram for target karat in USD
 */
function calculateKaratPriceUSD(price24USD, karat) {
    return (price24USD * karat) / KARAT_24;
}

/**
 * Calculate karat price in new SYP
 * @param {number} price24SYP - Price of 24 karat gold per gram in new SYP
 * @param {number} karat - Target karat value
 * @returns {number} Price per gram for target karat in new SYP
 */
function calculateKaratPriceSYP(price24SYP, karat) {
    return (price24SYP * karat) / KARAT_24;
}

/**
 * Convert new SYP to old SYP for DISPLAY ONLY
 * CRITICAL: This is display conversion only, not calculation
 * @param {number} newSYP - Amount in new SYP
 * @returns {number} Amount in old SYP
 */
function convertToOldSYP(newSYP) {
    return newSYP * CURRENCY_CONVERSION;
}

/**
 * Convert manufacturing fee to result currency
 * CRITICAL: Never mix currencies in arithmetic
 * @param {number} fee - Manufacturing fee amount
 * @param {string} feeCurrency - 'syp_new', 'syp_old', 'usd'
 * @param {string} resultCurrency - 'new', 'old', 'usd'
 * @param {number} exchangeRate - Exchange rate (SYP new per USD)
 * @param {string} exchangeType - 'new' or 'old'
 * @returns {number} Manufacturing fee in result currency
 */
function convertManufacturingFee(fee, feeCurrency, resultCurrency, exchangeRate, exchangeType) {
    // If same currency, no conversion needed
    if (feeCurrency === resultCurrency) {
        return fee;
    }
    
    // Convert fee to new SYP as intermediate step
    let feeInNewSYP;
    
    if (feeCurrency === 'syp_new') {
        feeInNewSYP = fee;
    } else if (feeCurrency === 'syp_old') {
        feeInNewSYP = fee / CURRENCY_CONVERSION;
    } else if (feeCurrency === 'usd') {
        // Convert USD to new SYP using exchange rate
        let exchangeRateInNew = exchangeRate;
        if (exchangeType === 'old') {
            exchangeRateInNew = exchangeRate / CURRENCY_CONVERSION;
        }
        if (exchangeRateInNew <= 0) return 0;
        feeInNewSYP = fee * exchangeRateInNew;
    }
    
    // Convert from new SYP to result currency
    if (resultCurrency === 'new') {
        return feeInNewSYP;
    } else if (resultCurrency === 'old') {
        return feeInNewSYP * CURRENCY_CONVERSION;
    } else if (resultCurrency === 'usd') {
        // Convert new SYP to USD using inverse of exchange rate
        let exchangeRateInNew = exchangeRate;
        if (exchangeType === 'old') {
            exchangeRateInNew = exchangeRate / CURRENCY_CONVERSION;
        }
        if (exchangeRateInNew <= 0) return 0;
        return feeInNewSYP / exchangeRateInNew;
    }
    
    return feeInNewSYP;
}

// ==================== Utility Functions ====================

/**
 * Validate and parse input value
 * @param {HTMLInputElement} input - Input element
 * @returns {number} Parsed numeric value or 0
 */
function parseInputValue(input) {
    if (!input || input.value === '') return 0;
    const value = parseFloat(input.value);
    return isNaN(value) || value < 0 ? 0 : value;
}

/**
 * Validate all required inputs before calculation
 * @param {number} xauPrice - XAUUSD price
 * @param {number} exchangeRate - Exchange rate
 * @param {number} weight - Piece weight
 * @returns {boolean} True if valid, false otherwise
 */
function validateInputs(xauPrice, exchangeRate, weight) {
    if (xauPrice <= 0) {
        validationError = 'الرجاء إدخال سعر الذهب بالبورصة (XAUUSD)';
        return false;
    }
    if (exchangeRate <= 0) {
        validationError = 'الرجاء إدخال سعر صرف الدولار';
        return false;
    }
    if (weight <= 0) {
        validationError = 'الرجاء إدخال وزن القطعة';
        return false;
    }
    validationError = null;
    return true;
}

/**
 * Format number with thousands separator (Arabic style)
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(value) {
    if (!isFinite(value)) return '0';
    
    const rounded = Math.round(value * 100) / 100;
    const parts = rounded.toFixed(2).split('.');
    
    let integerPart = parseInt(parts[0]);
    integerPart = integerPart.toLocaleString('en-US');
    integerPart = integerPart.replace(/,/g, '.');
    
    const decimalPart = parts[1];
    
    if (decimalPart === '00') {
        return integerPart;
    }
    
    return integerPart + ',' + decimalPart;
}

// ==================== Display Update Functions ====================

/**
 * Update exchange rate label
 */
function updateExchangeRateLabel() {
    if (exchangeRateLabel) {
        const exchangeType = exchangeRateTypeSelect.value;
        exchangeRateLabel.textContent = exchangeType === 'old' ? 'ل.س قديم / $' : 'ل.س جديد / $';
    }
}

/**
 * Update manufacturing fee label
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
 * Update karat prices display
 * @param {number} gramPriceUSD - Price per gram in USD
 * @param {number} gramPriceSYP - Price per gram in new SYP
 */
function updateKaratPricesDisplay(gramPriceUSD, gramPriceSYP) {
    const displayInUSD = karatDisplayCurrency === 'usd';
    const displayInOld = karatDisplayCurrency === 'old';
    
    let display24, display22, display21, display18, display14;
    const currencyText = displayInUSD ? '$ USD' : (displayInOld ? 'ل.س قديم' : 'ل.س جديد');
    
    if (displayInUSD) {
        display24 = gramPriceUSD;
        display22 = calculateKaratPriceUSD(gramPriceUSD, KARAT_22);
        display21 = calculateKaratPriceUSD(gramPriceUSD, KARAT_21);
        display18 = calculateKaratPriceUSD(gramPriceUSD, KARAT_18);
        display14 = calculateKaratPriceUSD(gramPriceUSD, KARAT_14);
    } else if (displayInOld) {
        display24 = convertToOldSYP(gramPriceSYP);
        display22 = convertToOldSYP(calculateKaratPriceSYP(gramPriceSYP, KARAT_22));
        display21 = convertToOldSYP(calculateKaratPriceSYP(gramPriceSYP, KARAT_21));
        display18 = convertToOldSYP(calculateKaratPriceSYP(gramPriceSYP, KARAT_18));
        display14 = convertToOldSYP(calculateKaratPriceSYP(gramPriceSYP, KARAT_14));
    } else {
        display24 = gramPriceSYP;
        display22 = calculateKaratPriceSYP(gramPriceSYP, KARAT_22);
        display21 = calculateKaratPriceSYP(gramPriceSYP, KARAT_21);
        display18 = calculateKaratPriceSYP(gramPriceSYP, KARAT_18);
        display14 = calculateKaratPriceSYP(gramPriceSYP, KARAT_14);
    }
    
    price24.textContent = formatNumber(display24);
    price22.textContent = formatNumber(display22);
    price21.textContent = formatNumber(display21);
    price18.textContent = formatNumber(display18);
    price14.textContent = formatNumber(display14);
    
    currency24.textContent = currencyText;
    currency22.textContent = currencyText;
    currency21.textContent = currencyText;
    currency18.textContent = currencyText;
    currency14.textContent = currencyText;
}

/**
 * Update piece price display
 * @param {number} gramPriceUSD - Price per gram in USD
 * @param {number} gramPriceSYP - Price per gram in new SYP
 * @param {number} weight - Piece weight in grams
 * @param {number} manufacturingFee - Manufacturing fee
 * @param {string} manufacturingCurrency - Fee currency
 * @param {number} exchangeRate - Exchange rate
 * @param {string} exchangeType - 'new' or 'old'
 * @param {string} transactionType - 'buyer' or 'seller'
 */
function updatePiecePriceDisplay(gramPriceUSD, gramPriceSYP, weight, manufacturingFee, manufacturingCurrency, exchangeRate, exchangeType, transactionType) {
    const displayInUSD = pieceDisplayCurrency === 'usd';
    const displayInOld = pieceDisplayCurrency === 'old';
    const currencyText = displayInUSD ? '$ USD' : (displayInOld ? 'ل.س قديم' : 'ل.س جديد');
    
    let displayPrice, displayGoldPrice, displayManufacturing;
    let operationText = '';
    
    // Calculate manufacturing fee in result currency BEFORE applying
    const resultCurrency = displayInUSD ? 'usd' : (displayInOld ? 'old' : 'new');
    const feeInResultCurrency = convertManufacturingFee(manufacturingFee, manufacturingCurrency, resultCurrency, exchangeRate, exchangeType);
    
    if (displayInUSD) {
        // USD calculation: gold value directly from USD gram price
        displayGoldPrice = gramPriceUSD * weight;
        displayManufacturing = feeInResultCurrency;
        
        if (transactionType === 'seller') {
            displayPrice = displayGoldPrice + displayManufacturing;
            operationText = '+';
        } else {
            displayPrice = displayGoldPrice - displayManufacturing;
            operationText = '-';
        }
    } else if (displayInOld) {
        // Old SYP calculation
        const goldPriceSYP = gramPriceSYP * weight;
        displayGoldPrice = convertToOldSYP(goldPriceSYP);
        displayManufacturing = feeInResultCurrency;
        
        if (transactionType === 'seller') {
            displayPrice = displayGoldPrice + displayManufacturing;
            operationText = '+';
        } else {
            displayPrice = displayGoldPrice - displayManufacturing;
            operationText = '-';
        }
    } else {
        // New SYP calculation
        const goldPriceSYP = gramPriceSYP * weight;
        displayGoldPrice = goldPriceSYP;
        displayManufacturing = feeInResultCurrency;
        
        if (transactionType === 'seller') {
            displayPrice = goldPriceSYP + displayManufacturing;
            operationText = '+';
        } else {
            displayPrice = goldPriceSYP - displayManufacturing;
            operationText = '-';
        }
    }
    
    // Ensure non-negative
    if (displayPrice < 0) displayPrice = 0;
    
    totalPrice.textContent = formatNumber(displayPrice);
    totalPriceCurrency.textContent = currencyText;
    goldPriceResult.textContent = formatNumber(displayGoldPrice) + ' ' + currencyText;
    manufacturingResult.textContent = formatNumber(displayManufacturing) + ' ' + currencyText + ' (' + operationText + ')';
}

/**
 * Update additional calculations display
 * @param {number} gramPriceUSD - Price per gram in USD
 * @param {number} gramPriceSYP - Price per gram in new SYP
 */
function updateAdditionalCalculationsDisplay(gramPriceUSD, gramPriceSYP) {
    const displayInUSD = additionalDisplayCurrency === 'usd';
    const displayInOld = additionalDisplayCurrency === 'old';
    const currencyText = displayInUSD ? '$ USD' : (displayInOld ? 'ل.س قديم' : 'ل.س جديد');
    
    let displayOunce, displayLira, displayTenGram, displayHundredGram;
    
    if (displayInUSD) {
        displayOunce = gramPriceUSD * OUNCE_GRAMS;
        
        const liraType = liraTypeSelect ? liraTypeSelect.value : 'ottoman';
        const coinData = HISTORICAL_COINS[liraType] || HISTORICAL_COINS.ottoman;
        displayLira = gramPriceUSD * coinData.pureGold;
        
        displayTenGram = gramPriceUSD * 10;
        displayHundredGram = gramPriceUSD * 100;
    } else if (displayInOld) {
        displayOunce = convertToOldSYP(gramPriceSYP * OUNCE_GRAMS);
        
        const liraType = liraTypeSelect ? liraTypeSelect.value : 'ottoman';
        const coinData = HISTORICAL_COINS[liraType] || HISTORICAL_COINS.ottoman;
        displayLira = convertToOldSYP(gramPriceSYP * coinData.pureGold);
        
        displayTenGram = convertToOldSYP(gramPriceSYP * 10);
        displayHundredGram = convertToOldSYP(gramPriceSYP * 100);
    } else {
        displayOunce = gramPriceSYP * OUNCE_GRAMS;
        
        const liraType = liraTypeSelect ? liraTypeSelect.value : 'ottoman';
        const coinData = HISTORICAL_COINS[liraType] || HISTORICAL_COINS.ottoman;
        displayLira = gramPriceSYP * coinData.pureGold;
        
        displayTenGram = gramPriceSYP * 10;
        displayHundredGram = gramPriceSYP * 100;
    }
    
    ouncePrice.textContent = formatNumber(displayOunce);
    liraPrice.textContent = formatNumber(displayLira);
    tenGramPrice.textContent = formatNumber(displayTenGram);
    hundredGramPrice.textContent = formatNumber(displayHundredGram);
    
    tenGramCurrency.textContent = currencyText;
    hundredGramCurrency.textContent = currencyText;
    ounceCurrency.textContent = '(31.1035 غرام)';
    
    const liraType = liraTypeSelect ? liraTypeSelect.value : 'ottoman';
    const coinData = HISTORICAL_COINS[liraType] || HISTORICAL_COINS.ottoman;
    if (liraCurrency) {
        liraCurrency.textContent = `(${coinData.pureGold} غرام خالص)`;
    }
    if (liraLabel) {
        liraLabel.textContent = coinData.label || 'سعر الليرة الذهبية';
    }
}

/**
 * Show validation error message
 */
function showValidationError() {
    if (validationError) {
        console.warn('Validation Error:', validationError);
        // Could add visual error display here
    }
}

// ==================== Main Calculation Function ====================

/**
 * Main calculation function - orchestrates all calculations
 * CRITICAL: Separates calculation logic from DOM rendering
 * CRITICAL: Allows partial rendering when some inputs are missing
 */
function calculateAll() {
    // Parse inputs
    const xauPrice = parseInputValue(xauPriceInput);
    const exchangeRate = parseInputValue(exchangeRateInput);
    const exchangeType = exchangeRateTypeSelect.value;
    const weight = parseInputValue(weightInput);
    const manufacturingFee = parseInputValue(manufacturingInput);
    const manufacturingCurrency = manufacturingCurrencySelect.value;
    const transactionType = transactionTypeSelect.value;
    
    // Update labels
    updateExchangeRateLabel();
    updateManufacturingLabel();
    
    // Calculate base prices (SINGLE source of truth)
    // CRITICAL: USD prices always calculated from XAUUSD, independent of exchange rate
    const gramPriceUSD = calculateGramPriceUSD(xauPrice);
    
    // SYP prices require exchange rate
    let gramPriceSYP = 0;
    if (exchangeRate > 0) {
        gramPriceSYP = calculateGramPriceSYP(gramPriceUSD, exchangeRate, exchangeType);
        // Update gold price input field only if we have valid exchange rate
        goldPriceInput.value = gramPriceSYP.toFixed(2);
    } else {
        // Clear gold price field if no exchange rate
        goldPriceInput.value = '0';
    }
    
    // CRITICAL: Always update displays, even if partial data
    // USD prices will show with XAUUSD only
    // SYP prices will show 0 if exchange rate is missing
    updateKaratPricesDisplay(gramPriceUSD, gramPriceSYP);
    updatePiecePriceDisplay(gramPriceUSD, gramPriceSYP, weight, manufacturingFee, manufacturingCurrency, exchangeRate, exchangeType, transactionType);
    updateAdditionalCalculationsDisplay(gramPriceUSD, gramPriceSYP);
    
    // Validate for piece calculation (only show warning for piece calculation)
    if (xauPrice > 0 && exchangeRate > 0 && weight <= 0) {
        validationError = 'الرجاء إدخال وزن القطعة';
        showValidationError();
    } else {
        validationError = null;
    }
}

/**
 * Reset all calculations
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
    validationError = null;
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
 * Query and cache all DOM elements
 * CRITICAL: This MUST run AFTER DOM is ready
 */
function queryDOMElements() {
    // Main input elements
    xauPriceInput = document.getElementById('xauPrice');
    exchangeRateTypeSelect = document.getElementById('exchangeRateType');
    exchangeRateInput = document.getElementById('exchangeRate');
    exchangeRateLabel = document.getElementById('exchangeRateLabel');
    goldPriceInput = document.getElementById('goldPrice');
    transactionTypeSelect = document.getElementById('transactionType');
    weightInput = document.getElementById('weight');
    manufacturingCurrencySelect = document.getElementById('manufacturingCurrency');
    manufacturingInput = document.getElementById('manufacturing');
    manufacturingLabel = document.getElementById('manufacturingLabel');
    resetBtn = document.getElementById('resetBtn');

    // Karat price elements
    price24 = document.getElementById('price24');
    price22 = document.getElementById('price22');
    price21 = document.getElementById('price21');
    price18 = document.getElementById('price18');
    price14 = document.getElementById('price14');

    // Karat currency labels
    currency24 = document.getElementById('currency24');
    currency22 = document.getElementById('currency22');
    currency21 = document.getElementById('currency21');
    currency18 = document.getElementById('currency18');
    currency14 = document.getElementById('currency14');

    // Karat currency switch
    karatCurrencyNew = document.getElementById('karatCurrencyNew');
    karatCurrencyOld = document.getElementById('karatCurrencyOld');
    karatCurrencyUsd = document.getElementById('karatCurrencyUsd');

    // Piece calculation elements
    totalPrice = document.getElementById('totalPrice');
    totalPriceCurrency = document.getElementById('totalPriceCurrency');
    goldPriceResult = document.getElementById('goldPriceResult');
    manufacturingResult = document.getElementById('manufacturingResult');

    // Piece currency switch
    pieceCurrencyNew = document.getElementById('pieceCurrencyNew');
    pieceCurrencyOld = document.getElementById('pieceCurrencyOld');
    pieceCurrencyUsd = document.getElementById('pieceCurrencyUsd');

    // Additional calculations elements
    ouncePrice = document.getElementById('ouncePrice');
    liraPrice = document.getElementById('liraPrice');
    tenGramPrice = document.getElementById('tenGramPrice');
    hundredGramPrice = document.getElementById('hundredGramPrice');

    // Additional currency labels
    tenGramCurrency = document.getElementById('tenGramCurrency');
    hundredGramCurrency = document.getElementById('hundredGramCurrency');
    ounceCurrency = document.getElementById('ounceCurrency');
    liraCurrency = document.getElementById('liraCurrency');

    // Additional currency switch
    additionalCurrencyNew = document.getElementById('additionalCurrencyNew');
    additionalCurrencyOld = document.getElementById('additionalCurrencyOld');
    additionalCurrencyUsd = document.getElementById('additionalCurrencyUsd');

    // Lira type selector
    liraTypeSelect = document.getElementById('liraType');
    liraLabel = document.getElementById('liraLabel');
}

/**
 * Bind all event listeners
 * CRITICAL: This MUST run AFTER DOM is ready
 */
function bindEventListeners() {
    const calculationTriggers = [
        xauPriceInput,
        exchangeRateTypeSelect,
        exchangeRateInput,
        transactionTypeSelect,
        weightInput,
        manufacturingCurrencySelect,
        manufacturingInput,
        liraTypeSelect
    ];

    calculationTriggers.forEach(element => {
        if (element) {
            element.addEventListener('input', calculateAll);
            element.addEventListener('change', calculateAll);
        }
    });

    const numberInputs = [xauPriceInput, exchangeRateInput, weightInput, manufacturingInput];
    numberInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', preventNegativeValues);
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', resetCalculations);
    }

    // Karat currency switch
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
    if (karatCurrencyUsd) {
        karatCurrencyUsd.addEventListener('change', function() {
            if (this.checked) {
                karatDisplayCurrency = 'usd';
                calculateAll();
            }
        });
    }

    // Piece currency switch
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
    if (pieceCurrencyUsd) {
        pieceCurrencyUsd.addEventListener('change', function() {
            if (this.checked) {
                pieceDisplayCurrency = 'usd';
                calculateAll();
            }
        });
    }

    // Additional currency switch
    if (additionalCurrencyNew) {
        additionalCurrencyNew.addEventListener('change', function() {
            if (this.checked) {
                additionalDisplayCurrency = 'new';
                calculateAll();
            }
        });
    }
    if (additionalCurrencyOld) {
        additionalCurrencyOld.addEventListener('change', function() {
            if (this.checked) {
                additionalDisplayCurrency = 'old';
                calculateAll();
            }
        });
    }
    if (additionalCurrencyUsd) {
        additionalCurrencyUsd.addEventListener('change', function() {
            if (this.checked) {
                additionalDisplayCurrency = 'usd';
                calculateAll();
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            resetCalculations();
        }
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            if (xauPriceInput) xauPriceInput.focus();
        }
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            if (exchangeRateInput) exchangeRateInput.focus();
        }
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            if (weightInput) weightInput.focus();
        }
    });
}

/**
 * Initialize calculator - runs ONCE after DOM is ready
 * CRITICAL: This function queries DOM and binds events ONLY ONCE
 */
function initializeCalculator() {
    console.log('Gold Price Calculator initializing...');
    
    // Step 1: Query all DOM elements
    queryDOMElements();
    
    // Step 2: Bind all event listeners
    bindEventListeners();
    
    // Step 3: Perform initial calculation
    calculateAll();
    
    // Step 4: Add loaded class
    document.body.classList.add('loaded');
    
    console.log('Gold Price Calculator initialized successfully');
}

// ==================== Initialization ====================
// CRITICAL: Initialize ONCE after DOM is ready
// DO NOT use window.addEventListener('load') as it causes double initialization
document.addEventListener('DOMContentLoaded', initializeCalculator);

// ==================== Export for Testing ====================
if (typeof window !== 'undefined') {
    window.GoldCalculator = {
        calculateAll,
        calculateGramPriceUSD,
        calculateGramPriceSYP,
        calculateKaratPriceUSD,
        calculateKaratPriceSYP,
        validateInputs
    };
}

console.log('Gold Price Calculator Script loaded');