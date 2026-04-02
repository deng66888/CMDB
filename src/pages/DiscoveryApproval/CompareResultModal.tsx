import { useState } from 'react'
import { Modal, Table, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { compareResultMock, type CompareRow } from '@/mock/ci'

interface CompareResultModalProps {
  open: boolean
  onClose: () => void
  onApprove: () => void
}

export default function CompareResultModal({ open, onClose, onApprove }: CompareResultModalProps) {
  const [rows, setRows] = useState<CompareRow[]>(() => [...compareResultMock])

  const toggleCheck = (key: string, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key && !r.disabled ? { ...r, checked } : r))
    )
  }

  const columns: ColumnsType<CompareRow> = [
    { title: '配置项', dataIndex: 'label', key: 'label', width: 160 },
    { title: 'CMDB', dataIndex: 'cmdb', key: 'cmdb', width: 140 },
    { title: '自动发现', dataIndex: 'discovery', key: 'discovery', width: 140 },
    {
      title: '',
      key: 'action',
      width: 64,
      render: (_, record) =>
        record.disabled ? (
          <Checkbox disabled />
        ) : (
          <Checkbox
            checked={!!record.checked}
            onChange={(e) => toggleCheck(record.key, e.target.checked)}
          />
        ),
    },
  ]

  return (
    <Modal
      title={
        <span>
          <span style={{ marginRight: 8 }}>对比结果审核</span>
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={onApprove}
      okText="审批"
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Table
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ y: 360 }}
      />
    </Modal>
  )
}
