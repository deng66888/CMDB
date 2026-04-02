/**
 * 关系图连线与箭头绑定 — 最小可运行示例（核心逻辑）
 * 要求：箭头与线一体（path + marker-end）、节点拖拽时连线实时更新、管理列表与 nodes 同步。
 */

// ---------- 1. SVG 箭头定义（defs）----------
// FIX: 箭头绑定到 path，避免分离 — 用 marker-end 使箭头与线一体
/** 可嵌入 SVG 的 defs 片段（示例 / 文档用） */
export const SVG_DEFS_ARROW = `
<defs>
  <marker id="arrow" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <polygon points="0 0, 10 5, 0 10" fill="#333" />
  </marker>
</defs>
`

// ---------- 2. Connection 类：含 updatePath()，基于实时位置生成 path d ----------
export type Pos = { x: number; y: number }
export class Connection {
  id: string
  startNodeId: string
  endNodeId: string
  pathType: 'line' | 'quad' | 'poly'

  constructor(id: string, startNodeId: string, endNodeId: string, pathType: 'line' | 'quad' | 'poly' = 'line') {
    this.id = id
    this.startNodeId = startNodeId
    this.endNodeId = endNodeId
    this.pathType = pathType
  }
  /** 根据节点当前坐标生成 path d；禁止缓存坐标，必须用实时位置 */
  updatePath(getPos: (id: string) => Pos | undefined): string {
    const start = getPos(this.startNodeId)
    const end = getPos(this.endNodeId)
    if (!start || !end) return ''
    const [x1, y1, x2, y2] = [start.x, start.y, end.x, end.y]
    if (this.pathType === 'line') return `M ${x1} ${y1} L ${x2} ${y2}`
    if (this.pathType === 'quad') {
      const cx = (x1 + x2) / 2 + 30
      const cy = (y1 + y2) / 2
      return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
    }
    const mx = (x1 + x2) / 2
    const my = y1
    return `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`
  }
}

// ---------- 3. Node 类：含 onDrag，拖拽时更新位置并触发连线重算 ----------
export class Node {
  id: string
  label: string
  x: number
  y: number

  constructor(id: string, label: string, x: number, y: number) {
    this.id = id
    this.label = label
    this.x = x
    this.y = y
  }
  onDrag(dx: number, dy: number, _connections: Connection[], notifyUpdate: () => void) {
    this.x += dx
    this.y += dy
    // 不缓存坐标；notifyUpdate 会触发用 getPos() 重新计算所有 conn.updatePath()
    notifyUpdate()
  }
}

// ---------- 4. 节点拖动时的连线更新逻辑（约 10 行）----------
// 示例：React 中 nodes/connections 为 state，getPos 从 nodes 取实时坐标
export function useConnectionPaths(
  nodes: Node[],
  connections: Connection[]
): string[] {
  const getPos = (id: string) => {
    const n = nodes.find((node) => node.id === id)
    return n ? { x: n.x, y: n.y } : undefined
  }
  return connections.map((c) => c.updatePath((id) => getPos(id)))
}

// ---------- 5. 管理列表同步代码片段 ----------
// 增加节点：生成新节点 → 推入 nodes → 列表即与关系图一致（同一数据源）
// 删除节点：filter 掉该节点 + 其连接 → 更新 nodes/connections → 重新渲染列表
// 列表渲染：nodes.map(n => <Row key={n.id} name={n.label} />)

// ---------- 6. 最小可运行示例（约 30 行，仅核心）----------
/*
  const [nodes, setNodes] = useState([new Node('a','A',50,50), new Node('b','B',200,50)]);
  const [conns] = useState([new Connection('c1','a','b')]);
  const paths = conns.map(c => c.updatePath(id => nodes.find(n => n.id === id)));
  const onDrag = (id, dx, dy) => setNodes(prev => prev.map(n => n.id === id ? { ...n, x: n.x+dx, y: n.y+dy } : n));
  return (
    <>
      <svg><defs><marker id="arrow" refX="10" refY="5" orient="auto"><polygon points="0 0,10 5,0 10" fill="#333"/></marker></defs>
        {paths.map((d,i) => <path key={i} d={d} stroke="#333" fill="none" markerEnd="url(#arrow)"/>)}
      </svg>
      {nodes.map(n => <div key={n.id} onMouseMove={e => e.buttons===1 && onDrag(n.id, e.movementX, e.movementY)}>{n.label}</div>)}
      <ul>{nodes.map(n => <li key={n.id}>{n.label}</li>)}</ul>
    </>
  );
*/
