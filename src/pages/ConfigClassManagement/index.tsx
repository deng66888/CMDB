import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Select, Table, Space, Checkbox, Form, Card, message, Tooltip, Modal, Popover } from 'antd'
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined, StarOutlined, StarFilled, EyeOutlined, DownOutlined, RightOutlined, ApartmentOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ciListMock, totalCountMock, type CIRecord } from '@/mock/ci'
import {
  configClassBasicInfoMock,
  configClassAttributesMock,
  configClassInheritedAttributesMock,
  configClassFieldTypes,
  configClassTreeMock,
  getConfigClassViewData,
  type ConfigClassBasicInfo,
  type ConfigClassAttribute,
  type ConfigClassTreeNode,
  type ConfigClassDependencyItem,
  type RecognitionRuleRow,
  type ConfigClassRecognitionRule,
} from '@/mock/configClass'
import AddRecognitionRuleModal from './AddRecognitionRuleModal'
import FormDesignCanvas from '../ConfigClassNew/FormDesignCanvas'
import { FieldTypeDisplay } from '../ConfigClassNew/fieldTypeIcons'
import { DependencyRelationDiagram, ConfigClassIconDisplay } from '../ConfigClassNew'
import type { FormLayoutItem } from '../ConfigClassNew/types'
import { FORM_TEMPLATES, TEMPLATE_FIELD_LABELS } from '../ConfigClassNew/types'
import styles from './index.module.css'

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const TAB_KEYS = ['basic', 'attributes', 'rules', 'dependency', 'automation', 'list'] as const
const TAB_LABELS: Record<(typeof TAB_KEYS)[number], string> = {
  basic: '基础信息',
  attributes: '属性',
  rules: '识别规则',
  dependency: '依赖关系',
  automation: '关联自动化',
  list: '配置项列表',
}

