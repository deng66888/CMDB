import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Select, Button, Drawer, Checkbox, Slider, Switch, message, Modal, Descriptions, Table, Tag, Empty, Progress } from 'antd'
import { Line } from '@ant-design/plots'
import {
  FilterOutlined,
  ShareAltOutlined,
  ExportOutlined,
  PlusOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
} from '@ant-design/icons'
import {
  getRelationGraphData,
  getQuickLocateOptions,
  defaultRelationGraphFilter,
  relationTypeOptions,
  type RelationGraphNode,
  type RelationGraphEdge,
  type RelationGraphFilter,
} from '@/mock/relationGraph'
import styles from './index.module.css'

const NODE_WIDTH = 200
const NODE_HEIGHT = 64
const ROW_GAP = 40
// 三列布局：左 | 列间距 80 | 中 | 列间距 80 | 右，加大横向间距避免连线拥挤
const LEFT_X = 80
const COL_GAP = 80
const CENTER_X = LEFT_X + NODE_WIDTH + COL_GAP   // 80+200+80 = 360
const RIGHT_X = CENTER_X + NODE_WIDTH + COL_GAP  // 360+200+80 = 640
const CANVAS_W = RIGHT_X + NODE_WIDTH + LEFT_X   // 640+200+80 = 920
const CANVAS_H = 580

/** 三列布局：左 | 中 | 右，列间距 COL_GAP */
function layoutNodes(nodes: RelationGraphNode[], edges: RelationGraphEdge[], centerId: string) {
  const upstreamIds = new Set(edges.filter((e) => e.targetId === centerId).map((e) => e.sourceId))
  const downstreamIds = new Set(edges.filter((e) => e.sourceId === centerId).map((e) => e.targetId))
  const pos: Record<string, { x: number; y: number }> = {}
  const leftX = LEFT_X
  const centerX = CENTER_X
  const rightX = RIGHT_X
  const cx = centerX
  const cy = CANVAS_H / 2 - NODE_HEIGHT / 2
  pos[centerId] = { x: cx, y: cy }

  const upstream = [...upstreamIds]
  const downstream = [...downstreamIds]
  const topY = 80
  upstream.forEach((id, i) => {
    pos[id] = { x: leftX, y: topY + i * (NODE_HEIGHT + ROW_GAP) }
  })
  downstream.forEach((id, i) => {
    pos[id] = { x: rightX, y: topY + i * (NODE_HEIGHT + ROW_GAP) }
  })
  const rest = nodes.filter((n) => !pos[n.id])
  rest.forEach((n, i) => {
    if (pos[n.id]) return
    pos[n.id] = { x: rightX, y: topY + (downstream.length + i) * (NODE_HEIGHT + ROW_GAP) }
  })
  const bizId = edges.find((e) => e.relation === '基于')?.targetId
  if (bizId && pos[bizId]) {
    const appSysId = edges.find((e) => e.targetId === bizId)?.sourceId
    if (appSysId && pos[appSysId]) {
      pos[bizId] = { x: pos[appSysId].x, y: pos[appSysId].y + NODE_HEIGHT + ROW_GAP }
    }
  }
  return pos
}

