import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Table, Tag, Space, Tooltip, Popconfirm, Switch, message } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, QuestionCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  complianceListMock,
  complianceDeleteRule,
  complianceToggleEnabled,
  type ComplianceRecord,
  type ComplianceResult,
} from '@/mock/ci'
import NewRuleModal from './NewRuleModal'
import EditRuleModal from './EditRuleModal'
import styles from './index.module.css'

const scheduleLabel: Record<string, string> = {
  manual: '仅手动',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
}

export default function Compliance() {
  const navigate = useNavigate()
  const [list, setList] = useState<ComplianceRecord[]>(() => [...complianceListMock])
  const [keyword, setKeyword] = useState('')
  const [resultFilter, setResultFilter] = useState<ComplianceResult | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<ComplianceRecord | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const refreshList = () => setList([...complianceListMock])

  let filteredList = useMemo(() => {
    let l = list
    if (keyword) {
      l = l.filter(
        (r) =>
          r.policyName.includes(keyword) || r.configClass.includes(keyword)
      )
    }
    if (resultFilter) l = l.filter((r) => r.result === resultFilter)
    if (statusFilter === 'enabled') l = l.filter((r) => r.enabled)
    if (statusFilter === 'disabled') l = l.filter((r) => !r.enabled)
    return l
  }, [list, keyword, resultFilter, statusFilter])

  const paginatedList = filteredList.slice((page - 1) * pageSize, page * pageSize)

  const runCheck = (record?: ComplianceRecord) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success(record ? `已对「${record.policyName}」发起重新检测` : '已发起全部策略检测')
    }, 800)
  }

  const handleToggleEnabled = (record: ComplianceRecord) => {
    complianceToggleEnabled(record.id)
    refreshList()
    message.success(record.enabled ? '已暂停规则' : '已启用规则')
  }

  const handleDelete = (record: ComplianceRecord) => {
    if (complianceDeleteRule(record.id)) {
      refreshList()
      setSelectedRowKeys((k) => k.filter((key) => key !== record.id))
      message.success('已删除规则')
    }
  }

  const handleBatchDelete = () => {
    const ids = selectedRowKeys as string[]
    ids.forEach((id) => complianceDeleteRule(id))
    refreshList()
    setSelectedRowKeys([])
    message.success(`已删除 ${ids.length} 条规则`)
  }

  const openEdit = (record: ComplianceRecord) => {
    setEditRecord(record)
    setEditModalOpen(true)
  }

  const columns: ColumnsType<ComplianceRecord> = [
    {
      title: '规则名称',
      dataIndex: 'policyName',
      minWidth: 200,
      ellipsis: true,
      render: (name, record) => (
        <Tooltip title={name} placement="topLeft">
          <a className={styles.nameLink} onClick={() => navigate(`/config/compliance-detail?id=${record.id}`)}>{name}</a>
        </Tooltip>
      ),
    },
    { title: '适用配置类', dataIndex: 'configClass', width: 100 },
    {
      title: '规则状态',
      dataIndex: 'enabled',
      width: 88,
      align: 'center',
      render: (enabled: boolean, record) => (
        <div className={styles.statusCell}>
          <Tooltip title={enabled ? '启用' : '已暂停'}>
            <Switch
              checked={enabled}
              onChange={() => handleToggleEnabled(record)}
              className={styles.statusSwitch}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '检测结果',
      dataIndex: 'result',
      width: 100,
      render: (result: ComplianceResult) => {
        if (result === 'pass') return <Tag color="success">通过</Tag>
        if (result === 'fail') return <Tag color="error">不通过</Tag>
        return <Tag color="default">待检测</Tag>
      },
    },
    {
      title: '检测统计',
      key: 'stats',
      width: 160,
      render: (_, record) =>
        record.totalCount != null ? (
          <span className={styles.statsCell}>
            共 {record.totalCount} 项
            {record.failCount != null && record.failCount > 0 && (
              <>
                <span className={styles.statsSep}>, </span>
                <Tag color="error">{record.failCount} 项不通过</Tag>
              </>
            )}
          </span>
        ) : (
          '-'
        ),
    },
    { title: '执行周期', dataIndex: 'schedule', width: 90, render: (s) => scheduleLabel[s] ?? s },
    { title: '上次检测', dataIndex: 'lastCheckTime', width: 160 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" className={styles.actionCell}>
          <Tooltip title="重新检测">
            <Button type="text" size="middle" icon={<ReloadOutlined />} onClick={() => runCheck(record)} loading={loading} />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" size="middle" icon={<EyeOutlined />} onClick={() => navigate(`/config/compliance-detail?id=${record.id}`)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="middle" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="确定删除该规则？"
            description="删除后不可恢复。"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <span>
                <Button type="text" size="middle" danger icon={<DeleteOutlined />} />
              </span>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <a href="#">合规性检测说明</a>
      </div>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewModalOpen(true)}>
            新建规则
          </Button>
          <Space.Compact>
            <Button type={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')}>
              全部
            </Button>
            <Button type={statusFilter === 'enabled' ? 'primary' : 'default'} onClick={() => setStatusFilter('enabled')}>
              已启用
            </Button>
            <Button type={statusFilter === 'disabled' ? 'primary' : 'default'} onClick={() => setStatusFilter('disabled')}>
              已暂停
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button type={resultFilter === '' ? 'primary' : 'default'} onClick={() => setResultFilter('')}>
              全部结果
            </Button>
            <Button type={resultFilter === 'pass' ? 'primary' : 'default'} onClick={() => setResultFilter('pass')}>
              通过
            </Button>
            <Button type={resultFilter === 'fail' ? 'primary' : 'default'} onClick={() => setResultFilter('fail')}>
              不通过
            </Button>
            <Button type={resultFilter === 'pending' ? 'primary' : 'default'} onClick={() => setResultFilter('pending')}>
              待检测
            </Button>
          </Space.Compact>
        </Space>
        <Space wrap>
          <Input
            placeholder="搜索策略名称、配置类"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => runCheck()} loading={loading}>
            全部重新检测
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条规则？`}
              onConfirm={handleBatchDelete}
              okText="删除"
              okButtonProps={{ danger: true }}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table
          rowKey="id"
          size="small"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={paginatedList}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredList.length,
            current: page,
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p)
              if (ps) setPageSize(ps)
            },
          }}
        />
      </div>
      <NewRuleModal open={newModalOpen} onClose={() => setNewModalOpen(false)} onSuccess={refreshList} />
      <EditRuleModal
        open={editModalOpen}
        record={editRecord}
        onClose={() => { setEditModalOpen(false); setEditRecord(null) }}
        onSuccess={refreshList}
      />
    </div>
  )
}
