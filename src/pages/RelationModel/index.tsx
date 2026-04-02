import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button, Table, Space, Tooltip, Modal, Form, Input, Select, Switch, message, Drawer, Tag, Slider, Checkbox, Menu } from 'antd'
import { QuestionCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, RollbackOutlined, SafetyCertificateOutlined, AimOutlined, ExportOutlined, HistoryOutlined, SyncOutlined, FilterOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import {
  relationModelListMock,
  RELATION_MODEL_CLASS_OPTIONS,
  RELATION_MODEL_VERB_OPTIONS,
  RELATION_LINK_FIELD_OPTIONS,
  runTopologyValidation,
  aiRelationRecommendationsMock,
  type RelationModelRecord,
  type AiRelationRecommendation,
} from '@/mock/relationModel'
import { DepNodeIcon } from '@/components/DepNodeIcon'
import styles from './index.module.css'

type ViewMode = 'list' | 'graph'

const GLOBAL_NODE_W = 160
const GLOBAL_NODE_H = 52
const GLOBAL_HW = GLOBAL_NODE_W / 2
const GLOBAL_HH = GLOBAL_NODE_H / 2
/** 层间距：节点宽 160 + 空隙 80 */
const LAYER_DX = 160 + 80
// 同层纵向间距：100
const ROW_DY = 100
const MARGIN_X = 24
const MARGIN_Y = 48

/** 分层左→右时统一用侧边上下居中：起点=源节点右侧边中点，终点=目标节点左侧边中点（参考企业运维平台关系图） */
function getLayeredEdgeEndpoints(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x1: number; y1: number; x2: number; y2: number } {
  const x1 = from.x + GLOBAL_HW
  const y1 = from.y
  const x2 = to.x - GLOBAL_HW
  const y2 = to.y
  return { x1, y1, x2, y2 }
}

/** 分层布局（左→右）：有直接连线的节点按前驱 y 排序，使如集群/集群节点靠近，减少长横线 */
function useLayeredLayout(enabled: RelationModelRecord[]) {
  return useMemo(() => {
    const nodes = new Set<string>()
    enabled.forEach((r) => { nodes.add(r.leftClass); nodes.add(r.rightClass) })
    const list = Array.from(nodes)
    const incoming = new Map<string, Set<string>>()
    list.forEach((n) => incoming.set(n, new Set()))
    enabled.forEach((r) => incoming.get(r.rightClass)?.add(r.leftClass))
    const layers = new Map<string, number>()
    list.forEach((n) => layers.set(n, 0))
    let changed = true
    const maxIter = Math.max(list.length + 2, 100)
    let iter = 0
    while (changed && iter < maxIter) {
      iter++
      changed = false
      list.forEach((n) => {
        const preds = incoming.get(n)!
        if (preds.size === 0) return
        const maxPred = Math.max(0, ...Array.from(preds).map((p) => layers.get(p) ?? 0))
        const newL = Math.min(maxPred + 1, list.length)
        if (newL > (layers.get(n) ?? 0)) { layers.set(n, newL); changed = true }
      })
    }
    list.forEach((n) => {
      const L = layers.get(n) ?? 0
      if (L > list.length) layers.set(n, list.length)
    })
    if (layers.get('集群') != null && layers.get('集群节点') != null) {
      layers.set('集群', layers.get('集群节点')!)
    }
    // 与容器节点同「距离」：以下节点与 MySQL数据库 同层，和容器节点到 MySQL 的层距一致
    const sameLayerAsMysql = new Set([
      '集群节点', '集群', '内存模块', '存储设备', 'ESX服务器', '交换机', '路由器', 'NAS', '虚拟服务器', '物理服务器',
    ])
    const mysqlLayer = layers.get('MySQL数据库')
    if (mysqlLayer != null) {
      sameLayerAsMysql.forEach((name) => {
        if (layers.has(name)) layers.set(name, mysqlLayer)
      })
    }
    const byLayer = new Map<number, string[]>()
    list.forEach((n) => {
      const L = layers.get(n) ?? 0
      if (!byLayer.has(L)) byLayer.set(L, [])
      byLayer.get(L)!.push(n)
    })
    const maxLayer = Math.max(0, ...byLayer.keys())
    const pos: Record<string, { x: number; y: number }> = {}
    let graphW = MARGIN_X * 2
    let graphH = MARGIN_Y * 2
    for (let L = 0; L <= maxLayer; L++) {
      let names = byLayer.get(L) ?? []
      if (L === 0) {
        names = [...names].sort()
      } else {
        const avgY = (predSet: Set<string>) => {
          const arr = Array.from(predSet)
          if (arr.length === 0) return 0
          return arr.reduce((s, p) => s + (pos[p]?.y ?? 0), 0) / arr.length
        }
        names = [...names].sort((a, b) => {
          if (a === '集群节点' && b !== '集群节点') return -1
          if (b === '集群节点' && a !== '集群节点') return 1
          if (a === '集群' && b !== '集群') return -1
          if (b === '集群' && a !== '集群') return 1
          const predsA = incoming.get(a)!
          const predsB = incoming.get(b)!
          return avgY(predsA) - avgY(predsB)
        })
      }
      const startX = MARGIN_X + L * LAYER_DX
      graphW = Math.max(graphW, startX + GLOBAL_NODE_W + MARGIN_X)
      names.forEach((name, i) => {
        const y = MARGIN_Y + i * ROW_DY
        pos[name] = { x: startX + GLOBAL_HW, y: y + GLOBAL_HH }
        graphH = Math.max(graphH, y + GLOBAL_NODE_H + MARGIN_Y)
      })
    }
    const nodeLayer: Record<string, number> = {}
    list.forEach((n) => { nodeLayer[n] = layers.get(n) ?? 0 })
    const safeW = Number.isFinite(graphW) && graphW > 0 ? graphW : 800
    const safeH = Number.isFinite(graphH) && graphH > 0 ? graphH : 600
    return { nodePos: pos, uniqueClasses: list, graphW: safeW, graphH: safeH, nodeLayer }
  }, [enabled])
}

function simpleHash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

function formatMockDateTime(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function buildRelationHistoryModel(baseList: RelationModelRecord[], steps: number = 4): { snapshots: RelationModelRecord[][]; labels: string[] } {
  const now = Date.now()
  const labels: string[] = []
  const snapshots: RelationModelRecord[][] = []
  for (let s = 0; s < steps; s++) {
    const timeMs = now - (steps - 1 - s) * 1000 * 60 * 60 * 6 // 每步 6 小时
    labels.push(formatMockDateTime(timeMs))
    const isCurrentSnapshot = s === steps - 1
    const next = baseList.map((r) => {
      // 当前快照保留 list 的 enabled，不应用 flip，使「应用所选矫正」生效
      if (isCurrentSnapshot) {
        return { ...r, updateTime: labels[s] }
      }
      const seed = simpleHash(`${r.id}|${s}`)
      const flip = seed % 7 === 0 || seed % 11 === 0
      return {
        ...r,
        enabled: r.enabled && !flip,
        updateTime: labels[s],
      }
    })
    snapshots.push(next)
  }
  return { snapshots, labels }
}

type RepairAction = {
  id: string
  edgeId: string
  nextEnabled: boolean
  title: string
  detail?: string
}

/** 全局关系图：分层从左到右布局；悬停连线时高亮；支持节点拖拽与还原布局；右键节点显示新建/删除 */
function GlobalRelationGraph({
  list,
  onChangeList,
  onNodeContextMenu,
}: {
  list: RelationModelRecord[]
  onChangeList: (next: RelationModelRecord[] | ((prev: RelationModelRecord[]) => RelationModelRecord[])) => void
  onNodeContextMenu?: (nodeName: string, clientX: number, clientY: number) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const [hoveredEdge, setHoveredEdge] = useState<RelationModelRecord | null>(null)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const dragRef = useRef<{ nodeName: string; startPos: { x: number; y: number }; startClient: { x: number; y: number } } | null>(null)

  const HISTORY_STEPS = 4
  const [timeModel, setTimeModel] = useState(() => buildRelationHistoryModel(list, HISTORY_STEPS))
  const [timeIndex, setTimeIndex] = useState(HISTORY_STEPS - 1)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)

  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false)
  const [roleViewEnabled, setRoleViewEnabled] = useState(false)
  const [roleKey, setRoleKey] = useState<'运维' | '开发' | '安全'>('运维')

  useEffect(() => {
    const nextTimeModel = buildRelationHistoryModel(list, HISTORY_STEPS)
    setTimeModel(nextTimeModel)
    setTimeIndex(Math.max(0, nextTimeModel.snapshots.length - 1))
  }, [list])

  const roleAllowedClasses = useMemo(() => {
    return {
      运维: new Set([
        '物理服务器',
        '虚拟服务器',
        'ESX服务器',
        '集群',
        '集群节点',
        'K8s集群',
        '容器节点',
        '交换机',
        '路由器',
        'NAS',
        '内存模块',
        '存储设备',
        'Pod',
        'Deployment',
        'Service',
        '容器',
      ]),
      开发: new Set([
        '应用',
        '微服务',
        'API服务',
        '网关',
        '负载均衡',
        '中间件',
        '消息队列',
        'Redis',
        '数据库',
        'MySQL数据库',
        'Oracle数据库',
        '数据源',
        '对象存储',
        'K8s集群',
        'Deployment',
        'Pod',
        'Service',
        '容器',
        '容器节点',
        '集群',
        '集群节点',
      ]),
      安全: new Set([
        '应用',
        '微服务',
        'API服务',
        '网关',
        '中间件',
        '数据库',
        'MySQL数据库',
        'Oracle数据库',
        'Redis',
        '数据源',
        '对象存储',
        'NAS',
        '交换机',
        '路由器',
        'K8s集群',
        '集群',
        '集群节点',
      ]),
    }
  }, [])

  const baseListForTime = timeModel.snapshots[timeIndex] ?? list
  const displayedList = useMemo(() => {
    if (!roleViewEnabled) return baseListForTime
    const allowed = roleAllowedClasses[roleKey]
    return baseListForTime.map((r) => ({
      ...r,
      enabled: r.enabled && allowed.has(r.leftClass) && allowed.has(r.rightClass),
    }))
  }, [baseListForTime, roleViewEnabled, roleKey, roleAllowedClasses])

  const enabled = useMemo(() => displayedList.filter((r) => r.enabled), [displayedList])
  const { nodePos, uniqueClasses, graphW, graphH, nodeLayer } = useLayeredLayout(enabled)
  const safeGraphW = Math.max(400, graphW)
  const safeGraphH = Math.max(400, graphH)
  const [validationDrawerOpen, setValidationDrawerOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const focusHop = 2
  const svgRef = useRef<SVGSVGElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const nodesContainerRef = useRef<HTMLDivElement>(null)
  const sameColumnClasses = useMemo(
    () =>
      new Set([
        '集群节点',
        '集群',
        '内存模块',
        '存储设备',
        'ESX服务器',
        '交换机',
        '路由器',
        'NAS',
        '虚拟服务器',
        '物理服务器',
      ]),
    []
  )

  // FIX: 节点移动同步 — 用实时位置计算连线，不缓存坐标；拖拽更新 positionOverrides → effectiveNodePos 重算 → 所有 path 重绘
  const effectiveNodePos = useMemo(() => {
    const r: Record<string, { x: number; y: number }> = {}
    uniqueClasses.forEach((n) => {
      r[n] = positionOverrides[n] ?? nodePos[n] ?? { x: 0, y: 0 }
    })
    return r
  }, [nodePos, positionOverrides, uniqueClasses])

  useEffect(() => {
    if (!draggingNode) return
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const z = zoomRef.current || 1
      setPositionOverrides((prev) => ({
        ...prev,
        [d.nodeName]: {
          x: d.startPos.x + (e.clientX - d.startClient.x) / z,
          y: d.startPos.y + (e.clientY - d.startClient.y) / z,
        },
      }))
    }
    const onUp = () => {
      setDraggingNode(null)
      dragRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [draggingNode])

  const handleFit = useCallback(() => {
    if (!wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    if (!Number.isFinite(graphW) || !Number.isFinite(graphH) || graphW <= 0 || graphH <= 0) return
    const scale = Math.min(r.width / graphW, r.height / graphH, 1.1)
    if (!Number.isFinite(scale)) return
    setZoom(Math.max(0.4, Math.min(scale, 2)))
  }, [graphW, graphH])

  const fitOnMountRef = useRef(false)
  useEffect(() => {
    if (fitOnMountRef.current || uniqueClasses.length === 0) return
    fitOnMountRef.current = true
    const t = setTimeout(handleFit, 150)
    return () => clearTimeout(t)
  }, [uniqueClasses.length, handleFit])

  const handleRestoreLayout = useCallback(() => {
    setPositionOverrides({})
  }, [])

  const handleSyncFromCollector = useCallback(() => {
    if (syncLoading) return
    setSyncLoading(true)
    const start = Date.now()
    message.loading('正在从 CMDB 采集器同步...', 0)
    window.setTimeout(() => {
      try {
        const nowStr = formatMockDateTime(start)
        const seed = simpleHash(nowStr)
        const base = baseListForTime
        // mock 同步：在当前时间快照基础上，随机“启用/关闭”少量关系
        const nextList = base.map((r, idx) => {
          const h = simpleHash(`${r.id}|sync|${seed}|${idx}`)
          const flip = h % 5 === 0
          return {
            ...r,
            enabled: r.enabled ? !flip : flip,
            updateTime: nowStr,
          }
        })
        const nextTimeModel = buildRelationHistoryModel(nextList, HISTORY_STEPS)
        setTimeModel(nextTimeModel)
        setTimeIndex(Math.max(0, nextTimeModel.snapshots.length - 1))
        message.success('同步完成')
      } finally {
        setSyncLoading(false)
      }
    }, 900)
  }, [syncLoading, baseListForTime, HISTORY_STEPS])

  // onDrag: 拖拽时用 effectiveNodePos 实时位置，updateConnectionPath 由上方 enabled.map + effectiveNodePos 自动完成
  const handleNodeMouseDown = useCallback((name: string, e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const p = effectiveNodePos[name]
    if (!p) return
    dragRef.current = { nodeName: name, startPos: { ...p }, startClient: { x: e.clientX, y: e.clientY } }
    setDraggingNode(name)
  }, [effectiveNodePos])

  const didDragRef = useRef(false)
  const handleNodeClick = useCallback((name: string) => {
    if (didDragRef.current) { didDragRef.current = false; return }
    setSelectedNode((prev) => (prev === name ? null : name))
  }, [])
  useEffect(() => {
    if (!draggingNode) return
    const onUp = () => { didDragRef.current = true }
    document.addEventListener('mouseup', onUp, { once: true })
    return () => document.removeEventListener('mouseup', onUp)
  }, [draggingNode])

  const validationResult = useMemo(
    () => (validationDrawerOpen ? runTopologyValidation(enabled) : { cycles: [], noIncoming: [], noOutgoing: [] }),
    [validationDrawerOpen, enabled]
  )

  const [selectedRepairActionIds, setSelectedRepairActionIds] = useState<string[]>([])

  useEffect(() => {
    if (!validationDrawerOpen) return
    setSelectedRepairActionIds([])
  }, [validationDrawerOpen])

  const repairActions = useMemo<RepairAction[]>(() => {
    if (!validationDrawerOpen) return []
    const enabledEdges = displayedList.filter((r) => r.enabled)
    const disabledEdges = displayedList.filter((r) => !r.enabled)
    const actions: RepairAction[] = []

    const findEnabledEdgeId = (from: string, to: string) =>
      enabledEdges.find((r) => r.leftClass === from && r.rightClass === to)?.id

    const findDisabledIncomingEdgeId = (to: string) =>
      disabledEdges.find((r) => r.rightClass === to)?.id

    const findDisabledOutgoingEdgeId = (from: string) =>
      disabledEdges.find((r) => r.leftClass === from)?.id

    // 规则 1：循环依赖 -> 禁用其中一条参与环路的边（人机协同：用户可选择执行）
    for (const cycle of validationResult.cycles) {
      if (cycle.length < 2) continue
      let pushed = false
      for (let i = 0; i < cycle.length - 1; i++) {
        const from = cycle[i]
        const to = cycle[i + 1]
        const edgeId = findEnabledEdgeId(from, to)
        if (edgeId) {
          actions.push({
            id: `cycle-disable-${edgeId}`,
            edgeId,
            nextEnabled: false,
            title: `修复循环：禁用 ${from} -> ${to}`,
            detail: '将该关系对暂时禁用以打断环路（建议确认后应用）。',
          })
          pushed = true
          break
        }
      }
      if (pushed) continue
    }

    // 规则 2：无入度节点 -> 启用一条指向该节点的关系
    for (const node of validationResult.noIncoming) {
      const edgeId = findDisabledIncomingEdgeId(node)
      if (!edgeId) continue
      actions.push({
        id: `no-in-${edgeId}`,
        edgeId,
        nextEnabled: true,
        title: `补入度：启用指向 ${node} 的关系`,
        detail: '启用一条目前未生效的关系对，让该节点获得入边。',
      })
    }

    // 规则 3：无出度节点 -> 启用一条从该节点出发的关系
    for (const node of validationResult.noOutgoing) {
      const edgeId = findDisabledOutgoingEdgeId(node)
      if (!edgeId) continue
      actions.push({
        id: `no-out-${edgeId}`,
        edgeId,
        nextEnabled: true,
        title: `补出度：启用从 ${node} 出发的关系`,
        detail: '启用一条目前未生效的关系对，让该节点具有出边。',
      })
    }

    // 去重（同一条边可能被多个规则命中）
    const seen = new Set<string>()
    const uniq = actions.filter((a) => {
      if (seen.has(a.edgeId + ':' + a.nextEnabled)) return false
      seen.add(a.edgeId + ':' + a.nextEnabled)
      return true
    })
    return uniq
  }, [validationDrawerOpen, displayedList, validationResult])

  const handleApplyRepairActions = useCallback(() => {
    if (selectedRepairActionIds.length === 0) return
    const idSet = new Set(selectedRepairActionIds)
    const actionMap = new Map<string, RepairAction>()
    repairActions.forEach((a) => {
      if (idSet.has(a.id)) actionMap.set(a.edgeId, a)
    })
    onChangeList((prev) =>
      prev.map((r) => {
        const act = actionMap.get(r.id)
        if (!act) return r
        return { ...r, enabled: act.nextEnabled }
      })
    )
    message.success('已应用所选矫正建议（规则驱动，需人工确认）')
    setSelectedRepairActionIds([])
  }, [selectedRepairActionIds, repairActions, onChangeList])

  const focusNodes = useMemo(() => {
    if (!selectedNode) return new Set(uniqueClasses)
    const set = new Set<string>()
    const q: { name: string; hop: number }[] = [{ name: selectedNode, hop: 0 }]
    set.add(selectedNode)
    while (q.length) {
      const { name, hop } = q.shift()!
      if (hop >= focusHop) continue
      enabled.forEach((r) => {
        if (r.leftClass === name && !set.has(r.rightClass)) { set.add(r.rightClass); q.push({ name: r.rightClass, hop: hop + 1 }) }
        if (r.rightClass === name && !set.has(r.leftClass)) { set.add(r.leftClass); q.push({ name: r.leftClass, hop: hop + 1 }) }
      })
    }
    return set
  }, [selectedNode, focusHop, enabled, uniqueClasses])
  const impactDownstreamCount = useMemo(() => {
    if (!selectedNode) return 0
    const set = new Set<string>()
    const q = [selectedNode]
    set.add(selectedNode)
    while (q.length) {
      const name = q.shift()!
      enabled.forEach((r) => {
        if (r.leftClass === name && !set.has(r.rightClass)) { set.add(r.rightClass); q.push(r.rightClass) }
      })
    }
    return set.size - 1
  }, [selectedNode, enabled])

  const LAYER_COLORS = ['#e6f7ff', '#f6ffed', '#fff7e6', '#fff1f0', '#f9f0ff']
  const getNodeLayerStyle = useCallback((name: string) => {
    const layer = nodeLayer[name] ?? 0
    return { backgroundColor: LAYER_COLORS[layer % LAYER_COLORS.length] }
  }, [nodeLayer])

  const buildFullSvgString = useCallback(() => {
    if (!svgRef.current) return null
    const svg = svgRef.current.cloneNode(true) as SVGSVGElement
    const ns = 'http://www.w3.org/2000/svg'
    const nodesGroup = document.createElementNS(ns, 'g')
    nodesGroup.setAttribute('class', 'export-nodes')
    const cardPaddingLeft = 12
    const cardPaddingTop = 10
    const iconSize = 36
    const iconGap = 10
    const container = nodesContainerRef.current
    uniqueClasses.forEach((name) => {
      const p = effectiveNodePos[name]
      if (!p) return
      const layer = nodeLayer[name] ?? 0
      const bgColor = LAYER_COLORS[layer % LAYER_COLORS.length]
      const iconLeft = p.x - GLOBAL_HW + cardPaddingLeft
      const iconTop = p.y - GLOBAL_HH + cardPaddingTop
      const g = document.createElementNS(ns, 'g')
      const rect = document.createElementNS(ns, 'rect')
      rect.setAttribute('x', String(p.x - GLOBAL_HW))
      rect.setAttribute('y', String(p.y - GLOBAL_HH))
      rect.setAttribute('width', String(GLOBAL_NODE_W))
      rect.setAttribute('height', String(GLOBAL_NODE_H))
      rect.setAttribute('rx', '8')
      rect.setAttribute('fill', bgColor)
      rect.setAttribute('stroke', '#d9d9d9')
      rect.setAttribute('stroke-width', '1')
      const iconRect = document.createElementNS(ns, 'rect')
      iconRect.setAttribute('x', String(iconLeft))
      iconRect.setAttribute('y', String(iconTop))
      iconRect.setAttribute('width', String(iconSize))
      iconRect.setAttribute('height', String(iconSize))
      iconRect.setAttribute('rx', '6')
      iconRect.setAttribute('fill', '#e6f7ff')
      let iconSvgEl: SVGSVGElement | null = null
      if (container) {
        const nodeEl = container.querySelector(`[data-node-name="${CSS.escape(name)}"]`)
        const iconSvg = nodeEl?.querySelector?.('svg')
        if (iconSvg && iconSvg instanceof SVGSVGElement) {
          iconSvgEl = iconSvg.cloneNode(true) as SVGSVGElement
          iconSvgEl.setAttribute('width', String(iconSize))
          iconSvgEl.setAttribute('height', String(iconSize))
          iconSvgEl.setAttribute('x', '0')
          iconSvgEl.setAttribute('y', '0')
          const vb = iconSvg.getAttribute('viewBox') || (iconSvg.viewBox?.baseVal && `${iconSvg.viewBox.baseVal.x} ${iconSvg.viewBox.baseVal.y} ${iconSvg.viewBox.baseVal.width} ${iconSvg.viewBox.baseVal.height}`)
          if (vb) iconSvgEl.setAttribute('viewBox', vb)
          iconSvgEl.querySelectorAll('path').forEach((path) => path.setAttribute('fill', '#1890ff'))
        }
      }
      const iconGroup = document.createElementNS(ns, 'g')
      iconGroup.setAttribute('transform', `translate(${iconLeft},${iconTop})`)
      if (iconSvgEl) {
        iconGroup.appendChild(iconSvgEl)
      } else {
        const iconCircle = document.createElementNS(ns, 'circle')
        iconCircle.setAttribute('cx', String(iconSize / 2))
        iconCircle.setAttribute('cy', String(iconSize / 2))
        iconCircle.setAttribute('r', '8')
        iconCircle.setAttribute('fill', '#1890ff')
        iconGroup.appendChild(iconCircle)
      }
      const text = document.createElementNS(ns, 'text')
      const textX = p.x - GLOBAL_HW + cardPaddingLeft + iconSize + iconGap + (GLOBAL_NODE_W - cardPaddingLeft - iconSize - iconGap - cardPaddingLeft) / 2
      text.setAttribute('x', String(textX))
      text.setAttribute('y', String(p.y))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.setAttribute('font-size', '13')
      text.setAttribute('fill', '#262626')
      text.setAttribute('font-weight', '500')
      text.textContent = name
      g.appendChild(rect)
      g.appendChild(iconRect)
      g.appendChild(iconGroup)
      g.appendChild(text)
      nodesGroup.appendChild(g)
    })
    svg.appendChild(nodesGroup)
    return new XMLSerializer().serializeToString(svg)
  }, [uniqueClasses, effectiveNodePos, nodeLayer])

  const handleExportSvg = useCallback(() => {
    const s = buildFullSvgString()
    if (!s) return
    const blob = new Blob(['\uFEFF' + s], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relation-graph.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [buildFullSvgString])

  const PNG_SCALE = 2
  const handleExportPng = useCallback(() => {
    const s = buildFullSvgString()
    if (!s) return
    const blob = new Blob(['\uFEFF' + s], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const w = safeGraphW * PNG_SCALE
      const h = safeGraphH * PNG_SCALE
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); return }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.scale(PNG_SCALE, PNG_SCALE)
      ctx.drawImage(img, 0, 0, safeGraphW, safeGraphH)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url)
        if (!pngBlob) return
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = 'relation-graph.png'
        a.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png', 1)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      message.error('PNG 导出失败，请尝试导出 SVG 或缩小画布后重试')
    }
    img.src = url
  }, [buildFullSvgString, safeGraphW, safeGraphH])

  const edgeLabelOffsets = useMemo(() => {
    const keyCounts = new Map<string, number>()
    enabled.forEach((r) => {
      const key = `${r.leftClass}|${r.rightClass}`
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
    })
    const keyIndices = new Map<string, number>()
    return enabled.map((r) => {
      const key = `${r.leftClass}|${r.rightClass}`
      const count = keyCounts.get(key) ?? 1
      const i = keyIndices.get(key) ?? 0
      keyIndices.set(key, i + 1)
      return i - (count - 1) / 2
    })
  }, [enabled])

  const edgeShowLabel = useMemo(() => {
    const labelKeySeen = new Set<string>()
    return enabled.map((r) => {
      const key = `${r.leftClass}|${r.rightClass}|${r.relationVerb}`
      if (labelKeySeen.has(key)) return false
      labelKeySeen.add(key)
      return true
    })
  }, [enabled])

  if (uniqueClasses.length === 0) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#8c8c8c' }}>暂无启用的关系对，请先在列表中新建。</div>
  }

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!(e.target as Element).closest?.('[data-graph-node]')) setSelectedNode(null)
  }, [])

  return (
    <div className={styles.globalGraphWrap} ref={wrapRef} onDoubleClick={handleCanvasDoubleClick}>
      <div className={styles.globalGraphToolbar}>
        <Tooltip title="拓扑校验"><Button type="text" icon={<SafetyCertificateOutlined />} onClick={() => setValidationDrawerOpen(true)} /></Tooltip>
        {selectedNode && (
          <Tooltip title="取消选中并还原视图"><Button type="text" icon={<AimOutlined />} onClick={() => setSelectedNode(null)}>取消聚焦</Button></Tooltip>
        )}
        <Tooltip title="还原布局"><Button type="text" icon={<RollbackOutlined />} onClick={handleRestoreLayout} /></Tooltip>
        <Tooltip title="适合界面"><Button type="text" icon={<ExpandOutlined />} onClick={handleFit} /></Tooltip>
        <Tooltip title="放大"><Button type="text" icon={<ZoomInOutlined />} onClick={() => setZoom((prev) => Math.min(prev + 0.2, 2))} /></Tooltip>
        <Tooltip title="缩小"><Button type="text" icon={<ZoomOutOutlined />} onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.4))} /></Tooltip>
        <Tooltip title="导出 SVG（含节点卡片）"><Button type="text" icon={<ExportOutlined />} onClick={handleExportSvg} /></Tooltip>
        <Tooltip title="导出 PNG（含节点卡片）"><Button type="text" icon={<ExportOutlined />} onClick={handleExportPng} /></Tooltip>
        <Tooltip title="时间轴查看历史拓扑"><Button type="text" icon={<HistoryOutlined />} onClick={() => setTimeDrawerOpen(true)} /></Tooltip>
        <Tooltip title="从 CMDB 采集器同步"><Button type="text" icon={<SyncOutlined />} loading={syncLoading} onClick={handleSyncFromCollector} /></Tooltip>
        <Tooltip title="按角色视图粒度"><Button type="text" icon={<FilterOutlined />} onClick={() => setRoleDrawerOpen(true)} /></Tooltip>
      </div>
      {selectedNode && (
        <div className={styles.impactPanel}>
          <span><strong>{selectedNode}</strong> 影响下游：<strong>{impactDownstreamCount}</strong> 个配置类</span>
        </div>
      )}
      <div className={styles.globalGraphScaled} style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
        <div
          className={styles.globalGraphInner}
          ref={innerRef}
          style={{ width: safeGraphW, height: safeGraphH }}
          onContextMenuCapture={(e) => {
            const el = (e.target as HTMLElement).closest?.('[data-graph-node]')
            if (el) e.preventDefault()
          }}
          onAuxClick={(e) => {
            if (e.button !== 2) return
            const el = (e.target as HTMLElement).closest?.('[data-graph-node]')
            const nodeName = el?.getAttribute('data-node-name')
            if (nodeName) {
              e.preventDefault()
              e.stopPropagation()
              onNodeContextMenu?.(nodeName, e.clientX, e.clientY)
            }
          }}
          onContextMenu={(e) => {
            const el = (e.target as HTMLElement).closest?.('[data-graph-node]')
            const nodeName = el?.getAttribute('data-node-name')
            if (nodeName) {
              e.preventDefault()
              e.stopPropagation()
              onNodeContextMenu?.(nodeName, e.clientX, e.clientY)
            }
          }}
        >
          <svg ref={svgRef} className={styles.globalGraphSvg} width={safeGraphW} height={safeGraphH} viewBox={`0 0 ${safeGraphW} ${safeGraphH}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
            <defs>
              {/* 未高亮：箭头与线一致为灰色 */}
              <marker id="relation-arrow-gray" markerWidth={12} markerHeight={10} refX={10} refY={5} orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 10 5, 0 10" fill="#bfbfbf" />
              </marker>
              {/* 高亮时：箭头与线一致为蓝色 */}
              <marker id="relation-arrow-blue" markerWidth={12} markerHeight={10} refX={10} refY={5} orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 10 5, 0 10" fill="#1890ff" />
              </marker>
              <marker id="relation-arrow-hit" markerWidth={16} markerHeight={14} refX={10} refY={5} orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 10 5, 0 10" fill="transparent" />
              </marker>
            </defs>
            <g style={{ overflow: 'visible' }}>
              {enabled.map((r, idx) => {
                const from = effectiveNodePos[r.leftClass]
                const to = effectiveNodePos[r.rightClass]
                if (!from || !to) return null
                const edgeInFocus = focusNodes.has(r.leftClass) && focusNodes.has(r.rightClass)
                const edgeDimmed = selectedNode != null && !edgeInFocus
                const sameColumnEdge =
                  sameColumnClasses.has(r.leftClass) &&
                  sameColumnClasses.has(r.rightClass) &&
                  (nodeLayer[r.leftClass] ?? 0) === (nodeLayer[r.rightClass] ?? 0)
                // 集群→集群节点：从集群上边框中点连到集群节点下边框中点
                const clusterToClusterNodeEdge = r.leftClass === '集群' && r.rightClass === '集群节点'
                // 物理服务器→NAS：从物理服务器上边框中点连到 NAS 下边框中点
                const physicalServerToNASEdge = r.leftClass === '物理服务器' && r.rightClass === 'NAS'
                // 物理服务器→交换机：从物理服务器上边框中点连到交换机下边框中点
                const physicalServerToSwitchEdge = r.leftClass === '物理服务器' && r.rightClass === '交换机'
                // 物理服务器→存储设备：从物理服务器上边框中点连到存储设备下边框中点
                const physicalServerToStorageEdge = r.leftClass === '物理服务器' && r.rightClass === '存储设备'
                // 物理服务器→内存模块：从物理服务器上边框中点连到内存模块下边框中点
                const physicalServerToMemoryEdge = r.leftClass === '物理服务器' && r.rightClass === '内存模块'
                // 虚拟服务器→ESX服务器：从虚拟服务器上边框中点连到 ESX 服务器下边框中点
                const virtualServerToESXEdge = r.leftClass === '虚拟服务器' && r.rightClass === 'ESX服务器'
                // 虚拟服务器→集群节点：从虚拟服务器上边框中点连到集群节点下边框中点
                const virtualServerToClusterNodeEdge = r.leftClass === '虚拟服务器' && r.rightClass === '集群节点'
                // k: 同一对节点的多条边的“序号/偏移因子”，用于让多条同层边不要重叠
                const k = edgeLabelOffsets[idx] ?? 0

                let x1: number
                let y1: number
                let x2: number
                let y2: number
                if (clusterToClusterNodeEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (physicalServerToNASEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (physicalServerToSwitchEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (physicalServerToStorageEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (physicalServerToMemoryEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (virtualServerToESXEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (virtualServerToClusterNodeEdge) {
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y - GLOBAL_HH
                  x2 = to.x
                  y2 = to.y + GLOBAL_HH + BORDER_GAP_PX
                } else if (sameColumnEdge) {
                  // 同栏由下至上：下方卡片下边框中点 → 上方卡片上边框中点，与边框留 1px 间隙
                  const BORDER_GAP_PX = 1
                  x1 = from.x
                  y1 = from.y + GLOBAL_HH + BORDER_GAP_PX
                  x2 = to.x
                  y2 = to.y - GLOBAL_HH - BORDER_GAP_PX
                } else {
                  const endpoints = getLayeredEdgeEndpoints(from, to)
                  x1 = endpoints.x1
                  y1 = endpoints.y1
                  x2 = endpoints.x2
                  y2 = endpoints.y2
                }

                let path: string
                if (clusterToClusterNodeEdge || physicalServerToNASEdge || physicalServerToSwitchEdge || physicalServerToStorageEdge || physicalServerToMemoryEdge || virtualServerToESXEdge || virtualServerToClusterNodeEdge) {
                  path = `M ${x1} ${y1} L ${x2} ${y2}`
                } else if (sameColumnEdge) {
                  path = `M ${x1} ${y1} L ${x2} ${y2}`
                } else {
                  const segLen = Math.hypot(x2 - x1, y2 - y1) || 1
                  const ux = (x2 - x1) / segLen
                  const uy = (y2 - y1) / segLen
                  const pathEndX = x2
                  const pathEndY = y2
                  const c2x = pathEndX - 9 * ux
                  const c2y = pathEndY - 9 * uy
                  path = `M ${x1} ${y1} C ${(x1 + c2x) / 2} ${y1}, ${c2x} ${c2y}, ${pathEndX} ${pathEndY}`
                }

                // 错位必须被限制在很小范围内，避免同一对节点的多条边文字重叠
                const MAX_LABEL_SHIFT_PX = 5
                const LABEL_STEP_PX = 3.5
                const rawShift = k * LABEL_STEP_PX
                const labelShift = Math.max(-MAX_LABEL_SHIFT_PX, Math.min(MAX_LABEL_SHIFT_PX, rawShift))
                const showLabel = edgeShowLabel[idx]
                let labelX: number
                let labelY: number
                const labelT = Math.max(0.35, Math.min(0.65, 0.5 + k * 0.08))
                if (clusterToClusterNodeEdge || physicalServerToNASEdge || physicalServerToSwitchEdge || physicalServerToStorageEdge || physicalServerToMemoryEdge || virtualServerToESXEdge || virtualServerToClusterNodeEdge) {
                  labelX = (x1 + x2) / 2 + labelShift
                  labelY = (y1 + y2) / 2
                } else if (sameColumnEdge) {
                  labelX = (x1 + x2) / 2 + labelShift
                  labelY = (y1 + y2) / 2
                } else {
                  const segLen = Math.hypot(x2 - x1, y2 - y1) || 1
                  const ux = (x2 - x1) / segLen
                  const uy = (y2 - y1) / segLen
                  const pathEndX = x2
                  const pathEndY = y2
                  const c2x = pathEndX - 9 * ux
                  const c2y = pathEndY - 9 * uy
                  const nx = -uy
                  const ny = ux
                  const t = labelT
                  const mt = 1 - t
                  const p1x = (x1 + c2x) / 2
                  const bx = mt * mt * mt * x1 + 3 * mt * mt * t * p1x + 3 * mt * t * t * c2x + t * t * t * pathEndX
                  const by = mt * mt * mt * y1 + 3 * mt * mt * t * y1 + 3 * mt * t * t * c2y + t * t * t * pathEndY
                  labelX = bx + nx * labelShift
                  labelY = by + ny * labelShift
                }
                const isHovered = hoveredEdge?.id === r.id
                const strokeColor = isHovered ? '#1890ff' : '#bfbfbf'
                const markerId = isHovered ? 'relation-arrow-blue' : 'relation-arrow-gray'
                return (
                  <g
                    key={`${r.id}-edge`}
                    onMouseEnter={() => setHoveredEdge(r)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    style={{ cursor: 'pointer', opacity: edgeDimmed ? 0.35 : 1 }}
                  >
                    {/* 扩大 hit 区放最底层，不遮挡线/箭头 */}
                    <path d={path} stroke="transparent" strokeWidth={32} fill="none" pointerEvents="stroke" markerEnd="url(#relation-arrow-hit)" />
                    {/* 线+箭头一体：key 随高亮变化强制重挂载，保证 marker 与 stroke 同步高亮 */}
                    <path key={`${r.id}-stroke-${isHovered}`} d={path} stroke={strokeColor} strokeWidth={isHovered ? 2.5 : 1} fill="none" strokeLinecap="butt" strokeLinejoin="round" markerEnd={`url(#${markerId})`} />
                    {showLabel && <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill={strokeColor} fontWeight={500}>{r.relationVerb}</text>}
                    <title>{`${r.leftClass} — ${r.relationVerb} — ${r.rightClass}`}</title>
                  </g>
                )
              })}
            </g>
          </svg>
          <div ref={nodesContainerRef} className={styles.globalGraphNodes} style={{ width: safeGraphW, height: safeGraphH }}>
            {uniqueClasses.map((name) => {
              const p = effectiveNodePos[name]
              if (!p) return null
              const isEndpoint = hoveredEdge ? (name === hoveredEdge.leftClass || name === hoveredEdge.rightClass) : false
              const isDragging = draggingNode === name
              const isSelected = selectedNode === name
              const nodeInFocus = focusNodes.has(name)
              const nodeDimmed = selectedNode != null && !nodeInFocus
              return (
                <div
                  key={name}
                  data-graph-node
                  data-node-name={name}
                  className={`${styles.globalDepNode} ${isEndpoint ? styles.globalDepNodeHighlight : ''} ${isDragging ? styles.globalDepNodeDragging : ''} ${isSelected ? styles.globalDepNodeSelected : ''}`}
                  style={{
                    left: p.x - GLOBAL_HW,
                    top: p.y - GLOBAL_HH,
                    width: GLOBAL_NODE_W,
                    minHeight: GLOBAL_NODE_H,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    opacity: nodeDimmed ? 0.35 : 1,
                    ...getNodeLayerStyle(name),
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(name, e)}
                  onClick={(e) => { e.stopPropagation(); handleNodeClick(name) }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onNodeContextMenu?.(name, e.clientX, e.clientY)
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 2) {
                      e.preventDefault()
                      e.stopPropagation()
                      onNodeContextMenu?.(name, e.clientX, e.clientY)
                    }
                  }}
                >
                  <div className={styles.globalDepNodeIconWrap}>
                    <DepNodeIcon name={name} className={styles.globalDepNodeIcon} />
                  </div>
                  <div className={styles.globalDepNodeText}>{name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Drawer
        title="时间轴（历史拓扑）"
        placement="right"
        width={360}
        open={timeDrawerOpen}
        onClose={() => setTimeDrawerOpen(false)}
      >
        <div style={{ marginBottom: 12, color: '#666' }}>
          通过时间轴切换展示的关系快照（前端 mock），用于查看拓扑随时间的变化。
        </div>
        <div style={{ marginBottom: 8, fontSize: 13, color: '#262626' }}>
          当前快照：<strong>{timeModel.labels[timeIndex] ?? '-'}</strong>
        </div>
        <Slider
          min={0}
          max={Math.max(0, timeModel.snapshots.length - 1)}
          value={timeIndex}
          onChange={(v) => setTimeIndex(v as number)}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {timeModel.labels.map((lab, i) => (
            <Tag key={lab} color={i === timeIndex ? '#1890ff' : undefined} style={{ cursor: 'pointer' }} onClick={() => setTimeIndex(i)}>
              {i === timeIndex ? '当前' : `T-${timeModel.labels.length - 1 - i}`} 
            </Tag>
          ))}
        </div>
      </Drawer>

      <Drawer
        title="按角色视图粒度"
        placement="right"
        width={360}
        open={roleDrawerOpen}
        onClose={() => setRoleDrawerOpen(false)}
      >
        <div style={{ marginBottom: 10, color: '#666' }}>
          开启后仅展示该角色允许查看的“关系两端配置类”，从而得到角色视图粒度的拓扑。
        </div>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#262626' }}>启用角色过滤</span>
          <Switch checked={roleViewEnabled} onChange={setRoleViewEnabled} />
        </div>
        <div style={{ marginBottom: 10, fontSize: 13, color: '#262626' }}>角色</div>
        <Select
          style={{ width: '100%' }}
          value={roleKey}
          options={[
            { label: '运维', value: '运维' },
            { label: '开发', value: '开发' },
            { label: '安全', value: '安全' },
          ]}
          onChange={(v) => setRoleKey(v as any)}
          disabled={!roleViewEnabled}
        />
        <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12, lineHeight: 1.5 }}>
          说明：该角色可见性为前端 mock，用于补全页面功能流程。后续可替换为后端权限/角色配置。
        </div>
      </Drawer>
      <Drawer title="拓扑校验" open={validationDrawerOpen} onClose={() => setValidationDrawerOpen(false)} width={400}>
        <p style={{ color: '#666', marginBottom: 16 }}>检测循环依赖、无入度/出度节点，便于发现模型问题。</p>
        {validationResult.cycles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>循环依赖</strong>
            <ul style={{ marginTop: 4, paddingLeft: 20 }}>
              {validationResult.cycles.map((cycle, i) => (
                <li key={i}><Tag color="red">{cycle.join(' → ')}</Tag></li>
              ))}
            </ul>
          </div>
        )}
        {validationResult.noIncoming.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>无入度节点（仅作为起点）</strong>
            <div style={{ marginTop: 4 }}>{validationResult.noIncoming.map((n) => <Tag key={n}>{n}</Tag>)}</div>
          </div>
        )}
        {validationResult.noOutgoing.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>无出度节点（仅作为终点）</strong>
            <div style={{ marginTop: 4 }}>{validationResult.noOutgoing.map((n) => <Tag key={n}>{n}</Tag>)}</div>
          </div>
        )}
        {repairActions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>智能矫正（规则驱动 + 人机协同）</strong>
            <div style={{ marginTop: 6, marginBottom: 10, color: '#666', fontSize: 13 }}>
              下面是系统基于规则的矫正建议。勾选后点击「应用所选矫正」会更新关系对的启用状态（建议你复核影响范围）。
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {repairActions.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e8e8e8',
                    background: '#fafafa',
                  }}
                >
                  <Checkbox
                    checked={selectedRepairActionIds.includes(a.id)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setSelectedRepairActionIds((prev) => (checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)))
                    }}
                  >
                    {a.title}
                  </Checkbox>
                  {a.detail && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12, lineHeight: 1.5 }}>{a.detail}</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" disabled={selectedRepairActionIds.length === 0} onClick={handleApplyRepairActions}>
                应用所选矫正
              </Button>
            </div>
          </div>
        )}
        {validationResult.cycles.length === 0 && validationResult.noIncoming.length === 0 && validationResult.noOutgoing.length === 0 && (
          <p style={{ color: '#52c41a' }}>未发现循环依赖；无入度/无出度节点为正常（如入口网关、末端存储）。</p>
        )}
      </Drawer>
    </div>
  )
}

