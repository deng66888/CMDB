import { useState, useEffect } from 'react'
import { Modal, Input, Radio, Form, Transfer, Switch, Select, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { ListView, ViewPersonalization } from './viewTypes'
import { AVAILABLE_COLUMNS, createEmptyView } from './viewTypes'
import styles from './index.module.css'

const TEXTAREA_ROWS = 3

interface ViewModalProps {
  open: boolean
  editingView: ListView | null
  onCancel: () => void
  onSave: (view: ListView) => void
}

export default function ViewModal({ open, editingView, onCancel, onSave }: ViewModalProps) {
  const [form] = Form.useForm()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const isCreate = !editingView?.id || editingView.id.startsWith('view_')

  useEffect(() => {
    if (!open) return
    const initial = editingView ?? createEmptyView(true)
    form.setFieldsValue({
      name: initial.name,
      visibility: initial.visibility,
      description: initial.description ?? '',
      zebra: initial.personalization.zebra,
      border: initial.personalization.border,
      highlightRow: initial.personalization.highlightRow,
      wrap: initial.personalization.wrap,
      doubleClickDetail: initial.personalization.doubleClickDetail,
      align: initial.personalization.align,
      tagField: initial.personalization.tagField,
      columnWidth: initial.personalization.columnWidth,
      fixedColumn: initial.personalization.fixedColumn,
    })
    setSelectedKeys(initial.columnKeys)
  }, [open, editingView, form])

  const handleOk = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return
    const columnKeys = selectedKeys.filter((k) => k !== 'action')
    if (!selectedKeys.includes('action')) columnKeys.push('action')
    const personalization: ViewPersonalization = {
      zebra: values.zebra,
      border: values.border,
      highlightRow: values.highlightRow,
      wrap: values.wrap,
      doubleClickDetail: values.doubleClickDetail,
      align: values.align,
      tagField: values.tagField,
      columnWidth: values.columnWidth,
      fixedColumn: values.fixedColumn,
    }
    const view: ListView = {
      id: editingView?.id ?? `view_${Date.now()}`,
      name: values.name,
      visibility: values.visibility,
      description: values.description,
      columnKeys,
      personalization,
      isMine: true,
      isSystem: editingView?.isSystem,
    }
    onSave(view)
    form.resetFields()
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const transferDataSource = AVAILABLE_COLUMNS.map((c) => ({ key: c.key, title: c.title }))
  const targetKeys = selectedKeys

  return (
    <Modal
      title={
        <span>
          {isCreate ? '创建配置项列视图' : '编辑配置项列视图'}
          <Tooltip title="配置项列视图可根据不同维度帮助用户以不同方式管理并展示配置项。">
            <QuestionCircleOutlined style={{ marginLeft: 8, color: 'rgba(0,0,0,0.45)' }} />
          </Tooltip>
        </span>
      }
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="保存并使用"
      cancelText="取消"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ visibility: 'public', align: 'left', columnWidth: 'auto', fixedColumn: 'none' }}>
        <div className={styles.viewModalSection}>
          <div className={styles.viewModalSectionTitle}>基本信息</div>
          <Form.Item name="name" label="视图名称" rules={[{ required: true, message: '请输入视图名称' }]}>
            <Input placeholder="请输入视图名称" />
          </Form.Item>
          <Form.Item name="visibility" label="可见范围">
            <Radio.Group>
              <Radio value="self">仅自己</Radio>
              <Radio value="public">公开</Radio>
            </Radio.Group>
          </Form.Item>
          <div className={styles.viewModalHint}>
            提示：设置为「公开」后，别人将可以看见并使用你的工单视图
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={TEXTAREA_ROWS} placeholder="选填" />
          </Form.Item>
        </div>

        <div className={styles.viewModalSection}>
          <div className={styles.viewModalSectionTitle}>列视图设置</div>
          <div className={styles.viewModalSectionSub}>设置可见列</div>
          <Transfer
            dataSource={transferDataSource}
            titles={[`可用的(${AVAILABLE_COLUMNS.length})`, `已选(${targetKeys.length})`]}
            targetKeys={targetKeys}
            selectedKeys={[]}
            onChange={(next) => setSelectedKeys(next as string[])}
            render={(item) => item.title}
            listStyle={{ width: 260, height: 280 }}
            showSearch
            filterOption={(input, item) => item.title.includes(input)}
            locale={{ searchPlaceholder: '请输入字段名称关键字' }}
          />
          <div className={styles.viewModalHint}>
            *请按照从上到下的顺序排序，上面的列在展示时排在左边
          </div>
        </div>

        <div className={styles.viewModalSection}>
          <div className={styles.viewModalSectionTitle}>个性化配置</div>
          <Form.Item name="zebra" label="显示斑马线" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="border" label="显示表格边框" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="highlightRow" label="高亮当前行" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="wrap" label="单元格文字换行" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="doubleClickDetail" label="双击行查看详情" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="align" label="单元格对齐方式">
            <Radio.Group>
              <Radio value="left">左对齐</Radio>
              <Radio value="center">居中</Radio>
              <Radio value="right">右对齐</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="tagField" label="标签化展示字段">
            <Select placeholder="请选择标签化展示字段" allowClear options={AVAILABLE_COLUMNS.map((c) => ({ value: c.key, label: c.title }))} />
          </Form.Item>
          <Form.Item name="columnWidth" label="列宽设置">
            <Radio.Group>
              <Radio value="auto">自适应</Radio>
              <Radio value="custom">自定义</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="fixedColumn" label="固定列设置">
            <Radio.Group>
              <Radio value="none">全部不固定</Radio>
              <Radio value="custom">自定义</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
