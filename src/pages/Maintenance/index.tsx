import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Table, Tag, Space, Dropdown, message } from 'antd'
import { SearchOutlined, CalendarOutlined, QuestionCircleOutlined, MoreOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { maintenanceListMock, type MaintenanceRecord, type MaintenanceStatus } from '@/mock/ci'
import styles from './index.module.css'

const statusTabs: { key: '' | MaintenanceStatus; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'expired', label: '已过期' },
  { key: 'expiring_30', label: '30日内到期' },
  { key: 'expiring_60', label: '60日内到期' },
  { key: 'expiring_90', label: '90日内到期' },
]

export default function Maintenance() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | MaintenanceStatus>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  let list = keyword
    ? maintenanceListMock.filter((r) => r.name.includes(keyword) || r.category.includes(keyword) || r.owner.includes(keyword))
    : maintenanceListMock
  if (filterStatus) list = list.filter((r) => r.status === filterStatus)
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize)

  const columns: ColumnsType<MaintenanceRecord> = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name, record) => (
        <a onClick={() => navigate(`/config/ci-detail?id=${record.id}`)}>{name}</a>
      ),
    },
    { title: '分类', dataIndex: 'category' },
    { title: '维保到期日', dataIndex: 'maintenanceEndDate' },
    {
      title: '剩余天数',
      dataIndex: 'daysRemaining',
      render: (days: number) => {
        if (days < 0) return <Tag color="error">已过期 {Math.abs(days)} 天</Tag>
        if (days <= 30) return <Tag color="warning">{days} 天</Tag>
        return <span>{days} 天</span>
      },
    },
    { title: '责任人', dataIndex: 'owner' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'detail', label: '查看配置项', onClick: () => navigate(`/config/ci-detail?id=${record.id}`) },
              { key: 'extend', label: '续保登记', onClick: () => message.info('续保登记') },
              { key: 'dismiss', label: '忽略提醒', onClick: () => message.info('已忽略') },
            ],
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <a href="#">维保提醒说明</a>
      </div>
      <div className={styles.toolbar}>
        <Space wrap>
          {statusTabs.map((tab) => (
            <Button
              key={tab.key || 'all'}
              type={filterStatus === tab.key ? 'primary' : 'default'}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </Space>
        <Space wrap>
          <Input
            placeholder="搜索名称、分类、责任人"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Button icon={<CalendarOutlined />}>导出维保报表</Button>
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={paginatedList}
          pagination={{
            total: list.length,
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
    </div>
  )
}
