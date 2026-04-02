import { Modal, Form, Select } from 'antd'

const CONFIG_CLASS_OPTIONS = [
  { value: '服务器', label: '服务器' },
  { value: '计算机', label: '计算机' },
  { value: '中间件', label: '中间件' },
  { value: '数据库', label: '数据库' },
  { value: '网络适配器', label: '网络适配器' },
]

interface ConfigClassModalProps {
  open: boolean
  onCancel: () => void
  onNext: (category: string) => void
}

export default function ConfigClassModal({ open, onCancel, onNext }: ConfigClassModalProps) {
  const [form] = Form.useForm()

  const handleOk = () => {
    form.validateFields().then((values) => {
      onNext(values.category)
      form.resetFields()
      onCancel()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="配置类"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="下一步"
      cancelText="取消"
      destroyOnClose
      width={440}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类" options={CONFIG_CLASS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
