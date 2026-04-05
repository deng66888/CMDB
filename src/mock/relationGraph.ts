/**
 * 关系图、新增关系、过滤设置 相关 mock
 * 企业级资产与关系：模拟从真实大环境拉取的配置项实例与关系，保证关系逻辑合理连接
 */

/** 关系图节点 */
export interface RelationGraphNode {
  id: string
  name: string
  category: string
  iconType: 'server' | 'app' | 'business'
}

/** 关系图边 */
export interface RelationGraphEdge {
  id: string
  sourceId: string
  targetId: string
  relation: string
}

/** 企业资产条目（与 CIRecord 对应，用于关系图与详情上游/下游） */
export interface EnterpriseAsset {
  id: string
  name: string
  category: string
}

/** 企业关系（有向：source -> target） */
export interface EnterpriseRelation {
  sourceId: string
  targetId: string
  relation: string
}

/** 企业级资产实例：服务器、数据库、应用、负载均衡、存储、网络等，符合真实大企业环境 */
export const enterpriseAssetsMock: EnterpriseAsset[] = [
  { id: 'ci-detail-1', name: '应用服务器', category: '服务器' },
  { id: 'phy-srv-01', name: 'PHY-SRV-机房A-01', category: '服务器' },
  { id: 'phy-srv-02', name: 'PHY-SRV-机房A-02', category: '服务器' },
  { id: 'phy-srv-03', name: 'PHY-SRV-机房B-01', category: '服务器' },
  { id: 'vm-web-01', name: 'VM-WEB-APP-01', category: '虚拟服务器' },
  { id: 'vm-web-02', name: 'VM-WEB-APP-02', category: '虚拟服务器' },
  { id: 'vm-db-01', name: 'VM-DB-ORA-01', category: '虚拟服务器' },
  { id: 'vm-db-02', name: 'VM-DB-MYSQL-01', category: '虚拟服务器' },
  { id: 'spa-srv-02', name: 'SPA应用程序SRV02', category: '应用' },
  { id: 'spa-ora-01', name: 'SPA ORA01', category: '数据库' },
  { id: 'san-002', name: '存储区域网络: 002', category: '存储' },
  { id: 'sap-web-01', name: 'SAP WEB01', category: '应用系统' },
  { id: 'sap-lb-01', name: 'SAP LoadBal01', category: '应用系统' },
  { id: 'app-itom', name: '应用系统 ITOM', category: '应用系统' },
  { id: 'app-front', name: '应用前端 ITOM', category: '应用系统' },
  { id: 'biz-itom', name: '业务服务 ITOM', category: '业务服务' },
  { id: 'core-trade', name: '核心交易系统', category: '应用系统' },
  { id: 'order-svc', name: '订单服务', category: '业务服务' },
  { id: 'pay-gw', name: '支付网关', category: '业务服务' },
  { id: 'user-center', name: '用户中心', category: '应用系统' },
  { id: 'report-center', name: '报表中心', category: '应用系统' },
  { id: 'oracle-prd', name: 'Oracle-PRD-01', category: '数据库' },
  { id: 'mysql-txn', name: 'MySQL-TXN-01', category: '数据库' },
  { id: 'redis-cache', name: 'Redis-Cache-01', category: '数据库' },
  { id: 'lb-inbound', name: 'LB-入口-01', category: '负载均衡' },
  { id: 'lb-app', name: 'LB-应用-01', category: '负载均衡' },
  { id: 'nas-share', name: 'NAS-共享-01', category: '存储' },
  { id: 'san-lun-pool', name: 'SAN-LUN-Pool-01', category: '存储' },
  { id: 'sw-idc-a', name: 'SW-IDC-A-01', category: '交换机' },
  { id: 'sw-idc-b', name: 'SW-IDC-B-01', category: '交换机' },
  { id: 'router-dmz', name: 'Router-DMZ-01', category: '路由器' },
  { id: 'nginx-gw-01', name: 'Nginx-GW-01', category: '中间件' },
  { id: 'tomcat-app-01', name: 'Tomcat-APP-01', category: '中间件' },
  { id: 'kafka-cluster', name: 'Kafka-Cluster-01', category: '消息队列' },
  { id: 'es-log', name: 'ES-Log-01', category: '数据库' },
  { id: 'cmdb-svc', name: 'CMDB服务', category: '业务服务' },
  { id: 'monitor-platform', name: '监控平台', category: '应用系统' },
  { id: 'log-platform', name: '日志平台', category: '应用系统' },
]

