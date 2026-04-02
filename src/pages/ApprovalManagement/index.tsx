import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Select, Table, Tag, Space, DatePicker } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { unifiedApprovalListMock, type UnifiedApprovalRecord, type ApprovalSourceType } from '@/mock/ci'
import ApprovalDetailDrawer from './ApprovalDetailDrawer'
import styles from './index.module.css'

const SOURCE_OPTIONS = [
  { value: 'all', label: '全部来源' },
  { value: 'manual', label: '人工申请' },
  { value: 'discovery', label: '自动发现' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: '新增', label: '新增' },
  { value: '变更', label: '变更' },
  { value: '差异', label: '差异' },
  { value: '特审批', label: '特审批' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '待审批', label: '待审批' },
  { value: '已通过', label: '已通过' },
  { value: '已驳回', label: '已驳回' },
]

const statusMap = { 待审批: 'warning', 已通过: 'success', 已驳回: 'error' }
const discoveryTypeMap = { 新增: 'green', 变更: 'blue', 差异: 'volcano', 特审批: 'red' }

export default function ApprovalManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [data, setData] = useState<UnifiedApprovalRecord[]>(unifiedApprovalListMock)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<UnifiedApprovalRecord | null>(null)

  const sourceFromUrl = searchParams.get('source')
  useEffect(() => {
    if (sourceFromUrl === 'discovery') {
      setSourceFilter('discovery')
      setSearchParams({}, { replace: true })
    }
  }, [sourceFromUrl, setSearchParams])

  let list = data
  if (sourceFilter !== 'all') list = list.filter((r) => r.sourceType === sourceFilter)
  if (typeFilter !== 'all') list = list.filter((r) => r.discoveryType === typeFilter)
  if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
  if (dateRange) {
    const [s, e] = dateRange
    const start = s.startOf('day').valueOf()
    const end = e.endOf('day').valueOf()
    list = list.filter((r) => {
      const t = dayjs(r.applyTime).valueOf()
      return t >= start && t <= end
    })
  }
  const filteredList = keyword ? list.filter((r) => r.name.includes(keyword) || r.category.includes(keyword)) : list

  const columns: ColumnsType<UnifiedApprovalRecord> = [
    { title: '', dataIndex: 'id', width: 48, render: () => <input type="checkbox" /> },
    {
      title: '名称',
      dataIndex: 'name',
      render: (name, record) => (
        <a onClick={() => { setDetailRecord(record); setDetailOpen(true) }}>{name}</a>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 100 },
    {
      title: '来源类型',
      dataIndex: 'sourceType',
      width: 100,
      render: (v: ApprovalSourceType) => (
        <Tag color={v === 'manual' ? 'blue' : 'green'}>
          {v === 'manual' ? '人工申请' : '自动发现'}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'discoveryType',
      width: 88,
      render: (v: keyof typeof discoveryTypeMap) =>
        v ? <Tag color={discoveryTypeMap[v]}>{v}</Tag> : '-',
    },
    { title: '申请人', dataIndex: 'applicant', width: 90 },
    { title: '申请时间', dataIndex: 'applyTime', width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (v: keyof typeof statusMap) => v && <Tag color={statusMap[v]}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => { setDetailRecord(record); setDetailOpen(true) }}
        >
          处理
        </Button>
      ),
    },
  ]

  const handleApprove = (id: string, result: 'pass' | 'reject', _remark?: string) => {
    setData((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: result === 'pass' ? ('已通过' as const) : ('已驳回' as const) }
          : r
      )
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Space wrap size="middle">
          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            options={SOURCE_OPTIONS}
            style={{ width: 130 }}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
            style={{ width: 110 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 110 }}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['开始日期', '结束日期']}
          />
          <Input
            placeholder="请输入关键字搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
        </Space>
      </div>
      <div className={styles.tip}>
        统一待办：人工申请与自动发现变更集中展示，可按来源、类型、时间筛选。不同角色可在后台配置可查看/操作的来源类型。
      </div>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={filteredList}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共${t}条` }}
      />
      <ApprovalDetailDrawer
        open={detailOpen}
        record={detailRecord}
        onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
        onApprove={handleApprove}
      />
    </div>
  )
}
