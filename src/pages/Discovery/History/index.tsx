import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Table, Descriptions, Tag, Button, Tabs, Select, Space } from 'antd'
import { ArrowLeftOutlined, ExportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  discoveryExecutionListMock,
  discoveryRawDataByExecutionMock,
  discoveryExceptionListMock,
  type DiscoveryExecution,
  type DiscoveryRunStatus,
  type DiscoveryRawData,
  type DiscoveryException,
} from '@/mock/discovery'
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

export default function DiscoveryHistory() {
  const [searchParams] = useSearchParams()
  const executionIdFromUrl = searchParams.get('executionId')
  const [activeTab, setActiveTab] = useState<'list' | 'exceptions'>('list')
  const [statusFilter, setStatusFilter] = useState<DiscoveryRunStatus | 'all'>('all')
  const [detailExecutionId, setDetailExecutionId] = useState<string | null>(executionIdFromUrl)
  const [detailOpen, setDetailOpen] = useState(!!executionIdFromUrl)

  useEffect(() => {
    if (executionIdFromUrl) {
      setDetailExecutionId(executionIdFromUrl)
      setDetailOpen(true)
    }
  }, [executionIdFromUrl])

  let execList = statusFilter === 'all' ? discoveryExecutionListMock : discoveryExecutionListMock.filter((e) => e.status === statusFilter)
  const execution = detailExecutionId ? discoveryExecutionListMock.find((e) => e.id === detailExecutionId) : null
  const rawDataList = detailExecutionId ? (discoveryRawDataByExecutionMock[detailExecutionId] ?? []) : []

  const execColumns: ColumnsType<DiscoveryExecution> = [
    { title: '开始时间', dataIndex: 'startTime', width: 180 },
    { title: '结束时间', dataIndex: 'endTime', width: 180 },
    { title: '任务名称', dataIndex: 'taskName' },
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
      width: 100,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => { setDetailExecutionId(row.id); setDetailOpen(true) }}>
          查看详情
        </Button>
      ),
    },
  ]

  const rawColumns: ColumnsType<DiscoveryRawData> = [
    { title: 'CI 类型', dataIndex: 'ciType', width: 100 },
    { title: '状态', dataIndex: 'status', width: 90 },
    {
      title: '原始数据',
      dataIndex: 'rawData',
      render: (data: Record<string, unknown>) => (
        <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>
      ),
    },
  ]

  const exceptionColumns: ColumnsType<DiscoveryException> = [
    { title: '时间', dataIndex: 'createdAt', width: 180 },
    { title: '任务', dataIndex: 'taskName' },
    { title: '目标', dataIndex: 'target', width: 120 },
    { title: '错误类型', dataIndex: 'errorType', width: 100 },
    { title: '说明', dataIndex: 'message' },
    { title: '操作', key: 'action', width: 80, render: () => <Button type="link" size="small">重试</Button> },
  ]

  return (
    <div className={styles.wrap}>
      <Card
        title="发现历史"
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(runStatusMap).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
            <Button icon={<ExportOutlined />}>导出</Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab as (k: string) => void}
          items={[
            {
              key: 'list',
              label: '执行记录',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={execColumns}
                  dataSource={execList}
                  pagination={{ total: execList.length, showTotal: (t) => `共 ${t} 条` }}
                />
              ),
            },
            {
              key: 'exceptions',
              label: '异常记录',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={exceptionColumns}
                  dataSource={discoveryExceptionListMock}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>

      {detailOpen && execution && (
        <Card
          title={`执行详情 · ${execution.taskName}`}
          extra={
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="开始时间">{execution.startTime}</Descriptions.Item>
            <Descriptions.Item label="结束时间">{execution.endTime ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={runStatusColor[execution.status]}>{runStatusMap[execution.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="发现总数">{execution.totalFound}</Descriptions.Item>
            <Descriptions.Item label="新增候选">{execution.newCandidates}</Descriptions.Item>
            <Descriptions.Item label="重复数">{execution.duplicates}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>按 CI 类型分组的发现数据</div>
          <Table rowKey="id" size="small" columns={rawColumns} dataSource={rawDataList} pagination={false} />
        </Card>
      )}
    </div>
  )
}
