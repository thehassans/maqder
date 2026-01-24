import momentHijri from 'moment-hijri';

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

const isSaudiNationality = (nationality) => {
  const raw = String(nationality || '').trim();
  const s = raw.toLowerCase();
  if (!s) return false;

  if (s === 'non-saudi' || s === 'non saudi') return false;
  if (s.includes('non') && s.includes('saudi')) return false;
  if (raw.includes('غير') && raw.includes('سعود')) return false;

  if (s === 'saudi' || s === 'sa' || s === 'ksa') return true;
  if (s === 'saudi arabia' || s === 'kingdom of saudi arabia') return true;
  if (s.includes('saudi')) return true;
  if (raw === 'سعودي' || raw === 'السعودية' || raw === 'سعودية') return true;

  return false;
};

const getAgeAtDate = (dateOfBirth, asOfDate) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const asOf = asOfDate ? new Date(asOfDate) : new Date();
  if (Number.isNaN(dob.getTime()) || Number.isNaN(asOf.getTime())) return null;

  let age = asOf.getFullYear() - dob.getFullYear();
  const m = asOf.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) age -= 1;
  return age;
};

/**
 * Calculate GOSI contributions based on Saudi Labor Law
 * @param {number} salary - Basic salary (GOSI calculation base)
 * @param {string} nationality - Employee nationality
 * @returns {object} - GOSI breakdown
 */
export function calculateGOSI(salary, nationality) {
  const isSaudi = isSaudiNationality(nationality);

  const salaryNumber = Number(salary);
  if (Number.isNaN(salaryNumber) || salaryNumber < 0) {
    throw new Error('Invalid input: salary must be a non-negative number');
  }

  const dateOfBirth = arguments?.[2]?.dateOfBirth;
  const asOfDate = arguments?.[2]?.asOfDate;
  const age = getAgeAtDate(dateOfBirth, asOfDate);
  const sanedEligible = isSaudi && (age === null || age < 60);
  
  // GOSI rates as per Saudi regulations
  const rates = {
    saudi: {
      employeeShare: sanedEligible ? 9.75 : 9.0,  // Pension + (SANED if eligible)
      employerShare: sanedEligible ? 11.75 : 11.0, // Pension + (SANED if eligible) + Occupational Hazards
      pensionEmployee: 9.0,
      pensionEmployer: 9.0,
      sanedEmployee: sanedEligible ? 0.75 : 0,
      sanedEmployer: sanedEligible ? 0.75 : 0,
      occupationalHazards: 2.0
    },
    nonSaudi: {
      employeeShare: 0,
      employerShare: 2.0, // Occupational Hazards only
      occupationalHazards: 2.0
    }
  };
  
  const rateConfig = isSaudi ? rates.saudi : rates.nonSaudi;
  
  // Cap salary at 45,000 SAR for GOSI calculations
  const cappedSalary = Math.min(salaryNumber, 45000);
  
  const employeeShare = (cappedSalary * rateConfig.employeeShare) / 100;
  const employerShare = (cappedSalary * rateConfig.employerShare) / 100;
  const totalContribution = employeeShare + employerShare;
  
  return {
    baseSalary: salaryNumber,
    cappedSalary,
    isSaudi,
    age,
    sanedEligible,
    employeeShare: round2(employeeShare),
    employerShare: round2(employerShare),
    totalContribution: round2(totalContribution),
    breakdown: isSaudi ? {
      pensionEmployee: round2(cappedSalary * rates.saudi.pensionEmployee / 100),
      pensionEmployer: round2(cappedSalary * rates.saudi.pensionEmployer / 100),
      sanedEmployee: round2(cappedSalary * rates.saudi.sanedEmployee / 100),
      sanedEmployer: round2(cappedSalary * rates.saudi.sanedEmployer / 100),
      occupationalHazards: round2(cappedSalary * rates.saudi.occupationalHazards / 100)
    } : {
      occupationalHazards: round2(cappedSalary * rates.nonSaudi.occupationalHazards / 100)
    },
    rates: rateConfig
  };
}

/**
 * Calculate End of Service Benefits (EOSB) based on Saudi Labor Law
 * @param {number} yearsService - Total years of service
 * @param {number} lastSalary - Last monthly salary (total)
 * @param {string} terminationReason - Reason for termination
 * @returns {object} - EOSB breakdown
 */
