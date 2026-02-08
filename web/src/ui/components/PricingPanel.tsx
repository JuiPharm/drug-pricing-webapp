import React, { useMemo } from 'react'
import { Card, Descriptions, InputNumber, Space, Table, Tag } from 'antd'
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
    }
  | {
      mode: 'gm'
      skgDiscountPct: number
      gmTarget: number
      setGmTarget: (v: number) => void
      computed: Map<string, PricingResult>
      selectedItems: Item[]
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
    { title: 'OPD', width: 110, render: (_, r) => r.res ? r.res.opd_price.toFixed(2) : '-' },
    { title: 'IPD', width: 110, render: (_, r) => r.res ? r.res.ipd_price.toFixed(2) : '-' },
    { title: 'SKG OPD', width: 110, render: (_, r) => r.res ? r.res.skg_opd_price.toFixed(2) : '-' },
    { title: 'SKG IPD', width: 110, render: (_, r) => r.res ? r.res.skg_ipd_price.toFixed(2) : '-' },
    { title: 'Foreigner OPD', width: 130, render: (_, r) => r.res ? r.res.opd_foreigner_price.toFixed(2) : '-' },
    { title: 'Foreigner IPD', width: 130, render: (_, r) => r.res ? r.res.ipd_foreigner_price.toFixed(2) : '-' },
    { title: '%GM OPD', width: 110, render: (_, r) => r.res ? <Tag color={r.res.gm_opd < 0 ? 'red' : r.res.gm_opd < 30 ? 'orange' : 'green'}>{r.res.gm_opd.toFixed(2)}%</Tag> : '-' },
    { title: 'SKG Disc OPD', width: 130, render: (_, r) => r.res ? r.res.skg_opd_discounted.toFixed(2) : '-' },
    { title: 'Profit after Disc (OPD)', width: 170, render: (_, r) => r.res ? <Tag color={r.res.loss_after_skg_discount_opd ? 'red' : 'green'}>{r.res.profit_skg_opd_discounted.toFixed(2)}</Tag> : '-' },
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
      </Card>

      <Card title="Preview (คำนวณก่อนบันทึก)">
        <Table
          rowKey={(r) => r.item.item_code}
          size="small"
          bordered
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </Space>
  )
}