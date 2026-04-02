import { useEffect, useMemo, useState, type Key } from 'react'
import { Modal, Input, Table, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'

export type ReferencePickerModalProps<T extends { id: string }> = {
  open: boolean
  title: string
  columns: ColumnsType<T>
  dataSource: T[]
  /** 参与关键字筛选的字段 */
  filterKeys: (keyof T)[]
  searchPlaceholder?: string
  rowKey?: string
  onCancel: () => void
  onConfirm: (row: T) => void
}

/**
 * 通用引用选择：搜索 + 单选表格 + 确定（双击行可快速确认）
 */
export function ReferencePickerModal<T extends { id: string }>({
  open,
  title,
  columns,
  dataSource,
  filterKeys,
  searchPlaceholder = '输入关键字筛选',
  rowKey = 'id',
  onCancel,
  onConfirm,
}: ReferencePickerModalProps<T>) {
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<T | null>(null)

  useEffect(() => {
    if (!open) {
      setKeyword('')
      setSelected(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    if (!k) return dataSource
    return dataSource.filter((row) =>
      filterKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(k)),
    )
  }, [dataSource, filterKeys, keyword])

  const handleOk = () => {
    if (selected) onConfirm(selected)
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      zIndex={1100}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" disabled={!selected} onClick={handleOk}>
            确定
          </Button>
        </Space>
      }
    >
      <Input.Search
        allowClear
        placeholder={searchPlaceholder}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Table<T>
        size="small"
        rowKey={rowKey}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 'max-content' }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selected ? [selected.id as Key] : [],
          onChange: (_keys, rows) => setSelected((rows[0] as T) ?? null),
        }}
        onRow={(record) => ({
          onClick: () => setSelected(record),
          onDoubleClick: () => onConfirm(record),
        })}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>提示：单击行选中，双击行可快速确定</div>
    </Modal>
  )
}
