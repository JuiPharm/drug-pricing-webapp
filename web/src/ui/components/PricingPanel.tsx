import React, { useMemo } from 'react'
import { Card, Descriptions, InputNumber, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Item, PricingResult } from '../../types'

type Props =
  | {
      mode: 'opd'
      skgDiscountPct: number
      opdTarget: number
      setOpdTarget: (v: number) => void
      computed: Map<string, PricingResult>
      selectedItems: Item[]
      onEditPrice: (item_code: string, field: 'opd_price' | 'ipd_price', value: number) => void
    }
  | {
      mode: 'gm'
      skgDiscountPct: number
      gmTarget: number
      setGmTarget: (v: number) => void
      computed: Map<string, PricingResult>
      selectedItems: Item[]
      onEditPrice: (item_code: string, field: 'opd_price' | 'ipd_price', value: number) => void
    }

export function PricingPanel(props: Props) {
  const rows = useMemo(() => {
    return props.selectedItems.map(it => {
      const res = props.computed.get(it.item_code)
      return { item: it, res }
    })
  }, [props.selectedItems, props.computed])

  const columns: ColumnsType<{ item: Item; res?: PricingResult }> = [
    { title: 'Item Code', width: 150, render: (_, r) => r.item.item_code },
    { title: 'Item Name', width: 320, render: (_, r) => r.item.full_name || r.item.generic_name },

    {
      title: 'OPD (แก้ได้)',
      width: 140,
      render: (_, r) =>
        r.res ? (
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={Number(r.res.opd_price.toFixed(2))}
            onChange={(v) => props.onEditPrice(r.item.item_code, 'opd_price', Number(v ?? 0))}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'IPD (แก้ได้)',
      width: 140,
      render: (_, r) =>
        r.res ? (
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={Number(r.res.ipd_price.toFixed(2))}
            onChange={(v) => props.onEditPrice(r.item.item_code, 'ipd_price', Number(v ?? 0))}
          />
        ) : (
          '-'
        ),
    },

    { title: 'SKG OPD', width: 110, render: (_, r) => r.res ? r.res.skg_opd_price.toFixed(2) : '-' },
    { title: 'SKG IPD', width: 110, render: (_, r) => r.res ? r.res.skg_ipd_price.toFixed(2) : '-' },

    { title: 'Foreigner (จาก IPD +30%)', width: 190, render: (_, r) => r.res ? r.res.ipd_foreigner_price.toFixed(2) : '-' },

    { title: '%GM OPD', width: 110, render: (_, r) => r.res ? <Tag color={r.res.gm_opd < 0 ? 'red' : r.res.gm_opd < 30 ? 'orange' : 'green'}>{r.res.gm_opd.toFixed(2)}%</Tag> : '-' },
    { title: '%GM IPD', width: 110, render: (_, r) => r.res ? <Tag color={r.res.gm_ipd < 0 ? 'red' : r.res.gm_ipd < 30 ? 'orange' : 'green'}>{r.res.gm_ipd.toFixed(2)}%</Tag> : '-' },

    { title: 'SKG Disc OPD', width: 130, render: (_, r) => r.res ? r.res.skg_opd_discounted.toFixed(2) : '-' },
    { title: 'Profit after Disc (OPD)', width: 180, render: (_, r) => r.res ? <Tag color={r.res.loss_after_skg_discount_opd ? 'red' : 'green'}>{r.res.profit_skg_opd_discounted.toFixed(2)}</Tag> : '-' },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="SKG Discount (%)">{props.skgDiscountPct}</Descriptions.Item>
          <Descriptions.Item label="Selected Items">{props.selectedItems.length}</Descriptions.Item>
          <Descriptions.Item label={props.mode === 'opd' ? 'OPD Target' : 'GM OPD Target'}>
            {props.mode === 'opd' ? (
              <InputNumber
                min={0}
                value={props.opdTarget}
                onChange={(v) => props.setOpdTarget(Number(v || 0))}
              />
            ) : (
              <InputNumber
                min={0}
                max={99.99}
                value={props.gmTarget}
                onChange={(v) => props.setGmTarget(Number(v || 0))}
              />
            )}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Paragraph style={{ marginTop: 10, marginBottom: 0, color: '#555' }}>
          กติกาปัจจุบัน: IPD = OPD × 1.2, สกย.OPD = OPD, สกย.IPD = IPD, Foreigner = IPD × 1.3 (เพิ่ม 30% จาก IPD)
        </Typography.Paragraph>
      </Card>

      <Card title="Preview (คำนวณก่อนบันทึก)">
        <Table
          rowKey={(r) => r.item.item_code}
          size="small"
          bordered
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1700 }}
        />
      </Card>
    </Space>
  )
}