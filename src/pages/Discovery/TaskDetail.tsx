import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Descriptions, Tabs, Table, Button, Tag, Empty } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  discoveryTaskListMock,
  discoveryExecutionListMock,
  discoveryTaskTypeLabels,
  type DiscoveryTask,
  type DiscoveryExecution,
  type DiscoveryRunStatus,
} from '@/mock/discovery'
import styles from './common.module.css'


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

export default function DiscoveryTaskDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [task, setTask] = useState<DiscoveryTask | null>(null)
  const [executions, setExecutions] = useState<DiscoveryExecution[]>([])

  useEffect(() => {
    const t = discoveryTaskListMock.find((x) => x.id === id)
    setTask(t ?? null)
    setExecutions(discoveryExecutionListMock.filter((e) => e.taskId === id))
  }, [id])

  if (!id || !task) {
    return (
      <div className={styles.wrap}>
        <Empty description="任务不存在" />
        <Button type="primary" onClick={() => navigate('/config/discovery-tasks')}>返回列表</Button>
      </div>
    )
  }

  const execColumns: ColumnsType<DiscoveryExecution> = [
    { title: '开始时间', dataIndex: 'startTime', width: 180 },
    { title: '结束时间', dataIndex: 'endTime', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: DiscoveryRunStatus) => <Tag color={runStatusColor[s]}>{runStatusMap[s]}</Tag>,
    },
    { title: '发现总数', dataIndex: 'totalFound', width: 90 },
    { title: '新增候选', dataIndex: 'newCandidates', width: 90 },
    { title: '重复数', dataIndex: 'duplicates', width: 80 },
    {
      title: '操作',
      key: 'action',
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => navigate(`/config/discovery-history?executionId=${row.id}`)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/config/discovery-tasks')}>
          返回列表
        </Button>
        <Button type="primary" icon={<PlayCircleOutlined />}>立即执行</Button>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="任务名称">{task.name}</Descriptions.Item>
          <Descriptions.Item label="任务类型">{discoveryTaskTypeLabels[task.type]}</Descriptions.Item>
          <Descriptions.Item label="状态">{task.enabled ? <Tag color="success">已启用</Tag> : <Tag>已暂停</Tag>}</Descriptions.Item>
          <Descriptions.Item label="调度">{task.schedule ?? '一次性'}</Descriptions.Item>
          <Descriptions.Item label="上次执行">{task.lastRunTime ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="上次结果">{task.lastRunStatus ? <Tag color={runStatusColor[task.lastRunStatus]}>{runStatusMap[task.lastRunStatus]}</Tag> : '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{task.createdBy}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{task.createdAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: 'overview',
              label: '概览',
              children: (
                <div>
                  <p>最近一次执行：{executions[0] ? `${executions[0].startTime}，${runStatusMap[executions[0].status]}，发现 ${executions[0].totalFound} 条，新增候选 ${executions[0].newCandidates} 条。` : '暂无执行记录'}</p>
                </div>
              ),
            },
            {
              key: 'history',
              label: '执行历史',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={execColumns}
                  dataSource={executions}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
