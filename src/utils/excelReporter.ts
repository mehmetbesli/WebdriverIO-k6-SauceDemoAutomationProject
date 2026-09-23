import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { TestResultItem } from './htmlReporter';

export interface ExcelReporterOptions {
  results: TestResultItem[];
  environment: string;
  targetUrl: string;
  timestamp: string;
  outputPath: string;
  browser?: string;
  headless?: boolean;
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[\d+m/g, '').replace(/\[\d+;\d+m/g, '');
}

/**
 * Enterprise Excel Reporter for WebdriverIO E2E Test Results
 * Generates an executive dashboard and detailed test result spreadsheet (.xlsx)
 */
export async function generateE2EExcelReport(options: ExcelReporterOptions): Promise<string> {
  const { results, environment, targetUrl, timestamp, outputPath, browser = 'chrome', headless = true } = options;

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const flaky = results.filter((r) => r.isFlaky || (r.retries && r.retries > 0)).length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const totalDuration = (results.reduce((acc, r) => acc + r.duration, 0) / 1000).toFixed(2);
  const envName = environment.toUpperCase();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SauceDemo Test Automation Framework';
  workbook.lastModifiedBy = 'WebdriverIO Enterprise Runner';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Thin border style for tables
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  /* =========================================================================
   * SHEET 1: Executive Dashboard (Yönetici Özeti & KPI)
   * ========================================================================= */
  const dashSheet = workbook.addWorksheet('Executive Dashboard', {
    views: [{ showGridLines: true }],
  });

  // Set column widths for Dashboard
  dashSheet.columns = [
    { width: 28 }, // Col A
    { width: 35 }, // Col B
    { width: 20 }, // Col C
    { width: 20 }, // Col D
    { width: 22 }, // Col E
    { width: 24 }, // Col F
  ];

  // 1. Title Banner
  dashSheet.mergeCells('A1:F2');
  const titleCell = dashSheet.getCell('A1');
  titleCell.value = '🚀 SAUCEDEMO E2E TEST OTOMASYON - YÖNETİCİ ÖZETİ';
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Section Header: Execution Metadata
  dashSheet.mergeCells('A4:F4');
  const metaHeader = dashSheet.getCell('A4');
  metaHeader.value = '📋 TEST KOŞUM ORTAMI VE BİLGİLERİ (EXECUTION METADATA)';
  metaHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  metaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  metaHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(4).height = 24;

  // Metadata Table Rows
  const metadataRows = [
    { label: '🌍 Test Ortamı (Environment)', value: `${envName}`, isEnv: true },
    { label: '🎯 Hedef Web Adresi (Target URL)', value: targetUrl },
    { label: '📅 Koşum Tarihi ve Saati', value: timestamp },
    { label: '🖥️ Platform / İşletim Sistemi', value: `Windows 11 (Node.js ${process.version})` },
    { label: '⚙️ Tarayıcı & Çalışma Modu', value: `${browser.toUpperCase()} | ${headless ? 'Headless (Arka Planda)' : 'Headed (Canlı Ekranda)'}` },
  ];

  metadataRows.forEach((item, idx) => {
    const rowNum = 5 + idx;
    dashSheet.getRow(rowNum).height = 22;

    const labelCell = dashSheet.getCell(`A${rowNum}`);
    labelCell.value = item.label;
    labelCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF334155' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    labelCell.border = thinBorder;

    dashSheet.mergeCells(`B${rowNum}:F${rowNum}`);
    const valCell = dashSheet.getCell(`B${rowNum}`);
    valCell.value = item.value;
    valCell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: item.isEnv || false,
      color: item.isEnv ? { argb: 'FF3730A3' } : { argb: 'FF0F172A' },
    };
    valCell.fill = item.isEnv
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    valCell.border = thinBorder;
  });

  // 3. Section Header: KPIs
  dashSheet.mergeCells('A11:F11');
  const kpiHeader = dashSheet.getCell('A11');
  kpiHeader.value = '📊 GENEL TEST BAŞARI VE KALİTE METRİKLERİ (KPIS)';
  kpiHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  kpiHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(11).height = 24;

  // KPI Table Headers (Row 12)
  const kpiHeaders = [
    'Toplam Test',
    'Başarılı (Passed)',
    'Başarısız (Failed)',
    'Flaky / Retried',
    'Başarı Oranı',
    'Toplam Koşum Süresi',
  ];
  dashSheet.getRow(12).height = 24;
  kpiHeaders.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = dashSheet.getCell(`${colLetter}12`);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  // KPI Table Values (Row 13)
  dashSheet.getRow(13).height = 36;

