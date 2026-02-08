import React, { useMemo } from 'react'
import { Drawer, Table, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Item } from '../../types'

export type FactorOverride = {
  ipd_factor?: number
  foreigner_uplift_pct?: number
  skg_opd_factor?: number
  skg_ipd_factor?: number
}

type Row = {
  item_code: string
  name: string
  ipd_factor: number
  foreigner_uplift_pct: number
  skg_opd_factor: number
  skg_ipd_factor: number
}

type Props = {
  open: boolean
  onClose: () => void
  items: Item[]
  overrides: Record<string, FactorOverride>
  onChange: (item_code: string, next: FactorOverride) => void
}

export function FactorsDrawer({ open, onClose, items, overrides, onChange }: Props) {
  const rows: Row[] = useMemo(() => {
    return items.map(it => {
      const ov = overrides[it.item_code] || {}
      return {
        item_code: it.item_code,
        name: it.full_name || it.generic_name || '',
        ipd_factor: Number(ov.ipd_factor ?? it.ipd_factor ?? 1),
        foreigner_uplift_pct: Number(ov.foreigner_uplift_pct ?? it.foreigner_uplift_pct ?? 0),
        skg_opd_factor: Number(ov.skg_opd_factor ?? it.skg_opd_factor ?? 1),
        skg_ipd_factor: Number(ov.skg_ipd_factor ?? it.skg_ipd_factor ?? 1),
      }
    })
  }, [items, overrides])

  const columns: ColumnsType<Row> = [
    { title: 'Item Code', dataIndex: 'item_code', width: 160, fixed: 'left' },
    { title: 'Item Name', dataIndex: 'name', width: 360 },
    {
      title: 'IPD factor',
      dataIndex: 'ipd_factor',
      width: 140,
      render: (_, r) => (
        <InputNumber
          min={0.01}
          step={0.01}
          value={r.ipd_factor}
          onChange={(v) => onChange(r.item_code, {
            ipd_factor: Number(v ?? 1),
            foreigner_uplift_pct: r.foreigner_uplift_pct,
            skg_opd_factor: r.skg_opd_factor,
            skg_ipd_factor: r.skg_ipd_factor
          })}
        />
      ),
    },
    {
      title: 'Foreigner uplift (%)',
      dataIndex: 'foreigner_uplift_pct',
      width: 180,
      render: (_, r) => (
        <InputNumber
          min={0}
          step={1}
          value={r.foreigner_uplift_pct}
          onChange={(v) => onChange(r.item_code, {
            ipd_factor: r.ipd_factor,
            foreigner_uplift_pct: Number(v ?? 0),
            skg_opd_factor: r.skg_opd_factor,
            skg_ipd_factor: r.skg_ipd_factor
          })}
        />
      ),
    },
    {
      title: 'SKG OPD factor',
      dataIndex: 'skg_opd_factor',
      width: 160,
      render: (_, r) => (
        <InputNumber
          min={0}
          step={0.01}
          value={r.skg_opd_factor}
          onChange={(v) => onChange(r.item_code, {
            ipd_factor: r.ipd_factor,
            foreigner_uplift_pct: r.foreigner_uplift_pct,
            skg_opd_factor: Number(v ?? 1),
            skg_ipd_factor: r.skg_ipd_factor
          })}
        />
      ),
    },
    {
      title: 'SKG IPD factor',
      dataIndex: 'skg_ipd_factor',
      width: 160,
      render: (_, r) => (
        <InputNumber
          min={0}
          step={0.01}
          value={r.skg_ipd_factor}
          onChange={(v) => onChange(r.item_code, {
            ipd_factor: r.ipd_factor,
            foreigner_uplift_pct: r.foreigner_uplift_pct,
            skg_opd_factor: r.skg_opd_factor,
            skg_ipd_factor: Number(v ?? 1)
          })}
        />
      ),
    },
  ]

  return (
    <Drawer
      title="Factors (ปรับ IPD factor / Foreigner uplift / SKG factors ต่อรายการ)"
      open={open}
      onClose={onClose}
      width={1100}
    >
      <Table
        rowKey="item_code"
        size="small"
        bordered
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 12 }}
        scroll={{ x: 1150 }}
      />
      <div style={{ marginTop: 12, color: '#555' }}>
        * factor ที่ปรับจะมีผลกับการคำนวณ (preview) และจะถูกบันทึกลง Google Sheet เมื่อกด “บันทึกราคา”
      </div>
    </Drawer>
  )
}