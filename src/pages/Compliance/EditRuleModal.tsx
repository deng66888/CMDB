import { useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import {
  complianceConfigClassOptions,
  complianceRuleTypeOptions,
  complianceScheduleOptions,
  complianceUpdateRule,
  type ComplianceRecord,
  type ComplianceSchedule,
  type ComplianceRuleType,
} from '@/mock/ci'

export interface EditRuleFormValues {
  policyName: string
  configClass: string
  ruleType: ComplianceRuleType
  customExpression?: string
  description?: string
  schedule: ComplianceSchedule
}

interface EditRuleModalProps {
  open: boolean
  record: ComplianceRecord | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditRuleModal({ open, record, onClose, onSuccess }: EditRuleModalProps) {
  const [form] = Form.useForm<EditRuleFormValues>()

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        policyName: record.policyName,
        configClass: record.configClass,
        ruleType: record.ruleType,
        customExpression: record.customExpression ?? '',
        description: record.description ?? '',
        schedule: record.schedule,
      })
    }
  }, [open, record, form])

  const ruleType = Form.useWatch('ruleType', form)
  const isCustom = ruleType === 'custom'

  const handleOk = () => {
    if (!record) return
    form.validateFields().then((values) => {
      const ok = complianceUpdateRule(record.id, {
        policyName: values.policyName.trim(),
        configClass: values.configClass,
        ruleType: values.ruleType,
        customExpression: values.ruleType === 'custom' ? values.customExpression?.trim() : undefined,
        description: values.description?.trim() || undefined,
        schedule: values.schedule,
      })
      if (ok) {
        message.success('规则已更新')
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <Modal
      title="编辑合规规则"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="policyName"
          label="规则名称"
          rules={[{ required: true, message: '请输入规则名称' }, { max: 64, message: '最多 64 个字符' }]}
        >
          <Input placeholder="如：主机名唯一性" maxLength={64} showCount />
        </Form.Item>
        <Form.Item name="configClass" label="适用配置类" rules={[{ required: true, message: '请选择配置类' }]}>
          <Select placeholder="选择配置类" options={complianceConfigClassOptions} />
        </Form.Item>
        <Form.Item name="ruleType" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
          <Select placeholder="选择规则类型" options={complianceRuleTypeOptions} />
        </Form.Item>
        {isCustom && (
          <Form.Item
            name="customExpression"
            label="自定义表达式"
            rules={[
              { required: true, message: '请输入自定义表达式' },
              { max: 2000, message: '表达式最多 2000 个字符' },
            ]}
            tooltip="支持对配置项属性进行判断，如：attributes.ip != ''、attributes.port > 0 && attributes.port < 65535"
          >
            <Input.TextArea
              placeholder="例：attributes.ip != '' 或 attributes.port > 0 && attributes.port < 65535"
              rows={4}
              maxLength={2000}
              showCount
            />
          </Form.Item>
        )}
        <Form.Item name="description" label="规则说明">
          <Input.TextArea placeholder="描述该规则的检测逻辑或适用范围" rows={3} />
        </Form.Item>
        <Form.Item name="schedule" label="执行周期" rules={[{ required: true }]}>
          <Select options={complianceScheduleOptions} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
