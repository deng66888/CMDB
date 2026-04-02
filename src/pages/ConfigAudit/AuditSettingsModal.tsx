import { useState } from 'react'
import { Modal, Radio, DatePicker, TimePicker, Checkbox, Button, Form, message } from 'antd'
import dayjs from 'dayjs'

type AuditMethod = 'single' | 'daily' | 'weekly' | 'monthly'

interface AuditSettingsModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export default function AuditSettingsModal({ open, onClose, onConfirm }: AuditSettingsModalProps) {
  const [method, setMethod] = useState<AuditMethod>('weekly')
  const [weekDaysVal, setWeekDaysVal] = useState<string[]>(['周一', '周二'])
  const [monthDays, setMonthDays] = useState('1,11,17,19,31')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const handleOk = () => {
    if (!dateRange || !timeRange) {
      message.warning('请填写起止日期和审计时间')
      return
    }
    onConfirm()
  }

  return (
    <Modal
      title="审计设置"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="审计范围" required>
          <Button type="primary">选择配置项</Button>
        </Form.Item>
        <Form.Item label="审计方式" required>
          <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)}>
            <Radio value="single">单次</Radio>
            <Radio value="daily">每天</Radio>
            <Radio value="weekly">每周</Radio>
            <Radio value="monthly">每月</Radio>
          </Radio.Group>
        </Form.Item>
        {method === 'weekly' && (
          <Form.Item label="审计日" required>
            <Checkbox.Group
              value={weekDaysVal}
              onChange={(v) => setWeekDaysVal(v as string[])}
              options={weekDays.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>
        )}
        {method === 'monthly' && (
          <Form.Item label="指定天数" required>
            <input
              type="text"
              value={monthDays}
              onChange={(e) => setMonthDays(e.target.value)}
              placeholder="如 1,11,17,19,31"
              style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
            />
          </Form.Item>
        )}
        <Form.Item label="起止日期" required>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="审计时间" required>
          <TimePicker.RangePicker
            value={timeRange}
            onChange={(v) => setTimeRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