/** 连线：同列走右侧竖线；跨列走带弧度的曲线。同目标同侧的边在目标侧分散端点，避免箭头叠在一起 */
const EDGE_GAP = 2
const SAME_COL_THRESHOLD = 100
const CURVE_OFFSET = 48
const TARGET_SPREAD_GAP = 10
function getEdgePathAndLabel(
  pos: Record<string, { x: number; y: number }>,
  sourceId: string,
  targetId: string,
  targetEndpointOffsetY: number = 0
): { path: string; labelX: number; labelY: number } {
  const s = pos[sourceId]
  const t = pos[targetId]
  if (!s || !t) return { path: '', labelX: 0, labelY: 0 }
  const srcCenterX = s.x + NODE_WIDTH / 2
  const tgtCenterX = t.x + NODE_WIDTH / 2
  const dx = tgtCenterX - srcCenterX
  const sameColumn = Math.abs(dx) < SAME_COL_THRESHOLD

  let path: string
  let labelX: number
  let labelY: number

  if (sameColumn) {
    const rightX = s.x + NODE_WIDTH + EDGE_GAP
    const x1 = rightX
    const y1 = s.y + NODE_HEIGHT / 2
    const x2 = rightX
    const y2 = t.y + NODE_HEIGHT / 2 + targetEndpointOffsetY
    const midY = (y1 + y2) / 2
    const arcOffset = Math.min(CURVE_OFFSET, Math.abs(y2 - y1) * 0.4)
    const cpx = rightX + arcOffset
    const cpy = midY
    path = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`
    const tMid = 0.5
    labelX = (1 - tMid) ** 2 * x1 + 2 * (1 - tMid) * tMid * cpx + tMid ** 2 * x2
    labelY = (1 - tMid) ** 2 * y1 + 2 * (1 - tMid) * tMid * cpy + tMid ** 2 * y2
  } else {
    const targetOnRight = dx > 0
    const y1 = s.y + NODE_HEIGHT / 2
    const y2 = t.y + NODE_HEIGHT / 2 + targetEndpointOffsetY
    const x1 = targetOnRight ? s.x + NODE_WIDTH + EDGE_GAP : s.x - EDGE_GAP
    const x2 = targetOnRight ? t.x - EDGE_GAP : t.x + NODE_WIDTH + EDGE_GAP
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) || 1
    const perpX = -(y2 - y1) / dist
    const perpY = (x2 - x1) / dist
    const cpx = midX + perpX * Math.min(CURVE_OFFSET, dist * 0.25)
    const cpy = midY + perpY * Math.min(CURVE_OFFSET, dist * 0.25)
    path = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`
    const tMid = 0.5
    labelX = (1 - tMid) ** 2 * x1 + 2 * (1 - tMid) * tMid * cpx + tMid ** 2 * x2
    labelY = (1 - tMid) ** 2 * y1 + 2 * (1 - tMid) * tMid * cpy + tMid ** 2 * y2
  }
  return { path, labelX, labelY }
}

/** 同目标、同侧的边在目标侧分散：返回每条边的 Y 方向偏移（使箭头不叠在一起） */
function getTargetEndpointOffsets(
  edges: RelationGraphEdge[],
  pos: Record<string, { x: number; y: number }>
): Record<string, number> {
  const out: Record<string, number> = {}
  const byTargetAndSide = new Map<string, string[]>()
  for (const e of edges) {
    const s = pos[e.sourceId]
    const t = pos[e.targetId]
    if (!s || !t) continue
    const srcCenterX = s.x + NODE_WIDTH / 2
    const tgtCenterX = t.x + NODE_WIDTH / 2
    const dx = tgtCenterX - srcCenterX
    const sameColumn = Math.abs(dx) < SAME_COL_THRESHOLD
    const key = sameColumn ? `${e.targetId}:col` : dx > 0 ? `${e.targetId}:left` : `${e.targetId}:right`
    const list = byTargetAndSide.get(key) ?? []
    list.push(e.id)
    byTargetAndSide.set(key, list)
  }
  byTargetAndSide.forEach((edgeIds) => {
    edgeIds.sort()
    const n = edgeIds.length
    if (n <= 1) return
    edgeIds.forEach((id, i) => {
      out[id] = (i - (n - 1) / 2) * TARGET_SPREAD_GAP
    })
  })
  return out
}

/** 按标题/分类选图标：服务器、应用系统、业务服务、数据库、存储等一一对应 */
function NodeIcon({ category }: { category: string }) {
  const c = category || ''
  if (c.includes('服务器') || c.includes('存储')) return <CloudServerOutlined className={styles.nodeIcon} />
  if (c.includes('数据库')) return <DatabaseOutlined className={styles.nodeIcon} />
  if (c.includes('业务服务')) return <ApiOutlined className={styles.nodeIcon} />
  if (c.includes('应用系统') || c.includes('应用前端') || c.includes('应用')) return <AppstoreOutlined className={styles.nodeIcon} />
  return <CloudOutlined className={styles.nodeIcon} />
}

const ciTypeOptions = [
  { label: '服务器', value: '服务器' },
  { label: '应用系统', value: '应用系统' },
  { label: '业务服务', value: '业务服务' },
  { label: '应用', value: '应用' },
  { label: '数据库', value: '数据库' },
  { label: '存储', value: '存储' },
]

