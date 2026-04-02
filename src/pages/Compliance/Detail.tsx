import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Descriptions, Table, Modal, Button, Tag, Space, Switch, Popconfirm, Empty, message } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getComplianceDetail,
  complianceToggleEnabled,
  complianceDeleteRule,
  complianceRuleTypeOptions,
  type ComplianceResult,
  type ComplianceCheckHistoryItem,
  type ComplianceCheckFailItem,
  type ComplianceCheckedCIItem,
} from '@/mock/ci'
import EditRuleModal from './EditRuleModal'
import styles from './detail.module.css'

const scheduleLabel: Record<string, string> = {
  manual: '仅手动执行',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
}

const ruleTypeLabelMap = Object.fromEntries(complianceRuleTypeOptions.map((o) => [o.value, o.label]))

export default function ComplianceDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const [detail, setDetail] = useState(() => getComplianceDetail(id))
  const [editOpen, setEditOpen] = useState(false)
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ComplianceCheckHistoryItem | null>(null)

  useEffect(() => {
    setDetail(getComplianceDetail(id))
  }, [id])

  if (!id) {
    return (
      <div className={styles.wrap}>
        <Empty description="缺少规则 ID" />
        <Button type="primary" onClick={() => navigate('/config/compliance')}>返回列表</Button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className={styles.wrap}>
        <Empty description="规则不存在或已删除" />
        <Button type="primary" onClick={() => navigate('/config/compliance')}>返回列表</Button>
      </div>
    )
  }

  const refreshDetail = () => setDetail(getComplianceDetail(id))

  const handleToggleEnabled = () => {
    complianceToggleEnabled(detail.id)
    refreshDetail()
    message.success(detail.enabled ? '已暂停规则' : '已启用规则')
  }

  const handleDelete = () => {
    if (complianceDeleteRule(detail.id)) {
      message.success('已删除规则')
      navigate('/config/compliance')
    }
  }

  const runCheck = () => {
    message.success(`已对「${detail.policyName}」发起重新检测`)
    setTimeout(refreshDetail, 500)
  }

  const resultTag = (result: ComplianceResult) => {
    if (result === 'pass') return <Tag color="success">通过</Tag>
    if (result === 'fail') return <Tag color="error">不通过</Tag>
    return <Tag color="default">待检测</Tag>
  }

  const openHistoryDetail = (row: ComplianceCheckHistoryItem) => {
    setSelectedHistoryItem(row)
    setHistoryDetailOpen(true)
  }

  const failItemColumns: ColumnsType<ComplianceCheckFailItem> = [
    { title: '配置项名称', dataIndex: 'ciName', ellipsis: true },
    { title: '不通过原因', dataIndex: 'reason', ellipsis: true },
  ]

  const checkedCIColumns: ColumnsType<ComplianceCheckedCIItem> = [
    {
      title: '配置项名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string, row) => (
        <a onClick={() => navigate(`/config/ci-detail?id=${row.ciId}`)}>{name}</a>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 100 },
    {
      title: '检测结果',
      dataIndex: 'result',
      width: 90,
      render: (r: 'pass' | 'fail') => r === 'pass' ? <Tag color="success">通过</Tag> : <Tag color="error">不通过</Tag>,
    },
    { title: '不通过原因', dataIndex: 'reason', ellipsis: true },
  ]

  const historyColumns: ColumnsType<ComplianceCheckHistoryItem> = [
    { title: '检测时间', dataIndex: 'checkTime', width: 180 },
    {
      title: '结果',
      dataIndex: 'result',
      width: 90,
      render: (r: ComplianceResult) => resultTag(r),
    },
    { title: '检测总数', dataIndex: 'totalCount', width: 100 },
    { title: '通过', dataIndex: 'passCount', width: 80 },
    { title: '不通过', dataIndex: 'failCount', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => openHistoryDetail(row)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/config/compliance')}>
          返回列表
        </Button>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={runCheck}>重新检测</Button>
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑规则</Button>
          <Switch
            checked={detail.enabled}
            onChange={handleToggleEnabled}
            checkedChildren="已启用"
            unCheckedChildren="已暂停"
          />
          <Popconfirm
            title="确定删除该规则？"
            description="删除后不可恢复。"
            onConfirm={handleDelete}
            okText="删除"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>删除规则</Button>
          </Popconfirm>
        </Space>
      </div>

      <Card title="基本信息" className={styles.card}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="规则名称">{detail.policyName}</Descriptions.Item>
          <Descriptions.Item label="适用配置类">{detail.configClass}</Descriptions.Item>
          <Descriptions.Item label="规则状态">
            {detail.enabled ? <Tag color="success">已启用</Tag> : <Tag color="default">已暂停</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="规则类型">{ruleTypeLabelMap[detail.ruleType] ?? detail.ruleType}</Descriptions.Item>
          <Descriptions.Item label="执行周期">{scheduleLabel[detail.schedule] ?? detail.schedule}</Descriptions.Item>
          <Descriptions.Item label="上次检测时间">{detail.lastCheckTime}</Descriptions.Item>
          <Descriptions.Item label="创建人">{detail.creator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{detail.createTime}</Descriptions.Item>
          <Descriptions.Item label="检测结果" span={2}>
            {resultTag(detail.result)}
            {detail.totalCount != null && (
              <span style={{ marginLeft: 8 }}>
                共 {detail.totalCount} 项
                {detail.failCount != null && detail.failCount > 0 && (
                  <Tag color="error" style={{ marginLeft: 8 }}>{detail.failCount} 项不通过</Tag>
                )}
              </span>
            )}
          </Descriptions.Item>
          {detail.description && (
            <Descriptions.Item label="规则说明" span={2}>{detail.description}</Descriptions.Item>
          )}
          {detail.ruleType === 'custom' && detail.customExpression && (
            <Descriptions.Item label="自定义表达式" span={2}>
              <pre className={styles.expressionPre}>{detail.customExpression}</pre>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="检测历史" className={styles.card}>
        {detail.checkHistory.length === 0 ? (
          <Empty description="暂无检测记录" />
        ) : (
          <Table
            rowKey="id"
            size="small"
            columns={historyColumns}
            dataSource={detail.checkHistory}
            pagination={false}
          />
        )}
      </Card>

      <EditRuleModal
        open={editOpen}
        record={detail}
        onClose={() => setEditOpen(false)}
        onSuccess={refreshDetail}
      />

      <Modal
        title={`本次检测详情 · ${selectedHistoryItem?.checkTime ?? ''}`}
        open={historyDetailOpen}
        onCancel={() => { setHistoryDetailOpen(false); setSelectedHistoryItem(null) }}
        footer={[
          <Button key="close" onClick={() => { setHistoryDetailOpen(false); setSelectedHistoryItem(null) }}>
            关闭
          </Button>,
        ]}
        width={640}
        destroyOnClose
      >
        {selectedHistoryItem && (
          <div className={styles.historyDetailModal}>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="检测时间">{selectedHistoryItem.checkTime}</Descriptions.Item>
              <Descriptions.Item label="检测结果">{resultTag(selectedHistoryItem.result)}</Descriptions.Item>
              <Descriptions.Item label="检测总数">{selectedHistoryItem.totalCount} 项</Descriptions.Item>
              <Descriptions.Item label="通过">{selectedHistoryItem.passCount} 项</Descriptions.Item>
              <Descriptions.Item label="不通过">{selectedHistoryItem.failCount} 项</Descriptions.Item>
            </Descriptions>
            {selectedHistoryItem.checkedItems?.length ? (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>涉及配置项实例</div>
                <Table
                  rowKey="id"
                  size="small"
                  columns={checkedCIColumns}
                  dataSource={selectedHistoryItem.checkedItems}
                  pagination={selectedHistoryItem.checkedItems.length > 5 ? { pageSize: 5 } : false}
                />
              </>
            ) : selectedHistoryItem.result === 'fail' && selectedHistoryItem.failItems?.length ? (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>不通过项列表</div>
                <Table
                  rowKey="id"
                  size="small"
                  columns={failItemColumns}
                  dataSource={selectedHistoryItem.failItems}
                  pagination={selectedHistoryItem.failItems.length > 5 ? { pageSize: 5 } : false}
                />
              </>
            ) : selectedHistoryItem.result === 'pass' ? (
              <Empty description="本次检测全部通过，无异常项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Empty description="暂无本次检测配置项明细" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
