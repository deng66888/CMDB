import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Form, Input, Select, Card, Space, Radio, message, Table, Tooltip, Checkbox, Modal, Popconfirm } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  CloudOutlined,
  DesktopOutlined,
  LaptopOutlined,
  MonitorOutlined,
  HddOutlined,
  ClusterOutlined,
  CodeOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
  GatewayOutlined,
  RocketOutlined,
  PrinterOutlined,
  WifiOutlined,
  PartitionOutlined,
  NodeIndexOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  configClassFieldTypes,
  configClassInheritedAttributesMock,
  getConfigClassViewData,
  type ConfigClassAttribute,
  type ConfigClassDependencyItem,
  type RecognitionRuleRow,
} from '@/mock/configClass'
import {
  relationModelListMock,
  getRelationPairs,
  deriveRelationFromPair,
  RELATION_MODEL_CLASS_OPTIONS,
  type RelationModelRecord,
} from '@/mock/relationModel'
import AddRecognitionRuleModal, { type RecognitionRuleFieldInput } from '../ConfigClassManagement/AddRecognitionRuleModal'
import FormDesignCanvas from './FormDesignCanvas'
import { FieldTypeDisplay } from './fieldTypeIcons'
import type { FormLayoutItem } from './types'
import { FORM_TEMPLATES, TEMPLATE_FIELD_LABELS } from './types'
import styles from './index.module.css'

/** CMDB 配置类内置图标（蓝色） */
const CMDB_ICONS: { value: string; label: string; Icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
  { value: 'cloud-server', label: '云服务器', Icon: CloudServerOutlined },
  { value: 'server', label: '服务器', Icon: DesktopOutlined },
  { value: 'database', label: '数据库', Icon: DatabaseOutlined },
  { value: 'application', label: '应用', Icon: AppstoreOutlined },
  { value: 'api', label: 'API', Icon: ApiOutlined },
  { value: 'cloud', label: '云资源', Icon: CloudOutlined },
  { value: 'laptop', label: '笔记本', Icon: LaptopOutlined },
  { value: 'monitor', label: '显示器', Icon: MonitorOutlined },
  { value: 'storage', label: '存储', Icon: HddOutlined },
  { value: 'cluster', label: '集群', Icon: ClusterOutlined },
  { value: 'code', label: '代码/服务', Icon: CodeOutlined },
  { value: 'mobile', label: '移动设备', Icon: MobileOutlined },
  { value: 'safety', label: '安全', Icon: SafetyCertificateOutlined },
  { value: 'gateway', label: '网关', Icon: GatewayOutlined },
  { value: 'rocket', label: '部署', Icon: RocketOutlined },
  { value: 'printer', label: '打印机', Icon: PrinterOutlined },
  { value: 'network', label: '网络', Icon: WifiOutlined },
  { value: 'partition', label: '分区', Icon: PartitionOutlined },
  { value: 'node', label: '节点', Icon: NodeIndexOutlined },
]

const ICON_COLOR = '#1890ff'
const ICON_SIZE = 28

function IconSelect({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className={styles.iconSelectGrid}>
      {CMDB_ICONS.map(({ value: optValue, label, Icon }) => (
        <Tooltip key={optValue} title={label}>
          <div
            role="button"
            tabIndex={0}
            className={value === optValue ? styles.iconSelectItemActive : styles.iconSelectItem}
            onClick={() => onChange?.(optValue)}
            onKeyDown={(e) => e.key === 'Enter' && onChange?.(optValue)}
          >
            <Icon style={{ fontSize: ICON_SIZE, color: ICON_COLOR }} />
          </div>
        </Tooltip>
      ))}
    </div>
  )
}

/** 仅展示配置类图标（查看配置类时用） */
export function ConfigClassIconDisplay({ value }: { value?: string }) {
  const item = CMDB_ICONS.find((c) => c.value === value)
  if (!item) return <CloudOutlined style={{ fontSize: ICON_SIZE, color: ICON_COLOR }} />
  const Icon = item.Icon
  return <Icon style={{ fontSize: ICON_SIZE, color: ICON_COLOR }} />
}

/** 依赖关系图：一框一组（关系类型淡底标题 + 框内多个配置类），每组一条连线；整体不超出 */
const DEP_GRAPH_W = 860
const DEP_GRAPH_H = 440
const DEP_NODE_W = 160
const DEP_NODE_H = 52
const DEP_GROUP_BOX_W = 176
const DEP_GROUP_TITLE_H = 32
const DEP_GROUP_ITEM_H = 36
const DEP_GROUP_ITEM_GAP = 10
const DEP_GROUP_PAD = 8
const DEP_GROUP_GAP = 24
const DEP_COL_MARGIN = 48

const DEP_TARGET_CONFIG_CLASS_OPTIONS = [
  ...RELATION_MODEL_CLASS_OPTIONS,
  '应用程序', '大容量存储器', '磁盘分区',
].filter((v, i, a) => a.indexOf(v) === i)

export type DepItemWithSource = ConfigClassDependencyItem & { inherited?: boolean }

type DepTarget = { target: string; inherited: boolean }
type DepGroup = { relation: string; targets: DepTarget[] }

function groupByRelation(items: DepItemWithSource[]): DepGroup[] {
  const map = new Map<string, DepTarget[]>()
  items.forEach((item) => {
    const list = map.get(item.relation) ?? []
    list.push({ target: item.target, inherited: !!item.inherited })
    map.set(item.relation, list)
  })
  return Array.from(map.entries()).map(([relation, targets]) => ({ relation, targets }))
}

type DepEdge = { id: string; sourceId: string; targetId: string; inherited: boolean }

