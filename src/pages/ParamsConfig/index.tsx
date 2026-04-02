import { useState, useMemo } from 'react'
import { Button, Table, Space, Tooltip, Modal, Form, Input, message } from 'antd'
import { QuestionCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { paramsConfigListMock, type ParamRecord } from '@/mock/paramsConfig'
import styles from './index.module.css'

export default function ParamsConfigPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [list, setList] = useState<ParamRecord[]>(() => [...paramsConfigListMock])

  const filteredList = useMemo(() => {
    if (!keyword.trim()) return list
    const k = keyword.trim().toLowerCase()
    return list.filter((r) => r.name.toLowerCase().includes(k) || (r.description && r.description.toLowerCase().includes(k)))
  }, [list, keyword])

  const total = filteredList.length
  const paginatedList = useMemo(
    () => filteredList.slice((page - 1) * pageSize, page * pageSize),
    [filteredList, page, pageSize]
  )

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: ParamRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
    })
    setModalOpen(true)
  }

  const handleDelete = (record: ParamRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除参数「${record.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((r) => r.id !== record.id))
        message.success('已删除')
      },
    })
  }

  const handleBatchDelete = () => {
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
          prev.map((r) =>
            r.id === editingId
              ? { ...r, name: values.name, description: values.description || '', updateTime: now }
              : r
          )
        )
        message.success('修改成功')
      } else {
        setList((prev) => [
          ...prev,
          {
            id: 'new-' + Date.now(),
            name: values.name,
            description: values.description || '',
            creator: '管理员',
            createTime: now,
            updateTime: now,
          },
        ])
        message.success('新增成功')
      }
      setModalOpen(false)
      form.resetFields()
    }).catch(() => {})
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  const columns: ColumnsType<ParamRecord> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
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
      <h2 className={styles.pageTitle}>参数配置</h2>
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <Tooltip title="参数配置用于维护系统级选择列表、枚举等字典数据，如国家、状态、环境、类型等，供配置项属性、表单等引用。">
          <a href="#">参数配置有什么作用?</a>
        </Tooltip>
      </div>
      <div className={styles.toolbar}>
        <Input
          placeholder="请输入关键字"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
        <Space>
          <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>
            删除
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table<ParamRecord>
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
            onChange: (p, ps) => {
              setPage(p)
              if (typeof ps === 'number') setPageSize(ps)
            },
          }}
        />
      </div>

      <Modal
        title={editingId ? '编辑参数' : '新增参数'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：国家、状态、环境" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
