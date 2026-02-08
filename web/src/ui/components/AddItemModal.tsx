import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Divider } from 'antd'
import { Item } from '../../types'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (item: Item) => Promise<void>
  defaultIpdFactor?: number
  defaultUpliftPct?: number
}

export function AddItemModal({ open, onClose, onCreate, defaultIpdFactor = 1.6, defaultUpliftPct = 30 }: Props) {
  const [form] = Form.useForm<Item>()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        ipd_factor: defaultIpdFactor as any,
        foreigner_uplift_pct: defaultUpliftPct as any,
        skg_opd_factor: 1 as any,
        skg_ipd_factor: 1 as any,
      } as any)
    }
  }, [open, defaultIpdFactor, defaultUpliftPct, form])

  return (
    <Modal
      open={open}
      title="เพิ่มรายการใหม่"
      okText="Submit"
      cancelText="Cancel"
      onCancel={onClose}
      onOk={async () => {
        const v = await form.validateFields()
        const payload: Item = {
          ...v,
          item_code: String(v.item_code).trim(),
          cost: Number(v.cost),
          ipd_factor: Number((v as any).ipd_factor),
          foreigner_uplift_pct: Number((v as any).foreigner_uplift_pct),
          skg_opd_factor: Number((v as any).skg_opd_factor ?? 1),
          skg_ipd_factor: Number((v as any).skg_ipd_factor ?? 1),
        } as any
        await onCreate(payload)
        form.resetFields()
      }}
    >
      <Form layout="vertical" form={form}>
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
          <Input />
        </Form.Item>
        <Form.Item name="major_class" label="Major Class" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="sub_class" label="Sub Class" rules={[{ required: true }]}>
          <Input />
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
      </Form>
    </Modal>
  )
}