function getDepGraphData(
  upstream: DepItemWithSource[],
  downstream: DepItemWithSource[]
): { upstreamGroups: DepGroup[]; downstreamGroups: DepGroup[]; edges: DepEdge[] } {
  const centerId = 'center'
  const upstreamGroups = groupByRelation(upstream)
  const downstreamGroups = groupByRelation(downstream)
  const edges: DepEdge[] = []
  upstreamGroups.forEach((grp, gi) => {
    const allInherited = grp.targets.length > 0 && grp.targets.every((t) => t.inherited)
    edges.push({ id: `eu-${gi}`, sourceId: `up-${gi}`, targetId: centerId, inherited: allInherited })
  })
  downstreamGroups.forEach((grp, gi) => {
    const allInherited = grp.targets.length > 0 && grp.targets.every((t) => t.inherited)
    edges.push({ id: `ed-${gi}`, sourceId: centerId, targetId: `down-${gi}`, inherited: allInherited })
  })
  return { upstreamGroups, downstreamGroups, edges }
}

function groupBoxHeight(grp: DepGroup): number {
  const itemTotal = grp.targets.length * DEP_GROUP_ITEM_H + Math.max(0, grp.targets.length - 1) * DEP_GROUP_ITEM_GAP
  return DEP_GROUP_TITLE_H + DEP_GROUP_PAD * 2 + itemTotal
}

function layoutDepGraphWithGroupBoxes(
  upstreamGroups: DepGroup[],
  downstreamGroups: DepGroup[]
): {
  centerPos: { x: number; y: number }
  groupBoxes: Record<string, { x: number; y: number; w: number; h: number }>
} {
  const cx = DEP_GRAPH_W / 2 - DEP_NODE_W / 2
  const cy = DEP_GRAPH_H / 2 - DEP_NODE_H / 2
  const centerPos = { x: cx, y: cy }
  const groupBoxes: Record<string, { x: number; y: number; w: number; h: number }> = {}
  const leftX = DEP_COL_MARGIN
  const rightX = DEP_GRAPH_W - DEP_COL_MARGIN - DEP_GROUP_BOX_W
  let upY = 20
  upstreamGroups.forEach((grp, gi) => {
    const h = groupBoxHeight(grp)
    groupBoxes[`up-${gi}`] = { x: leftX, y: upY, w: DEP_GROUP_BOX_W, h }
    upY += h + DEP_GROUP_GAP
  })
  let downY = 20
  downstreamGroups.forEach((grp, gi) => {
    const h = groupBoxHeight(grp)
    groupBoxes[`down-${gi}`] = { x: rightX, y: downY, w: DEP_GROUP_BOX_W, h }
    downY += h + DEP_GROUP_GAP
  })
  return { centerPos, groupBoxes }
}

function DepNodeIcon({ name, className }: { name: string; className?: string }) {
  const n = name || ''
  if (n.includes('服务器') || n.includes('ESX')) return <CloudServerOutlined className={className || styles.depNodeIcon} />
  if (n.includes('集群') || n.includes('K8s')) return <ClusterOutlined className={className || styles.depNodeIcon} />
  if (n.includes('存储') || n.includes('内存') || n.includes('磁盘') || n.includes('对象存储') || n.includes('NAS')) return <HddOutlined className={className || styles.depNodeIcon} />
  if (n.includes('应用')) return <AppstoreOutlined className={className || styles.depNodeIcon} />
  if (n.includes('数据库') || n.includes('Redis')) return <DatabaseOutlined className={className || styles.depNodeIcon} />
  if (n.includes('网关')) return <GatewayOutlined className={className || styles.depNodeIcon} />
  if (n.includes('负载均衡')) return <NodeIndexOutlined className={className || styles.depNodeIcon} />
  if (n.includes('交换机') || n.includes('路由器')) return <WifiOutlined className={className || styles.depNodeIcon} />
  if (n.includes('容器')) return <PartitionOutlined className={className || styles.depNodeIcon} />
  if (n.includes('消息队列') || n.includes('中间件') || n.includes('API服务')) return <ApiOutlined className={className || styles.depNodeIcon} />
  if (n.includes('虚拟机')) return <CloudOutlined className={className || styles.depNodeIcon} />
  if (n.includes('物理机') || n.includes('物理服务器') || n === '服务' || n.includes('计算机')) return <DesktopOutlined className={className || styles.depNodeIcon} />
  if (n === 'Service' || n.includes('Deployment') || n.includes('Pod')) return <RocketOutlined className={className || styles.depNodeIcon} />
  if (n.includes('数据源')) return <DatabaseOutlined className={className || styles.depNodeIcon} />
  if (n.includes('虚拟服务器')) return <CloudOutlined className={className || styles.depNodeIcon} />
  if (n.includes('容器节点')) return <NodeIndexOutlined className={className || styles.depNodeIcon} />
  return <CloudOutlined className={className || styles.depNodeIcon} />
}

const DEP_ARROW_INSET = 10

function getDepEdgePathFromBoxes(
  groupBoxes: Record<string, { x: number; y: number; w: number; h: number }>,
  centerPos: { x: number; y: number },
  sourceId: string,
  targetId: string
): string {
  const isUpstream = sourceId.startsWith('up-')
  let x1: number, y1: number, x2: number, y2: number
  if (isUpstream) {
    const box = groupBoxes[sourceId]
    if (!box) return ''
    x1 = box.x + box.w
    y1 = box.y + box.h / 2
    x2 = centerPos.x + DEP_ARROW_INSET
    y2 = centerPos.y + DEP_NODE_H / 2
  } else {
    x1 = centerPos.x + DEP_NODE_W - DEP_ARROW_INSET
    y1 = centerPos.y + DEP_NODE_H / 2
    const box = groupBoxes[targetId]
    if (!box) return ''
    x2 = box.x - DEP_ARROW_INSET
    y2 = box.y + box.h / 2
  }
  const midX = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
}