export default function RelationGraph() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ciId = searchParams.get('id') ?? 'ci-detail-1'
  const ciName = searchParams.get('name') ?? '应用服务器'
  const categoryFromUrl = searchParams.get('category') ?? '服务器'
  const openFilterOnMount = searchParams.get('filter') === '1'

  const [focusCenter, setFocusCenter] = useState(true)
  const [roamMode, setRoamMode] = useState(false)
  const [changeImpact, setChangeImpact] = useState(false)
  const [enableMonitor, setEnableMonitor] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [filter, setFilter] = useState<RelationGraphFilter>(defaultRelationGraphFilter)
  const [zoom, setZoom] = useState(1)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: RelationGraphNode } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  /** 右键菜单触发的详情抽屉：类型 + 当前节点 */
  const [rightClickDrawer, setRightClickDrawer] = useState<{ type: 'ciInfo' | 'affected' | 'monitor' | 'alert'; node: RelationGraphNode } | null>(null)
  const [quickLocateValue, setQuickLocateValue] = useState<string>(ciId)
  const [newRelationOpen, setNewRelationOpen] = useState(false)
  const [newFromId, setNewFromId] = useState<string>(ciId)
  const [newToId, setNewToId] = useState<string>(ciId)
  const [newRelationVerb, setNewRelationVerb] = useState<string>(relationTypeOptions[0]?.value ?? '')

  const [graphData, setGraphData] = useState(() => getRelationGraphData(ciId, ciName, categoryFromUrl))

  useEffect(() => {
    setGraphData(getRelationGraphData(ciId, ciName, categoryFromUrl))
    setNewFromId(ciId)
    setNewToId(ciId)
    setNewRelationVerb(relationTypeOptions[0]?.value ?? '')
  }, [ciId, ciName, categoryFromUrl])

  const nodes = graphData.nodes
  const edges = graphData.edges

  /** 确保快速定位值在节点列表中，否则 layout 不赋位置导致关系图不渲染 */
  useEffect(() => {
    if (nodes.length === 0) return
    const hasCenter = nodes.some((n) => n.id === quickLocateValue)
    if (!hasCenter) setQuickLocateValue(ciId)
  }, [nodes, ciId, quickLocateValue])

  const nodeOptions = useMemo(() => nodes.map((n) => ({ value: n.id, label: n.name })), [nodes])

  const pos = useMemo(() => layoutNodes(nodes, edges, quickLocateValue), [nodes, edges, quickLocateValue])
  const quickLocateOptions = useMemo(() => getQuickLocateOptions(ciId, ciName), [ciId, ciName])
  const isCurrentNode = (nodeId: string) => nodeId === ciId

  useEffect(() => {
    if (openFilterOnMount) setFilterDrawerOpen(true)
  }, [openFilterOnMount])

  // 仅左键点击时关闭右键菜单，避免右键触发的 click 把菜单关掉
  useEffect(() => {
    const onClose = (e: MouseEvent) => {
      if (e.button === 0) setContextMenu(null)
    }
    window.addEventListener('click', onClose)
    return () => window.removeEventListener('click', onClose)
  }, [])

  const handleShare = () => message.success('分享链接已复制到剪贴板')
  const handleExport = () => message.success('关系图导出功能开发中')
  const handleNewRelation = () => {
    setNewFromId(ciId)
    setNewToId(ciId)
    setNewRelationVerb(relationTypeOptions[0]?.value ?? '')
    setNewRelationOpen(true)
  }

  const handleCreateRelation = () => {
    if (!newFromId || !newToId) {
      message.warning('请选择起点与终点')
      return
    }
    if (newFromId === newToId) {
      message.warning('起点与终点不能相同')
      return
    }
    if (!newRelationVerb) {
      message.warning('请选择关系类型')
      return
    }
    setGraphData((prev) => ({
      ...prev,
      edges: [
        ...prev.edges,
        {
          id: `e-new-${Date.now()}`,
          sourceId: newFromId,
          targetId: newToId,
          relation: newRelationVerb,
        },
      ],
    }))
    setNewRelationOpen(false)
    message.success('关系已新增（mock）')
  }
  const handleFilterConfirm = () => {
    setFilterDrawerOpen(false)
    message.success('过滤条件已应用')
  }
  const handleViewCI = (node: RelationGraphNode) => {
    setContextMenu(null)
    if (node.id === ciId) {
      navigate(`/config/ci-detail?id=${ciId}`)
      return
    }
    setRightClickDrawer({ type: 'ciInfo', node })
  }

  /** 以 node 为起点，从图中计算下游/上游受影响的配置项 */
  const getAffectedByNode = (nodeId: string) => {
    const downstream = edges.filter((e) => e.sourceId === nodeId).map((e) => ({ targetId: e.targetId, relation: e.relation }))
    const upstream = edges.filter((e) => e.targetId === nodeId).map((e) => ({ sourceId: e.sourceId, relation: e.relation }))
    const downstreamNodes = downstream.map(({ targetId, relation }) => {
      const n = nodes.find((x) => x.id === targetId)
      return { id: targetId, name: n?.name ?? targetId, category: n?.category ?? '-', direction: '下游', relation }
    })
    const upstreamNodes = upstream.map(({ sourceId, relation }) => {
      const n = nodes.find((x) => x.id === sourceId)
      return { id: sourceId, name: n?.name ?? sourceId, category: n?.category ?? '-', direction: '上游', relation }
    })
    return [...downstreamNodes, ...upstreamNodes]
  }

  const handleOpenAffected = (node: RelationGraphNode) => {
    setContextMenu(null)
    setRightClickDrawer({ type: 'affected', node })
  }

  /** Mock：按配置项 id 生成关键监控指标（百分比 + 趋势数据，用于图表） */
  const getMockMetrics = (_nodeId: string) => {
    const percentMetrics = [
      { name: 'CPU 使用率', percent: 42, status: 'normal' as const },
      { name: '内存使用率', percent: 68, status: 'normal' as const },
      { name: '磁盘使用率', percent: 55, status: 'normal' as const },
    ]
    const trendData = [
      { time: '00:00', value: 8.2 }, { time: '02:00', value: 9.1 }, { time: '04:00', value: 7.5 },
      { time: '06:00', value: 10.2 }, { time: '08:00', value: 14.1 }, { time: '10:00', value: 12.5 },
      { time: '12:00', value: 11.8 }, { time: '14:00', value: 13.2 }, { time: '16:00', value: 12.5 },
      { time: '18:00', value: 15.1 }, { time: '20:00', value: 11.2 }, { time: '22:00', value: 9.8 },
    ]
    const qpsTrendData = [
      { time: '00:00', value: 800 }, { time: '02:00', value: 600 }, { time: '04:00', value: 400 },
      { time: '06:00', value: 900 }, { time: '08:00', value: 1400 }, { time: '10:00', value: 1200 },
      { time: '12:00', value: 1100 }, { time: '14:00', value: 1300 }, { time: '16:00', value: 1250 },
      { time: '18:00', value: 1500 }, { time: '20:00', value: 1150 }, { time: '22:00', value: 950 },
    ]
    return { percentMetrics, trendData, qpsTrendData }
  }

  const handleOpenMonitor = (node: RelationGraphNode) => {
    setContextMenu(null)
    setRightClickDrawer({ type: 'monitor', node })
  }

  /** Mock：按配置项 id 生成告警列表 */
  const getMockAlerts = (_nodeId: string) => [
    { id: '1', level: 'warning', message: 'CPU 使用率持续偏高', time: '2025-03-10 09:15' },
    { id: '2', level: 'info', message: '磁盘空间即将达到阈值', time: '2025-03-10 08:30' },
  ]

  const handleOpenAlerts = (node: RelationGraphNode) => {
    setContextMenu(null)
    setRightClickDrawer({ type: 'alert', node })
  }

  const hasEdgeWithCenter = (nodeId: string) =>
    edges.some((e) => (e.sourceId === nodeId && e.targetId === ciId) || (e.sourceId === ciId && e.targetId === nodeId))

  const handleDeleteRelationWithNode = (nodeId: string) => {
    const hasEdge = hasEdgeWithCenter(nodeId)
    setContextMenu(null)
    // 延迟一帧再弹确认框，避免菜单卸载导致弹窗不出现
    setTimeout(() => {
      if (!hasEdge) {
        message.warning('该节点与当前中心无直接关系，无需删除')
        return
      }
      Modal.confirm({
        title: '确认删除关系',
        content: '确定要删除该配置项与当前中心之间的直接关系吗？删除后关系图中将不再显示该连线。',
        okText: '确定删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          setGraphData((prev) => ({
            ...prev,
            edges: prev.edges.filter((e) => !((e.sourceId === nodeId && e.targetId === ciId) || (e.sourceId === ciId && e.targetId === nodeId))),
          }))
          message.success('已删除与当前中心的关系')
        },
      })
    }, 0)
  }

  const endpointOffsets = useMemo(() => getTargetEndpointOffsets(edges, pos), [edges, pos])

  const svgContent = useMemo(() => (
    <svg
      className={styles.graphSvg}
      width={CANVAS_W}
      height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* 未高亮：箭头与线一致为灰色（与关系建模一致） */}
        <marker id="arrowhead-gray" markerWidth={12} markerHeight={10} refX={10} refY={5} orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0 0, 10 5, 0 10" fill="#bfbfbf" />
        </marker>
        {/* 高亮时：箭头与线一致为蓝色 */}
        <marker id="arrowhead-blue" markerWidth={12} markerHeight={10} refX={10} refY={5} orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0 0, 10 5, 0 10" fill="#1890ff" />
        </marker>
      </defs>
      <g>
        {edges.map((e) => {
          const offsetY = endpointOffsets[e.id] ?? 0
          const { path, labelX, labelY } = getEdgePathAndLabel(pos, e.sourceId, e.targetId, offsetY)
          if (!path) return null
          const isHighlighted = hoveredNodeId != null && (e.sourceId === hoveredNodeId || e.targetId === hoveredNodeId)
          const markerId = isHighlighted ? 'arrowhead-blue' : 'arrowhead-gray'
          return (
            <g key={e.id}>
              {/* key 随高亮变化强制重挂载，保证 marker 与 stroke 同步高亮（与关系建模一致） */}
              <path
                key={`${e.id}-stroke-${isHighlighted}`}
                d={path}
                stroke={isHighlighted ? '#1890ff' : '#bfbfbf'}
                strokeWidth={isHighlighted ? 2 : 1}
                fill="none"
                markerEnd={`url(#${markerId})`}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={isHighlighted ? styles.edgeLabelHighlight : styles.edgeLabel}
              >
                {e.relation}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  ), [edges, pos, endpointOffsets, hoveredNodeId])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>{ciName}关系图</h2>
        <div className={styles.toolbar}>
          <Select
            className={styles.quickLocate}
            placeholder="快速定位"
            value={quickLocateValue}
            onChange={setQuickLocateValue}
            options={quickLocateOptions.map((o) => ({ value: o.id, label: `${o.name}（${o.category}）` }))}
          />
          <div className={styles.toolbarToggles}>
            <label>
              <input type="checkbox" checked={changeImpact} onChange={(e) => setChangeImpact(e.target.checked)} />
              变更影响分析
            </label>
            <label>
              <input type="checkbox" checked={enableMonitor} onChange={(e) => setEnableMonitor(e.target.checked)} />
              启用监控
            </label>
            <label>
              <input type="checkbox" checked={focusCenter} onChange={(e) => setFocusCenter(e.target.checked)} />
              聚焦居中
            </label>
            <label>
              <input type="checkbox" checked={roamMode} onChange={(e) => setRoamMode(e.target.checked)} />
              漫游模式
            </label>
          </div>
          <div className={styles.toolbarActions}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewRelation}>
              新建
            </Button>
            <Button icon={<FilterOutlined />} onClick={() => setFilterDrawerOpen(true)}>
              过滤设置
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <div className={styles.graphContent}>
          <div
            className={styles.graphScaledWrap}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {svgContent}
            <div className={styles.graphNodes} style={{ width: CANVAS_W, height: CANVAS_H }}>
              {nodes.map((node) => {
                const p = pos[node.id]
                if (!p) return null
                const isCurrent = isCurrentNode(node.id)
                const nodeClass = `${styles.node} ${isCurrent ? styles.nodeCenter : styles.nodeOther}`
                return (
                  <div
                    key={node.id}
                    className={nodeClass}
                    style={{ left: p.x, top: p.y }}
                    onClick={() => setQuickLocateValue(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({ x: e.clientX, y: e.clientY, node })
                    }}
                  >
                    <div className={styles.nodeIconWrap}>
                      <NodeIcon category={node.category} />
                    </div>
                    <div className={styles.nodeText}>
                      <div className={styles.nodeName}>
                        {node.name}
                        {isCurrent && <span className={styles.currentTag}>当前</span>}
                      </div>
                      <div className={styles.nodeCategory}>{node.category}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {contextMenu && (
          <div
            className={styles.nodeMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.nodeMenuItem} onClick={() => handleViewCI(contextMenu.node)}>
              查看配置项信息
            </button>
            <button type="button" className={styles.nodeMenuItem} onClick={() => handleOpenAffected(contextMenu.node)}>
              查看受影响的配置项
            </button>
            <button type="button" className={styles.nodeMenuItem} onClick={() => handleOpenMonitor(contextMenu.node)}>
              关键监控指标
            </button>
            <button type="button" className={styles.nodeMenuItem} onClick={() => handleOpenAlerts(contextMenu.node)}>
              查看警告信息
            </button>
            <button
              type="button"
              className={styles.nodeMenuItem}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRelationWithNode(contextMenu.node.id) }}
            >
              删除与当前中心的关系
            </button>
          </div>
        )}

        <Modal
          title="新建关系（mock）"
          open={newRelationOpen}
          onCancel={() => setNewRelationOpen(false)}
          onOk={handleCreateRelation}
          okText="确定"
          cancelText="取消"
          width={520}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#262626', fontWeight: 600 }}>起点（源）</div>
            <Select
              value={newFromId}
              onChange={setNewFromId}
              options={nodeOptions}
              showSearch
              optionFilterProp="label"
            />
            <div style={{ color: '#262626', fontWeight: 600 }}>终点（目标）</div>
            <Select
              value={newToId}
              onChange={setNewToId}
              options={nodeOptions}
              showSearch
              optionFilterProp="label"
            />
            <div style={{ color: '#262626', fontWeight: 600 }}>关系类型</div>
            <Select
              value={newRelationVerb}
              onChange={setNewRelationVerb}
              options={relationTypeOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>
        </Modal>

        <div className={styles.zoomBar}>
          <Button type="text" icon={<ExpandOutlined />} title="适应画布" onClick={() => setZoom(1)} />
          <Button type="text" icon={<ZoomInOutlined />} title="放大" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} />
          <Button type="text" icon={<ZoomOutOutlined />} title="缩小" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} />
        </div>
      </div>

      <Drawer
        title="过滤设置"
        placement="right"
        width={360}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setFilterDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleFilterConfirm}>确定</Button>
          </div>
        }
      >
        <div className={styles.filterDrawerSection}>
          <div className={styles.filterDrawerSectionTitle}>展示的 CI 类型</div>
          <Checkbox.Group
            value={filter.ciTypes}
            onChange={(vals) => setFilter((f) => ({ ...f, ciTypes: vals as string[] }))}
            options={ciTypeOptions}
          />
        </div>
        <div className={styles.filterDrawerSection}>
          <div className={styles.filterDrawerSectionTitle}>展示的关系类型</div>
          <Checkbox.Group
            value={filter.relationTypes}
            onChange={(vals) => setFilter((f) => ({ ...f, relationTypes: vals as string[] }))}
            options={relationTypeOptions.map((o) => ({ label: o.label, value: o.value }))}
          />
        </div>
        <div className={styles.filterDrawerSection}>
          <div className={styles.filterDrawerSectionTitle}>层级深度：{filter.depth}</div>
          <Slider min={1} max={5} value={filter.depth} onChange={(v) => setFilter((f) => ({ ...f, depth: v ?? 3 }))} />
        </div>
        <div className={styles.filterDrawerSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>显示业务友好名称</span>
            <Switch checked={filter.useDisplayName} onChange={(v) => setFilter((f) => ({ ...f, useDisplayName: v }))} />
          </div>
        </div>
      </Drawer>

      {/* 右键菜单触发的详情抽屉：配置项信息 / 受影响配置项 / 监控指标 / 警告信息 */}
      <Drawer
        title={
          rightClickDrawer
            ? rightClickDrawer.type === 'ciInfo'
              ? `配置项信息 - ${rightClickDrawer.node.name}`
              : rightClickDrawer.type === 'affected'
                ? `受影响的配置项 - ${rightClickDrawer.node.name}`
                : rightClickDrawer.type === 'monitor'
                  ? `关键监控指标 - ${rightClickDrawer.node.name}`
                  : `警告信息 - ${rightClickDrawer.node.name}`
            : ''
        }
        placement="right"
        width={480}
        open={!!rightClickDrawer}
        onClose={() => setRightClickDrawer(null)}
        destroyOnClose
      >
        {rightClickDrawer?.type === 'ciInfo' && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="名称">{rightClickDrawer.node.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{rightClickDrawer.node.category}</Descriptions.Item>
            <Descriptions.Item label="ID">{rightClickDrawer.node.id}</Descriptions.Item>
            <Descriptions.Item label="说明">该配置项在关系图中的简要信息；完整详情请从「配置项管理」进入查看。</Descriptions.Item>
          </Descriptions>
        )}
        {rightClickDrawer?.type === 'affected' && (() => {
          const list = getAffectedByNode(rightClickDrawer.node.id)
          if (list.length === 0) {
            return <Empty description="暂无上下游关联配置项（或未加载到当前图中）" />
          }
          return (
            <div>
              <p style={{ color: '#666', marginBottom: 12 }}>
                该配置项故障或变更时，以下配置项可能受影响（基于当前关系图）。
              </p>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '方向', dataIndex: 'direction', width: 64, render: (d) => (d === '下游' ? <Tag color="blue">下游</Tag> : <Tag color="green">上游</Tag>) },
                  { title: '名称', dataIndex: 'name' },
                  { title: '类型', dataIndex: 'category', width: 100 },
                  { title: '关系', dataIndex: 'relation', width: 80 },
                ]}
                dataSource={list}
              />
            </div>
          )
        })()}
        {rightClickDrawer?.type === 'monitor' && (() => {
          const { percentMetrics, trendData, qpsTrendData } = getMockMetrics(rightClickDrawer.node.id)
          const lineConfig = (data: { time: string; value: number }[]) => ({
            data,
            xField: 'time',
            yField: 'value',
            height: 120,
            autoFit: true,
            smooth: true,
            axis: { y: { grid: true }, x: { labelAutoRotate: true } },
          })
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {percentMetrics.map((m, i) => (
                  <div key={i} style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ color: '#262626', fontWeight: 500, marginBottom: 8, fontSize: 13 }}>{m.name}</div>
                    <Progress
                      type="circle"
                      percent={m.percent}
                      size={80}
                      strokeColor={m.percent > 80 ? '#ff4d4f' : m.percent > 60 ? '#faad14' : '#52c41a'}
                      format={() => `${m.percent}%`}
                    />
                  </div>
                ))}
              </div>
              <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ color: '#262626', fontWeight: 500, marginBottom: 8 }}>网络入带宽（Mbps）</div>
                <Line {...lineConfig(trendData)} />
              </div>
              <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ color: '#262626', fontWeight: 500, marginBottom: 8 }}>QPS（请求/秒）</div>
                <Line {...lineConfig(qpsTrendData)} />
              </div>
            </div>
          )
        })()}
        {rightClickDrawer?.type === 'alert' && (() => {
          const alerts = getMockAlerts(rightClickDrawer.node.id)
          if (alerts.length === 0) {
            return <Empty description="当前无告警" />
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a) => (
                <div key={a.id} style={{ padding: 12, background: a.level === 'warning' ? '#fffbe6' : '#f0f5ff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                  <Tag color={a.level === 'warning' ? 'orange' : 'blue'}>{a.level}</Tag>
                  <div style={{ marginTop: 6 }}>{a.message}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>{a.time}</div>
                </div>
              ))}
            </div>
          )
        })()}
      </Drawer>
    </div>
  )
}
