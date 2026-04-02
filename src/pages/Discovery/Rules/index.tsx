import { useState } from 'react'
import { Card, Tabs, Table, Button, Switch, Space, Modal, Form, Input, Select, InputNumber, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  preprocessRuleListMock,
  preprocessRuleTypeLabels,
  type PreprocessRule,
  type PreprocessRuleType,
} from '@/mock/discovery'
import styles from '../common.module.css'

export default function DiscoveryRules() {
  const [activeRuleType, setActiveRuleType] = useState<PreprocessRuleType | 'all'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form] = Form.useForm()

  let list = activeRuleType === 'all' ? preprocessRuleListMock : preprocessRuleListMock.filter((r) => r.ruleType === activeRuleType)

  const columns: ColumnsType<PreprocessRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name} placement="topLeft">
          <span style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </Tooltip>
      ),
    },
    { title: '类型', dataIndex: 'ruleType', width: 120, render: (t: PreprocessRuleType) => preprocessRuleTypeLabels[t] },
    { title: '条件(JSON)', dataIndex: 'conditions', render: (c) => <code>{JSON.stringify(c)}</code> },
    { title: '动作(JSON)', dataIndex: 'actions', render: (a) => <code>{JSON.stringify(a)}</code> },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      render: (enabled: boolean) => <Switch size="small" checked={enabled} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => (
        <Space>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            新建规则
          </Button>
        </Space>
      </div>

      <Card title="数据预处理规则">
        <p style={{ color: '#666', marginBottom: 16 }}>
          去重规则用于判断两条发现记录是否重复；自动补全用于根据发现数据补充缺失字段；自动入库规则满足条件时可直接入库（不经过审批）。
        </p>
        <Tabs
          activeKey={activeRuleType}
          onChange={setActiveRuleType as (k: string) => void}
          items={[
            { key: 'all', label: '全部' },
            { key: 'dedup', label: '去重规则' },
            { key: 'enrich', label: '自动补全' },
            { key: 'auto_approve', label: '自动入库' },
          ].map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: (
              <Table
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={tab.key === 'all' ? list : list.filter((r) => r.ruleType === tab.key)}
                pagination={{ total: list.length, showTotal: (t) => `共 ${t} 条` }}
                scroll={{ x: 800 }}
              />
            ),
          }))}
        />
      </Card>

      <Modal
        title="新建预处理规则"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={() => form.validateFields().then(() => setAddModalOpen(false))}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="如：服务器 IP+主机名去重" />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true }]}>
            <Select
              options={Object.entries(preprocessRuleTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={50}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
