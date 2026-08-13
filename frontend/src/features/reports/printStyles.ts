/**
 * Print styles injected into the react-to-print iframe.
 *
 * These target the `.report-print-root` wrapper rendered by <PrintableReport />
 * so the printed output is a true WYSIWYG clone of the on-screen ReportViewer,
 * laid out on A4 portrait pages with clean margins and safe page breaks.
 */

export const A4_PRINT_PAGE_STYLE = `
  @page {
    size: A4 portrait;
    margin: 16mm 14mm 18mm 14mm;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1a2332;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-print-root {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .report-print-root > * {
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  .report-print-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .report-print-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #d7dee8;
    font-size: 10px;
    color: #8b95a3;
    text-align: center;
  }
`;
