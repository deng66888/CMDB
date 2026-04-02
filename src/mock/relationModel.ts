/**
 * 关系建模：定义「关系对」左端配置类 - 关系动词 - 右端配置类
 * 关系动词区分：调用/消费/发布（逻辑）、部署于/运行于（部署）、属于/组成（结构）、转发至（网络）、监控/告警关联
 */

export interface RelationModelRecord {
  id: string
  /** 左端配置类（关系起点，箭头从左指向右） */
  leftClass: string
  /** 关系动词（如 调用、部署于、组成） */
  relationVerb: string
  /** 右端配置类（关系终点） */
  rightClass: string
  description: string
  impactDesc: string
  enabled: boolean
  /** 左端关联字段：配置项实例查找关系时通过该字段建立连接 */
  leftLinkField?: string
  /** 是否启用左端关联字段 */
  leftLinkFieldEnabled?: boolean
  /** 右端关联字段 */
  rightLinkField?: string
  /** 是否启用右端关联字段 */
  rightLinkFieldEnabled?: boolean
  creator: string
  createTime: string
  updateTime: string
}

const t = '2024-03-01 10:00:00'

export const relationModelListMock: RelationModelRecord[] = [
  { id: '1', leftClass: '物理服务器', relationVerb: '包含', rightClass: '内存模块', description: '物理机包含内存条', impactDesc: '内存故障影响该服务器', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '2', leftClass: '物理服务器', relationVerb: '包含', rightClass: '存储设备', description: '物理机挂载存储', impactDesc: '存储不可用影响服务器', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '3', leftClass: '虚拟服务器', relationVerb: '托管在', rightClass: '集群节点', description: '虚机托管于节点', impactDesc: '节点宕机影响其上虚机', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '4', leftClass: 'ESX服务器', relationVerb: '虚拟化的', rightClass: '虚拟服务器', description: '由 ESX 虚拟化出虚机', impactDesc: '宿主机故障导致虚机不可用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '5', leftClass: '应用', relationVerb: '运行在', rightClass: '虚拟服务器', description: '应用部署于虚机', impactDesc: '虚机故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '6', leftClass: '应用', relationVerb: '依赖于', rightClass: '数据库', description: '应用依赖数据库', impactDesc: '数据库故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '7', leftClass: '微服务', relationVerb: '调用', rightClass: '数据库', description: '微服务通过 JDBC 调用数据库', impactDesc: '数据库不可用影响微服务', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '8', leftClass: '微服务', relationVerb: '归档至', rightClass: '数据库', description: '日志归档到数据库', impactDesc: '归档目标故障影响微服务', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '9', leftClass: '集群', relationVerb: '组成', rightClass: '集群节点', description: '集群由多节点组成', impactDesc: '节点故障影响集群', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '10', leftClass: '集群节点', relationVerb: '托管在', rightClass: '物理服务器', description: '节点部署于物理机', impactDesc: '物理机宕机影响节点', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '11', leftClass: '虚拟服务器', relationVerb: '运行在', rightClass: 'ESX服务器', description: '虚机运行于 ESX', impactDesc: '宿主机故障导致虚机不可用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '12', leftClass: '应用', relationVerb: '部署于', rightClass: 'Pod', description: '应用部署于 K8s Pod', impactDesc: 'Pod 故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '13', leftClass: '负载均衡', relationVerb: '转发至', rightClass: '应用', description: '负载均衡反向代理至应用', impactDesc: '应用不可用影响流量', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '14', leftClass: '网关', relationVerb: '转发至', rightClass: '负载均衡', description: '网关反向代理至负载均衡', impactDesc: '负载均衡故障影响入口', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '15', leftClass: '应用', relationVerb: '依赖于', rightClass: 'Redis', description: '应用依赖缓存', impactDesc: 'Redis 故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '16', leftClass: '微服务', relationVerb: '消费', rightClass: '消息队列', description: '微服务消费 MQ 消息', impactDesc: '消息队列故障影响调用链', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '17', leftClass: '微服务', relationVerb: '发布', rightClass: '消息队列', description: '微服务向 MQ 发布消息', impactDesc: 'MQ 故障影响发布', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '18', leftClass: '应用', relationVerb: '通过数据源连接', rightClass: '数据源', description: '应用经数据源连接数据库', impactDesc: '数据源故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '19', leftClass: '数据源', relationVerb: '连接至', rightClass: 'MySQL数据库', description: '数据源连接 MySQL', impactDesc: 'MySQL 故障影响数据源', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '20', leftClass: '数据源', relationVerb: '连接至', rightClass: 'Oracle数据库', description: '数据源连接 Oracle', impactDesc: 'Oracle 故障影响业务', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '21', leftClass: '容器', relationVerb: '运行在', rightClass: '容器节点', description: '容器运行于容器节点', impactDesc: '节点故障影响容器', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '22', leftClass: '微服务', relationVerb: '运行在', rightClass: '容器', description: '微服务容器化部署', impactDesc: '容器故障影响微服务', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '23', leftClass: 'K8s集群', relationVerb: '组成', rightClass: 'Deployment', description: '集群包含 Deployment', impactDesc: 'Deployment 故障影响集群', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '24', leftClass: 'Deployment', relationVerb: '组成', rightClass: 'Pod', description: 'Deployment 管理 Pod', impactDesc: 'Pod 故障影响 Deployment', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '25', leftClass: 'Pod', relationVerb: '运行在', rightClass: '容器节点', description: 'Pod 调度于容器节点', impactDesc: '节点故障影响 Pod', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '26', leftClass: 'K8s集群', relationVerb: '托管在', rightClass: '物理服务器', description: 'K8s 节点在物理机上', impactDesc: '物理机影响集群', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '27', leftClass: 'API服务', relationVerb: '调用', rightClass: '数据库', description: 'API HTTP 调用访问数据库', impactDesc: '数据库故障影响 API', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '28', leftClass: 'API服务', relationVerb: '消费', rightClass: '消息队列', description: 'API 消费 MQ 消息', impactDesc: 'MQ 故障影响 API', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '29', leftClass: '存储设备', relationVerb: '连接至', rightClass: '交换机', description: '存储连到交换机', impactDesc: '网络故障影响存储访问', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '30', leftClass: '物理服务器', relationVerb: '连接至', rightClass: '交换机', description: '服务器接入交换机', impactDesc: '交换机故障影响服务器', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '31', leftClass: '交换机', relationVerb: '连接至', rightClass: '路由器', description: '交换机上联路由器', impactDesc: '路由器故障影响网段', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '32', leftClass: '应用', relationVerb: '归档至', rightClass: '对象存储', description: '日志/备份到对象存储', impactDesc: '对象存储故障影响归档', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '33', leftClass: '物理服务器', relationVerb: '挂载', rightClass: 'NAS', description: '服务器挂载 NAS', impactDesc: 'NAS 故障影响文件访问', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '34', leftClass: '中间件', relationVerb: '运行在', rightClass: '物理服务器', description: '中间件部署于物理机', impactDesc: '服务器故障影响中间件', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '35', leftClass: '应用', relationVerb: '依赖于', rightClass: '中间件', description: '应用依赖中间件', impactDesc: '中间件故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '36', leftClass: 'Service', relationVerb: '转发至', rightClass: 'Pod', description: 'K8s Service 转发至 Pod', impactDesc: 'Pod 不可用影响 Service', enabled: true, creator: '管理员', createTime: t, updateTime: t },
  { id: '37', leftClass: '应用', relationVerb: '调用', rightClass: 'Service', description: '应用调用 K8s Service', impactDesc: 'Service 故障影响应用', enabled: true, creator: '管理员', createTime: t, updateTime: t },
]

