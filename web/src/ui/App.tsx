import React, { useEffect, useMemo, useState } from 'react'
import './styles.css'
import { Layout, Typography, Tabs, Input, Space, Button, message, Tag, Modal, Drawer } from 'antd'
import type { TabsProps } from 'antd'
import { fetchConfig, fetchItems, fetchSummaryBySubclass, bulkUpdatePricing, createItem } from '../api/client'
import { Item, PricingResult, SubclassSummaryRow } from '../types'
import { computeFromOPD, computeFromGM } from '../logic/calc'
import { buildSummaryRows, exportPdf, exportXlsx } from '../logic/export'
import { ItemsTable } from './components/ItemsTable'
import { PricingPanel } from './components/PricingPanel'
import { AddItemModal } from './components/AddItemModal'
import { FactorsDrawer, FactorOverride } from './components/FactorsDrawer'
import { SummaryTable } from './components/SummaryTable'
import { SubclassSummary } from './components/SubclassSummary'

const { Header, Content } = Layout
const { Title } = Typography

export function App() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [updatedBy, setUpdatedBy] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [activeTab, setActiveTab] = useState<'opd'|'gm'>('opd')
  const [opdTarget, setOpdTarget] = useState<number>(0)
  const [gmTarget, setGmTarget] = useState<number>(40)
  const [addOpen, setAddOpen] = useState(false)
  const [factorsOpen, setFactorsOpen] = useState(false)
  const [factorOverrides, setFactorOverrides] = useState<Record<string, FactorOverride>>({})
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [subSummaryOpen, setSubSummaryOpen] = useState(false)
  const [subRows, setSubRows] = useState<SubclassSummaryRow[]>([])

  const dosageOptions = useMemo(() => Array.from(new Set(items.map(i => String(i.dosage_form || '').trim()).filter(Boolean))).sort(), [items])
  const majorClassOptions = useMemo(() => Array.from(new Set(items.map(i => String(i.major_class || '').trim()).filter(Boolean))).sort(), [items])
  const subClassOptions = useMemo(() => Array.from(new Set(items.map(i => String(i.sub_class || '').trim()).filter(Boolean))).sort(), [items])

  const defaultIpdFactor = useMemo(() => {
    const v = Number(config['default_ipd_factor'])
    return Number.isFinite(v) ? v : 1.6
  }, [config])

  const defaultUpliftPct = useMemo(() => {
    const v = Number(config['default_foreigner_uplift_pct'])
    return Number.isFinite(v) ? v : 30
  }, [config])

  const skgDiscountPct = useMemo(() => {
    const v = Number(config['skg_discount_pct'])
    return Number.isFinite(v) ? v : 20
  }, [config])

  async function loadAll() {
    setLoading(true)
    try {
      const [cfg, data] = await Promise.all([fetchConfig(), fetchItems(q)])
      setConfig(cfg || {})
      setItems(data)
    } catch (e: any) {
      message.error(e.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, []) // initial

  // Auto filter while typing (debounced)
  useEffect(() => {
    const t = setTimeout(() => { loadAll() }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const selectedItems = useMemo(() => {
    const map = new Map(items.map(i => [i.item_code, i]))
    return selectedCodes.map(c => map.get(c)).filter(Boolean) as Item[]
  }, [items, selectedCodes])

  const effectiveSelectedItems = useMemo(() => {
    return selectedItems.map(it => {
      const ov = factorOverrides[it.item_code] || {}
      return {
        ...it,
        ipd_factor: ov.ipd_factor ?? it.ipd_factor,
        foreigner_uplift_pct: ov.foreigner_uplift_pct ?? it.foreigner_uplift_pct,
        skg_opd_factor: ov.skg_opd_factor ?? it.skg_opd_factor,
        skg_ipd_factor: ov.skg_ipd_factor ?? it.skg_ipd_factor,
      }
    })
  }, [selectedItems, factorOverrides])

  const computed = useMemo(() => {
    const byCode = new Map<string, PricingResult>()
    effectiveSelectedItems.forEach(it => {
      const res = activeTab === 'opd'
        ? computeFromOPD(it, opdTarget, skgDiscountPct)
        : computeFromGM(it, gmTarget, skgDiscountPct)
      byCode.set(it.item_code, res)
    })
    return byCode
  }, [effectiveSelectedItems, activeTab, opdTarget, gmTarget, skgDiscountPct])

  const lossFlags = useMemo(() => {
    const losses: string[] = []
    computed.forEach((r, code) => {
      if (r.loss_after_skg_discount_opd || r.loss_after_skg_discount_ipd) losses.push(code)
    })
    return losses
  }, [computed])

  async function onSave() {
    if (effectiveSelectedItems.length === 0) return message.warning('กรุณาเลือกรายการก่อน')
    if (!updatedBy.trim()) return message.warning('กรุณากรอก Updated By ก่อนบันทึก')
    const updates = effectiveSelectedItems.map(it => {
      const r = computed.get(it.item_code)!
      return {
        item_code: it.item_code,
        pricing: {
          opd_price: r.opd_price,
          ipd_price: r.ipd_price,
          skg_opd_price: r.skg_opd_price,
          skg_ipd_price: r.skg_ipd_price,
          opd_foreigner_price: r.opd_foreigner_price,
          ipd_foreigner_price: r.ipd_foreigner_price,
          ipd_factor: it.ipd_factor,
          foreigner_uplift_pct: it.foreigner_uplift_pct,
          skg_opd_factor: it.skg_opd_factor,
          skg_ipd_factor: it.skg_ipd_factor,
        } satisfies Partial<Item>,
      }
    })

    if (lossFlags.length > 0) {
      const ok = await new Promise<boolean>(resolve => {
        Modal.confirm({
          title: 'พบรายการที่ “หลังส่วนลด สกย. แล้วขาดทุน”',
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>
                รายการ: {lossFlags.slice(0, 8).map(c => <Tag key={c} color="red">{c}</Tag>)}
                {lossFlags.length > 8 ? <Tag>+{lossFlags.length - 8} more</Tag> : null}
              </div>
              <div>ต้องการบันทึกต่อหรือไม่?</div>
            </div>
          ),
          okText: 'บันทึกต่อ',
          cancelText: 'ยกเลิก',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      })
      if (!ok) return
    }

    try {
      const count = await bulkUpdatePricing(updates, updatedBy.trim())
      message.success(`บันทึกสำเร็จ ${count} รายการ`)
      await loadAll()
    } catch (e: any) {
      message.error(e.message || 'Save failed')
    }
  }

  async function openSubclassSummary() {
    setSubSummaryOpen(true)
    try {
      const rows = await fetchSummaryBySubclass()
      setSubRows(rows)
    } catch (e: any) {
      message.error(e.message || 'Load summary failed')
    }
  }

  const tabItems: TabsProps['items'] = [
    { key: 'opd', label: 'ตั้งราคาจาก ราคา OPD', children: (
      <PricingPanel
        mode="opd"
        skgDiscountPct={skgDiscountPct}
        opdTarget={opdTarget}
        setOpdTarget={setOpdTarget}
        computed={computed}
        selectedItems={effectiveSelectedItems}

onEditPrice={(code, field, value) => {
  setPriceOverrides(prev => {
    const cur = prev[code] || {}
    if (field === 'opd_price') {
      return { ...prev, [code]: { ...cur, opd_price: value, ipd_price: value * 1.2 } }
    }
    return { ...prev, [code]: { ...cur, ipd_price: value } }
  })
}}
      />
    )},
    { key: 'gm', label: 'ตั้งราคาจาก Gross Margin OPD', children: (
      <PricingPanel
        mode="gm"
        skgDiscountPct={skgDiscountPct}
        gmTarget={gmTarget}
        setGmTarget={setGmTarget}
        computed={computed}
        selectedItems={effectiveSelectedItems}

onEditPrice={(code, field, value) => {
  setPriceOverrides(prev => {
    const cur = prev[code] || {}
    if (field === 'opd_price') {
      return { ...prev, [code]: { ...cur, opd_price: value, ipd_price: value * 1.2 } }
    }
    return { ...prev, [code]: { ...cur, ipd_price: value } }
  })
}}
      />
    )},
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Title level={4} style={{ color:'#fff', margin:0 }}>Drug Pricing Web App</Title>
        <Space>
          <Button onClick={() => setAddOpen(true)}>+ เพิ่มรายการ</Button>
          <Button onClick={() => setFactorsOpen(true)} disabled={selectedItems.length === 0}>ปรับ Factors</Button>
          <Button onClick={openSubclassSummary}>สรุป GM ตาม SubClass</Button>
          <Button onClick={() => setSummaryOpen(true)} disabled={selectedItems.length === 0}>สรุปรายการที่เลือก</Button>
        </Space>
      </Header>

      <Content style={{ padding: 16 }}>
        <Space direction="vertical" style={{ width:'100%' }} size="large">
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="ค้นหา (Item code / name / class / subclass) พิมพ์กี่ตัวก็ได้"
              style={{ width: 520 }}
              value={q}
              onChange={e => setQ(e.target.value)}
              onSearch={() => {}}
            />
            <Button onClick={() => loadAll()} loading={loading}>Refresh</Button>
            <Input
              placeholder="Updated By (ชื่อผู้ใช้งาน)"
              style={{ width: 240 }}
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              allowClear
            />
            <Button type="primary" onClick={onSave} disabled={selectedItems.length === 0}>บันทึกราคา</Button>
            {lossFlags.length > 0 ? <Tag color="red">ขาดทุนหลังลด: {lossFlags.length}</Tag> : <Tag color="green">No loss after SKG discount</Tag>}
          </Space>

          <ItemsTable
            items={items}
            loading={loading}
            selectedCodes={selectedCodes}
            onSelectedCodesChange={setSelectedCodes}
            computed={computed}
            lossCodes={lossFlags}
          />

          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as any)}
            items={tabItems}
          />

          <AddItemModal
            open={addOpen}
            defaultIpdFactor={defaultIpdFactor}
            defaultUpliftPct={defaultUpliftPct}
            defaultUpdatedBy={updatedBy}
            dosageOptions={dosageOptions}
            majorClassOptions={majorClassOptions}
            subClassOptions={subClassOptions}
            onClose={() => setAddOpen(false)}
            onCreate={async (item, updatedByFromModal) => {
              await createItem(item, updatedByFromModal)
              message.success('เพิ่มรายการสำเร็จ')
              if (!updatedBy.trim()) setUpdatedBy(updatedByFromModal)
              setAddOpen(false)
              await loadAll()
            }}
          />

          <FactorsDrawer
            open={factorsOpen}
            onClose={() => setFactorsOpen(false)}
            items={effectiveSelectedItems}
            overrides={factorOverrides}
            onChange={(code, next) => setFactorOverrides(prev => ({ ...prev, [code]: next }))}
          />

          <Drawer
            title="สรุปรายการที่เลือก"
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            width={980}
          >
            <SummaryTable
              items={selectedItems}
              onExportPdf={() => exportPdf(buildSummaryRows(selectedItems), 'pricing-summary.pdf')}
              onExportXlsx={() => exportXlsx(buildSummaryRows(selectedItems), 'pricing-summary.xlsx')}
            />
          </Drawer>

          <Drawer
            title="Gross Margin เฉลี่ยตาม SubClass"
            open={subSummaryOpen}
            onClose={() => setSubSummaryOpen(false)}
            width={980}
          >
            <SubclassSummary rows={subRows} />
          </Drawer>
        </Space>
      </Content>
    </Layout>
  )
}