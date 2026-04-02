import { useEffect } from 'react'
import { Modal, Form, Input, Select, Switch, message } from 'antd'
import dayjs from 'dayjs'
import {
  complianceConfigClassOptions,
  complianceRuleTypeOptions,
  complianceScheduleOptions,
  complianceAddRule,
  type ComplianceSchedule,
  type ComplianceRuleType,
} from '@/mock/ci'

export interface NewRuleFormValues {
  policyName: string
  configClass: string
  ruleType: ComplianceRuleType
  customExpression?: string
  description?: string
  schedule: ComplianceSchedule
  enabled: boolean
}

interface NewRuleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewRuleModal({ open, onClose, onSuccess }: NewRuleModalProps) {
  const [form] = Form.useForm<NewRuleFormValues>()

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ schedule: 'daily', enabled: true })
    }
  }, [open, form])

  const handleOk = () => {
    form.validateFields().then((values) => {
      complianceAddRule({
        policyName: values.policyName.trim(),
        configClass: values.configClass,
        ruleType: values.ruleType,
        customExpression: values.ruleType === 'custom' ? values.customExpression?.trim() : undefined,
        description: values.description?.trim() || undefined,
        schedule: values.schedule,
        enabled: values.enabled,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        creator: '当前用户',
      })
      message.success('规则已创建')
      onSuccess()
      onClose()
    })
  }

  const ruleType = Form.useWatch('ruleType', form)
  const isCustom = ruleType === 'custom'

  return (
    <Modal
      title="新建合规规则"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="创建"
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
        <Form.Item name="enabled" label="创建后启用" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="暂停" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