export const RELATION_MODEL_CLASS_OPTIONS = [
  '应用', '微服务', 'API服务', '网关', '负载均衡', '中间件', '消息队列', 'Redis', '数据库', 'MySQL数据库', 'Oracle数据库', '数据源', '对象存储', 'NAS',
  '物理服务器', '虚拟服务器', '容器节点', 'ESX服务器', '集群', '集群节点', 'K8s集群', 'Deployment', 'Service', 'Pod', '容器',
  '内存模块', '存储设备', '交换机', '路由器', '服务', '计算机',
]
/** 细化关系类型：调用/消费/发布、部署于/运行于、属于/组成、转发至、监控/告警关联 */
export const RELATION_MODEL_VERB_OPTIONS = [
  '调用', '消费', '发布', '转发至',
  '部署于', '运行在', '托管在', '虚拟化的',
  '属于', '组成', '包含',
  '依赖于', '连接至', '通过数据源连接', '归档至', '挂载',
  '监控', '告警关联', '成员',
]
/** 关联字段选项：配置项实例查找关系时用于建立连接的属性 */
export const RELATION_LINK_FIELD_OPTIONS = ['名称', '唯一编码', 'IP', '主机名', '端口', '实例ID']

/** 根据两个配置类查找所有匹配的关系对（顺序无关：左-右 或 右-左 都算） */
export function getRelationPairs(
  list: RelationModelRecord[],
  classA: string,
  classB: string
): RelationModelRecord[] {
  const a = (classA || '').trim()
  const b = (classB || '').trim()
  if (!a || !b) return []
  return list.filter(
    (r) => r.enabled && ((r.leftClass === a && r.rightClass === b) || (r.leftClass === b && r.rightClass === a))
  )
}