/** 企业级关系：部署/运行于/取决于/连接/使用者等，有向边，符合真实拓扑 */
export const enterpriseRelationsMock: EnterpriseRelation[] = [
  { sourceId: 'spa-srv-02', targetId: 'ci-detail-1', relation: '部署' },
  { sourceId: 'spa-ora-01', targetId: 'ci-detail-1', relation: '取决于' },
  { sourceId: 'san-002', targetId: 'ci-detail-1', relation: '与...交换数据' },
  { sourceId: 'ci-detail-1', targetId: 'sap-web-01', relation: '使用者' },
  { sourceId: 'ci-detail-1', targetId: 'sap-lb-01', relation: '是...交换数据' },
  { sourceId: 'ci-detail-1', targetId: 'app-itom', relation: '包含' },
  { sourceId: 'ci-detail-1', targetId: 'app-front', relation: '包含' },
  { sourceId: 'app-itom', targetId: 'biz-itom', relation: '基于' },
  { sourceId: 'vm-web-01', targetId: 'phy-srv-01', relation: '运行于' },
  { sourceId: 'vm-web-02', targetId: 'phy-srv-01', relation: '运行于' },
  { sourceId: 'vm-db-01', targetId: 'phy-srv-02', relation: '运行于' },
  { sourceId: 'vm-db-02', targetId: 'phy-srv-02', relation: '运行于' },
  { sourceId: 'core-trade', targetId: 'vm-web-01', relation: '部署' },
  { sourceId: 'order-svc', targetId: 'vm-web-01', relation: '部署' },
  { sourceId: 'user-center', targetId: 'vm-web-02', relation: '部署' },
  { sourceId: 'oracle-prd', targetId: 'vm-db-01', relation: '运行于' },
  { sourceId: 'mysql-txn', targetId: 'vm-db-02', relation: '运行于' },
  { sourceId: 'redis-cache', targetId: 'vm-db-02', relation: '运行于' },
  { sourceId: 'core-trade', targetId: 'oracle-prd', relation: '取决于' },
  { sourceId: 'order-svc', targetId: 'mysql-txn', relation: '取决于' },
  { sourceId: 'order-svc', targetId: 'redis-cache', relation: '取决于' },
  { sourceId: 'pay-gw', targetId: 'order-svc', relation: '基于' },
  { sourceId: 'user-center', targetId: 'mysql-txn', relation: '取决于' },
  { sourceId: 'lb-inbound', targetId: 'nginx-gw-01', relation: '连接' },
  { sourceId: 'nginx-gw-01', targetId: 'lb-app', relation: '连接' },
  { sourceId: 'lb-app', targetId: 'vm-web-01', relation: '连接' },
  { sourceId: 'lb-app', targetId: 'vm-web-02', relation: '连接' },
  { sourceId: 'phy-srv-01', targetId: 'sw-idc-a', relation: '连接至' },
  { sourceId: 'phy-srv-02', targetId: 'sw-idc-a', relation: '连接至' },
  { sourceId: 'sw-idc-a', targetId: 'router-dmz', relation: '连接至' },
  { sourceId: 'san-002', targetId: 'sw-idc-a', relation: '连接至' },
  { sourceId: 'nas-share', targetId: 'phy-srv-01', relation: '挂载' },
  { sourceId: 'san-lun-pool', targetId: 'phy-srv-02', relation: '连接至' },
  { sourceId: 'core-trade', targetId: 'kafka-cluster', relation: '与...交换数据' },
  { sourceId: 'order-svc', targetId: 'kafka-cluster', relation: '与...交换数据' },
  { sourceId: 'monitor-platform', targetId: 'phy-srv-01', relation: '监控' },
  { sourceId: 'monitor-platform', targetId: 'vm-web-01', relation: '监控' },
  { sourceId: 'log-platform', targetId: 'vm-web-01', relation: '连接' },
  { sourceId: 'cmdb-svc', targetId: 'phy-srv-01', relation: '连接' },
  { sourceId: 'report-center', targetId: 'oracle-prd', relation: '取决于' },
  { sourceId: 'report-center', targetId: 'vm-web-02', relation: '部署' },
]

