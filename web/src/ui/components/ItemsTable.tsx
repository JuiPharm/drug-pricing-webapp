import React, { useMemo } from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Item, PricingResult } from '../../types'

type Props = {
  items: Item[]
  loading: boolean
  selectedCodes: string[]
  onSelectedCodesChange: (codes: string[]) => void
  computed: Map<string, PricingResult>
  lossCodes: string[]
}

export function ItemsTable({ items, loading, selectedCodes, onSelectedCodesChange, computed, lossCodes }: Props) {
  const lossSet = useMemo(() => new Set(lossCodes), [lossCodes])

  const columns: ColumnsType<Item> = [
    { title: 'Item Code', dataIndex: 'item_code', width: 160, fixed: 'left' },
    { title: 'Item Name', dataIndex: 'full_name', width: 360, render: (_, r) => r.full_name || r.generic_name },
    { title: 'Cost', dataIndex: 'cost', width: 110, render: (v) => Number(v || 0).toFixed(2) },
    { title: 'OPD', dataIndex: 'opd_price', width: 110, render: (v) => v ? Number(v).toFixed(2) : '-' },
    { title: 'IPD', dataIndex: 'ipd_price', width: 110, render: (v) => v ? Number(v).toFixed(2) : '-' },
    { title: '%GM OPD', key: 'gm_opd', width: 110, render: (_, r) => {
      const res = computed.get(r.item_code)
      const gm = res ? res.gm_opd : (r.opd_price ? ((Number(r.opd_price) - Number(r.cost))/Number(r.opd_price))*100 : null)
      return gm === null || gm === undefined ? '-' : <Tag color={gm < 0 ? 'red' : gm < 30 ? 'orange' : 'green'}>{gm.toFixed(2)}%</Tag>
    }},
    { title: '%GM IPD', key: 'gm_ipd', width: 110, render: (_, r) => {
      const res = computed.get(r.item_code)
      const gm = res ? res.gm_ipd : (r.ipd_price ? ((Number(r.ipd_price) - Number(r.cost))/Number(r.ipd_price))*100 : null)
      return gm === null || gm === undefined ? '-' : <Tag color={gm < 0 ? 'red' : gm < 30 ? 'orange' : 'green'}>{gm.toFixed(2)}%</Tag>
    }},
    { title: 'Sub Class', dataIndex: 'sub_class', width: 220 },
    { title: 'Major Class', dataIndex: 'major_class', width: 260 },
    { title: 'Status', key: 'status', width: 110, fixed: 'right', render: (_, r) => (
      lossSet.has(r.item_code) ? <Tag color="red">LOSS</Tag> : <Tag color="blue">OK</Tag>
    )},
  ]

  return (
    <Table
      rowKey="item_code"
      size="middle"
      bordered
      loading={loading}
      dataSource={items}
      columns={columns}
      scroll={{ x: 1500, y: 520 }}
      rowSelection={{
        selectedRowKeys: selectedCodes,
        onChange: (keys) => onSelectedCodesChange(keys as string[]),
      }}
      rowClassName={(record) => lossSet.has(record.item_code) ? 'row-loss' : ''}
    />
  )
}