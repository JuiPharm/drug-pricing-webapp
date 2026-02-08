import { Item } from '../types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type SummaryRow = {
  item_code: string
  item_name: string
  cost: number
  opd_price: number
  ipd_price: number
  profit_opd: number
  profit_ipd: number
  gm_opd: number
  gm_ipd: number
}

export function buildSummaryRows(items: Item[]): SummaryRow[] {
  return items.map(it => {
    const cost = Number(it.cost) || 0
    const opd = Number(it.opd_price) || 0
    const ipd = Number(it.ipd_price) || 0
    const profit_opd = opd - cost
    const profit_ipd = ipd - cost
    const gm_opd = opd > 0 ? (profit_opd / opd) * 100 : 0
    const gm_ipd = ipd > 0 ? (profit_ipd / ipd) * 100 : 0
    return {
      item_code: it.item_code,
      item_name: it.full_name || it.generic_name || '',
      cost,
      opd_price: opd,
      ipd_price: ipd,
      profit_opd,
      profit_ipd,
      gm_opd,
      gm_ipd,
    }
  })
}

export function exportXlsx(rows: SummaryRow[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
    'Item Code': r.item_code,
    'Item Name': r.item_name,
    'Cost': r.cost,
    'ราคา OPD': r.opd_price,
    'ราคา IPD': r.ipd_price,
    'กำไร OPD (บาท)': r.profit_opd,
    'กำไร IPD (บาท)': r.profit_ipd,
    '%GM OPD': Number(r.gm_opd.toFixed(2)),
    '%GM IPD': Number(r.gm_ipd.toFixed(2)),
  })))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Summary')
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

export function exportPdf(rows: SummaryRow[], filename: string) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(12)
  doc.text('Pricing Summary', 14, 14)
  autoTable(doc, {
    startY: 20,
    head: [[
      'Item Code','Item Name','Cost','ราคา OPD','ราคา IPD','กำไร OPD (บาท)','กำไร IPD (บาท)','%GM OPD','%GM IPD'
    ]],
    body: rows.map(r => [
      r.item_code,
      r.item_name,
      r.cost.toFixed(2),
      r.opd_price.toFixed(2),
      r.ipd_price.toFixed(2),
      r.profit_opd.toFixed(2),
      r.profit_ipd.toFixed(2),
      r.gm_opd.toFixed(2),
      r.gm_ipd.toFixed(2),
    ]),
    styles: { fontSize: 8 },
  })
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}