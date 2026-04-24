import ReportSchedule from '../models/ReportSchedule.js';
import Tenant from '../models/Tenant.js';
import logger from '../utils/logger.js';
import { sendTenantEmail } from '../utils/tenantEmailService.js';
import { buildVatReturnReport, buildBusinessSummaryReport } from '../utils/reportingService.js';
import { buildScheduledReportPdfAttachment } from '../utils/reportPdfService.js';
import { computeNextRunAt, resolveScheduledRange } from '../utils/reportScheduleService.js';
import { tenantHasEmailAddon } from '../middleware/auth.js';

const formatDate = (value, language = 'en') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
};

const formatMoney = (value, currency = 'SAR') => `${String(currency || 'SAR').trim().toUpperCase()} ${Number(value || 0).toFixed(2)}`;

const buildSubject = ({ schedule, tenant, startDate, endDate, language }) => {
  const reportName = schedule.reportType === 'business'
    ? (language === 'ar' ? 'تقرير الأعمال' : 'Business Report')
    : (language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report');
  const tenantName = language === 'ar'
    ? (tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || tenant?.name || 'Maqder')
    : (tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || tenant?.name || 'Maqder');
  return `${reportName} - ${tenantName} - ${formatDate(startDate, language)} to ${formatDate(endDate, language)}`;
};

const buildSummaryLines = ({ schedule, report, language }) => {
  if (schedule.reportType === 'business') {
    return [
      `${language === 'ar' ? 'إجمالي المبيعات' : 'Sales Total'}: ${formatMoney(report?.totals?.sales?.grandTotal, report?.currency)}`,
      `${language === 'ar' ? 'إجمالي المشتريات' : 'Purchases Total'}: ${formatMoney(report?.totals?.purchases?.grandTotal, report?.currency)}`,
      `${language === 'ar' ? 'إجمالي المصاريف' : 'Expenses Total'}: ${formatMoney(report?.totals?.expenses?.totalAmount, report?.currency)}`,
      `${language === 'ar' ? 'الصافي' : 'Net'}: ${formatMoney(report?.totals?.net, report?.currency)}`,
    ];
  }

  return [
    `${language === 'ar' ? 'عدد الفواتير' : 'Invoices'}: ${Number(report?.totals?.invoiceCount || 0)}`,
    `${language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}: ${formatMoney(report?.totals?.taxableAmount, report?.currency)}`,
    `${language === 'ar' ? 'إجمالي الضريبة' : 'Total VAT'}: ${formatMoney(report?.totals?.totalTax, report?.currency)}`,
    `${language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due'}: ${formatMoney(report?.vatReturn?.statement?.netVatDue?.vatAmount, report?.currency)}`,
  ];
};

const buildEmailHtml = ({ subject, language, startDate, endDate, lines }) => {
  const intro = language === 'ar'
    ? `تم إنشاء التقرير المجدول للفترة ${formatDate(startDate, language)} - ${formatDate(endDate, language)}.`
    : `Your scheduled report for ${formatDate(startDate, language)} - ${formatDate(endDate, language)} is attached.`;

  return `<!DOCTYPE html>
<html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
    <div style="background:#14b8a6;color:#ffffff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;line-height:1.4;">${subject}</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">${intro}</p>
      <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        ${lines.map((line) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.8;">${line}</p>`).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
};

export async function processScheduledReports() {
  const now = new Date();

  try {
    const schedules = await ReportSchedule.find({
      enabled: true,
      nextRunAt: { $ne: null, $lte: now },
    })
      .sort({ nextRunAt: 1 })
      .limit(25);

    if (!schedules.length) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    const results = { processed: schedules.length, sent: 0, failed: 0 };

    for (const schedule of schedules) {
      const retryBase = new Date(now.getTime() + 60 * 1000);
      try {
        const tenant = await Tenant.findById(schedule.tenantId);
        if (!tenant || !tenant.isActive) {
          throw new Error('Tenant is unavailable');
        }
        if (!tenantHasEmailAddon(tenant)) {
          throw new Error('Email add-on is not enabled for this tenant');
        }
        if (!Array.isArray(schedule.recipients) || schedule.recipients.length === 0) {
          throw new Error('No schedule recipients configured');
        }

        const language = schedule.language === 'ar' ? 'ar' : 'en';
        const { startDate, endDate } = resolveScheduledRange({ rangePreset: schedule.rangePreset, now });
        const report = schedule.reportType === 'business'
          ? await buildBusinessSummaryReport({ tenantId: schedule.tenantId, startDate, endDate })
          : await buildVatReturnReport({ tenantId: schedule.tenantId, startDate, endDate });
        const attachment = await buildScheduledReportPdfAttachment({ reportType: schedule.reportType, report, language });
        const subject = buildSubject({ schedule, tenant, startDate, endDate, language });
        const summaryLines = buildSummaryLines({ schedule, report, language });
        const html = buildEmailHtml({ subject, language, startDate, endDate, lines: summaryLines });
        const text = [subject, '', ...summaryLines].join('\n');

        await sendTenantEmail({
          tenant,
          to: schedule.recipients,
          subject,
          html,
          text,
          attachments: [attachment],
          metadata: {
            purpose: 'scheduled_report',
            reportType: schedule.reportType,
            scheduleId: String(schedule._id),
            rangePreset: schedule.rangePreset,
            periodStart: startDate,
            periodEnd: endDate,
          },
        });

        schedule.lastRunAt = now;
        schedule.lastStatus = 'sent';
        schedule.lastError = '';
        schedule.lastReportPeriod = { startDate, endDate };
        schedule.nextRunAt = computeNextRunAt(schedule, retryBase);
        await schedule.save();
        results.sent += 1;
      } catch (error) {
        logger.error(`Scheduled report ${schedule._id} failed: ${error.message}`);
        schedule.lastRunAt = now;
        schedule.lastStatus = 'failed';
        schedule.lastError = String(error.message || 'Failed to send scheduled report');
        schedule.nextRunAt = computeNextRunAt(schedule, retryBase);
        await schedule.save();
        results.failed += 1;
      }
    }

    return results;
  } catch (error) {
    logger.error(`Scheduled report job failed: ${error.message}`);
    return { processed: 0, sent: 0, failed: 0, error: error.message };
  }
}
