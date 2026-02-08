import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Divider, Select, message } from 'antd'
import { Item } from '../../types'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (item: Item, updatedByFromModal: string) => Promise<void>
  defaultIpdFactor?: number
  defaultUpliftPct?: number
  defaultUpdatedBy?: string
  dosageOptions: string[]
  majorClassOptions: string[]
  subClassOptions: string[]
}

export function AddItemModal({
  open,
  onClose,
  onCreate,
  defaultIpdFactor = 1.6,
  defaultUpliftPct = 30,
  defaultUpdatedBy = '',
  dosageOptions,
  majorClassOptions,
  subClassOptions,
}: Props) {
  const [form] = Form.useForm<any>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        ipd_factor: defaultIpdFactor,
        foreigner_uplift_pct: defaultUpliftPct,
        skg_opd_factor: 1,
        skg_ipd_factor: 1,
        updated_by: defaultUpdatedBy,
      })
    }
  }, [open, defaultIpdFactor, defaultUpliftPct, defaultUpdatedBy, form])

  return (
    <Modal
      open={open}
      title="เพิ่มรายการใหม่"
      okText="Submit"
      cancelText="Cancel"
      confirmLoading={submitting}
      onCancel={() => {
        if (submitting) return
        onClose()
      }}
      onOk={async () => {
        if (submitting) return
        setSubmitting(true)
        const hide = message.loading('กำลังบันทึกรายการใหม่...', 0)
        try {
          const v = await form.validateFields()

          const updatedBy = String(v.updated_by || '').trim()
          const payload: Item = {
            item_code: String(v.item_code).trim(),
            generic_name: String(v.generic_name || '').trim(),
            full_name: String(v.full_name || '').trim(),
            dosage_form: String(v.dosage_form || '').trim(),
            major_class: String(v.major_class || '').trim(),
            sub_class: String(v.sub_class || '').trim(),
            cost: Number(v.cost),

            ipd_factor: Number(v.ipd_factor),
            foreigner_uplift_pct: Number(v.foreigner_uplift_pct),
            skg_opd_factor: Number(v.skg_opd_factor),
            skg_ipd_factor: Number(v.skg_ipd_factor),
          } as any

          await onCreate(payload, updatedBy)
          form.resetFields()
        } catch (e: any) {
          message.error(e?.message || 'บันทึกไม่สำเร็จ')
        } finally {
          hide()
          setSubmitting(false)
        }
      }}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="updated_by"
          label="Updated By (ชื่อผู้ใช้งาน)"
          rules={[{ required: true, message: 'กรุณากรอก Updated By' }]}
        >
          <Input placeholder="เช่น Jui" />
        </Form.Item>

        <Divider orientation="left">Master Data</Divider>

        <Form.Item name="item_code" label="item_code" rules={[{ required: true }]}>
          <Input placeholder="เช่น 51191603000024" />
        </Form.Item>

        <Form.Item name="generic_name" label="GenercName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="full_name" label="FullName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="dosage_form" label="DosageForm" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="เลือกหรือพิมพ์ค้นหา"
            options={dosageOptions.map(v => ({ value: v, label: v }))}
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item name="major_class" label="Major Class" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="เลือกหรือพิมพ์ค้นหา"
            options={majorClassOptions.map(v => ({ value: v, label: v }))}
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item name="sub_class" label="Sub Class" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="เลือกหรือพิมพ์ค้นหา"
            options={subClassOptions.map(v => ({ value: v, label: v }))}
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item name="cost" label="Cost" rules={[{ required: true }]}>
          <InputNumber style={{ width:'100%' }} min={0} />
        </Form.Item>

        <Divider orientation="left">Default Factors</Divider>

        <Form.Item
          name="ipd_factor"
          label="IPD factor (IPD/OPD)"
          rules={[{ required: true, message: 'กรุณาใส่ IPD factor' }]}
        >
          <InputNumber style={{ width:'100%' }} min={0.01} step={0.01} />
        </Form.Item>

        <Form.Item
          name="foreigner_uplift_pct"
          label="Foreigner uplift (%)"
          rules={[{ required: true, message: 'กรุณาใส่ uplift %' }]}
        >
          <InputNumber style={{ width:'100%' }} min={0} step={1} />
        </Form.Item>

        <Form.Item
          name="skg_opd_factor"
          label="SKG OPD factor (สกย.OPD/OPD)"
          rules={[{ required: true, message: 'กรุณาใส่ SKG OPD factor' }]}
        >
          <InputNumber style={{ width:'100%' }} min={0} step={0.01} />
        </Form.Item>

        <Form.Item
          name="skg_ipd_factor"
          label="SKG IPD factor (สกย.IPD/IPD)"
          rules={[{ required: true, message: 'กรุณาใส่ SKG IPD factor' }]}
        >
          <InputNumber style={{ width:'100%' }} min={0} step={0.01} />
        </Form.Item>
      </Form>
    </Modal>
  )
}