import { Drawer, Table, Button, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { versionListMock, type VersionRecord } from '@/mock/ci'
import type { CIRecord } from '@/mock/ci'

interface VersionDrawerProps {
  open: boolean
  onClose: () => void
  record: CIRecord | null
}

export default function VersionDrawer({ open, onClose, record }: VersionDrawerProps) {
  const columns: ColumnsType<VersionRecord> = [
    { title: '版本号', dataIndex: 'version', width: 100, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '操作人', dataIndex: 'operator', width: 100 },
    { title: '操作时间', dataIndex: 'operateTime', width: 180 },
    { title: '说明', dataIndex: 'remark' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Space>
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">回滚</Button>
        </Space>
      ),
    },
  ]

  return (
    <Drawer
      title={`版本管理 - ${record?.name ?? ''}`}
      placement="right"
      width={560}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={versionListMock}
        pagination={false}
      />
    </Drawer>
  )
}
