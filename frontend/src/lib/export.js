const sanitizeFileName = (value) => {
  return String(value || 'export')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const toCsvValue = (value) => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuotes = /[",\n\r]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

const toFileStamp = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

export const buildExportRows = ({ rows, columns }) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeCols = Array.isArray(columns) ? columns : []

  const headers = safeCols.map((c) => c.label ?? c.header ?? c.key ?? '')

  const values = safeRows.map((row) => {
    return safeCols.map((col) => {
      const getter = col.value || col.getValue
      const raw = typeof getter === 'function' ? getter(row) : row?.[col.key]
      const formatter = col.format
      const v = typeof formatter === 'function' ? formatter(raw, row) : raw
      return v === null || v === undefined ? '' : v
    })
  })

  return { headers, values }
}

export const exportToCsv = ({ fileName, rows, columns, delimiter = ',' }) => {
  const base = sanitizeFileName(fileName || 'export')
  const { headers, values } = buildExportRows({ rows, columns })

  const lines = [headers.map(toCsvValue).join(delimiter)]
  for (const row of values) {
    lines.push(row.map(toCsvValue).join(delimiter))
  }

  const csv = `\ufeff${lines.join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${base}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}

export const exportToExcel = async ({ fileName, rows, columns, sheetName = 'Export' }) => {
  const base = sanitizeFileName(fileName || 'export')
  const { headers, values } = buildExportRows({ rows, columns })

  const xlsxModule = await import('xlsx')
  const XLSX = xlsxModule?.default || xlsxModule

  const aoa = [headers, ...values]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${base}.xlsx`)
}

export const exportToPdf = async ({ fileName, title, rows, columns, orientation }) => {
  const base = sanitizeFileName(fileName || 'export')
  const { headers, values } = buildExportRows({ rows, columns })

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const inferredOrientation = orientation || (headers.length > 6 ? 'landscape' : 'portrait')
  const doc = new jsPDF({ orientation: inferredOrientation, unit: 'pt', format: 'a4' })

  const safeTitle = title ? String(title) : ''
  if (safeTitle) {
    doc.setFontSize(14)
    doc.text(safeTitle, 40, 40)
  }

  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, safeTitle ? 60 : 40)

  autoTable(doc, {
    startY: safeTitle ? 80 : 60,
    head: [headers],
    body: values.map((row) => row.map((v) => (v === null || v === undefined ? '' : String(v)))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${base}.pdf`)
}

export const printTable = ({ title, rows, columns }) => {
  const { headers, values } = buildExportRows({ rows, columns })

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const tableHead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
  const tableBody = values
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('')

  const w = window.open('', '_blank')
  if (!w) return

  w.document.open()
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title || 'Export')}</title>
<style>
  body{font-family:Arial, sans-serif; padding:24px;}
  h1{font-size:18px; margin:0 0 12px;}
  table{width:100%; border-collapse:collapse; font-size:12px;}
  th,td{border:1px solid #ddd; padding:8px; text-align:left; vertical-align:top;}
  th{background:#f5f5f5;}
</style>
</head>
<body>
<h1>${escapeHtml(title || '')}</h1>
<table>
<thead>${tableHead}</thead>
<tbody>${tableBody}</tbody>
</table>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`)
  w.document.close()
}

export const buildDefaultFileName = (base) => {
  return sanitizeFileName(`${base || 'export'}_${toFileStamp()}`)
}
