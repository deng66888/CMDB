import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Table, Tag, Space, Switch, Dropdown, Card, Row, Col, message } from 'antd'
import { SearchOutlined, PlusOutlined, MoreOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  discoveryTaskListMock,
  discoveryTaskTypeLabels,
  type DiscoveryTask,
  type DiscoveryTaskType,
  type DiscoveryRunStatus,
} from '@/mock/discovery'
import NewTaskWizard from './NewTaskWizard'
import styles from '../common.module.css'

const runStatusMap: Record<DiscoveryRunStatus, string> = {
  success: '成功',
  partial_failed: '部分失败',
  failed: '失败',
  running: '运行中',
}
const runStatusColor: Record<DiscoveryRunStatus, string> = {
  success: 'success',
  partial_failed: 'warning',
  failed: 'error',
  running: 'processing',
}

export default function DiscoveryTasks() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<DiscoveryTaskType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [list, setList] = useState<DiscoveryTask[]>(() => [...discoveryTaskListMock])

  let filteredList = list
  if (keyword) filteredList = filteredList.filter((t) => t.name.includes(keyword))
  if (typeFilter !== 'all') filteredList = filteredList.filter((t) => t.type === typeFilter)
  if (statusFilter === 'enabled') filteredList = filteredList.filter((t) => t.enabled)
  if (statusFilter === 'disabled') filteredList = filteredList.filter((t) => !t.enabled)

  const handleRun = (task: DiscoveryTask) => {
    message.success(`已提交任务「${task.name}」执行`)
  }
  const handleToggle = (task: DiscoveryTask) => {
    setList((prev) => prev.map((t) => (t.id === task.id ? { ...t, enabled: !t.enabled } : t)))
    message.success(task.enabled ? '已暂停' : '已启用')
  }
  const handleClone = () => {
    message.info('克隆任务（可在此扩展创建副本）')
  }
  const handleDelete = (task: DiscoveryTask) => {
    setList((prev) => prev.filter((t) => t.id !== task.id))
    message.success('已删除')
  }

  const columns: ColumnsType<DiscoveryTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (name, record) => (
        <a onClick={() => navigate(`/config/discovery-task-detail?id=${record.id}`)}>{name}</a>
      ),
    },
    { title: '任务类型', dataIndex: 'type', width: 120, render: (t: DiscoveryTaskType) => discoveryTaskTypeLabels[t] },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      render: (enabled: boolean, record) => (
        <Switch size="small" checked={enabled} onChange={() => handleToggle(record)} />
      ),
    },
    {
      title: '上次执行',
      key: 'lastRun',
      width: 180,
      render: (_, r) =>
        r.lastRunTime ? (
          <span>
            {r.lastRunTime}
            {r.lastRunStatus && (
              <Tag color={runStatusColor[r.lastRunStatus]} style={{ marginLeft: 8 }}>{runStatusMap[r.lastRunStatus]}</Tag>
            )}
          </span>
        ) : (
          '-'
        ),
    },
    { title: '调度', dataIndex: 'schedule', width: 120, render: (s) => (s ? `cron: ${s}` : '一次性') },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(record)}>
            立即执行
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'detail', label: '查看详情', onClick: () => navigate(`/config/discovery-task-detail?id=${record.id}`) },
                { key: 'edit', label: '编辑' },
                { key: 'clone', label: '克隆', onClick: () => handleClone() },
                { key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(record) },
              ],
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>
            新建任务
          </Button>
          <Button onClick={() => navigate('/config/approval?source=discovery')}>
            待审批项
          </Button>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部类型' },
              ...Object.entries(discoveryTaskTypeLabels).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 100 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'enabled', label: '已启用' },
              { value: 'disabled', label: '已暂停' },
            ]}
          />
          <Input
            placeholder="搜索任务名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <Button onClick={() => setViewMode('table')}>表格</Button>
          <Button onClick={() => setViewMode('card')}>卡片</Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <div className={styles.tableWrap}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={filteredList}
            pagination={{ total: filteredList.length, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {filteredList.map((task) => (
            <Card
              key={task.id}
              className={styles.cardItem}
              size="small"
              title={
                <a onClick={() => navigate(`/config/discovery-task-detail?id=${task.id}`)}>{task.name}</a>
              }
              extra={
                <Switch size="small" checked={task.enabled} onChange={() => handleToggle(task)} />
              }
              actions={[
                <span key="run" onClick={() => handleRun(task)}>立即执行</span>,
                <span key="detail" onClick={() => navigate(`/config/discovery-task-detail?id=${task.id}`)}>详情</span>,
              ]}
            >
              <Row gutter={[8, 8]}>
                <Col span={12}>类型</Col>
                <Col span={12}>{discoveryTaskTypeLabels[task.type]}</Col>
                <Col span={12}>上次执行</Col>
                <Col span={12}>
                  {task.lastRunTime ?? '-'}
                  {task.lastRunStatus && <Tag color={runStatusColor[task.lastRunStatus]}>{runStatusMap[task.lastRunStatus]}</Tag>}
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      )}

      <NewTaskWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSuccess={() => { setWizardOpen(false); setList([...discoveryTaskListMock]) }} />
    </div>
  )
}
