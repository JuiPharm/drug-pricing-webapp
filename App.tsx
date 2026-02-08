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

const DOSAGE_FORM_OPTIONS = ["TUB", "VIA", "TIN", "BOX", "BOT", "PCS", "GAL", "TAB", "CAP", "PCK", "AMP", "SYR", "SET", "BAG", "ML", "SAC", "PAT", "UNT", "GM", "PAD", "CRT", "LT"] as const
const MAJOR_CLASS_OPTIONS = ["40.Dermatological & Personal Care", "18.Antidotes, Detoxifying Agents & Drugs Used in Substance Dependence", "13.Nutrition", "31.Health Supplements & Food", "14.Eye", "21.Other Therapeutic Products", "19.Intravenous & Other Sterile Solutions", "20.Radiographic & Diagnostic Agents", "30.Vitamins & Minerals", "09.Oncology", "04.Central Nervous System", "02.Cardiovascular & Hematopoietic System", "03.Respiratory System", "08.Anti-Infectives (Systemic)", "16.Dermatological Therapy", "17.Anaesthetics, Surgical Preparations & Wound Care", "05.Musculo-Skeletal System", "11.Endocrine & Metabolic System", "10.Genito-Urinary System", "01.Gastrointestinal & Hepatobiliary System", "15.Ear & Mouth / Throat", "12.Allergy & Immune System", "06.Hormones", "07.Contraceptive Agents"] as const
const SUB_CLASS_OPTIONS = ["c.Personal Care", "a.Antidotes & Detoxifying Agents", "b.Enteral/Nutritional Products", "c.Other Complementary Health Products", "a.Emollients, Cleansers & Skin Protectives", "i.Other Eye Preparations", "21.Other Therapeutic Products", "19.Intravenous & Other Sterile Solutions", "20.Radiographic & Diagnostic Agents", "g.Vitamins & Minerals (Paediatric)", "c.Parenteral Nutritional Products", "e.Vitamins &/or Minerals", "a.Infant Nutritional Products", "d.Targeted Cancer Therapy", "l.Nonsteroidal Anti-Inflammatory Drugs (NSAIDs)", "k.Analgesics (Non-Opioid) & Antipyretics", "h.Diuretics", "c.Cough & Cold Preparations", "p.Antivirals", "c.Topical Antivirals", "f.Acne Treatment Preparations", "a.Cardiac Drugs", "a.Anaesthetics - Local & General", "d.Nasal Decongestants & Other Nasal Preparations", "c.Antidepressants", "q.Anthelmintics", "f.Other Drugs Acting on Musculo-Skeletal System", "f.Agents Affecting Bone Metabolism", "e.Drugs for Bladder & Prostate Disorders", "a.Antacids, Antireflux Agents & Antiulcerants", "b.Hyperuricemia & Gout Preparations", "b.Antidiabetic Agents", "b.Hypnotics & Sedatives", "n.Anticoagulants, Antiplatelets & Fibrinolytics (Thrombolytics)", "c.Antispasmodics", "g.Neurodegenerative Disease Drugs", "a.Aminoglycosides", "a.Eye Anti-Infectives & Antiseptics", "b.Antiasthmatic & COPD Preparations", "e.Calcium Antagonists", "d.Beta-Blockers", "f.Angiotensin II Antagonists", "b.Topical Antifungals & Antiparasites", "c.Penicillins", "n.Antifungals", "b.GIT Regulators, Antiflatulents & Anti-Inflammatories", "f.Digestives", "e.Preparations for Oral Ulceration & Inflammation", "b.Cancer Hormone Therapy", "g.Ophthalmic Decongestants, Anesthetics, Anti-Inflammatories", "b.Vaccines, Antisera & Immunologicals", "d.Antipsychotics", "f.Other CNS Drugs & Agents for ADHD", "r.Antimalarials", "c.Vitamin C", "l.Dyslipidaemic Agents", "d.Mydriatic Drugs", "a.Cytotoxic Chemotherapy", "c.Immunosuppressants", "f.Macrolides", "d.Other Beta-Lactams", "c.Muscle Relaxants", "a.Disease-Modifying Anti-Rheumatic Drugs (DMARDs)", "f.Vitamins & Minerals (Geriatric)", "h.Antiparkinsonian Drugs", "k.Other Dermatologicals", "i.Antivertigo Drugs", "e.Topical Corticosteroids", "d.Topical Anti-Infectives with Corticosteroids", "j.Other Gastrointestinal Drugs", "a.Antihistamines & Antiallergics", "e.Laxatives, Purgatives", "h.Anorectal Preparations", "a.Ear Anti-Infectives & Antiseptics", "f.Antiglaucoma Preparations", "e.Trophic Hormones & Related Synthetic Drugs", "a.Vitamins A, D & E", "h.Psoriasis, Seborrhea & Ichthyosis Preparations", "d.Calcium/with Vitamins", "c.ACE Inhibitors/Direct Renin Inhibitors", "e.Miotic Drugs", "e.Anticonvulsants", "c.Drugs Acting on the Uterus", "h.Ophthalmic Lubricants", "b.Cephalosporins", "a.Oral Contraceptives", "g.Cholagogues, Cholelitholytics & Hepatic Protectors", "g.Quinolones", "b.Neuromuscular Blocking Agents", "a.Topical Antibiotics", "k.Other Antibiotics", "a.Anxiolytics", "b.Oestrogens, Progesterones & Related Synthetic Drugs", "j.Antibacterial Combinations", "i.Sulphonamides", "m.Antileprotics", "r.Haematopoietic Agents", "a.Insulin Preparations", "i.Antidiuretics", "d.Corticosteroid Hormones", "c.Eye Corticosteroids", "b.Eye Antiseptics with Corticosteroids", "d.Antidiarrheals", "d.Other Ear Preparations", "i.Antiemetics", "h.Tetracyclines", "n.Antimigraine Preparations", "m.Haemostatics", "k.Vasoconstrictors", "b.Urinary Antiseptics", "g.Other Agents Affecting Metabolism", "l.Anti-TB Agents", "c.Other Contraceptives", "j.Analgesics (Opioid)", "h.Vitamins & Minerals (Pre & Post Natal) / Antianemics", "j.Peripheral Vasodilators & Cerebral Activators", "m.Drugs for Neuropathic Pain", "j.Skin Antiseptics & Disinfectants", "p.Nootropics & Neurotonics/Neurotrophics", "s.Other Cardiovascular Drugs", "c.Surgical Dressings & Wound Care", "c.Cancer Immunotherapy", "b.Anti-Anginal Drugs", "b.Supplements & Adjuvant Therapy", "c.Thyroid Hormones", "e.Supportive Care Therapy", "d.Anti-Inflammatory Enzymes", "d.Antithyroid Agents", "g.Other Antihypertensives", "s.Antiamoebics", "a.Preparations for Vaginal Conditions", "e.Neuromuscular Disorder Drugs", "b.Drugs Used in Substance Dependence", "e.Anti-Obesity Agents", "g.Topical Antihistamines/Antipruritics", "p.Phlebitis & Varicose Preparations", "d.Electrolytes", "f.Other Drugs Acting on the Genito-Urinary System", "i.Warts & Calluses Preparations", "d.Drugs for Erectile Dysfunction & Ejaculatory Disorders", "a.Androgens & Related Synthetic Drugs", "b.Vitamin B-Complex / with C"] as const


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
            dosageOptions={[...DOSAGE_FORM_OPTIONS]}
            majorClassOptions={[...MAJOR_CLASS_OPTIONS]}
            subClassOptions={[...SUB_CLASS_OPTIONS]}
            onClose={() => setAddOpen(false)}
            onCreate={async (item) => {
              await createItem(item, updatedByFromModal)
              message.success('เพิ่มรายการสำเร็จ')
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