import { useState, useEffect } from 'react'
import { Modal, Steps, Form, Input, Select, InputNumber, Button, message } from 'antd'
import { discoveryTaskTypeLabels, credentialListMock } from '@/mock/discovery'

const STEPS = [
  { title: '选择任务类型' },
  { title: '配置目标' },
  { title: '设置调度' },
  { title: '高级选项' },
  { title: '确认' },
]

interface NewTaskWizardProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewTaskWizard({ open, onClose, onSuccess }: NewTaskWizardProps) {
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const taskType = Form.useWatch('type', form)

  useEffect(() => {
    if (open) {
      setCurrent(0)
      form.resetFields()
    }
  }, [open, form])

  const handleNext = () => {
    if (current < STEPS.length - 1) setCurrent((c) => c + 1)
    else {
      form.validateFields().then(() => {
        message.success('任务已创建')
        onSuccess()
        onClose()
      })
    }
  }

  const handlePrev = () => setCurrent((c) => Math.max(0, c - 1))

  return (
    <Modal
      title="新建发现任务"
      open={open}
      onCancel={onClose}
      width={640}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        current > 0 ? <Button key="prev" onClick={handlePrev}>上一步</Button> : null,
        <Button key="next" type="primary" onClick={handleNext}>
          {current === STEPS.length - 1 ? '创建' : '下一步'}
        </Button>,
      ].filter(Boolean)}
      destroyOnClose
    >
      <Steps current={current} size="small" style={{ marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <Steps.Step key={i} title={s.title} />
        ))}
      </Steps>

      <Form form={form} layout="vertical" initialValues={{ scheduleType: 'cron', schedule: '0 2 * * *', credentialId: undefined }}>
        {current === 0 && (
          <>
            <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
              <Select
                placeholder="选择发现方式"
                options={Object.entries(discoveryTaskTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
              />
            </Form.Item>
            <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
              <Input placeholder="如：核心机房 IP 段扫描" />
            </Form.Item>
          </>
        )}

        {current === 1 && (
          <>
            {!taskType ? (
              <div style={{ padding: '24px 0', color: '#666' }}>请返回上一步选择任务类型后，再配置目标。</div>
            ) : (
              <>
                <div style={{ marginBottom: 16, color: '#666' }}>当前类型：{discoveryTaskTypeLabels[taskType as keyof typeof discoveryTaskTypeLabels]}</div>
                {taskType === 'network' && (
                  <>
                    <Form.Item name={['targetConfig', 'ipRange']} label="IP 段" rules={[{ required: true, message: '请输入 IP 段' }]}>
                      <Input placeholder="如：10.0.0.0/24 或 192.168.1.0-192.168.1.255" />
                    </Form.Item>
                    <Form.Item name={['targetConfig', 'ports']} label="端口列表" tooltip="留空则使用默认端口">
                      <Input placeholder="如：22,80,443,3389" />
                    </Form.Item>
                  </>
                )}
                {taskType === 'cloud' && (
                  <>
                    <Form.Item name={['targetConfig', 'cloudAccountId']} label="云账号" rules={[{ required: true, message: '请选择云账号' }]}>
                      <Select placeholder="选择已添加的云账号" options={[{ value: 'ca1', label: '生产阿里云主账号' }, { value: 'ca2', label: 'AWS 海外区' }]} />
                    </Form.Item>
                    <Form.Item name={['targetConfig', 'regions']} label="Region" rules={[{ required: true, message: '请选择至少一个 Region' }]}>
                      <Select mode="multiple" placeholder="选择 Region" options={[{ value: 'cn-hangzhou', label: 'cn-hangzhou' }, { value: 'cn-shanghai', label: 'cn-shanghai' }, { value: 'us-east-1', label: 'us-east-1' }]} />
                    </Form.Item>
                  </>
                )}
                {taskType === 'agent' && (
                  <>
                    <Form.Item name={['targetConfig', 'agentGroup']} label="Agent 组">
                      <Select placeholder="选择 Agent 组" options={[{ value: 'default', label: '默认组' }, { value: 'prod', label: '生产组' }]} />
                    </Form.Item>
                  </>
                )}
                {taskType === 'script' && (
                  <>
                    <Form.Item name={['targetConfig', 'scriptId']} label="发现脚本" rules={[{ required: true, message: '请选择脚本' }]}>
                      <Select placeholder="选择脚本" options={[{ value: 'scr1', label: 'IDC 设备清单解析' }, { value: 'scr2', label: 'Windows 主机信息采集' }]} />
                    </Form.Item>
                    <Form.Item name={['targetConfig', 'path']} label="文件路径">
                      <Input placeholder="如：/data/idc.csv 或 C:\\data\\hosts.csv" />
                    </Form.Item>
                  </>
                )}
                {taskType === 'api' && (
                  <>
                    <Form.Item name={['targetConfig', 'apiEndpoint']} label="API 地址" rules={[{ required: true, message: '请输入 API 地址' }]}>
                      <Input placeholder="https://api.example.com/resources" />
                    </Form.Item>
                    <Form.Item name={['targetConfig', 'apiMethod']} label="请求方式">
                      <Select options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]} />
                    </Form.Item>
                  </>
                )}
              </>
            )}
          </>
        )}

        {current === 2 && (
          <>
            <Form.Item name="scheduleType" label="执行方式" rules={[{ required: true }]}>
              <Select options={[{ value: 'once', label: '一次性执行' }, { value: 'cron', label: '周期性执行（Cron）' }]} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev) => prev.scheduleType === 'cron'}>
              {() =>
                form.getFieldValue('scheduleType') === 'cron' && (
                  <>
                    <Form.Item name="schedule" label="Cron 表达式" rules={[{ required: true, message: '请输入 Cron 表达式' }]}>
                      <Input placeholder="如：0 2 * * * 表示每天 2:00，*/15 * * * * 表示每 15 分钟" />
                    </Form.Item>
                    <div style={{ fontSize: 12, color: '#666' }}>常用：0 2 * * * 每天 2:00；0 */6 * * * 每 6 小时；*/30 * * * * 每 30 分钟</div>
                  </>
                )
              }
            </Form.Item>
          </>
        )}

        {current === 3 && (
          <>
            <Form.Item name="credentialId" label="凭证" tooltip="网络扫描、脚本执行等可关联已有凭证">
              <Select
                allowClear
                placeholder="选择凭证（可选）"
                options={credentialListMock.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` }))}
              />
            </Form.Item>
            <Form.Item name="timeout" label="超时时间(秒)" tooltip="单次任务整体超时，10–3600">
              <InputNumber min={10} max={3600} placeholder="默认 300" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="scanRate" label="扫描速率限制" tooltip="网络扫描时每秒最多探测主机数，0 表示不限制">
              <InputNumber min={0} max={1000} placeholder="0 表示不限制" style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {current === 4 && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ marginBottom: 12 }}>请确认上述配置无误后点击「创建」。</p>
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, fontSize: 13 }}>
              <p style={{ margin: '4px 0' }}><strong>任务名称：</strong>{form.getFieldValue('name') || '-'}</p>
              <p style={{ margin: '4px 0' }}><strong>任务类型：</strong>{form.getFieldValue('type') ? discoveryTaskTypeLabels[form.getFieldValue('type') as keyof typeof discoveryTaskTypeLabels] : '-'}</p>
              <p style={{ margin: '4px 0' }}><strong>执行方式：</strong>{form.getFieldValue('scheduleType') === 'cron' ? `周期性（${form.getFieldValue('schedule') || '-'}）` : '一次性'}</p>
            </div>
            <p style={{ marginTop: 12, color: '#666' }}>任务创建后可随时在列表中启用、暂停或立即执行。</p>
          </div>
        )}
      </Form>
    </Modal>
  )
}