export function calculateEOSB(yearsService, lastSalary, terminationReason = 'end_of_contract') {
  if (yearsService < 0 || lastSalary < 0) {
    throw new Error('Invalid input: years of service and salary must be positive');
  }

  const yearsServiceNumber = Number(yearsService);
  const lastSalaryNumber = Number(lastSalary);
  if (Number.isNaN(yearsServiceNumber) || Number.isNaN(lastSalaryNumber)) {
    throw new Error('Invalid input: years of service and salary must be numbers');
  }
  
  // EOSB calculation rules:
  // - First 5 years: 0.5 * monthly_salary * years
  // - Years > 5: 1.0 * monthly_salary * (years - 5)
  
  let eosb = 0;
  let breakdown = [];
  
  // Calculate for first 5 years
  const firstFiveYears = Math.min(yearsServiceNumber, 5);
  const firstFiveYearsAmount = 0.5 * lastSalaryNumber * firstFiveYears;
  
  if (firstFiveYears > 0) {
    breakdown.push({
      period: `First ${firstFiveYears} year(s)`,
      rate: 0.5,
      years: firstFiveYears,
      amount: Math.round(firstFiveYearsAmount * 100) / 100
    });
    eosb += firstFiveYearsAmount;
  }
  
  // Calculate for years beyond 5
  if (yearsServiceNumber > 5) {
    const remainingYears = yearsServiceNumber - 5;
    const remainingAmount = 1.0 * lastSalaryNumber * remainingYears;
    
    breakdown.push({
      period: `Remaining ${remainingYears.toFixed(2)} year(s)`,
      rate: 1.0,
      years: remainingYears,
      amount: Math.round(remainingAmount * 100) / 100
    });
    eosb += remainingAmount;
  }
  
  // Apply modifiers based on termination reason
  let modifier = 1.0;
  let modifierReason = 'Full entitlement';

  if (terminationReason === 'resignation') {
    if (yearsServiceNumber < 2) {
      modifier = 0;
      modifierReason = 'No entitlement (resigned before 2 years)';
    } else if (yearsServiceNumber >= 2 && yearsServiceNumber < 5) {
      modifier = 1 / 3;
      modifierReason = '1/3 entitlement (resigned between 2-5 years)';
    } else if (yearsServiceNumber >= 5 && yearsServiceNumber < 10) {
      modifier = 2 / 3;
      modifierReason = '2/3 entitlement (resigned between 5-10 years)';
    } else {
      modifier = 1.0;
      modifierReason = 'Full entitlement';
    }
  } else {
  
  switch (terminationReason) {
    case 'resignation_less_than_2_years':
      modifier = 0;
      modifierReason = 'No entitlement (resigned before 2 years)';
      break;
    case 'resignation_2_to_5_years':
      modifier = 1/3;
      modifierReason = '1/3 entitlement (resigned between 2-5 years)';
      break;
    case 'resignation_5_to_10_years':
      modifier = 2/3;
      modifierReason = '2/3 entitlement (resigned between 5-10 years)';
      break;
    case 'resignation_over_10_years':
    case 'end_of_contract':
    case 'employer_termination':
    case 'retirement':
    case 'death':
    case 'force_majeure':
      modifier = 1.0;
      modifierReason = 'Full entitlement';
      break;
    case 'article_80_termination':
      modifier = 0;
      modifierReason = 'No entitlement (Article 80 termination)';
      break;
    default:
      modifier = 1.0;
  }
  }
  
  const finalAmount = eosb * modifier;
  
  return {
    yearsOfService: yearsServiceNumber,
    lastSalary: lastSalaryNumber,
    terminationReason,
    grossEOSB: round2(eosb),
    modifier,
    modifierReason,
    finalAmount: round2(finalAmount),
    breakdown
  };
}

/**
 * Generate WPS (Wage Protection System) SIF file
 * Saudi Central Bank format
 * @param {object} companyInfo - Company details
 * @param {array} employees - Array of employee payroll records
 * @param {Date} paymentDate - Payment date
 * @returns {string} - SIF file content
 */