  const kpiValues = [
    { val: total, color: 'FF0F172A', bg: 'FFFFFFFF' },
    { val: passed, color: 'FF15803D', bg: 'FFDCFCE7' },
    { val: failed, color: failed > 0 ? 'FFB91C1C' : 'FF64748B', bg: failed > 0 ? 'FFFEE2E2' : 'FFFFFFFF' },
    { val: flaky, color: flaky > 0 ? 'FFB45309' : 'FF64748B', bg: flaky > 0 ? 'FFFEF3C7' : 'FFFFFFFF' },
    { val: `%${passRate}`, color: failed === 0 ? 'FF15803D' : 'FFB91C1C', bg: failed === 0 ? 'FFDCFCE7' : 'FFFEE2E2' },
    { val: `${totalDuration} sn`, color: 'FF0F172A', bg: 'FFFFFFFF' },
  ];

  kpiValues.forEach((kpi, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = dashSheet.getCell(`${colLetter}13`);
    cell.value = kpi.val;
    cell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: kpi.color } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  /* =========================================================================
   * SHEET 2: E2E Test Details (Tüm E2E Test Adımları)
   * ========================================================================= */
  const detailsSheet = workbook.addWorksheet('E2E Test Details', {
    views: [{ showGridLines: true }],
  });

  detailsSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: '🌍 Ortam', key: 'env', width: 12 },
    { header: 'Test Suite (Dosya)', key: 'suite', width: 28 },
    { header: 'Case ID', key: 'caseId', width: 12 },
    { header: 'Test Başlığı / Senaryo', key: 'title', width: 44 },
    { header: 'Tarayıcı', key: 'browser', width: 14 },
    { header: 'Durum (Status)', key: 'status', width: 16 },
    { header: 'Süre (sn)', key: 'duration', width: 12 },
    { header: 'Hata Mesajı Detayı', key: 'error', width: 40 },
    { header: 'Ekran Görüntüsü', key: 'screenshot', width: 24 },
  ];

  // Header row styling
  const headerRow = detailsSheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  // Enable AutoFilter on header row
  detailsSheet.autoFilter = 'A1:J1';

  // Populate data rows
  results.forEach((r, idx) => {
    const rowNum = idx + 2;
    const isEven = idx % 2 === 1;
    const bgPattern = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    const caseMatch = r.title.match(/TC\d+/i);
    const caseId = caseMatch ? caseMatch[0].toUpperCase() : '-';

    const cleanError = r.error ? stripAnsi(r.error) : '-';
    const durationSec = (r.duration / 1000).toFixed(2);
    const browserDisplay = (r.browserName || browser).toUpperCase();

    const row = detailsSheet.addRow({
      no: idx + 1,
      env: envName,
      suite: r.parent || 'E2E Suite',
      caseId: caseId,
      title: r.title,
      browser: browserDisplay,
      status: r.passed ? (r.isFlaky ? 'PASSED (FLAKY)' : 'PASSED') : 'FAILED',
      duration: parseFloat(durationSec),
      error: cleanError,
      screenshot: r.screenshot ? '📸 View Screenshot' : '-',
    });

    row.height = 22;

    // Apply cell styles & borders
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgPattern } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Centered columns: No, Ortam, Case ID, Tarayıcı, Süre, Ekran Görüntüsü
      if ([1, 2, 4, 6, 8, 10].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Ortam Badge Cell (Col 2)
      if (colNumber === 2) {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF3730A3' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      }

      // Case ID Cell (Col 4)
      if (colNumber === 4 && caseId !== '-') {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      }

      // Status Cell (Col 7)
      if (colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (r.passed) {
          if (r.isFlaky) {
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB45309' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          }
        } else {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      }

      // Error Cell (Col 9)
      if (colNumber === 9) {
        if (!r.passed) {
          cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FFB91C1C' } };
        }
      }

      // Screenshot Hyperlink Cell (Col 10)
      if (colNumber === 10 && r.screenshot) {
        const absScreenshotPath = path.resolve(process.cwd(), r.screenshot);
        cell.value = {
          text: '📸 Ekran Görüntüsü',
          hyperlink: `file:///${absScreenshotPath.replace(/\\/g, '/')}`,
        };
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF2563EB' }, underline: true };
      }
    });
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
