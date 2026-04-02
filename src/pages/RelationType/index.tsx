import { useState, useMemo } from 'react'
import { Button, Table, Space, Tooltip, Modal, Form, Input, message } from 'antd'
import { QuestionCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  relationTypeListMock,
  type RelationTypeRecord,
  type RelationTypeCategory,
} from '@/mock/relationType'
import styles from './index.module.css'

const CATEGORY_TABS: { key: RelationTypeCategory; label: string }[] = [
  { key: 'ci', label: '配置项' },
  { key: 'ci_user', label: '配置项/用户' },
  { key: 'ci_group', label: '配置项/组' },
]

export default function RelationTypePage() {
  const [category, setCategory] = useState<RelationTypeCategory>('ci')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [list, setList] = useState<RelationTypeRecord[]>(() => [...relationTypeListMock])

  const filteredList = useMemo(() => list.filter((r) => r.category === category), [list, category])
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

  const handleEdit = (record: RelationTypeRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      parentDesc: record.parentDesc,
      childDesc: record.childDesc,
    })
    setModalOpen(true)
  }

  const handleDelete = (record: RelationTypeRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除关系类型「${record.name}」吗？`,
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
      const payload = {
        ...values,
        category,
        creator: '管理员',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }
      if (editingId) {
        setList((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? { ...r, name: payload.name, parentDesc: payload.parentDesc, childDesc: payload.childDesc, updateTime: payload.updateTime }
              : r
          )
        )
        message.success('修改成功')
      } else {
        setList((prev) => [
          ...prev,
          {
            id: 'new-' + Date.now(),
            ...payload,
          } as RelationTypeRecord,
        ])
        message.success('新建成功')
      }
      setModalOpen(false)
      form.resetFields()
    }).catch(() => {})
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  const columns: ColumnsType<RelationTypeRecord> = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: '父级描述', dataIndex: 'parentDesc', key: 'parentDesc', ellipsis: true },
    { title: '子级描述', dataIndex: 'childDesc', key: 'childDesc', ellipsis: true },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
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
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <Tooltip title="关系类型用于定义配置项之间、配置项与用户/组之间的关联关系，如包含、托管在、负责人等，便于建模与拓扑展示。">
          <a href="#">关系类型有什么作用?</a>
        </Tooltip>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {CATEGORY_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={category === key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => { setCategory(key); setPage(1); setSelectedRowKeys([]) }}
            >
              {label}
            </button>
          ))}
        </div>
        <Space>
          <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>
            删除
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建
          </Button>
        </Space>
      </div>
      <div className={styles.tableWrap}>
        <Table<RelationTypeRecord>
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
            onChange: (p, ps) => {
              setPage(p)
              if (typeof ps === 'number') setPageSize(ps)
            },
          }}
        />
      </div>

      <Modal
        title={editingId ? '编辑关系类型' : '新建关系类型'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：包含、托管在" />
          </Form.Item>
          <Form.Item name="parentDesc" label="父级描述" rules={[{ required: true, message: '请输入父级描述' }]}>
            <Input placeholder="如：父级包含" />
          </Form.Item>
          <Form.Item name="childDesc" label="子级描述" rules={[{ required: true, message: '请输入子级描述' }]}>
            <Input placeholder="如：子级被包含" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
