import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGOSI, calculateEOSB } from '../utils/hr/payrollCalculations.js';

test('calculateGOSI: Saudi with SANED eligible', () => {
  const res = calculateGOSI(10000, 'Saudi', { dateOfBirth: '1990-01-01', asOfDate: '2026-01-01' });
  assert.equal(res.isSaudi, true);
  assert.equal(res.sanedEligible, true);
  assert.equal(res.cappedSalary, 10000);
  assert.equal(res.employeeShare, 975);
  assert.equal(res.employerShare, 1175);
  assert.equal(res.totalContribution, 2150);
});

test('calculateGOSI: Saudi cap at 45,000', () => {
  const res = calculateGOSI(50000, 'Saudi', { dateOfBirth: '1990-01-01', asOfDate: '2026-01-01' });
  assert.equal(res.cappedSalary, 45000);
  assert.equal(res.employeeShare, 4387.5);
  assert.equal(res.employerShare, 5287.5);
  assert.equal(res.totalContribution, 9675);
});

test('calculateGOSI: non-Saudi only occupational hazards', () => {
  const res = calculateGOSI(10000, 'Non-Saudi');
  assert.equal(res.isSaudi, false);
  assert.equal(res.employeeShare, 0);
  assert.equal(res.employerShare, 200);
  assert.equal(res.totalContribution, 200);
});

test('calculateGOSI: SANED not eligible when age >= 60', () => {
  const res = calculateGOSI(10000, 'Saudi', { dateOfBirth: '1960-01-01', asOfDate: '2026-01-02' });
  assert.equal(res.isSaudi, true);
  assert.equal(res.sanedEligible, false);
  assert.equal(res.employeeShare, 900);
  assert.equal(res.employerShare, 1100);
  assert.equal(res.totalContribution, 2000);
});

test('calculateGOSI: rejects negative salary', () => {
  assert.throws(() => calculateGOSI(-1, 'Saudi'), /salary must be a non-negative number/i);
});

test('calculateEOSB: resignation < 2 years => 0', () => {
  const res = calculateEOSB(1, 10000, 'resignation');
  assert.equal(res.modifier, 0);
  assert.equal(res.finalAmount, 0);
});

test('calculateEOSB: resignation 2-5 years => 1/3', () => {
  const res = calculateEOSB(3, 10000, 'resignation');
  assert.equal(res.grossEOSB, 15000);
  assert.ok(Math.abs(res.modifier - 1 / 3) < 1e-12);
  assert.equal(res.finalAmount, 5000);
});

test('calculateEOSB: resignation 5-10 years => 2/3', () => {
  const res = calculateEOSB(7, 10000, 'resignation');
  assert.equal(res.grossEOSB, 45000);
  assert.ok(Math.abs(res.modifier - 2 / 3) < 1e-12);
  assert.equal(res.finalAmount, 30000);
});

test('calculateEOSB: end_of_contract => full', () => {
  const res = calculateEOSB(7, 10000, 'end_of_contract');
  assert.equal(res.grossEOSB, 45000);
  assert.equal(res.modifier, 1);
  assert.equal(res.finalAmount, 45000);
});

test('calculateEOSB: rejects negative inputs', () => {
  assert.throws(() => calculateEOSB(-1, 10000, 'end_of_contract'));
  assert.throws(() => calculateEOSB(1, -10000, 'end_of_contract'));
});
