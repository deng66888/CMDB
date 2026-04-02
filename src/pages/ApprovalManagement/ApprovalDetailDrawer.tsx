import { useState } from 'react'
import { Drawer, Descriptions, Button, Table, Checkbox, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { compareResultMock, type CompareRow, type UnifiedApprovalRecord } from '@/mock/ci'
import styles from './ApprovalDetailDrawer.module.css'

interface ApprovalDetailDrawerProps {
  open: boolean
  record: UnifiedApprovalRecord | null
  onClose: () => void
  onApprove: (id: string, result: 'pass' | 'reject', remark?: string) => void
}

export default function ApprovalDetailDrawer({ open, record, onClose, onApprove }: ApprovalDetailDrawerProps) {
  const [compareRows, setCompareRows] = useState<CompareRow[]>(() => [...compareResultMock])
  const [remark, setRemark] = useState('')

  if (!record) return null

  const isDiscovery = record.sourceType === 'discovery'

  const toggleCheck = (key: string, checked: boolean) => {
    setCompareRows((prev) =>
      prev.map((r) => (r.key === key && !r.disabled ? { ...r, checked } : r))
    )
  }

  const discoveryColumns: ColumnsType<CompareRow> = [
    { title: '配置项', dataIndex: 'label', key: 'label', width: 140 },
    { title: 'CMDB', dataIndex: 'cmdb', key: 'cmdb', width: 120 },
    { title: '自动发现', dataIndex: 'discovery', key: 'discovery', width: 120 },
    {
      title: '采纳',
      key: 'action',
      width: 64,
      render: (_, row) =>
        row.disabled ? (
          <Checkbox disabled />
        ) : (
          <Checkbox
            checked={!!row.checked}
            onChange={(e) => toggleCheck(row.key, e.target.checked)}
          />
        ),
    },
  ]

  const handleBatchConfirm = () => {
    onApprove(record.id, 'pass')
    message.success('已批量确认采纳')
    onClose()
  }

  const handlePass = () => {
    onApprove(record.id, 'pass', remark)
    message.success('已通过')
    onClose()
  }

  const handleReject = () => {
    onApprove(record.id, 'reject', remark)
    message.success('已驳回')
    onClose()
  }

  return (
    <Drawer
      title={`审批详情 - ${record.name}`}
      placement="right"
      width={isDiscovery ? 620 : 520}
      onClose={onClose}
      open={open}
      destroyOnClose
      className={styles.drawer}
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>取消</Button>
          {isDiscovery ? (
            <Button type="primary" onClick={handleBatchConfirm}>批量确认采纳</Button>
          ) : (
            <Space>
              <Button danger onClick={handleReject}>驳回</Button>
              <Button type="primary" onClick={handlePass}>通过</Button>
            </Space>
          )}
        </div>
      }
    >
      <div className={styles.sourceTag}>
        <span className={record.sourceType === 'manual' ? styles.tagManual : styles.tagDiscovery}>
          {record.sourceType === 'manual' ? '人工申请' : '自动发现'}
        </span>
        {record.discoveryType && (
          <span className={styles.tagType}>{record.discoveryType}</span>
        )}
      </div>

      {isDiscovery ? (
        <>
          <h4 className={styles.sectionTitle}>差异对比</h4>
          <p className={styles.sectionDesc}>勾选需要采纳的发现结果，点击「批量确认采纳」将变更写入CMDB。</p>
          <Table
            rowKey="key"
            size="small"
            columns={discoveryColumns}
            dataSource={compareRows}
            pagination={false}
            scroll={{ y: 360 }}
          />
        </>
      ) : (
        <>
          <h4 className={styles.sectionTitle}>申请信息</h4>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="名称">{record.name}</Descriptions.Item>
            <Descriptions.Item label="分类">{record.category}</Descriptions.Item>
            <Descriptions.Item label="申请人">{record.applicant}</Descriptions.Item>
            <Descriptions.Item label="申请时间">{record.applyTime}</Descriptions.Item>
            <Descriptions.Item label="申请理由">{record.applyReason ?? '-'}</Descriptions.Item>
          </Descriptions>
          <div className={styles.remarkRow}>
            <label>审批意见（可选）</label>
            <textarea
              className={styles.remarkInput}
              placeholder="请输入审批意见"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
            />
          </div>
        </>
      )}
    </Drawer>
  )
}
