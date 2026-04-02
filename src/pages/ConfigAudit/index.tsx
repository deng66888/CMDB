import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Table, Tag, Space, Dropdown, message } from 'antd'
import { SearchOutlined, QuestionCircleOutlined, SettingOutlined, MoreOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ciListMock, totalCountMock, type CIRecord, type AuditStatus } from '@/mock/ci'
import AuditSettingsModal from './AuditSettingsModal'
import styles from './index.module.css'

const auditStatusMap: Record<AuditStatus, string> = {
  待审计: 'warning',
  通过: 'success',
  不匹配: 'error',
  丢失: 'default',
}

export default function ConfigAudit() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<AuditStatus | ''>('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredList = keyword
    ? ciListMock.filter((r) => r.name.includes(keyword) || r.category.includes(keyword))
    : ciListMock
  const list = filterStatus ? filteredList.filter((r) => r.auditStatus === filterStatus) : filteredList
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize)

  const columns: ColumnsType<CIRecord> = [
    { title: '', dataIndex: 'id', width: 48, render: () => <input type="checkbox" /> },
    {
      title: '名称',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <a onClick={() => navigate(`/config/ci-detail?id=${record.id}`)}>{name}</a>
      ),
    },
    { title: '分类', dataIndex: 'category', sorter: (a, b) => a.category.localeCompare(b.category) },
    { title: '供应商', dataIndex: 'vendor' },
    { title: '创建人', dataIndex: 'creator', sorter: (a, b) => a.creator.localeCompare(b.creator) },
    { title: '创建时间', dataIndex: 'createTime', sorter: (a, b) => a.createTime.localeCompare(b.createTime) },
    {
      title: '审计状态',
      dataIndex: 'auditStatus',
      render: (v: AuditStatus) => v && <Tag color={auditStatusMap[v]}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: 'log', label: '活动日志' },
              { key: 'export', label: '导出' },
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
        <a href="#">配置审计有什么作用?</a>
      </div>
      <div className={styles.toolbar}>
        <Space wrap>
          <Button type={filterStatus === '' ? 'primary' : 'default'} onClick={() => setFilterStatus('')}>
            配置类
          </Button>
          <Button type={filterStatus === '通过' ? 'primary' : 'default'} onClick={() => setFilterStatus('通过')}>
            通过
          </Button>
          <Button type={filterStatus === '不匹配' ? 'primary' : 'default'} onClick={() => setFilterStatus('不匹配')}>
            不匹配
          </Button>
          <Button type={filterStatus === '丢失' ? 'primary' : 'default'} onClick={() => setFilterStatus('丢失')}>
            丢失
          </Button>
          <Button type="primary" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            审计设置
          </Button>
        </Space>
        <Space>
          <Select placeholder="所有配置项" style={{ width: 140 }} options={[{ value: 'all', label: '所有配置项' }]} />
          <Input
            placeholder="请输入关键字搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            defaultValue="standard"
            style={{ width: 120 }}
            options={[{ value: 'standard', label: '标准视图' }]}
          />
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={paginatedList}
          pagination={{
            total: totalCountMock,
            current: page,
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共${t}条`,
            onChange: (p, ps) => {
              setPage(p)
              if (ps) setPageSize(ps)
            },
          }}
        />
      </div>
      <AuditSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onConfirm={() => { message.success('审计设置已保存'); setSettingsOpen(false) }} />
    </div>
  )
}