/** 影响分析：删除某节点相关关系后，其下游（N 跳）将失去上游依赖，用于静态校验与未来动态影响预判 */
function analyzeDeleteImpact(
  nodeName: string,
  relations: RelationModelRecord[],
  hopRadius: number = 2
): { byHop: Map<number, string[]>; all: string[] } {
  const enabled = relations.filter((r) => r.enabled)
  const successors = (n: string) =>
    enabled.filter((r) => r.leftClass === n).map((r) => r.rightClass)
  const byHop = new Map<number, string[]>()
  const affected = new Set<string>()
  let current = [nodeName]
  const seen = new Set<string>([nodeName])
  for (let hop = 1; hop <= hopRadius; hop++) {
    const next: string[] = []
    for (const n of current) {
      for (const child of successors(n)) {
        if (seen.has(child)) continue
        seen.add(child)
        next.push(child)
        affected.add(child)
      }
    }
    if (next.length) byHop.set(hop, [...next].sort())
    current = next
  }
  return { byHop, all: [...affected].sort() }
}

/** 删除关联弹窗内容：影响分析 + 按对端配置类多选删除 */
function DeleteRelationsContent({
  nodeName,
  list,
  selectedPartners,
  onSelectedPartnersChange,
}: {
  nodeName: string
  list: RelationModelRecord[]
  selectedPartners: string[]
  onSelectedPartnersChange: (v: string[]) => void
}) {
  const impact = useMemo(() => analyzeDeleteImpact(nodeName, list, 2), [nodeName, list])
  const partnerCounts = useMemo(() => {
    const relations = list.filter((r) => r.leftClass === nodeName || r.rightClass === nodeName)
    const m = new Map<string, number>()
    relations.forEach((r) => {
      const p = r.leftClass === nodeName ? r.rightClass : r.leftClass
      m.set(p, (m.get(p) ?? 0) + 1)
    })
    return Array.from(m.entries()).map(([partner, count]) => ({ partner, count }))
  }, [list, nodeName])

  const allPartners = useMemo(() => partnerCounts.map(({ partner }) => partner), [partnerCounts])
  const allSelected = allPartners.length > 0 && selectedPartners.length === allPartners.length

  return (
    <div style={{ marginTop: 8 }}>
      {/* 影响分析：删除前展示影响范围，为后续动态影响预判、ITSM 联动预留 */}
      <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 8 }}>影响分析</div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          删除与「{nodeName}」的关联后，以下配置类将失去上游依赖（可能受影响）。未来可升级为动态影响预判、与业务系统/SLA 联动。
        </p>
        {impact.all.length === 0 ? (
          <p style={{ fontSize: 12, color: '#8c8c8c' }}>无下游依赖，影响范围为空。</p>
        ) : (
          <>
            {[1, 2].map((hop) => {
              const nodes = impact.byHop.get(hop)
              if (!nodes?.length) return null
              return (
                <div key={hop} style={{ marginBottom: hop === 1 ? 8 : 0 }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c', marginRight: 8 }}>{hop} 跳下游：</span>
                  {nodes.map((c) => (
                    <Tag key={c} color="blue" style={{ marginBottom: 4 }}>{c}</Tag>
                  ))}
                </div>
              )
            })}
            <p style={{ fontSize: 11, color: '#8c8c8c', marginTop: 8, marginBottom: 0 }}>
              可扩展：标记受影响的应用、业务系统、SLA 等级；与 ITSM 联动自动生成变更工单。
            </p>
            <Button type="link" size="small" disabled style={{ padding: 0, height: 'auto', marginTop: 4 }}>
              与 ITSM 联动，自动生成变更工单（预留）
            </Button>
          </>
        )}
      </div>
      <p style={{ marginBottom: 12, color: '#666' }}>
        当前配置类「{nodeName}」与以下配置类有关联，请选择要删除的关联（可多选或全选）：
      </p>
      <Checkbox
        checked={allSelected}
        indeterminate={selectedPartners.length > 0 && selectedPartners.length < allPartners.length}
        onChange={(e) => onSelectedPartnersChange(e.target.checked ? [...allPartners] : [])}
      >
        全选
      </Checkbox>
      <div style={{ marginTop: 8 }}>
        <Checkbox.Group
          value={selectedPartners}
          onChange={(v) => onSelectedPartnersChange(v as string[])}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {partnerCounts.map(({ partner, count }) => (
            <Checkbox key={partner} value={partner}>
              配置类「{partner}」（{count} 条关系）
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>
    </div>
  )
}

export default function RelationModelPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [list, setList] = useState<RelationModelRecord[]>(() => [...relationModelListMock])
  /** 关系图节点右键菜单：{ nodeName, x, y } 为 client 坐标 */
  const [graphContextMenu, setGraphContextMenu] = useState<{ nodeName: string; x: number; y: number } | null>(null)
  const graphContextMenuRef = useRef<HTMLDivElement>(null)
  /** 删除关联弹窗：当前要删除关系的节点名，弹窗内可选 1 个/多个/全选 关联配置类后删除 */
  const [deleteRelationsForNode, setDeleteRelationsForNode] = useState<string | null>(null)
  /** 删除关联弹窗内选中的关联配置类（对端类名） */
  const [deleteSelectedPartners, setDeleteSelectedPartners] = useState<string[]>([])
  /** AI 辅助建模：智能推荐关系 Drawer */
  const [aiRecommendDrawerOpen, setAiRecommendDrawerOpen] = useState(false)
  /** 用户忽略的推荐 ID，不再展示 */
  const [dismissedRecommendIds, setDismissedRecommendIds] = useState<string[]>([])

  const [searchParams, setSearchParams] = useSearchParams()
  const openNew = searchParams.get('openNew') === '1'

  const filteredList = useMemo(() => {
    if (!keyword.trim()) return list
    const k = keyword.trim().toLowerCase()
    return list.filter(
      (r) =>
        r.leftClass.toLowerCase().includes(k) ||
        r.rightClass.toLowerCase().includes(k) ||
        r.relationVerb.toLowerCase().includes(k) ||
        (r.description && r.description.toLowerCase().includes(k))
    )
  }, [list, keyword])

  const total = filteredList.length
  const paginatedList = useMemo(() => filteredList.slice((page - 1) * pageSize, page * pageSize), [filteredList, page, pageSize])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  /** 从关系图节点右键「新建」打开弹窗，带出当前点击的配置类为左端 */
  const handleAddFromGraph = useCallback((className: string) => {
    setGraphContextMenu(null)
    setEditingId(null)
    form.setFieldsValue({
      leftClass: className,
      rightClass: undefined,
      relationVerb: undefined,
      enabled: true,
      leftLinkField: '名称',
      leftLinkFieldEnabled: false,
      rightLinkField: '名称',
      rightLinkFieldEnabled: false,
      description: '',
      impactDesc: '',
    })
    setModalOpen(true)
  }, [form])

  /** 打开「删除关联」弹窗：由右键菜单「删除」只负责设节点名，弹窗内再选 1 个/多个/全选 关联后删除 */
  const openDeleteRelationsModal = useCallback((className: string) => {
    setGraphContextMenu(null)
    const relations = list.filter((r) => r.leftClass === className || r.rightClass === className)
    if (relations.length === 0) {
      message.info(`配置类「${className}」暂无关联关系`)
      return
    }
    const partners = Array.from(new Set(relations.map((r) => (r.leftClass === className ? r.rightClass : r.leftClass))))
    setDeleteRelationsForNode(className)
    setDeleteSelectedPartners(partners)
  }, [list])

  /** 删除关联弹窗：按选中的对端配置类删除关系 */
  const deleteRelationsModalOk = useCallback(() => {
    if (!deleteRelationsForNode) return
    setList((prev) =>
      prev.filter((r) => {
        if (r.leftClass !== deleteRelationsForNode && r.rightClass !== deleteRelationsForNode) return true
        const partner = r.leftClass === deleteRelationsForNode ? r.rightClass : r.leftClass
        return !deleteSelectedPartners.includes(partner)
      })
    )
    message.success('已删除选中的关联关系')
    setDeleteRelationsForNode(null)
    setDeleteSelectedPartners([])
  }, [deleteRelationsForNode, deleteSelectedPartners])

  /** 当前可展示的 AI 推荐：排除已存在的关系对与用户已忽略的 */
  const visibleRecommendations = useMemo(() => {
    const existingPairs = new Set(
      list.filter((r) => r.enabled).map((r) => `${r.leftClass}\0${r.rightClass}`)
    )
    return aiRelationRecommendationsMock.filter(
      (rec) =>
        !dismissedRecommendIds.includes(rec.id) &&
        !existingPairs.has(`${rec.source}\0${rec.target}`)
    )
  }, [list, dismissedRecommendIds])

  const handleAcceptRecommendation = useCallback(
    (rec: AiRelationRecommendation) => {
      const verb = RELATION_MODEL_VERB_OPTIONS.includes(rec.recommended_relation)
        ? rec.recommended_relation
        : '依赖于'
      setEditingId(null)
      form.setFieldsValue({
        leftClass: rec.source,
        rightClass: rec.target,
        relationVerb: verb,
        enabled: true,
        leftLinkField: '名称',
        leftLinkFieldEnabled: false,
        rightLinkField: '名称',
        rightLinkFieldEnabled: false,
        description: `AI 推荐：${rec.evidence}`,
        impactDesc: '',
      })
      setAiRecommendDrawerOpen(false)
      setModalOpen(true)
      message.info('已带入推荐关系，请确认后保存')
    },
    [form]
  )

  const handleDismissRecommendation = useCallback((id: string) => {
    setDismissedRecommendIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  useEffect(() => {
    if (!openNew) return
    handleAdd()
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('openNew')
      return p
    })
  }, [openNew, handleAdd, setSearchParams])

  const handleEdit = (record: RelationModelRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      leftClass: record.leftClass,
      relationVerb: record.relationVerb,
      rightClass: record.rightClass,
      description: record.description || '',
      impactDesc: record.impactDesc || '',
      enabled: record.enabled,
      leftLinkField: record.leftLinkField ?? '名称',
      leftLinkFieldEnabled: record.leftLinkFieldEnabled ?? false,
      rightLinkField: record.rightLinkField ?? '名称',
      rightLinkFieldEnabled: record.rightLinkFieldEnabled ?? false,
    })
    setModalOpen(true)
  }

  const handleDelete = (record: RelationModelRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除关系对「${record.leftClass} - ${record.relationVerb} - ${record.rightClass}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((r) => r.id !== record.id))
        message.success('已删除')
      },
    })
  }

  const handleToggleEnabled = (record: RelationModelRecord) => {
    setList((prev) => prev.map((r) => (r.id === record.id ? { ...r, enabled: !r.enabled } : r)))
    message.success(record.enabled ? '已禁用' : '已启用')
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的项')
      return
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 项吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((r) => !selectedRowKeys.includes(r.id)))
        setSelectedRowKeys([])
        message.success('已删除')
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      const row = {
        ...values,
        leftLinkField: values.leftLinkField,
        leftLinkFieldEnabled: !!values.leftLinkFieldEnabled,
        rightLinkField: values.rightLinkField,
        rightLinkFieldEnabled: !!values.rightLinkFieldEnabled,
      }
      if (editingId) {
        setList((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...row, updateTime: now } : r)))
        message.success('修改成功')
      } else {
        setList((prev) => [
          ...prev,
          { id: 'new-' + Date.now(), ...row, creator: '管理员', createTime: now, updateTime: now } as RelationModelRecord,
        ])
        message.success('新建成功')
      }
      setModalOpen(false)
      form.resetFields()
    }).catch(() => {})
  }

  const rowSelection = { selectedRowKeys, onChange: (keys: React.Key[]) => setSelectedRowKeys(keys) }

  useEffect(() => {
    if (!graphContextMenu) return
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) return
      const el = e.target as HTMLElement
      if (el?.closest?.('[data-context-menu-item]')) return
      if (graphContextMenuRef.current && graphContextMenuRef.current.contains(e.target as Node)) return
      setGraphContextMenu(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [graphContextMenu])

  const columns: ColumnsType<RelationModelRecord> = [
    { title: '左端配置类', dataIndex: 'leftClass', key: 'leftClass', width: 120 },
    { title: '关系动词', dataIndex: 'relationVerb', key: 'relationVerb', width: 100 },
    { title: '右端配置类', dataIndex: 'rightClass', key: 'rightClass', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v: boolean, record) => <Switch size="small" checked={v} onChange={() => handleToggleEnabled(record)} />,
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.wrap}>
      <h2 className={styles.pageTitle}>关系建模</h2>
      <div className={styles.help}>
        <QuestionCircleOutlined />
        <Tooltip title="定义「关系对」：左端配置类 - 关系动词 - 右端配置类。创建配置类时依赖关系只需选择对端配置类，系统根据此处建模自动推导关系类型与上下游（左→右为下游，右→左为上游）。">
          <a href="#">关系建模有什么作用?</a>
        </Tooltip>
      </div>

      <div className={styles.toolbar}>
        <Space>
          <Button type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>列表</Button>
          <Button type={viewMode === 'graph' ? 'primary' : 'default'} onClick={() => setViewMode('graph')}>关系图</Button>
        </Space>
        {viewMode === 'list' && (
          <>
            <Input
              placeholder="搜索左/右端配置类或关系动词"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 280 }}
            />
            <Space>
              <Button danger disabled={selectedRowKeys.length === 0} onClick={handleBatchDelete}>删除</Button>
              <Button icon={<ThunderboltOutlined />} onClick={() => setAiRecommendDrawerOpen(true)}>AI 辅助建模</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建</Button>
            </Space>
          </>
        )}
      </div>

      {viewMode === 'list' && (
        <div className={styles.tableWrap}>
          <Table<RelationModelRecord>
            rowKey="id"
            size="small"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={paginatedList}
            pagination={{
              total,
              current: page,
              pageSize,
              showSizeChanger: true,
              showTotal: (t) => `共${t}条`,
              pageSizeOptions: ['10', '20', '50'],
              showQuickJumper: true,
              onChange: (p, ps) => { setPage(p); if (typeof ps === 'number') setPageSize(ps) },
            }}
          />
        </div>
      )}

      {viewMode === 'graph' && (
        <div className={styles.graphWrap}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>全局关系图：分层左→右，按层着色；可<strong>拖拽节点</strong>调整布局，<strong>右键节点</strong>新建/删除关系，<strong>点击节点</strong>查看影响下游并聚焦 N 跳；工具栏支持<strong>拓扑校验</strong>（循环依赖/孤立节点）、<strong>还原布局</strong>、<strong>导出 SVG</strong>。鼠标移到连线上可高亮该关系及两端节点。</p>
          <GlobalRelationGraph list={list} onChangeList={setList} onNodeContextMenu={(nodeName, x, y) => setGraphContextMenu({ nodeName, x, y })} />
          {graphContextMenu &&
            createPortal(
              <div
                ref={graphContextMenuRef}
                className={styles.graphContextMenu}
                style={{
                  position: 'fixed',
                  left: graphContextMenu.x,
                  top: graphContextMenu.y,
                  zIndex: 9999,
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  minWidth: 110,
                }}
              >
                <Menu
                  selectedKeys={[]}
                  items={[
                    { key: 'add', label: '新建', onClick: () => handleAddFromGraph(graphContextMenu.nodeName) },
                    { key: 'del', label: '删除', danger: true, onClick: () => openDeleteRelationsModal(graphContextMenu.nodeName) },
                  ]}
                  style={{ border: 'none', minWidth: 110 }}
                />
              </div>,
              document.body
            )}
        </div>
      )}

      {/* 删除关联：选择要删除的关联配置类（1 个/多个/全选） */}
      <Modal
        title="删除关联关系"
        open={!!deleteRelationsForNode}
        onCancel={() => { setDeleteRelationsForNode(null); setDeleteSelectedPartners([]) }}
        onOk={deleteRelationsModalOk}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ disabled: deleteSelectedPartners.length === 0 }}
        destroyOnClose
        width={480}
      >
        {deleteRelationsForNode && (
          <DeleteRelationsContent
            nodeName={deleteRelationsForNode}
            list={list}
            selectedPartners={deleteSelectedPartners}
            onSelectedPartnersChange={setDeleteSelectedPartners}
          />
        )}
      </Modal>

      <Drawer
        title="AI 辅助建模：智能推荐关系"
        placement="right"
        width={480}
        open={aiRecommendDrawerOpen}
        onClose={() => setAiRecommendDrawerOpen(false)}
      >
        <div style={{ marginBottom: 16, fontSize: 12, color: '#666' }}>
          <p style={{ marginBottom: 8 }}>基于历史数据与常见拓扑模式，推荐可能缺失的关系，供人工确认后补全。</p>
          <p style={{ marginBottom: 0 }}>
            <strong>技术路径：</strong>对接日志/监控（ELK、Prometheus）→ 图神经网络学习典型拓扑 → 输出高置信度建议。
          </p>
        </div>
        {visibleRecommendations.length === 0 ? (
          <p style={{ color: '#8c8c8c' }}>暂无新推荐，或您已采纳/忽略全部建议。</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleRecommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: 12,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <Tag color="blue">{rec.source}</Tag>
                  <span style={{ margin: '0 6px', color: '#8c8c8c' }}>→</span>
                  <Tag color="green">{rec.recommended_relation}</Tag>
                  <span style={{ margin: '0 6px', color: '#8c8c8c' }}>→</span>
                  <Tag color="orange">{rec.target}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                  置信度：<strong style={{ color: rec.confidence >= 0.9 ? '#52c41a' : '#1890ff' }}>{(rec.confidence * 100).toFixed(0)}%</strong>
                </div>
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>{rec.evidence}</div>
                <Space>
                  <Button type="primary" size="small" onClick={() => handleAcceptRecommendation(rec)}>采纳</Button>
                  <Button size="small" onClick={() => handleDismissRecommendation(rec.id)}>忽略</Button>
                </Space>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Modal title={editingId ? '编辑关系对' : '新建关系对'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleModalOk} okText="确定" cancelText="取消" destroyOnClose width={860} className={styles.relationModal}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div className={styles.relationFormRow}>
            <div className={styles.relationFormSide}>
              <div className={styles.relationFormSideTitle}>关系左侧</div>
              <Form.Item name="leftClass" label="左端配置类" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="关系起点" allowClear options={RELATION_MODEL_CLASS_OPTIONS.map((c) => ({ label: c, value: c }))} showSearch optionFilterProp="label" />
              </Form.Item>
              <Form.Item name="leftLinkField" label="关联字段" initialValue="名称" tooltip="配置项实例查找关系时，通过该字段与对端建立连接">
                <Select placeholder="选择字段" allowClear options={RELATION_LINK_FIELD_OPTIONS.map((f) => ({ label: f, value: f }))} />
              </Form.Item>
              <Form.Item name="leftLinkFieldEnabled" label="是否启用关联字段" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </div>
            <div className={styles.relationFormVerb}>
              <Form.Item name="relationVerb" label="关系动词" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="如：连接至、包含" allowClear options={RELATION_MODEL_VERB_OPTIONS.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </div>
            <div className={styles.relationFormSide}>
              <div className={styles.relationFormSideTitle}>关系右侧</div>
              <Form.Item
                name="rightClass"
                label="右端配置类"
                dependencies={['leftClass', 'relationVerb']}
                rules={[
                  { required: true, message: '请选择' },
                  {
                    validator: async (_, value) => {
                      const leftClass = form.getFieldValue('leftClass')
                      const relationVerb = form.getFieldValue('relationVerb')
                      const rightClass = value
                      if (!leftClass || !relationVerb || !rightClass) return
                      const exists = list.some(
                        (r) =>
                          r.leftClass === leftClass &&
                          r.relationVerb === relationVerb &&
                          r.rightClass === rightClass &&
                          r.id !== editingId
                      )
                      if (exists) throw new Error('当前关系已存在')
                    },
                  },
                ]}
              >
                <Select placeholder="关系终点" allowClear options={RELATION_MODEL_CLASS_OPTIONS.map((c) => ({ label: c, value: c }))} showSearch optionFilterProp="label" />
              </Form.Item>
              <Form.Item name="rightLinkField" label="关联字段" initialValue="名称" tooltip="配置项实例查找关系时，通过该字段与对端建立连接">
                <Select placeholder="选择字段" allowClear options={RELATION_LINK_FIELD_OPTIONS.map((f) => ({ label: f, value: f }))} />
              </Form.Item>
              <Form.Item name="rightLinkFieldEnabled" label="是否启用关联字段" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </div>
          </div>
          <div className={styles.relationFormFooter}>
            <Form.Item name="description" label="描述">
              <Input placeholder="如：微服务连接数据库" />
            </Form.Item>
            <Form.Item name="impactDesc" label="影响分析说明">
              <Input placeholder="如：数据库不可用影响微服务" />
            </Form.Item>
            <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
