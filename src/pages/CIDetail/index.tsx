import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Descriptions, Tabs, Table, Button, Tag, Empty, Space, Form, Input, InputNumber, message, Modal, Select, Radio } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import {
  serverDetailMock,
  getDetailById,
  relatedStorageMock,
  relatedFilesystemMock,
  relatedSoftwareMock,
  relatedNicMock,
  ciListMock,
} from '@/mock/ci'
import type { ServerDetail } from '@/mock/ci'
import {
  categoryToCIType,
  getRelationTypesByCIType,
  getRelationCount,
  defaultRelatedSelectedKeys,
} from '@/mock/relatedConfig'
import type { RelationGroupKey } from '@/mock/relatedConfig'
import { relationTypeOptions } from '@/mock/relationGraph'
import styles from './index.module.css'

const groupOrder: RelationGroupKey[] = ['硬件组成', '软件环境', '位置信息', '网络关系']

const currentCiId = 'ci-detail-1'

export default function CIDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditFromUrl = searchParams.get('edit') === '1'
  const [isEditing, setIsEditing] = useState(isEditFromUrl)
  const [detail, setDetail] = useState<ServerDetail>(serverDetailMock)
  const [form] = Form.useForm()
  const [addRelationForm] = Form.useForm()
  const [addRelationOpen, setAddRelationOpen] = useState(false)
  const [relatedConfigOpen, setRelatedConfigOpen] = useState(false)
  const ciType = categoryToCIType(detail.category)
  const [relatedTab, setRelatedTab] = useState<'storage' | 'filesystem' | 'software' | 'nic'>('storage')
  const [relatedSelectedKeys, setRelatedSelectedKeys] = useState<string[]>(() => defaultRelatedSelectedKeys)
  const [modalTargetKeys, setModalTargetKeys] = useState<string[]>([])
  const [modalLeftSelected, setModalLeftSelected] = useState<string[]>([])
  const [modalRightSelected, setModalRightSelected] = useState<string[]>([])

  const relationTypesAll = getRelationTypesByCIType(ciType)
  const modalAvailable = relationTypesAll.filter((m) => !modalTargetKeys.includes(m.key))
  const modalSelected = relationTypesAll.filter((m) => modalTargetKeys.includes(m.key))
  const groupBy = (list: typeof relationTypesAll) => {
    const map = new Map<RelationGroupKey, typeof list>()
    list.forEach((m) => {
      const arr = map.get(m.group) ?? []
      arr.push(m)
      map.set(m.group, arr)
    })
    return groupOrder.map((g) => ({ group: g, items: map.get(g) ?? [] })).filter((x) => x.items.length > 0)
  }
  const availableGrouped = groupBy(modalAvailable)
  const selectedGrouped = groupBy(modalSelected)

  const openRelatedConfigModal = () => {
    setModalTargetKeys([...relatedSelectedKeys])
    setModalLeftSelected([])
    setModalRightSelected([])
    setRelatedConfigOpen(true)
  }

  const moveToRight = () => {
    setModalTargetKeys((prev) => [...prev, ...modalLeftSelected])
    setModalLeftSelected([])
  }
  const moveToLeft = () => {
    setModalTargetKeys((prev) => prev.filter((k) => !modalRightSelected.includes(k)))
    setModalRightSelected([])
  }
  const handleModalOk = () => {
    setRelatedSelectedKeys([...modalTargetKeys])
    setRelatedConfigOpen(false)
    message.success('已保存')
  }

  const openAddRelation = () => {
    addRelationForm.resetFields()
    setAddRelationOpen(true)
  }
  const handleAddRelationOk = () => {
    addRelationForm.validateFields().then((values) => {
      const target = ciListMock.find((c) => c.id === values.targetId)
      const item = { name: target?.name ?? values.targetId, relation: values.relationType }
      if (values.direction === 'upstream') {
        setDetail((prev) => ({ ...prev, upstream: [...prev.upstream, item] }))
      } else {
        setDetail((prev) => ({ ...prev, downstream: [...prev.downstream, item] }))
      }
      addRelationForm.resetFields()
      setAddRelationOpen(false)
      message.success('关系已添加')
    })
  }
  const goRelationGraph = (openFilter?: boolean) => {
    const q = new URLSearchParams()
    const ciId = searchParams.get('id') ?? currentCiId
    q.set('id', ciId)
    q.set('name', detail.name)
    q.set('category', detail.category || '服务器')
    if (openFilter) q.set('filter', '1')
    navigate(`/config/ci-relation-graph?${q.toString()}`)
  }

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const d = getDetailById(id)
      if (d) setDetail(d)
      else setDetail(serverDetailMock)
    } else {
      setDetail(serverDetailMock)
    }
  }, [searchParams])

  useEffect(() => {
    if (isEditing) {
      form.setFieldsValue({
        name: detail.name,
        category: detail.category,
        assetId: detail.assetId,
        modelId: detail.modelId,
        manufacturer: detail.manufacturer,
        ...detail.config,
      })
    }
  }, [isEditing, detail, form])

  const configEntries = Object.entries(detail.config)
  const mid = Math.ceil(configEntries.length / 2)
  const leftConfig = configEntries.slice(0, mid)
  const rightConfig = configEntries.slice(mid)

  const handleSave = () => {
    form.validateFields().then((values) => {
      setDetail((prev) => ({
        ...prev,
        name: values.name ?? prev.name,
        category: values.category ?? prev.category,
        assetId: values.assetId ?? prev.assetId,
        modelId: values.modelId ?? prev.modelId,
        manufacturer: values.manufacturer ?? prev.manufacturer,
        config: { ...prev.config, ...values },
      }))
      setIsEditing(false)
      message.success('保存成功')
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    form.resetFields()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>服务器详情</h2>
        {!isEditing ? (
          <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            编辑
          </Button>
        ) : (
          <Space>
            <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>取消</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
          </Space>
        )}
      </div>

      {isEditing ? (
        <Card title="编辑基础信息" className={styles.card}>
          <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
            <Form.Item name="name" label="名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Input />
            </Form.Item>
            <Form.Item name="assetId" label="资产">
              <Input />
            </Form.Item>
            <Form.Item name="modelId" label="型号标识">
              <Input />
            </Form.Item>
            <Form.Item name="manufacturer" label="制造商">
              <Input />
            </Form.Item>
            <Form.Item name="操作系统" label="操作系统">
              <Input />
            </Form.Item>
            <Form.Item name="磁盘空间" label="磁盘空间(GB)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="内存" label="内存(MB)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="描述" label="描述">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <>
          <Card title="服务器详情" className={styles.card}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="名称">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="分类">{detail.category}</Descriptions.Item>
              <Descriptions.Item label="资产">{detail.assetId}</Descriptions.Item>
              <Descriptions.Item label="序列号">{detail.serialNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="型号标识">{detail.modelId}</Descriptions.Item>
              <Descriptions.Item label="制造商">{detail.manufacturer}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="配置信息" className={styles.card}>
            <div className={styles.configGrid}>
              <div className={styles.configCol}>
                {leftConfig.map(([k, v]) => (
                  <div key={k} className={styles.configRow}>
                    <span className={styles.configLabel}>{k}:</span>
                    <span>{v === '已安装' ? <Tag color="success">已安装</Tag> : v ?? '-'}</span>
                  </div>
                ))}
              </div>
              <div className={styles.configCol}>
                {rightConfig.map(([k, v]) => (
                  <div key={k} className={styles.configRow}>
                    <span className={styles.configLabel}>{k}:</span>
                    <span>{v === '已安装' ? <Tag color="success">已安装</Tag> : v ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {!isEditing && (
        <>
          <Card
            title="依赖关系"
            className={styles.card}
            extra={
              <Space>
                <a onClick={openAddRelation}>新增关系</a>
                <a onClick={() => goRelationGraph(false)}>预览关系图</a>
                <a onClick={() => goRelationGraph(true)}>过滤设置</a>
              </Space>
            }
          >
            <div className={styles.depGrid}>
              <div>
                <div className={styles.depTitle}>上游关系</div>
                {detail.upstream.length ? detail.upstream.map((item, i) => (
                  <div key={i} className={styles.depItem}>[{item.relation}] {item.name}</div>
                )) : <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </div>
              <div>
                <div className={styles.depTitle}>下游关系</div>
                {detail.downstream.length ? detail.downstream.map((item, i) => (
                  <div key={i} className={styles.depItem}>[{item.relation}] {item.name}</div>
                )) : <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </div>
            </div>
          </Card>
          <Card
            title="相关配置"
            className={styles.card}
            extra={<Button type="primary" size="small" onClick={openRelatedConfigModal}>添加</Button>}
          >
            <Tabs
              activeKey={relatedTab}
              onChange={(k) => setRelatedTab(k as typeof relatedTab)}
              items={[
                { key: 'storage', label: '存储设备', data: relatedStorageMock },
                { key: 'filesystem', label: '文件系统', data: relatedFilesystemMock },
                { key: 'software', label: '安装的软件', data: relatedSoftwareMock },
                { key: 'nic', label: '网卡', data: relatedNicMock },
              ].map((tab) => ({
                key: tab.key,
                label: tab.label,
                children: (
                  <Table
                    size="small"
                    columns={[
                      { title: '名称', dataIndex: 'name' },
                      { title: '存储类型', dataIndex: 'type' },
                      { title: '尺寸', dataIndex: 'size' },
                      { title: '创建人', dataIndex: 'creator' },
                      { title: '创建时间', dataIndex: 'createTime' },
                    ]}
                    dataSource={tab.data}
                    rowKey="id"
                    locale={{ emptyText: '暂无数据' }}
                    pagination={false}
                  />
                ),
              }))}
            />
          </Card>
        </>
      )}

      <Modal
        title="新增关系"
        open={addRelationOpen}
        onCancel={() => setAddRelationOpen(false)}
        onOk={handleAddRelationOk}
        footer={[
          <Button key="cancel" onClick={() => setAddRelationOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={handleAddRelationOk}>确定</Button>,
        ]}
      >
        <Form form={addRelationForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="relationType" label="关系类型" rules={[{ required: true, message: '请选择关系类型' }]}>
            <Select
              placeholder="请选择关系类型"
              options={relationTypeOptions}
              showSearch
              filterOption={(q, opt) => (opt?.label ?? '').toLowerCase().includes(q.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="direction" label="方向" initialValue="downstream" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="upstream">上游（当前 CI 依赖于目标）</Radio>
              <Radio value="downstream">下游（目标依赖于当前 CI）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="targetId" label="目标配置项" rules={[{ required: true, message: '请选择目标配置项' }]}>
            <Select
              placeholder="请选择或搜索目标配置项"
              showSearch
              filterOption={(q, opt) => (opt?.label ?? '').toLowerCase().includes(q.toLowerCase())}
              options={ciListMock
                .filter((c) => c.name !== detail.name)
                .map((c) => ({ value: c.id, label: `${c.name}（${c.category}）` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="相关配置"
        open={relatedConfigOpen}
        onCancel={() => setRelatedConfigOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setRelatedConfigOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={handleModalOk}>确定</Button>,
        ]}
      >
        <div className={styles.relatedModalLayout}>
          <div className={styles.relatedModalCol}>
            <div className={styles.relatedModalColTitle}>可用的</div>
            <div className={styles.relatedModalList}>
              {availableGrouped.map(({ group, items }) => (
                <div key={group} className={styles.relatedModalGroup}>
                  <div className={styles.relatedModalGroupTitle}>├─ {group} ({items.length})</div>
                  {items.map((m) => (
                    <label key={m.key} className={styles.relatedModalItem}>
                      <input
                        type="checkbox"
                        checked={modalLeftSelected.includes(m.key)}
                        onChange={(e) => {
                          if (e.target.checked) setModalLeftSelected((prev) => [...prev, m.key])
                          else setModalLeftSelected((prev) => prev.filter((k) => k !== m.key))
                        }}
                      />
                      <span>【{m.displayName}】(关联 {getRelationCount(m.key)} 个)</span>
                    </label>
                  ))}
                </div>
              ))}
              {availableGrouped.length === 0 && <div className={styles.relatedModalEmpty}>暂无可用项</div>}
            </div>
          </div>
          <div className={styles.relatedModalActions}>
            <Button type="primary" size="small" onClick={moveToRight} disabled={modalLeftSelected.length === 0}>
              &gt;
            </Button>
            <Button type="primary" size="small" onClick={moveToLeft} disabled={modalRightSelected.length === 0}>
              &lt;
            </Button>
          </div>
          <div className={styles.relatedModalCol}>
            <div className={styles.relatedModalColTitle}>已选</div>
            <div className={styles.relatedModalList}>
              {selectedGrouped.map(({ group, items }) => (
                <div key={group} className={styles.relatedModalGroup}>
                  <div className={styles.relatedModalGroupTitle}>├─ {group} ({items.length})</div>
                  {items.map((m) => (
                    <label key={m.key} className={styles.relatedModalItem}>
                      <input
                        type="checkbox"
                        checked={modalRightSelected.includes(m.key)}
                        onChange={(e) => {
                          if (e.target.checked) setModalRightSelected((prev) => [...prev, m.key])
                          else setModalRightSelected((prev) => prev.filter((k) => k !== m.key))
                        }}
                      />
                      <span>【{m.displayName}】(关联 {getRelationCount(m.key)} 个)</span>
                    </label>
                  ))}
                </div>
              ))}
              {selectedGrouped.length === 0 && <div className={styles.relatedModalEmpty}>暂无已选项</div>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
