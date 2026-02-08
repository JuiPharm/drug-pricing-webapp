import React, { useMemo } from 'react'
import { Button, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Item } from '../../types'
import { buildSummaryRows, SummaryRow } from '../../logic/export'

type Props = {
  items: Item[]
  onExportPdf: () => void
  onExportXlsx: () => void
}

export function SummaryTable({ items, onExportPdf, onExportXlsx }: Props) {
  const rows = useMemo(() => buildSummaryRows(items), [items])

  const columns: ColumnsType<SummaryRow> = [
    { title: 'Item Code', dataIndex: 'item_code', width: 160 },
    { title: 'Item Name', dataIndex: 'item_name', width: 340 },
    { title: 'Cost', dataIndex: 'cost', width: 120, render: (v) => v.toFixed(2) },
    { title: 'ราคา OPD', dataIndex: 'opd_price', width: 120, render: (v) => v.toFixed(2) },
    { title: 'ราคา IPD', dataIndex: 'ipd_price', width: 120, render: (v) => v.toFixed(2) },
    { title: 'กำไร OPD (บาท)', dataIndex: 'profit_opd', width: 140, render: (v) => v.toFixed(2) },
    { title: 'กำไร IPD (บาท)', dataIndex: 'profit_ipd', width: 140, render: (v) => v.toFixed(2) },
    { title: '%GM OPD', dataIndex: 'gm_opd', width: 110, render: (v) => v.toFixed(2) + '%' },
    { title: '%GM IPD', dataIndex: 'gm_ipd', width: 110, render: (v) => v.toFixed(2) + '%' },
  ]

  return (
    <Space direction="vertical" style={{ width:'100%' }} size="middle">
      <Space>
        <Button onClick={onExportPdf}>Download PDF</Button>
        <Button onClick={onExportXlsx}>Download XLSX</Button>
      </Space>
      <Table
        rowKey="item_code"
        size="small"
        bordered
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1300 }}
      />
    </Space>
  )
}