import { useState } from 'react'
import { Card, Row, Col, Statistic, Table, Button, Input, InputNumber, Select, Tag, Space, Modal, Form, message } from 'antd'
import { DownloadOutlined, SettingOutlined, CloudSyncOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  agentOverviewMock,
  agentListMock,
  agentStatusLabels,
  agentEventListMock,
  type AgentInstance,
  type AgentStatus,
  type AgentEvent,
} from '@/mock/discovery'
import styles from '../common.module.css'

export default function DiscoveryAgent() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all')
  const [installModalOpen, setInstallModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'events'>('list')
  const [configForm] = Form.useForm()
  const [installToken, setInstallToken] = useState('')
  const [installServer, setInstallServer] = useState('https://cmdb.example.com')

  let agentList = keyword ? agentListMock.filter((a) => a.hostname.includes(keyword) || a.ip.includes(keyword)) : agentListMock
  if (statusFilter !== 'all') agentList = agentList.filter((a) => a.status === statusFilter)

  const columns: ColumnsType<AgentInstance> = [
    { title: '主机名', dataIndex: 'hostname' },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '操作系统', render: (_, r) => `${r.osType} ${r.osVersion}`, width: 140 },
    { title: 'Agent 版本', dataIndex: 'agentVersion', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: AgentStatus) => <Tag color={s === 'online' ? 'success' : s === 'offline' ? 'default' : 'warning'}>{agentStatusLabels[s]}</Tag>,
    },
    { title: '最后上报', dataIndex: 'lastHeartbeat', width: 160 },
    { title: '标签', dataIndex: 'labels', render: (labels: string[]) => labels?.map((l) => <Tag key={l}>{l}</Tag>) },
  ]

  const eventColumns: ColumnsType<AgentEvent> = [
    { title: '时间', dataIndex: 'createdAt', width: 180 },
    { title: '主机', dataIndex: 'hostname', width: 140 },
    { title: '事件类型', dataIndex: 'eventType', width: 100 },
    { title: '说明', dataIndex: 'message' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => setInstallModalOpen(true)}>
            安装命令
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setConfigModalOpen(true)}>Agent 配置</Button>
          <Button icon={<CloudSyncOutlined />}>批量升级</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="在线" value={agentOverviewMock.online} suffix="台" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="离线" value={agentOverviewMock.offline} suffix="台" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待安装" value={agentOverviewMock.installing} suffix="台" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="异常" value={agentOverviewMock.abnormal} suffix="台" />
          </Card>
        </Col>
      </Row>

      <Card
        title="Agent 列表"
        extra={
          <Space>
            <Input placeholder="搜索主机名、IP" value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 180 }} />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 100 }}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(agentStatusLabels).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Button type={activeTab === 'list' ? 'primary' : 'default'} onClick={() => setActiveTab('list')}>Agent 列表</Button>
          <Button type={activeTab === 'events' ? 'primary' : 'default'} onClick={() => setActiveTab('events')}>事件日志</Button>
        </Space>
        {activeTab === 'list' ? (
          <Table rowKey="id" size="small" columns={columns} dataSource={agentList} pagination={{ total: agentList.length, showTotal: (t) => `共 ${t} 条` }} />
        ) : (
          <Table rowKey="id" size="small" columns={eventColumns} dataSource={agentEventListMock} pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Modal title="安装命令" open={installModalOpen} onCancel={() => setInstallModalOpen(false)} footer={null} width={640}>
        <p style={{ marginBottom: 16 }}>填写 Token 和服务器地址后，下方命令会自动更新，复制到目标主机执行即可完成 Agent 安装。</p>
        <Form layout="vertical" style={{ marginBottom: 16 }}>
          <Form.Item label="安装 Token（必填）">
            <Input placeholder="从「发现源管理」或管理员获取" value={installToken} onChange={(e) => setInstallToken(e.target.value)} />
          </Form.Item>
          <Form.Item label="CMDB 服务地址">
            <Input placeholder="https://cmdb.example.com" value={installServer} onChange={(e) => setInstallServer(e.target.value)} />
          </Form.Item>
        </Form>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Linux / macOS</div>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>
{`curl -sSL ${installServer.replace(/\/$/, '')}/agent/install.sh | bash -s -- --token=${installToken || 'YOUR_TOKEN'} --server=${installServer || 'https://cmdb.example.com'}`}
        </pre>
        <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 500 }}>Windows (PowerShell)</div>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>
{`irm ${installServer.replace(/\/$/, '')}/agent/install.ps1 | iex -Token ${installToken || 'YOUR_TOKEN'} -Server ${installServer || 'https://cmdb.example.com'}`}
        </pre>
      </Modal>

      <Modal
        title="Agent 全局配置"
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={() => {
          configForm.validateFields().then(() => {
            message.success('配置已下发，将逐步生效')
            setConfigModalOpen(false)
          })
        }}
        width={520}
      >
        <Form form={configForm} layout="vertical" initialValues={{ heartbeatInterval: 60, logLevel: 'info', reportScope: 'all' }}>
          <Form.Item name="heartbeatInterval" label="心跳间隔(秒)" rules={[{ required: true }]}>
            <InputNumber min={10} max={300} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="logLevel" label="日志级别" rules={[{ required: true }]}>
            <Select options={[{ value: 'debug', label: 'debug' }, { value: 'info', label: 'info' }, { value: 'warn', label: 'warn' }, { value: 'error', label: 'error' }]} />
          </Form.Item>
          <Form.Item name="reportScope" label="上报数据范围" rules={[{ required: true }]}>
            <Select options={[{ value: 'all', label: '全部属性' }, { value: 'basic', label: '仅基础属性' }, { value: 'custom', label: '按标签/组配置' }]} />
          </Form.Item>
          <Form.Item name="configNote" label="备注">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