/** 从关系对推导：当前配置类为 currentClass，对端为 peerClass，选中的关系对 pair → 应加入 upstream 还是 downstream，以及展示的关系动词与对端名称 */
export function deriveRelationFromPair(
  pair: RelationModelRecord,
  currentClass: string
): { relation: string; target: string; isUpstream: boolean } {
  const cur = (currentClass || '').trim()
  if (pair.leftClass === cur) {
    return { relation: pair.relationVerb, target: pair.rightClass, isUpstream: false }
  }
  if (pair.rightClass === cur) {
    return { relation: pair.relationVerb, target: pair.leftClass, isUpstream: true }
  }
  return { relation: pair.relationVerb, target: pair.rightClass, isUpstream: false }
}

/** 拓扑校验：检测循环依赖、孤立节点等 */
export function runTopologyValidation(enabled: RelationModelRecord[]) {
  const nodes = new Set<string>()
  enabled.forEach((r) => { nodes.add(r.leftClass); nodes.add(r.rightClass) })
  const outgoing = new Map<string, Set<string>>()
  const incoming = new Map<string, Set<string>>()
  nodes.forEach((n) => { outgoing.set(n, new Set()); incoming.set(n, new Set()) })
  enabled.forEach((r) => {
    outgoing.get(r.leftClass)!.add(r.rightClass)
    incoming.get(r.rightClass)!.add(r.leftClass)
  })

  const cycles: string[][] = []
  const visited = new Set<string>()
  const stack = new Set<string>()
  const path: string[] = []
  const pathIndex = new Map<string, number>()

  function dfs(n: string) {
    visited.add(n)
    stack.add(n)
    const idx = path.length
    pathIndex.set(n, idx)
    path.push(n)
    for (const to of outgoing.get(n)!) {
      if (!visited.has(to)) {
        dfs(to)
      } else if (stack.has(to)) {
        const start = pathIndex.get(to) ?? 0
        cycles.push(path.slice(start).concat(to))
      }
    }
    path.pop()
    pathIndex.delete(n)
    stack.delete(n)
  }
  nodes.forEach((n) => { if (!visited.has(n)) dfs(n) })

  const noIncoming = Array.from(nodes).filter((n) => incoming.get(n)!.size === 0)
  const noOutgoing = Array.from(nodes).filter((n) => outgoing.get(n)!.size === 0)

  return { cycles, noIncoming, noOutgoing }
}

/** AI 辅助建模：智能推荐关系（基于历史数据/常见模式，未来可对接 ELK、Prometheus、GNN） */
export interface AiRelationRecommendation {
  id: string
  source: string
  target: string
  recommended_relation: string
  confidence: number
  evidence: string
}

/** 高置信度建议 mock，后续可替换为对接日志/监控或 GNN 输出 */
export const aiRelationRecommendationsMock: AiRelationRecommendation[] = [
  {
    id: 'ai-1',
    source: '应用',
    target: 'MySQL数据库',
    recommended_relation: '通过数据源连接',
    confidence: 0.95,
    evidence: '端口 3306 流量持续 > 10MB/s，疑似数据库连接',
  },
  {
    id: 'ai-2',
    source: '微服务',
    target: 'Redis',
    recommended_relation: '依赖于',
    confidence: 0.88,
    evidence: '检测到 Redis 6379 端口调用模式与缓存访问一致',
  },
  {
    id: 'ai-3',
    source: '网关',
    target: '应用',
    recommended_relation: '转发至',
    confidence: 0.82,
    evidence: 'HTTP 路由与上游应用实例存在稳定转发关系',
  },
  {
    id: 'ai-4',
    source: '应用',
    target: '消息队列',
    recommended_relation: '消费',
    confidence: 0.79,
    evidence: '消息队列 Topic 订阅关系与应用实例匹配',
  },
]