export function generateWPSSIFFile(companyInfo, employees, paymentDate) {
  const lines = [];
  const payDate = new Date(paymentDate);
  
  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };
  
  // Pad string to fixed length
  const pad = (str, length, char = ' ', padLeft = false) => {
    str = String(str || '');
    if (padLeft) {
      return str.padStart(length, char);
    }
    return str.padEnd(length, char);
  };
  
  // Pad number with leading zeros
  const padNumber = (num, length) => {
    return String(num || 0).padStart(length, '0');
  };
  
  // Format amount (2 decimal places, no decimal point, 15 chars)
  const formatAmount = (amount) => {
    const cents = Math.round((amount || 0) * 100);
    return padNumber(cents, 15);
  };
  
  // Calculate totals
  const totalRecords = employees.length;
  const totalSalary = employees.reduce((sum, emp) => sum + (emp.netPay || 0), 0);
  
  // === HEADER RECORD ===
  // Position: 1-1 (Record Type = 'H')
  // Position: 2-16 (Total Salary - 15 chars)
  // Position: 17-26 (Employer Bank Code - 10 chars)
  // Position: 27-40 (Employer ID/MOL Number - 14 chars)
  // Position: 41-48 (Payment Date YYYYMMDD - 8 chars)
  // Position: 49-54 (Payment Time HHMMSS - 6 chars)
  // Position: 55-62 (Total Records - 8 chars)
  // Position: 63-72 (File Serial Number - 10 chars)
  // Position: 73-75 (Filler/Currency SAR - 3 chars)
  // Position: 76-100 (Reference - 25 chars)
  
  const header = [
    'H',                                          // Record Type
    formatAmount(totalSalary),                    // Total Salary
    pad(companyInfo.bankCode || '', 10),          // Employer Bank Code
    pad(companyInfo.molId || '', 14),             // MOL Establishment ID
    formatDate(payDate),                          // Payment Date
    pad('120000', 6),                             // Payment Time
    padNumber(totalRecords, 8),                   // Total Records
    padNumber(companyInfo.fileSerial || 1, 10),   // File Serial
    'SAR',                                        // Currency
    pad(companyInfo.reference || '', 25)          // Reference
  ].join('');
  
  lines.push(header);
  
  // === DETAIL RECORDS ===
  employees.forEach((emp, index) => {
    // Position: 1-1 (Record Type = 'D')
    // Position: 2-16 (Net Salary - 15 chars)
    // Position: 17-40 (Employee Bank Account/IBAN - 24 chars)
    // Position: 41-44 (Employee Bank Code - 4 chars)
    // Position: 45-59 (Employee ID/Iqama - 15 chars)
    // Position: 60-109 (Employee Name - 50 chars)
    // Position: 110-114 (Sequence Number - 5 chars)
    // Position: 115-116 (ID Type: 1=Iqama, 2=National ID - 2 chars)
    // Position: 117-131 (Basic Salary - 15 chars)
    // Position: 132-146 (Housing Allowance - 15 chars)
    // Position: 147-161 (Other Allowance - 15 chars)
    // Position: 162-176 (Deductions - 15 chars)
    
    const idType = emp.nationality?.toLowerCase() === 'saudi' ? '2' : '1';
    
    const detail = [
      'D',                                              // Record Type
      formatAmount(emp.netPay),                         // Net Salary
      pad(emp.iban || '', 24),                          // IBAN
      pad(emp.bankCode || '', 4),                       // Bank Code
      pad(emp.employeeId || emp.iqamaNumber || '', 15), // Employee ID
      pad(emp.employeeName || '', 50),                  // Employee Name
      padNumber(index + 1, 5),                          // Sequence
      pad(idType, 2),                                   // ID Type
      formatAmount(emp.basicSalary),                    // Basic Salary
      formatAmount(emp.housingAllowance),               // Housing Allowance
      formatAmount(emp.otherAllowances),                // Other Allowances
      formatAmount(emp.totalDeductions)                 // Deductions
    ].join('');
    
    lines.push(detail);
  });
  
  // === TRAILER RECORD ===
  // Position: 1-1 (Record Type = 'T')
  // Position: 2-16 (Total Salary - 15 chars)
  // Position: 17-24 (Total Records - 8 chars)
  
  const trailer = [
    'T',                              // Record Type
    formatAmount(totalSalary),        // Total Salary
    padNumber(totalRecords, 8)        // Total Records
  ].join('');
  
  lines.push(trailer);
  
  return lines.join('\r\n');
}

/**
 * Parse WPS SIF file
 * @param {string} content - SIF file content
 * @returns {object} - Parsed data
 */