/** 依赖关系类型（用于新增关系表单） */
export interface RelationTypeOption {
  value: string
  label: string
}

export const relationTypeOptions: RelationTypeOption[] = [
  { value: '部署', label: '部署' },
  { value: '包含', label: '包含' },
  { value: '基于', label: '基于' },
  { value: '取决于', label: '取决于' },
  { value: '使用者', label: '使用者' },
  { value: '与...交换数据', label: '与...交换数据' },
  { value: '是...交换数据', label: '是...交换数据' },
  { value: '运行于', label: '运行于' },
  { value: '连接', label: '连接' },
]

const assetById = new Map(enterpriseAssetsMock.map((a) => [a.id, a]))

function iconTypeForCategory(category: string): 'server' | 'app' | 'business' {
  if (/服务器|存储|交换机|路由器|计算机/i.test(category)) return 'server'
  if (/业务服务|API|网关/i.test(category)) return 'business'
  return 'app'
}

/**
 * 以当前配置项为中心的关系图数据，从企业资产与关系拉取：
 * - 当前配置项必为节点且处于中心，上游在左、下游在右
 * - 仅包含与当前 CI 直接相连的节点及它们之间的边，关系逻辑符合真实大企业拓扑
 */
/** 仅传节点 id：从资产表解析名称与类型后拉取以该节点为中心的关系图（用于拓扑漫游切换中心） */
export function getGraphDataByNodeId(nodeId: string) {
  const asset = assetById.get(nodeId)
  const name = asset?.name ?? nodeId
  const category = asset?.category ?? '服务器'
  return getRelationGraphData(nodeId, name, category)
}

/** 与「点击节点以该 id 为中心拉取拓扑」的常见命名一致 */
export const getGraphData = getGraphDataByNodeId

export function getRelationGraphData(ciId: string, ciName: string, category: string) {
  const idSet = new Set<string>([ciId])
  const relevantEdges = enterpriseRelationsMock.filter((e) => e.sourceId === ciId || e.targetId === ciId)
  relevantEdges.forEach((e) => {
    idSet.add(e.sourceId)
    idSet.add(e.targetId)
  })
  const nodes: RelationGraphNode[] = []
  const seen = new Set<string>()
  for (const id of idSet) {
    if (seen.has(id)) continue
    seen.add(id)
    const asset = assetById.get(id)
    const name = id === ciId ? ciName : asset?.name ?? id
    const cat = id === ciId ? (category || '服务器') : asset?.category ?? '服务器'
    nodes.push({ id, name, category: cat, iconType: iconTypeForCategory(cat) })
  }
  const edges: RelationGraphEdge[] = relevantEdges.map((e, i) => ({
    id: `e-${e.sourceId}-${e.targetId}-${i}`,
    sourceId: e.sourceId,
    targetId: e.targetId,
    relation: e.relation,
  }))
  return { nodes, edges }
}

/** 快速定位：可选的配置项列表（当前 CI 及关联） */
export function getQuickLocateOptions(ciId: string, ciName: string) {
  const { nodes } = getRelationGraphData(ciId, ciName, '服务器')
  return nodes.map((n) => ({ id: n.id, name: n.name, category: n.category }))
}

/** 过滤设置：可筛选项 */
export interface RelationGraphFilter {
  /** 展示的 CI 类型：多选，空表示全部 */
  ciTypes: string[]
  /** 展示的关系类型：多选，空表示全部 */
  relationTypes: string[]
  /** 层级深度 1-5 */
  depth: number
  /** 是否显示业务友好名称 */
  useDisplayName: boolean
  /** 变更影响分析 开关 */
  changeImpact: boolean
  /** 启用监控 开关 */
  enableMonitor: boolean
}

export const defaultRelationGraphFilter: RelationGraphFilter = {
  ciTypes: [],
  relationTypes: [],
  depth: 3,
  useDisplayName: true,
  changeImpact: false,
  enableMonitor: false,
}
