const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Generates an Enterprise Excel report (.xlsx) for k6 Performance Test Results
 * @param {object} options
 * @param {object} options.summaryData - k6 summary JSON data
 * @param {string} options.environment - Active test environment (QA, DEV, etc.)
 * @param {string} options.targetUrl - Target web application URL
 * @param {string} options.timestamp - Execution session timestamp
 * @param {string} options.outputPath - Destination .xlsx file path
 */
async function generatePerfExcelReport(options) {
  const { summaryData, environment, targetUrl, timestamp, outputPath } = options;

  const envName = (environment || 'qa').toUpperCase();
  const metrics = summaryData.metrics || {};

  const p95 = metrics['http_req_duration']?.values['p(95)']?.toFixed(2) || '0.00';
  const avg = metrics['http_req_duration']?.values['avg']?.toFixed(2) || '0.00';
  const min = metrics['http_req_duration']?.values['min']?.toFixed(2) || '0.00';
  const max = metrics['http_req_duration']?.values['max']?.toFixed(2) || '0.00';
  const reqTotal = metrics['http_reqs']?.values['count'] || 0;
  const failRate = ((metrics['http_req_failed']?.values['rate'] || 0) * 100).toFixed(2);
  const durationSec = summaryData.state?.testRunDurationMs
    ? (summaryData.state.testRunDurationMs / 1000).toFixed(2)
    : '0.00';

  let allThresholdsPassed = true;
  if (metrics) {
    for (const metric of Object.values(metrics)) {
      if (metric.thresholds) {
        for (const th of Object.values(metric.thresholds)) {
          if (!th.ok) {
            allThresholdsPassed = false;
            break;
          }
        }
      }
    }
  }
  const isPassed = allThresholdsPassed && parseFloat(failRate) === 0;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SauceDemo Performance Framework';
  workbook.lastModifiedBy = 'Grafana k6 Runner';
  workbook.created = new Date();
  workbook.modified = new Date();

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  /* =========================================================================
   * SHEET 1: Performance Dashboard
   * ========================================================================= */
  const dashSheet = workbook.addWorksheet('Performance Dashboard', {
    views: [{ showGridLines: true }],
  });

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
  titleCell.value = '⚡ SAUCEDEMO K6 PERFORMANS TESTİ - YÖNETİCİ ÖZETİ';
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Section Header: Execution Metadata
  dashSheet.mergeCells('A4:F4');
  const metaHeader = dashSheet.getCell('A4');
  metaHeader.value = '📋 PERFORMANS KOŞUM ORTAMI VE BİLGİLERİ (EXECUTION METADATA)';
  metaHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  metaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  metaHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(4).height = 24;

  const metadataRows = [
    { label: '🌍 Test Ortamı (Environment)', value: envName, isEnv: true },
    { label: '🎯 Hedef Web Adresi (Target URL)', value: targetUrl },
    { label: '📅 Koşum Tarihi ve Saati', value: timestamp },
    { label: '⏱️ Test Koşum Süresi', value: `${durationSec} sn` },
    {
      label: '🏁 Genel SLA Durumu',
      value: isPassed ? '✅ BAŞARILI (Tüm SLA hedefleri karşılandı)' : '❌ EŞİK AŞILDI (SLA hedefleri ihlal edildi)',
      isStatus: true,
      passed: isPassed,
    },
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
    valCell.border = thinBorder;
    valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    if (item.isEnv) {
      valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF3730A3' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    } else if (item.isStatus) {
      valCell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: item.passed ? { argb: 'FF15803D' } : { argb: 'FFB91C1C' },
      };
      valCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: item.passed ? { argb: 'FFDCFCE7' } : { argb: 'FFFEE2E2' },
      };
    } else {
      valCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0F172A' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    }
  });

  // 3. Section Header: KPIs
  dashSheet.mergeCells('A11:F11');
  const kpiHeader = dashSheet.getCell('A11');
  kpiHeader.value = '📊 PERFORMANS SLA VE KALİTE METRİKLERİ (KPIS)';
  kpiHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  kpiHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  dashSheet.getRow(11).height = 24;

  const kpiHeaders = [
    'P95 Yanıt Süresi',
    'Ortalama Süre (Avg)',
    'Min Yanıt Süresi',
    'Max Yanıt Süresi',
    'Hata Oranı (Fail Rate)',
    'Toplam HTTP İsteği',
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

  const isP95Ok = parseFloat(p95) < 1000;
  const isFailRateOk = parseFloat(failRate) === 0;

  dashSheet.getRow(13).height = 36;
  const kpiValues = [
    {
      val: `${p95} ms`,
      color: isP95Ok ? 'FF15803D' : 'FFB91C1C',
      bg: isP95Ok ? 'FFDCFCE7' : 'FFFEE2E2',
    },
    { val: `${avg} ms`, color: 'FF0F172A', bg: 'FFFFFFFF' },
    { val: `${min} ms`, color: 'FF0F172A', bg: 'FFFFFFFF' },
    { val: `${max} ms`, color: 'FF0F172A', bg: 'FFFFFFFF' },
    {
      val: `%${failRate}`,
      color: isFailRateOk ? 'FF15803D' : 'FFB91C1C',
      bg: isFailRateOk ? 'FFDCFCE7' : 'FFFEE2E2',
    },
    { val: reqTotal, color: 'FF0F172A', bg: 'FFFFFFFF' },
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
   * SHEET 2: Step & Check Details (Adım ve Doğrulama Detayları)
   * ========================================================================= */
  const detailsSheet = workbook.addWorksheet('Step & Check Details', {
    views: [{ showGridLines: true }],
  });

  detailsSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: '🌍 Ortam', key: 'env', width: 12 },
    { header: 'Performans Grubu / Adım Adı', key: 'group', width: 28 },
    { header: 'Kontrol / Doğrulama Kriteri (Check)', key: 'checkName', width: 44 },
    { header: 'Başarılı İstek (Passes)', key: 'passes', width: 22 },
    { header: 'Başarısız İstek (Fails)', key: 'fails', width: 22 },
    { header: 'Başarı Oranı (%)', key: 'passRate', width: 18 },
    { header: 'Durum (Status)', key: 'status', width: 16 },
  ];

  // Header styling
  const headerRow = detailsSheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  detailsSheet.autoFilter = 'A1:H1';

  // Extract checks from groups
  const checksList = [];
  const groups = summaryData.root_group?.groups || [];
  for (const grp of groups) {
    if (grp.checks && grp.checks.length > 0) {
      for (const ch of grp.checks) {
        checksList.push({
          group: grp.name,
          checkName: ch.name,
          passes: ch.passes || 0,
          fails: ch.fails || 0,
        });
      }
    }
  }

  checksList.forEach((item, idx) => {
    const isEven = idx % 2 === 1;
    const bgPattern = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    const totalChecks = item.passes + item.fails;
    const rate = totalChecks > 0 ? ((item.passes / totalChecks) * 100).toFixed(1) : '100.0';
    const isPassedCheck = item.fails === 0;

    const row = detailsSheet.addRow({
      no: idx + 1,
      env: envName,
      group: item.group,
      checkName: item.checkName,
      passes: item.passes,
      fails: item.fails,
      passRate: `%${rate}`,
      status: isPassedCheck ? 'PASSED' : 'FAILED',
    });

    row.height = 22;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgPattern } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Centered columns: No, Ortam, Passes, Fails, PassRate, Status
      if ([1, 2, 5, 6, 7, 8].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Ortam Badge Cell (Col 2)
      if (colNumber === 2) {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF3730A3' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      }

      // Status Cell (Col 8)
      if (colNumber === 8) {
        if (isPassedCheck) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      }
    });
  });

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

module.exports = {
  generatePerfExcelReport,
};
