import React from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SubclassSummaryRow } from '../../types'

type Props = { rows: SubclassSummaryRow[] }

export function SubclassSummary({ rows }: Props) {
  const columns: ColumnsType<SubclassSummaryRow> = [
    { title: 'Sub Class', dataIndex: 'sub_class', width: 360 },
    { title: 'Item Count', dataIndex: 'item_count', width: 120 },
    { title: 'Avg %GM OPD', dataIndex: 'avg_gm_opd', width: 140, render: (v) => v === null ? '-' : <Tag color={v < 0 ? 'red' : v < 30 ? 'orange' : 'green'}>{v.toFixed(2)}%</Tag> },
    { title: 'Avg %GM IPD', dataIndex: 'avg_gm_ipd', width: 140, render: (v) => v === null ? '-' : <Tag color={v < 0 ? 'red' : v < 30 ? 'orange' : 'green'}>{v.toFixed(2)}%</Tag> },
  ]
  return (
    <Table
      rowKey="sub_class"
      size="small"
      bordered
      dataSource={rows}
      columns={columns}
      pagination={{ pageSize: 20 }}
    />
  )
}