function TreeNodeRow({
  node,
  expanded,
  onToggleExpand,
  onView,
  onAddChild,
  favoriteIds,
  onToggleFavorite,
  setTreeExpanded,
  treeExpanded,
  depth = 0,
}: {
  node: ConfigClassTreeNode
  expanded: boolean
  onToggleExpand: () => void
  onView: (id: string) => void
  onAddChild: (id: string) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
  setTreeExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  treeExpanded: Record<string, boolean>
  depth?: number
}) {
  const hasChildren = node.children && node.children.length > 0
  const [hover, setHover] = useState(false)
  const isFavorited = favoriteIds.has(node.id)
  return (
    <div className={styles.panelTreeNode} style={{ marginBottom: 0 }}>
      <div
        className={styles.panelClassItem}
        style={{ paddingLeft: 4 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onView(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.panelTreeExpand}
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          >
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </button>
        ) : (
          <span className={styles.panelTreeExpandPlaceholder} />
        )}
        <span className={styles.panelTreeNodeTitle}>{node.name}</span>
        {hover && (
          <span className={styles.treeNodeActions} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={isFavorited ? '取消收藏' : '收藏'}>
              <span onClick={() => onToggleFavorite(node.id)}>
                {isFavorited ? <StarFilled className={styles.starFilled} /> : <StarOutlined />}
              </span>
            </Tooltip>
            <Tooltip title="添加子类"><span onClick={(e) => { e.stopPropagation(); onAddChild(node.id) }}><PlusOutlined /></span></Tooltip>
            <Tooltip title="查看"><span onClick={(e) => { e.stopPropagation(); onView(node.id) }}><EyeOutlined /></span></Tooltip>
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div className={styles.panelTreeNodeList} style={{ marginLeft: 12 }}>
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              expanded={!!treeExpanded[child.id]}
              onToggleExpand={() => setTreeExpanded((p) => ({ ...p, [child.id]: !p[child.id] }))}
              onView={onView}
              onAddChild={onAddChild}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              setTreeExpanded={setTreeExpanded}
              treeExpanded={treeExpanded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreePopoverNode({
  node,
  currentId,
  onSelect,
  expandedKeys,
  onToggleExpand,
  depth = 0,
}: {
  node: ConfigClassTreeNode
  currentId: string | null
  onSelect: (id: string) => void
  expandedKeys: Set<string>
  onToggleExpand: (key: string) => void
  depth?: number
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedKeys.has(node.id)
  const isCurrent = node.id === currentId
  return (
    <div className={styles.treePopoverItem} style={{ marginLeft: depth > 0 ? 12 : 0 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <span
            className={styles.panelTreeExpand}
            style={{ width: 18, cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id) }}
            role="button"
          >
            {isExpanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        ) : (
          <span style={{ width: 18, display: 'inline-block' }} />
        )}
        <div
          className={isCurrent ? styles.treePopoverItemActive : ''}
          style={{ flex: 1, padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </div>
      </div>
      {hasChildren && isExpanded && node.children?.map((c) => (
        <TreePopoverNode
          key={c.id}
          node={c}
          currentId={currentId}
          onSelect={onSelect}
          expandedKeys={expandedKeys}
          onToggleExpand={onToggleExpand}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

function flattenTree(nodes: ConfigClassTreeNode[], out: ConfigClassTreeNode[] = []): ConfigClassTreeNode[] {
  nodes.forEach((n) => {
    out.push(n)
    if (n.children?.length) flattenTree(n.children, out)
  })
  return out
}

/** 按关键词过滤树：保留名称匹配的节点或含匹配子节点的父节点 */
function filterConfigClassTree(nodes: ConfigClassTreeNode[], keyword: string): ConfigClassTreeNode[] {
  if (!keyword.trim()) return nodes
  const q = keyword.trim().toLowerCase()
  return nodes
    .map((node) => {
      const matchSelf = node.name.toLowerCase().includes(q)
      const filteredChildren = node.children ? filterConfigClassTree(node.children, keyword) : undefined
      const matchChild = filteredChildren && filteredChildren.length > 0
      if (matchSelf) return node
      if (matchChild) return { ...node, children: filteredChildren }
      return null
    })
    .filter((n): n is ConfigClassTreeNode => n != null)
}

export default function ConfigClassManagement() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewId = searchParams.get('view')
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({})
  const [listTab, setListTab] = useState<'class' | 'favorite'>('class')
  const [treeKeyword, setTreeKeyword] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [rootExpand, setRootExpand] = useState(true)
  const [activeTab, setActiveTab] = useState<(typeof TAB_KEYS)[number]>('basic')
  const [attrSubTab, setAttrSubTab] = useState<'props' | 'form'>('form')
  /** 属性来源：继承的（父类 cmdb_ci）/ 添加的（当前类自定义）/ 所有 */
  const [attrSourceTab, setAttrSourceTab] = useState<'inherited' | 'added' | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [basicForm] = Form.useForm()
  const [basicInfo, setBasicInfo] = useState<ConfigClassBasicInfo>(configClassBasicInfoMock)
  const [attributes, setAttributes] = useState<ConfigClassAttribute[]>(() => [...configClassAttributesMock])
  const [, setRecognitionRules] = useState<ConfigClassRecognitionRule[]>([])
  const [uniqueCodePrefix, setUniqueCodePrefix] = useState('')
  const [uniqueCodeFields, setUniqueCodeFields] = useState<string[]>([])
  const [viewRecognitionRuleRows, setViewRecognitionRuleRows] = useState<RecognitionRuleRow[]>([])
  const [viewDependencyUpstream, setViewDependencyUpstream] = useState<ConfigClassDependencyItem[]>([])
  const [viewDependencyDownstream, setViewDependencyDownstream] = useState<ConfigClassDependencyItem[]>([])
  const [popoverExpandedKeys, setPopoverExpandedKeys] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!viewId) return
    const data = getConfigClassViewData(viewId)
    setBasicInfo(data.basicInfo)
    setUniqueCodePrefix(data.uniqueCodePrefix)
    setUniqueCodeFields(data.uniqueCodeFields)
    setAttributes(data.attributes)
    setViewRecognitionRuleRows(data.recognitionRuleRows)
    setViewDependencyUpstream(data.dependencyUpstream)
    setViewDependencyDownstream(data.dependencyDownstream)
    basicForm.setFieldsValue(data.basicInfo)
  }, [viewId, basicForm])
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false)
  const [formProps, setFormProps] = useState<{
    labelAlign: 'left' | 'right' | 'top'
    labelWidth: number
    formSize: string
    labelSuffix: string
    emptyText: string
    layoutColumns: 1 | 2 | 3
  }>({
    labelAlign: 'left',
    labelWidth: 80,
    formSize: 'small',
    labelSuffix: '：',
    emptyText: '暂无数据',
    layoutColumns: 1,
  })
  const [formSidebarTab, setFormSidebarTab] = useState<'fields' | 'fieldTypes' | 'formProps'>('fields')
  const [formLayoutItems, setFormLayoutItems] = useState<FormLayoutItem[]>([])
  const [formTemplateId, setFormTemplateId] = useState<string>('blank')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const allAttributesForForm = [...configClassInheritedAttributesMock, ...attributes]

  const handleDragStartField = useCallback((attr: ConfigClassAttribute) => (e: React.DragEvent) => {
    const payload = JSON.stringify({
      type: 'field',
      fieldName: attr.fieldName,
      fieldType: attr.type,
      technicalName: attr.technicalName ?? attr.fieldName,
      required: attr.required,
    })
    e.dataTransfer.setData('application/json', payload)
    e.dataTransfer.setData('text/plain', payload)
    e.dataTransfer.effectAllowed = 'copy'
    try {
      const img = new Image()
      img.src = transparentPixel
      e.dataTransfer.setDragImage(img, 0, 0)
    } catch {
      // ignore
    }
  }, [])
  const handleDragStartFieldType = useCallback((key: string, label: string) => (e: React.DragEvent) => {
    const payload = JSON.stringify({ type: 'fieldType', key, label })
    e.dataTransfer.setData('application/json', payload)
    e.dataTransfer.setData('text/plain', payload)
    e.dataTransfer.effectAllowed = 'copy'
    try {
      const img = new Image()
      img.src = transparentPixel
      e.dataTransfer.setDragImage(img, 0, 0)
    } catch {
      // ignore
    }
  }, [])

  const applyFormTemplate = useCallback(
    (templateId: string) => {
      setFormTemplateId(templateId)
      const t = FORM_TEMPLATES.find((x) => x.id === templateId)
      if (!t || t.groups.length === 0) {
        setFormLayoutItems([])
        return
      }
      const next: FormLayoutItem[] = []
      t.groups.forEach((gr) => {
        const requiredSet = new Set(gr.required ?? [])
        gr.fieldTechnicalNames.forEach((techName) => {
          const attr = allAttributesForForm.find((a) => (a.technicalName || a.fieldName) === techName)
          const id = `fd-${Date.now()}-${Math.random().toString(36).slice(2)}`
          if (attr) {
            next.push({
              id,
              label: attr.fieldName,
              type: attr.type,
              group: gr.groupKey,
              technicalName: attr.technicalName ?? attr.fieldName,
              required: attr.required || requiredSet.has(techName),
              readOnly: gr.groupKey === 'audit',
              autoGenerated: (attr.technicalName ?? techName) === 'sys_id',
            })
          } else {
            next.push({
              id,
              label: TEMPLATE_FIELD_LABELS[techName] || techName,
              type: 'string',
              group: gr.groupKey,
              technicalName: techName,
              required: requiredSet.has(techName),
              readOnly: gr.groupKey === 'audit',
              autoGenerated: techName === 'sys_id',
            })
          }
        })
      })
      setFormLayoutItems(next)
      if (templateId !== 'blank') message.success(`已应用「${t.name}」`)
    },
    [allAttributesForForm]
  )

  const list = keyword ? ciListMock.filter((r) => r.name.includes(keyword)) : ciListMock
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize)

  const handleSaveAttributes = () => {
    message.success('属性已保存')
  }

  const inheritedList = configClassInheritedAttributesMock
  const attributesDisplay =
    attrSourceTab === 'inherited' ? inheritedList : attrSourceTab === 'added' ? attributes : [...inheritedList, ...attributes]

  const isInheritedReadonly = attrSourceTab === 'inherited'
  const attrColumns: ColumnsType<ConfigClassAttribute> = [
    { title: '', dataIndex: 'id', width: 44, align: 'center', render: (_: unknown, record: ConfigClassAttribute) => (record.source === 'added' ? <input type="checkbox" /> : null) },
    { title: '字段名', dataIndex: 'fieldName', minWidth: 120, ellipsis: true },
    { title: '类型', dataIndex: 'type', minWidth: 90 },
    { title: '引用', dataIndex: 'reference', minWidth: 120, ellipsis: true },
    { title: '最大长度', dataIndex: 'maxLength', minWidth: 88, render: (v: number | null) => v ?? '-' },
    { title: '默认值', dataIndex: 'defaultValue', minWidth: 90, ellipsis: true },
    { title: '选填', dataIndex: 'optional', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled={isInheritedReadonly} /> },
    { title: '必填', dataIndex: 'required', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled={isInheritedReadonly} /> },
    { title: '隐藏', dataIndex: 'hidden', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled={isInheritedReadonly} /> },
    { title: '说明', dataIndex: 'description', minWidth: 200, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: ConfigClassAttribute) =>
        record.source === 'added' ? (
          <Space>
            <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} /></Tooltip>
            <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => setAttributes((prev) => prev.filter((x) => x.id !== record.id))} /></Tooltip>
          </Space>
        ) : (
          <Tooltip title="继承自基类 cmdb_ci，不可编辑"><span style={{ color: '#999', fontSize: 12 }}>继承</span></Tooltip>
        ),
    },
  ]

  const ciColumns: ColumnsType<CIRecord> = [
    { title: '', dataIndex: 'id', width: 40, render: () => <input type="checkbox" /> },
    { title: '名称', dataIndex: 'name', render: (name, r) => <a onClick={() => navigate(`/config/ci-detail?id=${r.id}`)}>{name}</a> },
    { title: '分类', dataIndex: 'category' },
    { title: '制造商', dataIndex: 'vendor' },
    { title: '创建人', dataIndex: 'creator' },
    { title: '创建时间', dataIndex: 'createTime' },
    { title: '状态', dataIndex: 'status' },
  ]

  const handleDeleteConfigClass = () => {
    if (!viewId) return
    const data = getConfigClassViewData(viewId)
    const hasData = data.dependencyCount > 0 || data.configItemCount > 0
    if (!hasData) {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除当前配置类吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          setSearchParams({})
          message.success('已删除')
        },
      })
    } else {
      Modal.warning({
        title: '无法删除',
        content: (
          <div>
            <p>请先解除或删除以下数据后才可删除当前配置类：</p>
            {data.dependencyCount > 0 && <p style={{ marginTop: 8 }}>· 依赖关系（{data.dependencyCount} 条）</p>}
            {data.configItemCount > 0 && <p style={{ marginTop: 4 }}>· 配置项实例（{data.configItemCount} 个）</p>}
          </div>
        ),
        okText: '知道了',
      })
    }
  }

  const totalConfigClassCount = flattenTree(configClassTreeMock).length
  const favoriteList = flattenTree(configClassTreeMock).filter((n) => favoriteIds.has(n.id))
  const filteredTree = useMemo(() => filterConfigClassTree(configClassTreeMock, treeKeyword), [treeKeyword])
  const filteredFavoriteList = useMemo(
    () => (treeKeyword.trim() ? favoriteList.filter((n) => n.name.toLowerCase().includes(treeKeyword.trim().toLowerCase())) : favoriteList),
    [favoriteList, treeKeyword]
  )

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!viewId) {
    return (
      <div className={styles.wrap}>
        <h3 className={styles.sectionTitle}>配置类</h3>
        <div className={styles.main}>
          <div className={styles.treePanel}>
            <Input
              placeholder="搜索配置类"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={treeKeyword}
              onChange={(e) => setTreeKeyword(e.target.value)}
              allowClear
              style={{ marginBottom: 8 }}
            />
            <div className={styles.panelTabs}>
              <button type="button" className={listTab === 'class' ? styles.panelTabActive : styles.panelTab} onClick={() => setListTab('class')}>配置类</button>
              <button type="button" className={listTab === 'favorite' ? styles.panelTabActive : styles.panelTab} onClick={() => setListTab('favorite')}>收藏</button>
            </div>
            {listTab === 'class' && (
              <div className={styles.panelSection}>
                <button type="button" className={styles.panelSectionHead} onClick={() => setRootExpand((e) => !e)}>
                  <span>配置类（共{totalConfigClassCount}个）</span>
                  {rootExpand ? <DownOutlined /> : <RightOutlined />}
                </button>
                {rootExpand && (
                  <div className={styles.panelTreeNodeList} style={{ marginLeft: 0, marginTop: 4 }}>
                    {filteredTree.map((node) => (
                      <TreeNodeRow
                        key={node.id}
                        node={node}
                        expanded={!!treeExpanded[node.id]}
                        onToggleExpand={() => setTreeExpanded((p) => ({ ...p, [node.id]: !p[node.id] }))}
                        onView={(id) => setSearchParams({ view: id })}
                        onAddChild={(id) => navigate(`/config/backend-config-class/new?parent=${id}`)}
                        favoriteIds={favoriteIds}
                        onToggleFavorite={toggleFavorite}
                        setTreeExpanded={setTreeExpanded}
                        treeExpanded={treeExpanded}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {listTab === 'favorite' && (
              <div className={styles.panelSection}>
                <div className={styles.panelSectionHeadStatic}>收藏</div>
                <div className={styles.panelAppList}>
                  {filteredFavoriteList.length === 0 ? (
                    <div className={styles.panelEmpty}>{favoriteList.length === 0 ? '暂无收藏' : '无匹配收藏'}</div>
                  ) : (
                    filteredFavoriteList.map((n) => (
                      <div key={n.id} className={styles.panelAppItem}>
                        <span className={styles.panelAppName} onClick={() => setSearchParams({ view: n.id })}>{n.name}</span>
                        <span className={styles.panelAppActions}>
                          <Tooltip title="取消收藏">
                            <span className={styles.panelStarBtn} onClick={() => toggleFavorite(n.id)}><StarFilled className={styles.starFilled} /></span>
                          </Tooltip>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={styles.rightEmpty}>
            <div className={styles.rightEmptyInner}>
              <Button type="primary" size="large" className={styles.newConfigClassBtn} icon={<PlusOutlined />} onClick={() => navigate('/config/backend-config-class/new')}>
                新建配置类
              </Button>
              <div className={styles.configClassIntro}>
                <h4>配置类说明</h4>
                <p>配置类用于对配置项进行分类建模，定义某类配置项的基础信息、属性、识别规则、依赖关系及关联自动化等。创建配置类后，可在该配置类下创建配置项实例。</p>
                <p>左侧树展示全部配置类层级，点击配置类可查看详情；支持添加子类、收藏、展开/折叠子节点。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const viewName = (() => {
    const flat = flattenTree(configClassTreeMock)
    return flat.find((n) => n.id === viewId)?.name ?? viewId
  })()

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Space wrap align="center">
          <Button type="link" onClick={() => setSearchParams({})} style={{ paddingLeft: 0 }}>返回列表</Button>
          <span className={styles.viewTitle}>{viewName}</span>
          <Popover
            trigger="click"
            placement="bottomLeft"
            content={
              <div className={styles.treePopover}>
                {configClassTreeMock.map((n) => (
                  <TreePopoverNode
                    key={n.id}
                    node={n}
                    currentId={viewId}
                    onSelect={(id) => setSearchParams({ view: id })}
                    expandedKeys={popoverExpandedKeys}
                    onToggleExpand={(key) => setPopoverExpandedKeys((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next })}
                  />
                ))}
              </div>
            }
          >
            <Button icon={<ApartmentOutlined />}>配置类</Button>
          </Popover>
          <Button icon={<PlusOutlined />} onClick={() => navigate(`/config/backend-config-class/new?parent=${viewId}`)}>添加子类</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteConfigClass}>删除</Button>
        </Space>
      </div>
      <div className={styles.main}>
        <div className={styles.leftPanel}>
          {TAB_KEYS.map((key) => (
            <div
              key={key}
              className={activeTab === key ? styles.sectionItemActive : styles.sectionItem}
              onClick={() => setActiveTab(key)}
            >
              {TAB_LABELS[key]}
            </div>
          ))}
        </div>
        <div className={styles.rightPanel}>
          {activeTab === 'basic' && (
            <Card size="small" className={styles.contentCard}>
              <Form form={basicForm} layout="vertical" initialValues={basicInfo} onValuesChange={() => {}}>
                <Form.Item name="className" label="类名称" rules={[{ required: true }]}>
                  <Input placeholder="如：应用" disabled />
                </Form.Item>
                <Form.Item name="description" label="描述">
                  <Input.TextArea rows={3} maxLength={1000} showCount placeholder="最多1000个字符" disabled />
                </Form.Item>
                <Form.Item name="classCode" label="类编码" rules={[{ required: true }]}>
                  <Input placeholder="如：配置管理" disabled />
                </Form.Item>
                <Form.Item name="icon" label="图标">
                  <ConfigClassIconDisplay value={basicInfo.icon} />
                </Form.Item>
                <div style={{ marginTop: 24, marginBottom: 16 }}>
                  <div className={styles.sectionHead}>唯一编码配置</div>
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>生成 CI 的自动编号</p>
                  <div style={{ maxWidth: 480 }}>
                    <Form.Item label="前缀" style={{ marginBottom: 12 }}>
                      <Input value={uniqueCodePrefix} disabled style={{ maxWidth: 320 }} />
                    </Form.Item>
                    <Form.Item label="属性" style={{ marginBottom: 0 }}>
                      <Select
                        mode="multiple"
                        placeholder="参与唯一编码的属性"
                        value={uniqueCodeFields}
                        style={{ maxWidth: 320 }}
                        disabled
                        options={allAttributesForForm.map((a) => ({ value: a.technicalName || a.fieldName, label: a.fieldName }))}
                      />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </Card>
          )}

          {activeTab === 'attributes' && (
            <div className={styles.attrLayout}>
              <div className={styles.attrMain}>
                {/* 属性 / 表单：同级别主 Tab */}
                <Space style={{ marginBottom: 16 }} className={styles.attrFormTabs}>
                  <Button type={attrSubTab === 'props' ? 'primary' : 'default'} onClick={() => setAttrSubTab('props')}>属性</Button>
                  <Button type={attrSubTab === 'form' ? 'primary' : 'default'} onClick={() => setAttrSubTab('form')}>表单</Button>
                </Space>

                {attrSubTab === 'props' && (
                  <>
                    {/* 继承的 / 添加的 / 所有：仅属性的查看筛选 */}
                    <div style={{ marginBottom: 12 }}>
                      <span className={styles.attrFilterLabel}>查看：</span>
                      <Space>
                        <Button type={attrSourceTab === 'inherited' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('inherited')}>继承的</Button>
                        <Button type={attrSourceTab === 'added' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('added')}>添加的</Button>
                        <Button type={attrSourceTab === 'all' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('all')}>所有</Button>
                      </Space>
                    </div>
                    <Space style={{ marginBottom: 12 }}>
                      <Button type="primary" size="small" icon={<PlusOutlined />} disabled={attrSourceTab === 'inherited'} onClick={() => setAttributes((prev) => [...prev, { id: 'a' + Date.now(), fieldName: '新属性', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: true, required: false, hidden: false, source: 'added' }])}>新建</Button>
                      <Button danger size="small" icon={<DeleteOutlined />} disabled={attrSourceTab === 'inherited'}>删除</Button>
                    </Space>
                    <Table
                      rowKey="id"
                      size="small"
                      columns={attrColumns}
                      dataSource={attributesDisplay}
                      scroll={{ x: 'max-content' }}
                      pagination={{ total: attributesDisplay.length, pageSize: 10, showTotal: (t) => `共${t}条` }}
                    />
                    <Button type="primary" style={{ marginTop: 12 }} onClick={handleSaveAttributes}>保存</Button>
                  </>
                )}

                {attrSubTab === 'form' && (
                  <div className={styles.formLayoutArea}>
                    <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: '#262626' }}>系统/行业模板</div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Select
                          value={formTemplateId}
                          onChange={applyFormTemplate}
                          options={FORM_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                          style={{ width: 200 }}
                          placeholder="选择模板"
                        />
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {FORM_TEMPLATES.find((x) => x.id === formTemplateId)?.description}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>
                        选择模板可快速填充四个分组；或从右侧拖拽「字段」「字段类型」到分组，左侧标签、右侧为对应控件。
                      </p>
                    </div>
                    <FormDesignCanvas items={formLayoutItems} onItemsChange={setFormLayoutItems} onSave={() => { message.success('表单布局已保存'); handleSaveAttributes(); }} formProps={formProps} />
                  </div>
                )}
              </div>
              {/* 右侧「字段 / 字段类型 / 表单属性」仅在选择「表单」Tab 时显示 */}
              {attrSubTab === 'form' && (
                <div className={styles.attrSidebar}>
                  <div className={styles.sidebarTabs}>
                    <span className={formSidebarTab === 'fields' ? styles.sidebarTabActive : ''} onClick={() => setFormSidebarTab('fields')} style={{ cursor: 'pointer' }}>字段</span>
                    <span className={formSidebarTab === 'fieldTypes' ? styles.sidebarTabActive : ''} onClick={() => setFormSidebarTab('fieldTypes')} style={{ cursor: 'pointer' }}>字段类型</span>
                    <span className={formSidebarTab === 'formProps' ? styles.sidebarTabActive : ''} onClick={() => setFormSidebarTab('formProps')} style={{ cursor: 'pointer' }}>表单属性</span>
                  </div>
                  {formSidebarTab === 'fields' && (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>拖拽到左侧分组，将生成对应表单控件</p>
                      {allAttributesForForm.map((a) => (
                        <div
                          key={a.id}
                          className={styles.draggableFieldItem}
                          title={`${a.fieldName} (${a.technicalName || a.fieldName})`}
                          draggable
                          onDragStart={handleDragStartField(a)}
                        >
                          {a.fieldName}
                          {a.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
                          <span style={{ marginLeft: 4, fontSize: 11, color: '#8c8c8c' }}>({a.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {formSidebarTab === 'fieldTypes' && (
                    <div className={styles.fieldTypeGrid}>
                      {configClassFieldTypes.map((f) => (
                        <div
                          key={f.key}
                          className={styles.fieldTypeItem}
                          title={f.label}
                          draggable
                          onDragStart={handleDragStartFieldType(f.key, f.label)}
                        >
                          <FieldTypeDisplay typeKey={f.key} label={f.label} />
                        </div>
                      ))}
                    </div>
                  )}
                  {formSidebarTab === 'formProps' && (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>布局列数</div>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {[1, 2, 3].map((n) => (
                          <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input type="radio" name="layoutCols" checked={formProps.layoutColumns === n} onChange={() => setFormProps((p) => ({ ...p, layoutColumns: n as 1 | 2 | 3 }))} />
                            一排 {n} 个
                          </label>
                        ))}
                      </Space>
                      <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 500 }}>标签对齐</div>
                      <Space size={8}>
                        {(['left', 'right', 'top'] as const).map((align) => (
                          <label key={align} style={{ cursor: 'pointer' }}>
                            <input type="radio" name="labelAlign" checked={formProps.labelAlign === align} onChange={() => setFormProps((p) => ({ ...p, labelAlign: align }))} /> {align === 'left' ? '左' : align === 'right' ? '右' : '顶'}
                          </label>
                        ))}
                      </Space>
                      <div style={{ marginTop: 12 }}>标签宽度：<input type="number" value={formProps.labelWidth} onChange={(e) => setFormProps((p) => ({ ...p, labelWidth: Number(e.target.value) || 0 }))} style={{ width: 56 }} /> px</div>
                      <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 500 }}>表单尺寸</div>
                      <Space size={8}>
                        {['small', 'middle', 'large'].map((sz) => (
                          <label key={sz} style={{ cursor: 'pointer' }}>
                            <input type="radio" name="formSize" checked={formProps.formSize === sz} onChange={() => setFormProps((p) => ({ ...p, formSize: sz }))} />{' '}
                            {sz === 'small' ? '小' : sz === 'middle' ? '中' : '大'}
                          </label>
                        ))}
                      </Space>
                      <div style={{ marginTop: 8 }}>空数据提示：<input type="text" value={formProps.emptyText} onChange={(e) => setFormProps((p) => ({ ...p, emptyText: e.target.value }))} style={{ width: '100%', marginTop: 4 }} /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <Card size="small" className={styles.contentCard}>
              <div className={styles.sectionHead}>识别规则</div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>选中的字段需全部匹配才判定为同一 CI。</p>
              <div className={styles.sectionHead}>识别字段配置</div>
              <div className={styles.ruleCards}>
                {viewRecognitionRuleRows.map((row) => (
                  <Card
                    key={row.id}
                    size="small"
                    className={row.source === 'another' ? styles.ruleCardOther : row.source === 'mixed' ? styles.ruleCardMixed : styles.ruleCardMain}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          {row.source === 'another' ? '其它表' : row.source === 'mixed' ? '主表+其它表' : '主表'}
                        </div>
                        <div style={{ fontWeight: 500 }}>{row.fieldName}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {viewRecognitionRuleRows.length === 0 && (
                  <div style={{ fontSize: 13, color: '#8c8c8c' }}>暂无识别规则</div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'dependency' && (
            <Card
              size="small"
              className={`${styles.contentCard} ${styles.contentCardFull}`}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  minHeight: 0,
                },
              }}
            >
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                全生命周期视角：上游为当前类从哪里来，下游为当前类由什么组成或依赖什么。
              </p>
              <div className={styles.dependencyGraphHost}>
                <DependencyRelationDiagram
                  variant="fill"
                  centerName={basicInfo.className}
                  upstream={viewDependencyUpstream}
                  downstream={viewDependencyDownstream}
                />
              </div>
            </Card>
          )}

          {activeTab === 'automation' && (
            <Card size="small" className={styles.contentCard}>
              <div className={styles.placeholder}>关联自动化脚本或作业，可在此配置触发条件与执行动作。</div>
            </Card>
          )}

          {activeTab === 'list' && (
            <>
              <div className={styles.tableToolbar}>
                <Input placeholder="请输入关键字搜索" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 200 }} />
              </div>
              <Table
                rowKey="id"
                size="small"
                columns={ciColumns}
                dataSource={paginatedList}
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                pagination={{
                  total: totalCountMock,
                  current: page,
                  pageSize,
                  showSizeChanger: true,
                  showTotal: (t) => `共${t}条`,
                  onChange: (p, ps) => { setPage(p); if (ps) setPageSize(ps) },
                }}
              />
            </>
          )}
        </div>
      </div>
      <AddRecognitionRuleModal
        open={addRuleModalOpen}
        onClose={() => setAddRuleModalOpen(false)}
        onSave={(fields, source) => {
          setRecognitionRules((prev) => [
            ...prev,
            ...fields.map((f) => ({
              id: 'r' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
              source: source === 'main' ? '主表属性' : source === 'another' ? '其它表' : '主表+其它表',
              primaryKey: f.fieldName,
              attributes: f.fieldName,
            })),
          ])
        }}
        mainTableAttributes={allAttributesForForm}
      />
    </div>
  )
}
