import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Table, Space, message } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { draftListMock, type DraftRecord } from '@/mock/ci'
import styles from './index.module.css'

export default function DraftManagement() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [data] = useState<DraftRecord[]>(draftListMock)

  const list = keyword ? data.filter((r) => r.name.includes(keyword) || r.configClass.includes(keyword)) : data

  const columns: ColumnsType<DraftRecord> = [
    { title: '名称', dataIndex: 'name', render: (name, record) => <a onClick={() => navigate(`/config/ci-detail?id=${record.id}&edit=1`)}>{name}</a> },
    { title: '配置类', dataIndex: 'configClass' },
    { title: '创建人', dataIndex: 'creator' },
    { title: '创建时间', dataIndex: 'createTime' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/config/ci-detail?id=${record.id}&edit=1`)}>编辑</Button>
          <Button type="link" size="small" icon={<SendOutlined />} onClick={() => message.success('已提交审批')}>提交</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => message.success('已删除草稿')}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Input
          placeholder="请输入关键字搜索"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </div>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={list}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共${t}条` }}
      />
    </div>
  )
}