export function parseWPSSIFFile(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const result = {
    header: null,
    records: [],
    trailer: null,
    isValid: true,
    errors: []
  };
  
  for (const line of lines) {
    const recordType = line.charAt(0);
    
    if (recordType === 'H') {
      result.header = {
        totalSalary: parseInt(line.substring(1, 16)) / 100,
        bankCode: line.substring(16, 26).trim(),
        molId: line.substring(26, 40).trim(),
        paymentDate: line.substring(40, 48),
        totalRecords: parseInt(line.substring(54, 62)),
        fileSerial: line.substring(62, 72).trim(),
        currency: line.substring(72, 75).trim()
      };
    } else if (recordType === 'D') {
      result.records.push({
        netSalary: parseInt(line.substring(1, 16)) / 100,
        iban: line.substring(16, 40).trim(),
        bankCode: line.substring(40, 44).trim(),
        employeeId: line.substring(44, 59).trim(),
        employeeName: line.substring(59, 109).trim(),
        sequence: parseInt(line.substring(109, 114)),
        idType: line.substring(114, 116).trim(),
        basicSalary: parseInt(line.substring(116, 131)) / 100,
        housingAllowance: parseInt(line.substring(131, 146)) / 100,
        otherAllowances: parseInt(line.substring(146, 161)) / 100,
        deductions: parseInt(line.substring(161, 176)) / 100
      });
    } else if (recordType === 'T') {
      result.trailer = {
        totalSalary: parseInt(line.substring(1, 16)) / 100,
        totalRecords: parseInt(line.substring(16, 24))
      };
    }
  }
  
  // Validation
  if (result.header && result.trailer) {
    if (result.header.totalRecords !== result.records.length) {
      result.isValid = false;
      result.errors.push('Record count mismatch');
    }
    if (Math.abs(result.header.totalSalary - result.trailer.totalSalary) > 0.01) {
      result.isValid = false;
      result.errors.push('Total salary mismatch between header and trailer');
    }
  }
  
  return result;
}

/**
 * Convert Gregorian date to Hijri
 * @param {Date|string} gregorianDate - Gregorian date
 * @returns {object} - Both date formats
 */
export function convertToHijri(gregorianDate) {
  const date = new Date(gregorianDate);
  const hijri = momentHijri(date);
  
  return {
    gregorian: {
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      formatted: date.toLocaleDateString('en-GB')
    },
    hijri: {
      date: hijri.format('iYYYY/iMM/iDD'),
      day: hijri.iDate(),
      month: hijri.iMonth() + 1,
      year: hijri.iYear(),
      monthName: hijri.format('iMMMM'),
      formatted: hijri.format('iDD iMMMM iYYYY')
    }
  };
}

/**
 * Convert Hijri date to Gregorian
 * @param {string} hijriDate - Hijri date in format YYYY/MM/DD
 * @returns {object} - Both date formats
 */
export function convertFromHijri(hijriDate) {
  const [year, month, day] = hijriDate.split('/').map(Number);
  const gregorian = momentHijri(`${year}/${month}/${day}`, 'iYYYY/iM/iD');
  
  return {
    gregorian: {
      date: gregorian.format('YYYY-MM-DD'),
      day: gregorian.date(),
      month: gregorian.month() + 1,
      year: gregorian.year(),
      formatted: gregorian.format('DD/MM/YYYY')
    },
    hijri: {
      date: hijriDate,
      day,
      month,
      year,
      formatted: momentHijri(`${year}/${month}/${day}`, 'iYYYY/iM/iD').format('iDD iMMMM iYYYY')
    }
  };
}

/**
 * Calculate vacation/leave entitlement
 * @param {number} yearsService - Years of service
 * @returns {object} - Leave entitlement
 */
export function calculateLeaveEntitlement(yearsService) {
  // Saudi Labor Law:
  // - Less than 5 years: 21 days annual leave
  // - 5 years or more: 30 days annual leave
  
  const annualLeave = yearsService >= 5 ? 30 : 21;
  
  return {
    annualLeave,
    sickLeave: {
      fullPay: 30,      // First 30 days at full pay
      threeFourthsPay: 60, // Next 60 days at 3/4 pay
      unpaid: 30        // Remaining 30 days unpaid
    },
    maternityLeave: 70,  // 70 days for women
    paternityLeave: 3,   // 3 days for men
    hajjLeave: 10,       // Once during employment, after 2 years
    marriageLeave: 5,
    bereavementLeave: 5,
    iddahLeave: 130      // For Muslim women after spouse death
  };
}

export default {
  calculateGOSI,
  calculateEOSB,
  generateWPSSIFFile,
  parseWPSSIFFile,
  convertToHijri,
  convertFromHijri,
  calculateLeaveEntitlement
};