function DependencyRelationDiagram({
  centerName,
  upstream,
  downstream,
  onAddClick,
  onDeleteUpstream,
  onDeleteDownstream,
  /** 配置类管理查看页等：铺满父容器并在尺寸变化时自动「适合界面」 */
  variant = 'default',
}: {
  centerName: string
  upstream: DepItemWithSource[]
  downstream: DepItemWithSource[]
  onAddClick?: () => void
  onDeleteUpstream?: (item: ConfigClassDependencyItem) => void
  onDeleteDownstream?: (item: ConfigClassDependencyItem) => void
  variant?: 'default' | 'fill'
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const graphData = useMemo(() => getDepGraphData(upstream, downstream), [upstream, downstream])
  const { upstreamGroups, downstreamGroups, edges } = graphData
  const { centerPos, groupBoxes } = useMemo(
    () => layoutDepGraphWithGroupBoxes(upstreamGroups, downstreamGroups),
    [upstreamGroups, downstreamGroups]
  )

  const handleFit = useCallback(() => {
    if (!wrapRef.current) return
    const el = wrapRef.current
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    const scale = Math.min(r.width / DEP_GRAPH_W, r.height / DEP_GRAPH_H, 1.1)
    setZoom(Math.max(0.4, Math.min(scale, 2)))
  }, [])

  const isEmpty = upstream.length === 0 && downstream.length === 0

  /** 容器尺寸变化（右侧栏变宽、窗口 resize）时重新计算缩放，避免画布挤在角落 */
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let raf = 0
    const scheduleFit = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => handleFit())
    }
    scheduleFit()
    const ro = new ResizeObserver(scheduleFit)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [handleFit, graphData, isEmpty])

  const wrapCls =
    variant === 'fill'
      ? `${styles.depGraphWrap} ${styles.depGraphWrapFill}`
      : styles.depGraphWrap
  const scaledCls =
    variant === 'fill'
      ? `${styles.depGraphScaled} ${styles.depGraphScaledFill}`
      : styles.depGraphScaled

  if (isEmpty) {
    return (
      <div className={wrapCls} ref={wrapRef}>
        {onAddClick && (
          <div className={styles.depGraphTopLeft}>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onAddClick}>新建</Button>
          </div>
        )}
        <div className={styles.depGraphToolbar}>
          <Tooltip title="适合界面">
            <Button type="text" icon={<ExpandOutlined />} onClick={handleFit} />
          </Tooltip>
          <Tooltip title="放大">
            <Button type="text" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button type="text" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))} />
          </Tooltip>
        </div>
        <div
          className={scaledCls}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <div className={styles.depGraphInner} style={{ width: DEP_GRAPH_W, height: DEP_GRAPH_H }}>
            <div className={styles.depGraphNodes} style={{ width: DEP_GRAPH_W, height: DEP_GRAPH_H }}>
              <div
                className={`${styles.depNode} ${styles.depNodeCenter}`}
                style={{ left: DEP_GRAPH_W / 2 - DEP_NODE_W / 2, top: DEP_GRAPH_H / 2 - DEP_NODE_H / 2 }}
              >
                <div className={styles.depNodeIconWrap}>
                  <DepNodeIcon name={centerName} className={styles.depNodeIcon} />
                </div>
                <div className={styles.depNodeText}>{centerName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={wrapCls} ref={wrapRef}>
      {onAddClick && (
        <div className={styles.depGraphTopLeft}>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onAddClick}>新建</Button>
        </div>
      )}
      <div className={styles.depGraphToolbar}>
        <Tooltip title="适合界面">
          <Button type="text" icon={<ExpandOutlined />} onClick={handleFit} />
        </Tooltip>
        <Tooltip title="放大">
          <Button type="text" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} />
        </Tooltip>
        <Tooltip title="缩小">
          <Button type="text" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))} />
        </Tooltip>
      </div>
      <div
        className={scaledCls}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        <div className={styles.depGraphInner} style={{ width: DEP_GRAPH_W, height: DEP_GRAPH_H }}>
          <svg className={styles.depGraphSvg} width={DEP_GRAPH_W} height={DEP_GRAPH_H} viewBox={`0 0 ${DEP_GRAPH_W} ${DEP_GRAPH_H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="dep-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 10 4, 0 8" fill="#bfbfbf" />
              </marker>
              <marker id="dep-arrow-start" markerWidth="10" markerHeight="8" refX="0" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="10 0, 0 4, 10 8" fill="#bfbfbf" />
              </marker>
              <marker id="dep-arrow-inherited" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 10 4, 0 8" fill="#d9d9d9" />
              </marker>
              <marker id="dep-arrow-start-inherited" markerWidth="10" markerHeight="8" refX="0" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="10 0, 0 4, 10 8" fill="#d9d9d9" />
              </marker>
            </defs>
            <g style={{ overflow: 'visible' }}>
              {edges.map((e) => {
                const path = getDepEdgePathFromBoxes(groupBoxes, centerPos, e.sourceId, e.targetId)
                if (!path) return null
                const isUpstream = e.sourceId.startsWith('up-')
                const inherited = e.inherited
                const strokeColor = inherited ? '#d9d9d9' : '#bfbfbf'
                return (
                  <g key={e.id}>
                    <path
                      d={path}
                      stroke={strokeColor}
                      strokeWidth="1"
                      strokeDasharray={inherited ? '5,5' : undefined}
                      fill="none"
                      markerStart={isUpstream ? (inherited ? 'url(#dep-arrow-start-inherited)' : 'url(#dep-arrow-start)') : undefined}
                      markerEnd={inherited ? 'url(#dep-arrow-inherited)' : 'url(#dep-arrow)'}
                    />
                  </g>
                )
              })}
            </g>
          </svg>
          <div className={styles.depGraphNodes} style={{ width: DEP_GRAPH_W, height: DEP_GRAPH_H }}>
            <div
              className={`${styles.depNode} ${styles.depNodeCenter}`}
              style={{ left: centerPos.x, top: centerPos.y }}
            >
              <div className={styles.depNodeIconWrap}>
                <CloudServerOutlined className={styles.depNodeIcon} />
              </div>
              <div className={styles.depNodeText}>{centerName}</div>
            </div>
            {upstreamGroups.map((grp, gi) => {
              const box = groupBoxes[`up-${gi}`]
              if (!box) return null
              return (
                <div key={`up-${gi}`} className={styles.depGroupBox} style={{ left: box.x, top: box.y, width: box.w, minHeight: box.h }}>
                  <div className={styles.depGroupTitleBar}>{grp.relation}</div>
                  <div className={styles.depGroupContent}>
                    {grp.targets.map((t, ti) => (
                      <div key={ti} className={styles.depGroupItem} style={t.inherited ? { color: '#8c8c8c' } : undefined}>
                        <span className={styles.depGroupItemIcon}>
                          <DepNodeIcon name={t.target} className={styles.depGroupItemIconSvg} />
                        </span>
                        <span className={styles.depGroupItemText}>{t.target}{t.inherited ? ' (继)' : ''}</span>
                        {onDeleteUpstream && (
                          <Popconfirm
                            title="确认删除"
                            description={`确定要删除上游关系「${grp.relation}」-「${t.target}」吗？`}
                            okText="确定"
                            cancelText="取消"
                            onConfirm={(e) => { e?.stopPropagation(); onDeleteUpstream({ relation: grp.relation, target: t.target }) }}
                          >
                            <Tooltip title={t.inherited ? '删除继承关系' : '删除'}>
                              <button
                                type="button"
                                className={styles.depGroupItemDel}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DeleteOutlined />
                              </button>
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {downstreamGroups.map((grp, gi) => {
              const box = groupBoxes[`down-${gi}`]
              if (!box) return null
              return (
                <div key={`down-${gi}`} className={styles.depGroupBox} style={{ left: box.x, top: box.y, width: box.w, minHeight: box.h }}>
                  <div className={styles.depGroupTitleBar}>{grp.relation}</div>
                  <div className={styles.depGroupContent}>
                    {grp.targets.map((t, ti) => (
                      <div key={ti} className={styles.depGroupItem} style={t.inherited ? { color: '#8c8c8c' } : undefined}>
                        <span className={styles.depGroupItemIcon}>
                          <DepNodeIcon name={t.target} className={styles.depGroupItemIconSvg} />
                        </span>
                        <span className={styles.depGroupItemText}>{t.target}{t.inherited ? ' (继)' : ''}</span>
                        {onDeleteDownstream && (
                          <Popconfirm
                            title="确认删除"
                            description={`确定要删除下游关系「${grp.relation}」-「${t.target}」吗？`}
                            okText="确定"
                            cancelText="取消"
                            onConfirm={(e) => { e?.stopPropagation(); onDeleteDownstream({ relation: grp.relation, target: t.target }) }}
                          >
                            <Tooltip title={t.inherited ? '删除继承关系' : '删除'}>
                              <button
                                type="button"
                                className={styles.depGroupItemDel}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DeleteOutlined />
                              </button>
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DependencyRelationDiagram, DepNodeIcon }

const STEPS = ['基础信息', '属性', '识别规则', '依赖关系', '关联自动化']

export default function ConfigClassNew() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [basicForm] = Form.useForm()
  const [attrSubTab, setAttrSubTab] = useState<'props' | 'form'>('form')
  const [attrSourceTab, setAttrSourceTab] = useState<'inherited' | 'added' | 'all'>('all')
  const [addedAttributes, setAddedAttributes] = useState<ConfigClassAttribute[]>([])
  const [formProps, setFormProps] = useState({
    labelAlign: 'left' as const,
    labelWidth: 80,
    formSize: 'small' as string,
    labelSuffix: '：',
    emptyText: '暂无数据',
    layoutColumns: 1 as 1 | 2 | 3,
  })
  const [formSidebarTab, setFormSidebarTab] = useState<'fields' | 'fieldTypes' | 'formProps'>('fields')
  const [formLayoutItems, setFormLayoutItems] = useState<FormLayoutItem[]>([])
  const [formTemplateId, setFormTemplateId] = useState<string>('blank')
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [recognitionRuleRows, setRecognitionRuleRows] = useState<RecognitionRuleRow[]>([])
  const [dependencyUpstream, setDependencyUpstream] = useState<DepItemWithSource[]>([])
  const [dependencyDownstream, setDependencyDownstream] = useState<DepItemWithSource[]>([])
  const [parentClassName, setParentClassName] = useState<string>('')
  const hasLoadedParentDeps = useRef(false)
  const [searchParams] = useSearchParams()
  const parentId = searchParams.get('parent') ?? null

  useEffect(() => {
    hasLoadedParentDeps.current = false
  }, [parentId])

  useEffect(() => {
    if (currentStep !== 3 || !parentId || hasLoadedParentDeps.current) return
    try {
      const data = getConfigClassViewData(parentId)
      setDependencyUpstream((data.dependencyUpstream ?? []).map((x) => ({ ...x, inherited: true })))
      setDependencyDownstream((data.dependencyDownstream ?? []).map((x) => ({ ...x, inherited: true })))
      setParentClassName(data.basicInfo?.className ?? '')
      hasLoadedParentDeps.current = true
    } catch {
      hasLoadedParentDeps.current = true
    }
  }, [currentStep, parentId])

  const [addDepModalOpen, setAddDepModalOpen] = useState(false)
  const [addDepForm] = Form.useForm()
  const [addDepRelationSelectOpen, setAddDepRelationSelectOpen] = useState(false)
  const [pendingDepTarget, setPendingDepTarget] = useState<string>('')
  const [pendingDepPairs, setPendingDepPairs] = useState<RelationModelRecord[]>([])
  const [selectedDepVerb, setSelectedDepVerb] = useState<string>('')
  const [uniqueCodePrefix, setUniqueCodePrefix] = useState('')
  const [uniqueCodeFields, setUniqueCodeFields] = useState<string[]>([])
  const [ciNameTemplate, setCiNameTemplate] = useState('')
  const [ciNameField, setCiNameField] = useState<string | undefined>(undefined)
  const [ciNameConfigModalOpen, setCiNameConfigModalOpen] = useState(false)
  /** 关联自动化：任务调度分类、任务调度 */
  const [automationCategory, setAutomationCategory] = useState<string | undefined>(undefined)
  const [automationTask, setAutomationTask] = useState<string | undefined>(undefined)

  /** 任务调度分类选项（Mock） */
  const AUTOMATION_CATEGORY_OPTIONS = useMemo(() => [
    { label: '发现与采集', value: 'discovery' },
    { label: '合规检测', value: 'compliance' },
    { label: '自动化作业', value: 'automation' },
  ], [])
  /** 按分类的任务调度选项（Mock） */
  const automationTaskOptions = useMemo(() => {
    if (!automationCategory) return []
    const map: Record<string, { label: string; value: string }[]> = {
      discovery: [
        { label: '主机发现', value: 'host_discovery' },
        { label: '网络设备发现', value: 'network_discovery' },
        { label: '应用发现', value: 'app_discovery' },
      ],
      compliance: [
        { label: '配置合规扫描', value: 'config_scan' },
        { label: '安全基线检测', value: 'security_baseline' },
      ],
      automation: [
        { label: '批量脚本执行', value: 'batch_script' },
        { label: '配置变更作业', value: 'config_change' },
      ],
    }
    return map[automationCategory] ?? []
  }, [automationCategory])

  /** 表单设计用：全部属性（继承+添加），用于「字段」列表与模板解析 */
  const allAttributesForForm = useMemo(
    () => [...configClassInheritedAttributesMock, ...addedAttributes],
    [addedAttributes]
  )

  const transparentPixel =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

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

  const attributesDisplay =
    attrSourceTab === 'inherited' ? configClassInheritedAttributesMock : attrSourceTab === 'added' ? addedAttributes : [...configClassInheritedAttributesMock, ...addedAttributes]

  const validateUniqueCode = useCallback(() => {
    const prefix = (uniqueCodePrefix ?? '').trim()
    if (!prefix) {
      message.warning('请填写唯一编码前缀')
      return false
    }
    if (!uniqueCodeFields || uniqueCodeFields.length === 0) {
      message.warning('请至少选择参与唯一编码的一个属性')
      return false
    }
    return true
  }, [uniqueCodePrefix, uniqueCodeFields])

  /** 保存时未通过校验的步骤索引，用于高亮提示 */
  const [firstErrorStep, setFirstErrorStep] = useState<number | null>(null)

  const handleNext = () => {
    if (currentStep === 0) {
      setFirstErrorStep(null)
      basicForm.validateFields().then(() => {
        if (!validateUniqueCode()) return
        if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1)
      }).catch(() => {})
    } else if (currentStep < STEPS.length - 1) {
      setFirstErrorStep(null)
      setCurrentStep((s) => s + 1)
    } else {
      // 最后一步点击「保存」：校验前面步骤必填项
      basicForm.validateFields().then(() => {
        if (!validateUniqueCode()) {
          setFirstErrorStep(0)
          setCurrentStep(0)
          message.warning('请先完成「基础信息」中的必填项：类名称、类编码、唯一编码前缀及参与属性')
          return
        }
        message.success('配置类创建成功')
        navigate('/config/backend-config-class')
      }).catch(() => {
        setFirstErrorStep(0)
        setCurrentStep(0)
        message.warning('请先完成「基础信息」中的必填项：类名称、类编码、唯一编码前缀及参与属性')
      })
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>新建配置类</h2>
      <div className={styles.steps}>
        {STEPS.map((name, i) => (
          <div
            key={name}
            className={
              i === currentStep
                ? styles.stepActive
                : i === firstErrorStep
                  ? styles.stepError
                  : styles.step
            }
            onClick={() => { setFirstErrorStep(null); setCurrentStep(i) }}
          >
            {name}
          </div>
        ))}
      </div>

      <div className={styles.mainLayout}>
        <Card className={styles.card} style={currentStep === 1 && attrSubTab === 'form' ? { flex: 1, minWidth: 0 } : undefined}>
          {currentStep === 0 && (
            <>
              <Form form={basicForm} layout="vertical" initialValues={{ classCode: 'u_cmdb_cl_ces' }} style={{ maxWidth: 480 }}>
                <Form.Item name="className" label="类名称" rules={[{ required: true }]}>
                  <Input placeholder="如：应用" />
                </Form.Item>
                <Form.Item name="description" label="描述">
                  <Input.TextArea rows={3} maxLength={1000} showCount placeholder="最多1000个字符" />
                </Form.Item>
                <Form.Item name="classCode" label="类编码" rules={[{ required: true }]}>
                  <Input placeholder="如：u_cmdb_cl_ces" />
                </Form.Item>
                <Form.Item name="icon" label="图标" initialValue="application">
                  <IconSelect />
                </Form.Item>
              </Form>
              <div className={styles.sectionHead} style={{ marginTop: 24 }}>唯一编码配置 <span style={{ color: '#ff4d4f', fontSize: 14 }}>*</span></div>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>生成 CI 的自动编号（如 SRV-2024-001），为必填项</p>
              <div style={{ maxWidth: 480 }}>
                <Form.Item label="前缀" required style={{ marginBottom: 16 }}>
                  <Input placeholder="请输入前缀" value={uniqueCodePrefix} onChange={(e) => setUniqueCodePrefix(e.target.value)} />
                </Form.Item>
                <Form.Item label="属性" required style={{ marginBottom: 0 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      mode="multiple"
                      placeholder="选择 1 个或多个属性"
                      value={uniqueCodeFields}
                      onChange={setUniqueCodeFields}
                      options={allAttributesForForm
                        .filter((a) => a.fieldName !== '唯一编码' && (a.technicalName || a.fieldName) !== 'sys_id')
                        .map((a) => ({ value: a.technicalName || a.fieldName, label: a.fieldName }))}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <Tooltip title="参与唯一编码组合字段">
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', color: '#8c8c8c', cursor: 'help', flexShrink: 0 }}>
                        <InfoCircleOutlined />
                      </span>
                    </Tooltip>
                  </Space.Compact>
                </Form.Item>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <div className={styles.attrStep}>
              {/* 属性 / 表单：同级别 */}
              <Space style={{ marginBottom: 16 }} className={styles.attrFormTabs}>
                <Button type={attrSubTab === 'props' ? 'primary' : 'default'} onClick={() => setAttrSubTab('props')}>属性</Button>
                <Button type={attrSubTab === 'form' ? 'primary' : 'default'} onClick={() => setAttrSubTab('form')}>表单</Button>
              </Space>
              {attrSubTab === 'props' && (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span className={styles.attrFilterLabel}>查看：</span>
                      <Space>
                        <Button type={attrSourceTab === 'inherited' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('inherited')}>继承的</Button>
                        <Button type={attrSourceTab === 'added' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('added')}>添加的</Button>
                        <Button type={attrSourceTab === 'all' ? 'primary' : 'default'} size="small" onClick={() => setAttrSourceTab('all')}>所有</Button>
                      </Space>
                    </div>
                    <Space>
                      <Button type="primary" size="small" icon={<PlusOutlined />} disabled={attrSourceTab === 'inherited'} onClick={() => setAddedAttributes((prev) => [...prev, { id: 'a' + Date.now(), fieldName: '新属性', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: true, required: false, hidden: false, source: 'added' }])}>新建</Button>
                      <Button danger size="small" icon={<DeleteOutlined />} disabled={attrSourceTab === 'inherited'}>删除</Button>
                    </Space>
                  </div>
                  <Table<ConfigClassAttribute>
                    rowKey="id"
                    size="small"
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: '', dataIndex: 'id', width: 44, align: 'center', render: (_, r) => r.source === 'added' ? <Checkbox /> : null },
                      { title: '字段名', dataIndex: 'fieldName', minWidth: 120, ellipsis: true },
                      { title: '类型', dataIndex: 'type', minWidth: 90 },
                      { title: '引用', dataIndex: 'reference', minWidth: 120, ellipsis: true },
                      { title: '最大长度', dataIndex: 'maxLength', minWidth: 88, render: (v: number | null) => v ?? '-' },
                      { title: '默认值', dataIndex: 'defaultValue', minWidth: 90, ellipsis: true },
                      { title: '选填', dataIndex: 'optional', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled /> },
                      { title: '必填', dataIndex: 'required', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled /> },
                      { title: '隐藏', dataIndex: 'hidden', width: 64, align: 'center', render: (v: boolean) => <Checkbox checked={v} disabled /> },
                      { title: '说明', dataIndex: 'description', minWidth: 200, ellipsis: true },
                      {
                        title: '操作',
                        key: 'action',
                        width: 120,
                        fixed: 'right',
                        render: (_, record) => {
                          const isNameField = record.fieldName === '名称' || record.technicalName === 'name'
                          return record.source === 'added' ? (
                            <Space size="small">
                              <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} /></Tooltip>
                              <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => setAddedAttributes((prev) => prev.filter((x) => x.id !== record.id))} /></Tooltip>
                            </Space>
                          ) : isNameField ? (
                            <Space size="small">
                              <Tooltip title="配置项名称配置">
                                <Button type="link" size="small" icon={<SettingOutlined />} onClick={(e) => { e.stopPropagation(); setCiNameConfigModalOpen(true) }} />
                              </Tooltip>
                              <Tooltip title="继承自 cmdb_ci"><span style={{ color: '#999', fontSize: 12 }}>继承</span></Tooltip>
                            </Space>
                          ) : (
                            <Tooltip title="继承自 cmdb_ci"><span style={{ color: '#999', fontSize: 12 }}>继承</span></Tooltip>
                          )
                        },
                      },
                    ]}
                    dataSource={attributesDisplay}
                    pagination={{ total: attributesDisplay.length, pageSize: 10, size: 'small', showTotal: (t) => `共${t}条` }}
                  />
                </>
              )}
              {attrSubTab === 'form' && (
                <>
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
                      选择模板可快速填充四个分组；或从右侧拖拽「字段」「字段类型」到分组，左侧标签、右侧为对应输入框/下拉/单选等控件。
                    </p>
                  </div>
                  <FormDesignCanvas items={formLayoutItems} onItemsChange={setFormLayoutItems} onSave={() => message.success('表单布局已保存')} formProps={formProps} />
                </>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className={styles.sectionHead}>识别规则</div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                选中的字段需全部匹配才判定为同一 CI，用于决定是更新现有 CI 还是新建。
              </p>
              <div className={styles.sectionHead}>识别字段配置</div>
              <div className={styles.ruleCards}>
                {recognitionRuleRows.map((row) => (
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
                      <Space size="small">
                        <Tooltip title="编辑">
                          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingRuleId(row.id); setAddRuleModalOpen(true) }} />
                        </Tooltip>
                        <Button type="text" size="small" danger onClick={() => setRecognitionRuleRows((prev) => prev.filter((r) => r.id !== row.id))}>×</Button>
                      </Space>
                    </div>
                  </Card>
                ))}
                <div className={styles.addRule} onClick={() => setAddRuleModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setAddRuleModalOpen(true)}>
                  <PlusOutlined style={{ fontSize: 28 }} />
                  <span>添加识别规则</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                全生命周期视角：不仅关注本配置类本身，还关注它从哪里来（如被 ESX 虚拟化、属于哪个集群）以及由什么组成（如包含内存、磁盘）。用于故障影响分析（上游宕机则本 CI 受影响，下游故障则本 CI 数据或能力受影响）。系统可通过资产发现等拓扑自动发现填充这些关系。
              </p>
              {parentId && parentClassName && (() => {
                const inheritedCount = dependencyUpstream.filter((x) => x.inherited).length + dependencyDownstream.filter((x) => x.inherited).length
                return inheritedCount > 0 ? (
                  <p style={{ fontSize: 13, color: '#1890ff', marginBottom: 12 }}>
                    当前已继承父类 [ {parentClassName} ] 的 {inheritedCount} 个依赖关系，您可以在此基础上修改或新增。
                  </p>
                ) : null
              })()}
              <Card title="依赖关系" className={styles.card}>
                <DependencyRelationDiagram
                  centerName={basicForm.getFieldValue('className') || '服务器'}
                  upstream={dependencyUpstream}
                  downstream={dependencyDownstream}
                  onAddClick={() => { addDepForm.resetFields(); setAddDepModalOpen(true) }}
                  onDeleteUpstream={(item) => setDependencyUpstream((prev) => prev.filter((x) => String(x.relation) !== String(item.relation) || String(x.target) !== String(item.target)))}
                  onDeleteDownstream={(item) => setDependencyDownstream((prev) => prev.filter((x) => String(x.relation) !== String(item.relation) || String(x.target) !== String(item.target)))}
                />
              </Card>
              <Modal
                title="新建关系"
                open={addDepModalOpen}
                onCancel={() => setAddDepModalOpen(false)}
                onOk={() => {
                  addDepForm.validateFields().then((v) => {
                    const currentClass = basicForm.getFieldValue('className') || '服务器'
                    const targetClass = v.target
                    const pairs = getRelationPairs(relationModelListMock, currentClass, targetClass)
                    if (pairs.length === 0) {
                      message.warning('未找到该配置类与当前类的关系定义，请先在「关系建模」中配置关系对（左端-关系动词-右端）')
                      return
                    }
                    if (pairs.length === 1) {
                      const d = deriveRelationFromPair(pairs[0]!, currentClass)
                      const item: DepItemWithSource = { relation: d.relation, target: d.target, inherited: false }
                      if (d.isUpstream) setDependencyUpstream((prev) => [...prev, item])
                      else setDependencyDownstream((prev) => [...prev, item])
                      addDepForm.resetFields()
                      setAddDepModalOpen(false)
                      message.success('已根据关系建模自动确定关系类型与方向')
                      return
                    }
                    setPendingDepTarget(targetClass)
                    setPendingDepPairs(pairs)
                    setSelectedDepVerb(pairs[0]!.relationVerb)
                    setAddDepModalOpen(false)
                    setAddDepRelationSelectOpen(true)
                  }).catch(() => {})
                }}
                okText="确定"
                cancelText="取消"
                destroyOnClose
              >
                <Form form={addDepForm} layout="vertical" style={{ marginTop: 16 }}>
                  <Form.Item name="target" label="目标配置类" rules={[{ required: true, message: '请选择目标配置类' }]}>
                    <Select placeholder="选择对端配置类，系统将根据关系建模自动决定关系类型与上下游" allowClear options={DEP_TARGET_CONFIG_CLASS_OPTIONS.map((c) => ({ label: c, value: c }))} showSearch optionFilterProp="label" />
                  </Form.Item>
                  <p style={{ fontSize: 12, color: '#8c8c8c', marginTop: -8 }}>选择配置类后，系统在关系建模中查找关系对并自动推导上下游；若存在多种关系则需再选择关系类型。</p>
                </Form>
              </Modal>
              <Modal
                title="请选择关系类型"
                open={addDepRelationSelectOpen}
                onCancel={() => { setAddDepRelationSelectOpen(false); setPendingDepTarget(''); setPendingDepPairs([]) }}
                onOk={() => {
                  const currentClass = basicForm.getFieldValue('className') || '服务器'
                  const pair = pendingDepPairs.find((p) => p.relationVerb === selectedDepVerb)
                  if (!pair) return
                  const d = deriveRelationFromPair(pair, currentClass)
                  const item: DepItemWithSource = { relation: d.relation, target: d.target, inherited: false }
                  if (d.isUpstream) setDependencyUpstream((prev) => [...prev, item])
                  else setDependencyDownstream((prev) => [...prev, item])
                  setAddDepRelationSelectOpen(false)
                  setPendingDepTarget('')
                  setPendingDepPairs([])
                  addDepForm.resetFields()
                  message.success('已添加')
                }}
                okText="确定"
                cancelText="取消"
              >
                <p style={{ marginBottom: 12 }}>当前类与「{pendingDepTarget}」在关系建模中存在多种关系，请选择一种：</p>
                <Radio.Group value={selectedDepVerb} onChange={(e) => setSelectedDepVerb(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendingDepPairs.map((p) => (
                    <Radio key={p.id} value={p.relationVerb}>{p.leftClass} - {p.relationVerb} - {p.rightClass}</Radio>
                  ))}
                </Radio.Group>
              </Modal>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>关联自动化</span>
                <Tooltip title="选择任务调度分类及具体任务后，可在配置类下自动关联执行">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
                </Tooltip>
              </div>
              <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#666' }}>
                当前为关联自动化配置，请选择相应的任务调度分类，进行自动化关联。
              </div>
              <div style={{ maxWidth: 480 }}>
                <Form.Item label="任务调度分类" style={{ marginBottom: 16 }}>
                  <Select
                    placeholder="请选择任务调度分类"
                    allowClear
                    value={automationCategory}
                    onChange={(v) => { setAutomationCategory(v); setAutomationTask(undefined) }}
                    options={AUTOMATION_CATEGORY_OPTIONS}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="任务调度" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="请选择任务调度"
                    allowClear
                    value={automationTask}
                    onChange={setAutomationTask}
                    options={automationTaskOptions}
                    disabled={!automationCategory}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
            </div>
          )}
        </Card>

        <Modal
          title="配置项名称配置"
          open={ciNameConfigModalOpen}
          onCancel={() => setCiNameConfigModalOpen(false)}
          onOk={() => setCiNameConfigModalOpen(false)}
          okText="确定"
          cancelText="取消"
        >
          <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>CI 的显示名称（如「北京 - 应用服务器 -01」）</p>
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
            <Form.Item label="配置项名称" style={{ marginBottom: 16 }}>
              <Input placeholder="如：北京 - 应用服务器 -01" value={ciNameTemplate} onChange={(e) => setCiNameTemplate(e.target.value)} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="关联属性" style={{ marginBottom: 0 }}>
              <Select
                placeholder="选择用于显示名称的属性（如服务器名称）"
                value={ciNameField}
                onChange={setCiNameField}
                allowClear
                options={allAttributesForForm.map((a) => ({ value: a.technicalName || a.fieldName, label: a.fieldName }))}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>
        </Modal>

        {/* 右侧「字段 / 字段类型 / 表单属性」仅在选择「表单」Tab 时显示 */}
        {currentStep === 1 && attrSubTab === 'form' && (
          <div className={styles.formSidebar}>
            <div className={styles.formSidebarTabs}>
              <div className={formSidebarTab === 'fields' ? `${styles.formSidebarTab} ${styles.formSidebarTabActive}` : styles.formSidebarTab} onClick={() => setFormSidebarTab('fields')}>字段</div>
              <div className={formSidebarTab === 'fieldTypes' ? `${styles.formSidebarTab} ${styles.formSidebarTabActive}` : styles.formSidebarTab} onClick={() => setFormSidebarTab('fieldTypes')}>字段类型</div>
              <div className={formSidebarTab === 'formProps' ? `${styles.formSidebarTab} ${styles.formSidebarTabActive}` : styles.formSidebarTab} onClick={() => setFormSidebarTab('formProps')}>表单属性</div>
            </div>
            <div className={styles.formSidebarBody}>
              {formSidebarTab === 'fields' && (
                <div>
                  <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>全部属性，拖拽到左侧表单设计区域</p>
                  {allAttributesForForm.map((a) => (
                    <div
                      key={a.id}
                      className={styles.draggableField}
                      draggable
                      onDragStart={handleDragStartField(a)}
                    >
                      {a.fieldName}
                      {a.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
                      <span style={{ marginLeft: 4, fontSize: 11, color: '#8c8c8c' }}>
                        ({a.technicalName || a.fieldName} · {a.type})
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {formSidebarTab === 'fieldTypes' && (
                <div>
                  <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>拖拽到左侧画布分组中</p>
                  <div className={styles.fieldTypeGridForm}>
                    {configClassFieldTypes.map((f) => (
                      <div
                        key={f.key}
                        className={styles.fieldTypeItemForm}
                        draggable
                        onDragStart={handleDragStartFieldType(f.key, f.label)}
                        title={f.label}
                      >
                        <FieldTypeDisplay typeKey={f.key} label={f.label} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formSidebarTab === 'formProps' && (
                <div className={styles.formPropsBlock}>
                  <label>布局列数</label>
                  <Radio.Group
                    value={formProps.layoutColumns ?? 1}
                    onChange={(e) => setFormProps((p) => ({ ...p, layoutColumns: e.target.value }))}
                    size="small"
                    style={{ display: 'block', marginTop: 4 }}
                  >
                    <Radio value={1}>一排 1 个</Radio>
                    <Radio value={2}>一排 2 个</Radio>
                    <Radio value={3}>一排 3 个</Radio>
                  </Radio.Group>
                  <label>标签对齐方式</label>
                  <Radio.Group value={formProps.labelAlign} onChange={(e) => setFormProps((p) => ({ ...p, labelAlign: e.target.value }))} size="small" style={{ display: 'block', marginTop: 4 }}>
                    <Radio value="left">左对齐</Radio>
                    <Radio value="right">右对齐</Radio>
                    <Radio value="top">顶部对齐</Radio>
                  </Radio.Group>
                  <label>标签宽度（像素）</label>
                  <Input type="number" value={formProps.labelWidth} onChange={(e) => setFormProps((p) => ({ ...p, labelWidth: Number(e.target.value) || 0 }))} style={{ marginTop: 4 }} min={0} />
                  <label>表单尺寸</label>
                  <Radio.Group
                    value={formProps.formSize}
                    onChange={(e) => setFormProps((p) => ({ ...p, formSize: e.target.value }))}
                    size="small"
                    style={{ display: 'block', marginTop: 4 }}
                  >
                    <Radio value="small">小</Radio>
                    <Radio value="middle">中</Radio>
                    <Radio value="large">大</Radio>
                  </Radio.Group>
                  <label>标签后缀</label>
                  <Input value={formProps.labelSuffix} onChange={(e) => setFormProps((p) => ({ ...p, labelSuffix: e.target.value }))} style={{ marginTop: 4 }} placeholder="如 ：" />
                  <label>空数据提示文案</label>
                  <Input value={formProps.emptyText} onChange={(e) => setFormProps((p) => ({ ...p, emptyText: e.target.value }))} style={{ marginTop: 4 }} placeholder="暂无数据" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Space>
          <Button onClick={() => navigate('/config/backend-config-class')}>取消</Button>
          <Button onClick={handlePrev} disabled={currentStep === 0}>后退</Button>
          <Button type="primary" onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? '保存' : '下一步'}
          </Button>
        </Space>
      </div>

      <AddRecognitionRuleModal
        open={addRuleModalOpen}
        onClose={() => { setAddRuleModalOpen(false); setEditingRuleId(null) }}
        onSave={(fields: RecognitionRuleFieldInput[], source: import('../ConfigClassManagement/AddRecognitionRuleModal').SourceType, editId?: string) => {
          if (editId && fields.length > 0) {
            const f = fields[0]!
            setRecognitionRuleRows((prev) => prev.map((r) => (r.id === editId ? { ...r, fieldName: f.fieldName, technicalName: f.technicalName, source } : r)))
          } else {
            const newRows: RecognitionRuleRow[] = fields.map((f) => ({
              id: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
              fieldName: f.fieldName,
              technicalName: f.technicalName,
              source,
            }))
            setRecognitionRuleRows((prev) => [...prev, ...newRows])
          }
        }}
        mainTableAttributes={allAttributesForForm}
        alreadyAddedFieldKeys={recognitionRuleRows.map((r) => r.technicalName || r.fieldName)}
        editingRuleId={editingRuleId}
        initialForEdit={editingRuleId ? (() => {
          const row = recognitionRuleRows.find((r) => r.id === editingRuleId)
          if (!row) return null
          return {
            source: (row.source ?? 'main') as 'main' | 'another' | 'mixed',
            mainKeys: row.technicalName ? [row.technicalName] : [],
          }
        })() : null}
      />
    </div>
  )
}
