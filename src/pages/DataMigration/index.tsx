import { useState, useMemo } from 'react'
import { Button, Table, Space, Tooltip, Modal, Form, Input, Select, Tag, message } from 'antd'
import { QuestionCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { migrationTaskListMock, MIGRATION_ENV_OPTIONS, type MigrationTaskRecord, type MigrationStatus } from '@/mock/dataMigration'
import styles from './index.module.css'

const STATUS_MAP: Record<MigrationStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  running: { color: 'processing', text: '执行中' },
  success: { color: 'success', text: '成功' },
  failed: { color: 'error', text: '失败' },
}

export default function DataMigrationPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [list, setList] = useState<MigrationTaskRecord[]>(() => [...migrationTaskListMock])

  const filteredList = useMemo(() => {
    if (!keyword.trim()) return list
    const k = keyword.trim().toLowerCase()
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(k) ||
        r.sourceEnv.toLowerCase().includes(k) ||
        r.targetEnv.toLowerCase().includes(k)
    )
  }, [list, keyword])

  const total = filteredList.length
  const paginatedList = useMemo(() => filteredList.slice((page - 1) * pageSize, page * pageSize), [filteredList, page, pageSize])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: MigrationTaskRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      sourceEnv: record.sourceEnv,
      targetEnv: record.targetEnv,
    })
    setModalOpen(true)
  }

  const handleRun = (record: MigrationTaskRecord) => {
    if (record.status === 'running') {
      message.warning('任务正在执行中')
      return
    }
    message.loading({ content: '正在执行迁移...', key: 'mig' })
    setList((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, status: 'running' as const } : r
      )
    )
    setTimeout(() => {
      setList((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                status: 'success' as const,
                lastRunTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                lastRunResult: '成功，迁移完成',
              }
            : r
        )
      )
      message.success({ content: '迁移执行完成', key: 'mig' })
    }, 2000)
  }

  const handleDelete = (record: MigrationTaskRecord) => {
    if (record.status === 'running') {
      message.warning('执行中的任务不能删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除迁移任务「${record.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((r) => r.id !== record.id))
        message.success('已删除')
      },
    })
  }

  const handleBatchDelete = () => {
    const running = list.filter((r) => selectedRowKeys.includes(r.id) && r.status === 'running')
    if (running.length > 0) {
      message.warning('选中有执行中的任务，请先取消或等待完成')
      return
    }
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的项')
      return
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 项吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((r) => !selectedRowKeys.includes(r.id)))
        setSelectedRowKeys([])
        message.success('已删除')
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      if (editingId) {
        setList((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, ...values, updateTime: now } : r))
        )
        message.success('修改成功')
      } else {
        setList((prev) => [
          ...prev,
          {
            id: 'new-' + Date.now(),
            ...values,
            status: 'draft' as const,
            creator: '管理员',
            createTime: now,
            updateTime: now,
          } as MigrationTaskRecord,
        ])
        message.success('新建成功')
      }
      setModalOpen(false)
      form.resetFields()
    }).catch(() => {})
  }

  const rowSelection = { selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }

  const columns: ColumnsType<MigrationTaskRecord> = [
    { title: '任务名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '源环境', dataIndex: 'sourceEnv', key: 'sourceEnv', width: 110 },
    { title: '目标环境', dataIndex: 'targetEnv', key: 'targetEnv', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: MigrationStatus) => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text ?? v}</Tag>,
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    { title: '上次执行', dataIndex: 'lastRunTime', key: 'lastRunTime', width: 170, render: (v: string) => v || '-' },
    { title: '执行结果', dataIndex: 'lastRunResult', key: 'lastRunResult', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="执行">
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(record)} disabled={record.status === 'running'} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} disabled={record.status === 'running'} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <h2 className={styles.pageTitle}>数据迁移</h2>
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <Tooltip title="在开发/测试/生产等环境间迁移配置类结构、配置项数据、关系类型与参数等，支持草稿、执行、历史结果查看。执行前请确认源与目标环境连接正常。">
          <a href="#">数据迁移有什么作用?</a>
        </Tooltip>
      </div>
      <div className={styles.toolbar}>
        <Input
          placeholder="搜索任务名称或环境"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
        <Space>
          <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>删除</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建迁移任务</Button>
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table<MigrationTaskRecord>
          rowKey="id"
          size="small"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={paginatedList}
          pagination={{
            total,
            current: page,
            pageSize,
            showSizeChanger: true,
            showTotal: (t) => `共${t}条`,
            pageSizeOptions: ['10', '20', '50'],
            showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); if (typeof ps === 'number') setPageSize(ps) },
          }}
        />
      </div>

      <Modal title={editingId ? '编辑迁移任务' : '新建迁移任务'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleModalOk} okText="确定" cancelText="取消" destroyOnClose width={520}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="如：配置类结构迁移-测试到生产" />
          </Form.Item>
          <Form.Item name="sourceEnv" label="源环境" rules={[{ required: true, message: '请选择源环境' }]}>
            <Select placeholder="请选择" allowClear options={MIGRATION_ENV_OPTIONS.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="targetEnv" label="目标环境" rules={[{ required: true, message: '请选择目标环境' }]}>
            <Select placeholder="请选择" allowClear options={MIGRATION_ENV_OPTIONS.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
