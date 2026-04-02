/** 配置项、审计、发现审批等通用模拟数据 */

import { enterpriseAssetsMock, enterpriseRelationsMock } from './relationGraph'

export type AuditStatus = '待审计' | '通过' | '不匹配' | '丢失'
export type ApprovalStatus = '待审批' | '已审批'
export type DiscoveryType = '新增' | '变更' | '差异' | '特审批'

export interface CIRecord {
  id: string
  name: string
  category: string
  vendor?: string
  assetId?: string
  creator: string
  createTime: string
  status?: string
  auditStatus?: AuditStatus
  approvalStatus?: ApprovalStatus
  discoveryType?: DiscoveryType
}

const t = '2021-09-02 14:28:28'
const t2 = '2021-10-15 10:00:00'

export const ciListMock: CIRecord[] = [
  ...enterpriseAssetsMock.map((a, i) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    creator: '管理员',
    createTime: i % 2 === 0 ? t : t2,
    status: '已安装' as const,
    auditStatus: '待审计' as AuditStatus,
    approvalStatus: '待审批' as ApprovalStatus,
  })),
  { id: '1', name: 'LinuxServer', category: '服务器', creator: '管理员', createTime: t, status: '已安装', auditStatus: '待审计', approvalStatus: '待审批', discoveryType: '新增' },
  { id: '2', name: 'MacBook Pro 15', category: '计算机', vendor: '苹果', creator: '管理员', createTime: t, status: '已安装', auditStatus: '待审计', approvalStatus: '待审批', discoveryType: '变更' },
  { id: '3', name: 'Tomcat', category: '中间件', vendor: '苹果', creator: '管理员', createTime: t, status: '已安装', auditStatus: '待审计', approvalStatus: '待审批', discoveryType: '差异' },
  { id: '4', name: 'Nginx', category: '中间件', vendor: '苹果', creator: '管理员', createTime: t, status: '已安装', auditStatus: '待审计', approvalStatus: '待审批' },
  { id: '5', name: 'Nginx2', category: '中间件', vendor: '苹果', creator: '管理员', createTime: t, status: '已安装', auditStatus: '待审计' },
  { id: '6', name: 'Mysql', category: '数据库', vendor: '苹果', assetId: 'test', creator: 'test', createTime: t, status: '已发布', auditStatus: '待审计' },
  { id: '7', name: 'Oracle', category: '数据库', vendor: '苹果', assetId: 'test', creator: 'test', createTime: t, status: '已安装', auditStatus: '待审计' },
  { id: '8', name: 'eth0', category: '网络适配器', vendor: '微软', creator: 'test', createTime: t, status: '已安装', auditStatus: '待审计' },
  { id: '9', name: 'eth1', category: '网络适配器', vendor: '微软', creator: 'test', createTime: t, status: '已安装', auditStatus: '待审计' },
  { id: '10', name: 'eth2', category: '网络适配器', vendor: '微软', creator: 'test', createTime: t, status: '已安装', auditStatus: '待审计' },
]

export const totalCountMock = 800

/** 配置类列表（数量多，用于左侧面板） */
export const configClassListMock = [
  'Oracle应用TNS服务', 'Oracle并发服务', 'Oracle数据库侦听器', 'Oracle发现省用户界面', 'Oracle ESB',
  '服务器', '计算机', '中间件', '数据库', '网络适配器', '存储设备', '安全设备', '应用系统', '虚拟化', '公有云', '私有云', '办公设备',
  'Linux服务器', 'Windows服务器', 'Unix服务器', '数据库实例', 'Web应用', 'API网关', '负载均衡', '防火墙', '交换机', '路由器',
  'Tomcat实例', 'Nginx实例', 'MySQL实例', 'Redis实例', 'Kafka集群', 'Elasticsearch节点', 'Docker主机', 'K8s集群', 'VMware虚拟机',
  'Oracle RAC节点', 'Oracle DataGuard', 'SQL Server实例', 'PostgreSQL实例', 'MongoDB实例', 'RabbitMQ', 'Zookeeper', 'Consul',
  '应用服务A', '应用服务B', '批处理任务', '定时任务', '消息队列', '缓存服务', '文件服务', '日志服务', '监控代理', '备份客户端',
  '网络接口', '磁盘阵列', '磁带库', 'SAN存储', 'NAS存储', '对象存储', 'CDN节点', 'DNS服务', 'DHCP服务', 'NTP服务',
  '配置项类型A', '配置项类型B', '业务应用', '基础设施', '云资源', '容器镜像', '微服务', '函数计算', 'Serverless', '中间件集群',
  '数据库集群', '缓存集群', '消息集群', '搜索集群', '大数据节点', 'AI训练节点', 'GPU服务器', '高性能计算', '工单系统', 'CMDB节点',
]

/** 配置类树节点：应用与其它配置类同级或嵌套，任意节点可有多个下级 */
export interface ConfigClassTreeNode {
  key: string
  title: string
  children?: ConfigClassTreeNode[]
}

/** 配置类树（根为虚拟“配置类”，其下为多级树，应用与其它类按真实层级混合） */
export const configClassTreeMock: ConfigClassTreeNode[] = [
  {
    key: '应用',
    title: '应用',
    children: [
      { key: 'Oracle应用TNS服务', title: 'Oracle应用TNS服务' },
      { key: 'Oracle并发服务', title: 'Oracle并发服务' },
      { key: 'Oracle数据库侦听器', title: 'Oracle数据库侦听器' },
      { key: 'Oracle发现省用户界面', title: 'Oracle发现省用户界面' },
      { key: 'Oracle ESB', title: 'Oracle ESB' },
      { key: '核心交易系统', title: '核心交易系统' },
      { key: '报表中心', title: '报表中心' },
      { key: '用户中心', title: '用户中心' },
      { key: '订单服务', title: '订单服务' },
      { key: '支付网关', title: '支付网关' },
      { key: '消息中心', title: '消息中心' },
      { key: '配置中心', title: '配置中心' },
      { key: '监控平台', title: '监控平台' },
      { key: '日志平台', title: '日志平台' },
      { key: '运维平台', title: '运维平台' },
      { key: 'DevOps流水线', title: 'DevOps流水线' },
      { key: 'CMDB服务', title: 'CMDB服务' },
      { key: 'API管理', title: 'API管理' },
      { key: '门户系统', title: '门户系统' },
      { key: '数据中台', title: '数据中台' },
    ],
  },
  {
    key: '服务器',
    title: '服务器',
    children: [
      { key: 'Linux服务器', title: 'Linux服务器' },
      { key: 'Windows服务器', title: 'Windows服务器' },
      { key: 'Unix服务器', title: 'Unix服务器' },
      { key: '服务器', title: '服务器' },
    ],
  },
  { key: '计算机', title: '计算机' },
  {
    key: '中间件',
    title: '中间件',
    children: [
      { key: 'Tomcat实例', title: 'Tomcat实例' },
      { key: 'Nginx实例', title: 'Nginx实例' },
      { key: 'MySQL实例', title: 'MySQL实例' },
      { key: 'Redis实例', title: 'Redis实例' },
      { key: 'Web应用', title: 'Web应用' },
      { key: 'API网关', title: 'API网关' },
      { key: '负载均衡', title: '负载均衡' },
      { key: '中间件', title: '中间件' },
    ],
  },
  {
    key: '数据库',
    title: '数据库',
    children: [
      { key: '数据库实例', title: '数据库实例' },
      { key: 'Oracle RAC节点', title: 'Oracle RAC节点' },
      { key: 'Oracle DataGuard', title: 'Oracle DataGuard' },
      { key: 'SQL Server实例', title: 'SQL Server实例' },
      { key: 'PostgreSQL实例', title: 'PostgreSQL实例' },
      { key: 'MongoDB实例', title: 'MongoDB实例' },
      { key: '数据库', title: '数据库' },
    ],
  },
  { key: '网络适配器', title: '网络适配器' },
  {
    key: '存储设备',
    title: '存储设备',
    children: [
      { key: '磁盘阵列', title: '磁盘阵列' },
      { key: '磁带库', title: '磁带库' },
      { key: 'SAN存储', title: 'SAN存储' },
      { key: 'NAS存储', title: 'NAS存储' },
      { key: '对象存储', title: '对象存储' },
      { key: '存储设备', title: '存储设备' },
    ],
  },
  {
    key: '安全设备',
    title: '安全设备',
    children: [
      { key: '防火墙', title: '防火墙' },
      { key: '安全设备', title: '安全设备' },
    ],
  },
  { key: '应用系统', title: '应用系统' },
  {
    key: '虚拟化',
    title: '虚拟化',
    children: [
      { key: 'VMware虚拟机', title: 'VMware虚拟机' },
      { key: 'Docker主机', title: 'Docker主机' },
      { key: 'K8s集群', title: 'K8s集群' },
      { key: '虚拟化', title: '虚拟化' },
    ],
  },
  { key: '公有云', title: '公有云' },
  { key: '私有云', title: '私有云' },
  { key: '办公设备', title: '办公设备' },
]

/** 应用列表（17个），含收藏状态 */
export interface AppItem {
  id: string
  name: string
  favorited: boolean
}
export const applicationListMock: AppItem[] = [
  { id: 'a1', name: 'Oracle应用TNS服务', favorited: true },
  { id: 'a2', name: 'Oracle并发服务', favorited: false },
  { id: 'a3', name: '核心交易系统', favorited: false },
  { id: 'a4', name: '报表中心', favorited: false },
  { id: 'a5', name: '用户中心', favorited: true },
  { id: 'a6', name: '订单服务', favorited: false },
  { id: 'a7', name: '支付网关', favorited: false },
  { id: 'a8', name: '消息中心', favorited: false },
  { id: 'a9', name: '配置中心', favorited: false },
  { id: 'a10', name: '监控平台', favorited: false },
  { id: 'a11', name: '日志平台', favorited: false },
  { id: 'a12', name: '运维平台', favorited: false },
  { id: 'a13', name: 'DevOps流水线', favorited: false },
  { id: 'a14', name: 'CMDB服务', favorited: true },
  { id: 'a15', name: 'API管理', favorited: false },
  { id: 'a16', name: '门户系统', favorited: false },
  { id: 'a17', name: '数据中台', favorited: false },
]

/** 服务器/配置项详情 */
export interface ServerDetail {
  name: string
  category: string
  assetId: string
  serialNumber: string
  modelId: string
  manufacturer: string
  config: Record<string, string | number | undefined>
  upstream: { name: string; relation: string }[]
  downstream: { name: string; relation: string }[]
}

const defaultConfig: Record<string, string | number | undefined> = {
  型号: '',
  操作系统: 'Windows XP',
  操作系统版本: '2',
  磁盘空间: 250,
  内存: 80,
  CPU插槽数: 6,
  状态: '已安装',
  CPU速度: 800,
  CPU数量: 1,
  CPU制造商: 'Intel',
  CPU类型: 'GenuineIntel',
  CPU核数: 1,
  所属机柜: '',
  环境: '生产',
  telnet用户名: 'admin',
  描述: '服务器',
}

const assetByIdMap = new Map(enterpriseAssetsMock.map((a) => [a.id, a]))

/** 根据配置项 id 从企业资产与关系生成详情（上游/下游来自关系，其余字段默认），保证与关系图一致 */
export function getDetailById(id: string): ServerDetail | null {
  const asset = assetByIdMap.get(id)
  if (!asset) return null
  const upstream = enterpriseRelationsMock
    .filter((e) => e.targetId === id)
    .map((e) => ({ name: assetByIdMap.get(e.sourceId)?.name ?? e.sourceId, relation: e.relation }))
  const downstream = enterpriseRelationsMock
    .filter((e) => e.sourceId === id)
    .map((e) => ({ name: assetByIdMap.get(e.targetId)?.name ?? e.targetId, relation: e.relation }))
  return {
    name: asset.name,
    category: asset.category,
    assetId: id.startsWith('phy-') ? `P${id.slice(-4)}` : id.slice(0, 12),
    serialNumber: '',
    modelId: 'Dell Inc. PowerEdge M710HD',
    manufacturer: 'Dell Inc.',
    config: { ...defaultConfig, 描述: asset.category },
    upstream,
    downstream,
  }
}

export const serverDetailMock: ServerDetail = {
  name: '应用服务器',
  category: '服务器',
  assetId: 'P1000204',
  serialNumber: '',
  modelId: 'Dell Inc. PowerEdge M710HD',
  manufacturer: 'Dell Inc.',
  config: defaultConfig,
  upstream: [
    { name: 'SPA应用程序SRV02', relation: '取决于' },
    { name: 'SPA ORA01', relation: '取决于' },
    { name: '存储区域网络: 002', relation: '取决于' },
    { name: '存储区域网络: 002', relation: '与...交换数据' },
  ],
  downstream: [
    { name: 'SAP WEB01', relation: '使用者' },
    { name: 'SAP LoadBal01', relation: '是...交换数据' },
  ],
}

/** 配置项详情 - 相关配置列表行（存储设备/文件系统/安装的软件/网卡） */
export interface RelatedConfigRow {
  id: string
  name: string
  type?: string
  size?: string
  creator: string
  createTime: string
}

/** 存储设备（当前服务器关联） */
export const relatedStorageMock: RelatedConfigRow[] = [
  { id: 's1', name: '本地磁盘 C:', type: 'SSD', size: '256 GB', creator: '管理员', createTime: '2021-09-02 14:28:28' },
  { id: 's2', name: '本地磁盘 D:', type: 'HDD', size: '1 TB', creator: '管理员', createTime: '2021-09-02 14:28:28' },
  { id: 's3', name: 'SAN LUN 001', type: 'SAN', size: '500 GB', creator: '管理员', createTime: '2021-10-15 10:00:00' },
]

/** 文件系统（当前服务器关联） */
export const relatedFilesystemMock: RelatedConfigRow[] = [
  { id: 'f1', name: 'C:\\', type: 'NTFS', size: '200 GB', creator: '管理员', createTime: '2021-09-02 14:28:28' },
  { id: 'f2', name: 'D:\\data', type: 'NTFS', size: '800 GB', creator: '管理员', createTime: '2021-09-02 14:30:00' },
  { id: 'f3', name: '/opt/app', type: 'ext4', size: '50 GB', creator: '管理员', createTime: '2021-11-01 09:00:00' },
]

/** 安装的软件（当前服务器关联） */
export const relatedSoftwareMock: RelatedConfigRow[] = [
  { id: 'w1', name: 'Oracle Database 19c', type: '数据库', creator: '管理员', createTime: '2021-09-05 11:00:00' },
  { id: 'w2', name: 'Tomcat 9.0', type: '中间件', creator: '管理员', createTime: '2021-09-06 14:20:00' },
  { id: 'w3', name: 'Nginx 1.20', type: '中间件', creator: '管理员', createTime: '2021-09-06 14:25:00' },
  { id: 'w4', name: 'Java Runtime 11', type: '运行时', creator: '管理员', createTime: '2021-09-02 15:00:00' },
  { id: 'w5', name: 'Windows Server 2019', type: '操作系统', creator: '系统', createTime: '2021-09-01 10:00:00' },
]

/** 网卡（当前服务器关联） */
export const relatedNicMock: RelatedConfigRow[] = [
  { id: 'n1', name: 'eth0', type: '千兆', creator: '管理员', createTime: '2021-09-02 14:28:28' },
  { id: 'n2', name: 'eth1', type: '千兆', creator: '管理员', createTime: '2021-09-02 14:28:28' },
  { id: 'n3', name: 'eth2', type: '万兆', creator: '管理员', createTime: '2021-10-01 16:00:00' },
]

/** 审计设置表单 */
export type AuditMethod = 'single' | 'daily' | 'weekly' | 'monthly'

/** 对比结果审核 - 行 */
export interface CompareRow {
  key: string
  label: string
  cmdb: string
  discovery: string
  checked?: boolean
  disabled?: boolean
}

/** 草稿列表 */
export interface DraftRecord {
  id: string
  name: string
  configClass: string
  creator: string
  createTime: string
}

export const draftListMock: DraftRecord[] = [
  { id: 'd1', name: 'LinuxServer-草稿', configClass: '服务器', creator: '管理员', createTime: '2021-12-01 10:00:00' },
  { id: 'd2', name: 'Tomcat-草稿', configClass: '中间件', creator: '管理员', createTime: '2021-12-02 14:30:00' },
  { id: 'd3', name: '新应用服务器', configClass: '服务器', creator: 'test', createTime: '2021-12-03 09:15:00' },
]

/** 审批记录 */
export interface ApprovalRecord {
  id: string
  name: string
  category: string
  applicant: string
  applyTime: string
  status: '待审批' | '已通过' | '已驳回'
}

/** 统一审批待办：来源类型 */
export type ApprovalSourceType = 'manual' | 'discovery'

/** 统一审批待办记录（人工申请 + 自动发现） */
export interface UnifiedApprovalRecord {
  id: string
  name: string
  category: string
  sourceType: ApprovalSourceType
  discoveryType?: DiscoveryType
  applicant: string
  applyTime: string
  status: '待审批' | '已通过' | '已驳回'
  /** 人工申请时的申请理由 */
  applyReason?: string
}

export const unifiedApprovalListMock: UnifiedApprovalRecord[] = [
  { id: 'u1', name: 'LinuxServer', category: '服务器', sourceType: 'manual', applicant: '管理员', applyTime: '2021-12-10 11:00:00', status: '待审批', applyReason: '新增生产环境服务器，需纳入CMDB管理。' },
  { id: 'u2', name: 'Oracle', category: '数据库', sourceType: 'manual', applicant: 'test', applyTime: '2021-12-10 10:30:00', status: '已通过', applyReason: '数据库实例信息变更。' },
  { id: 'u3', name: 'Nginx', category: '中间件', sourceType: 'manual', applicant: '管理员', applyTime: '2021-12-09 16:00:00', status: '已驳回', applyReason: '端口配置更新。' },
  { id: 'u4', name: 'Tomcat', category: '中间件', sourceType: 'discovery', discoveryType: '变更', applicant: '系统', applyTime: '2021-12-11 09:15:00', status: '待审批' },
  { id: 'u5', name: 'Mysql', category: '数据库', sourceType: 'discovery', discoveryType: '新增', applicant: '系统', applyTime: '2021-12-11 08:00:00', status: '待审批' },
  { id: 'u6', name: 'eth0', category: '网络适配器', sourceType: 'discovery', discoveryType: '差异', applicant: '系统', applyTime: '2021-12-10 14:20:00', status: '待审批' },
]

/** 版本记录 */
export interface VersionRecord {
  id: string
  version: string
  operator: string
  operateTime: string
  remark: string
}

export const versionListMock: VersionRecord[] = [
  { id: 'v1', version: 'v1.2', operator: '管理员', operateTime: '2021-12-15 10:00:00', remark: '更新配置信息' },
  { id: 'v2', version: 'v1.1', operator: 'test', operateTime: '2021-12-10 14:30:00', remark: '初始创建' },
]

export const approvalListMock: ApprovalRecord[] = [
  { id: 'a1', name: 'LinuxServer', category: '服务器', applicant: '管理员', applyTime: '2021-12-10 11:00:00', status: '待审批' },
  { id: 'a2', name: 'Oracle', category: '数据库', applicant: 'test', applyTime: '2021-12-10 10:30:00', status: '已通过' },
  { id: 'a3', name: 'Nginx', category: '中间件', applicant: '管理员', applyTime: '2021-12-09 16:00:00', status: '已驳回' },
]

export const compareResultMock: CompareRow[] = [
  { key: '1', label: 'IP地址', cmdb: '192.168.1.10', discovery: '192.168.1.10', checked: false },
  { key: '2', label: 'HBA卡', cmdb: '0', discovery: '0', disabled: true },
  { key: '3', label: '网卡详情', cmdb: '25条', discovery: '30条', checked: true },
  { key: '4', label: '服务信息列表', cmdb: '11条', discovery: '13条', checked: true },
  { key: '5', label: '网卡', cmdb: '25', discovery: '30', disabled: true },
  { key: '6', label: '磁盘详情', cmdb: '3条', discovery: '3条', checked: true },
  { key: '7', label: '主机名', cmdb: 'eve-ng-community', discovery: 'eve-ng-community', checked: false },
  { key: '8', label: '操作系统版本号', cmdb: '16.04', discovery: '16.04', checked: false },
]

// ========== 概览页 Mock ==========
export const overviewKpiMock = {
  configClassTotal: 21,
  configItemTotal: 234,
  myApproval: 0,
  maintenanceExpired: 0,
  maintenanceExpiring: 0,
  scrappedAssets: 0,
}

/** 配置类统计：类别顺序与 UI 图一致 */
export const overviewClassCategories = ['服务器', '网络设备', '存储设备', '安全设备', '中间件', '数据库', '应用系统', '虚拟化', '公有云', '私有云', '办公设备']
const overviewStatusOrder = ['使用', '闲置', '报废', '维修', '故障']

export const overviewClassStatMock: { category: string; status: string; count: number }[] = (() => {
  const counts: Record<string, Partial<Record<string, number>>> = {
    服务器: { 使用: 280, 闲置: 45, 报废: 12, 维修: 8, 故障: 5 },
    网络设备: { 使用: 85, 闲置: 10, 报废: 2, 维修: 1, 故障: 0 },
    存储设备: { 使用: 42, 闲置: 5, 报废: 0, 维修: 1, 故障: 0 },
    安全设备: { 使用: 38, 闲置: 3, 报废: 1, 维修: 0, 故障: 0 },
    中间件: { 使用: 95, 闲置: 12, 报废: 2, 维修: 2, 故障: 1 },
    数据库: { 使用: 58, 闲置: 8, 报废: 0, 维修: 1, 故障: 0 },
    应用系统: { 使用: 72, 闲置: 6, 报废: 1, 维修: 0, 故障: 0 },
    虚拟化: { 使用: 35, 闲置: 4, 报废: 0, 维修: 0, 故障: 0 },
    公有云: { 使用: 28, 闲置: 2, 报废: 0, 维修: 0, 故障: 0 },
    私有云: { 使用: 22, 闲置: 3, 报废: 0, 维修: 0, 故障: 0 },
    办公设备: { 使用: 156, 闲置: 24, 报废: 8, 维修: 3, 故障: 2 },
  }
  const data: { category: string; status: string; count: number }[] = []
  overviewClassCategories.forEach((category) => {
    overviewStatusOrder.forEach((status) => {
      const count = counts[category]?.[status] ?? 0
      if (count > 0) data.push({ category, status, count })
    })
  })
  return data
})()
export { overviewStatusOrder }

/** 折旧率报表行 */
export interface DepreciationRow {
  name: string
  purchaseTime: string
  purchasePrice: number
  depreciationRate: number
  depreciatedPrice: number
}
export const overviewDepreciationMock: DepreciationRow[] = [] // 暂无数据

/** 配置项动态时序：日期 4/1～4/13，类型顺序固定，数据按日期+类型排序保证图表顺序 */
export const overviewDynamicDateOrder = ['4/1', '4/2', '4/3', '4/4', '4/5', '4/6', '4/7', '4/8', '4/9', '4/10', '4/11', '4/12', '4/13']
export const overviewDynamicTypeOrder = ['新增', '变更', '维修', '故障', '报废', '删除']

export const overviewDynamicSeriesMock: { date: string; type: string; count: number }[] = (() => {
  const data: { date: string; type: string; count: number }[] = []
  const pct = [0.48, 0.26, 0.08, 0.06, 0.05, 0.07]
  overviewDynamicDateOrder.forEach((date, di) => {
    const dayTotal = 55 + (di === 0 ? 85 : 0) + Math.floor(Math.random() * 15)
    let rest = dayTotal
    const parts: number[] = []
    pct.forEach((p, i) => {
      const v = i === pct.length - 1 ? rest : Math.round(dayTotal * p)
      rest -= v
      parts.push(Math.max(0, v))
    })
    if (rest !== 0) parts[0] += rest
    overviewDynamicTypeOrder.forEach((type, ti) => {
      data.push({ date, type, count: parts[ti] ?? 0 })
    })
  })
  return data
})()

/** 配置项状态统计（环形图） */
export const overviewStatusStatMock: { status: string; value: number }[] = [
  { status: '新增', value: 10 },
  { status: '变更', value: 10 },
  { status: '维修中', value: 10 },
  { status: '空闲中', value: 10 },
  { status: '故障中', value: 10 },
  { status: '审批中', value: 10 },
  { status: '报废', value: 10 },
]

/** 报废/闲置配置项报表（按月），与 UI 图趋势一致 */
export const overviewScrappedSeriesMock: { month: string; count: number }[] = [
  { month: '2021-08', count: 0.72 },
  { month: '2021-09', count: 0.68 },
  { month: '2021-10', count: 0.75 },
  { month: '2021-11', count: 0.78 },
  { month: '2021-12', count: 0.4 },
  { month: '2022-01', count: 0.65 },
  { month: '2022-02', count: 0.7 },
  { month: '2022-03', count: 0.68 },
  { month: '2022-04', count: 0.72 },
]
export const overviewIdleSeriesMock: { month: string; count: number }[] = [
  { month: '2021-08', count: 0.65 },
  { month: '2021-09', count: 0.7 },
  { month: '2021-10', count: 0.68 },
  { month: '2021-11', count: 0.72 },
  { month: '2021-12', count: 0.42 },
  { month: '2022-01', count: 0.68 },
  { month: '2022-02', count: 0.58 },
  { month: '2022-03', count: 0.7 },
  { month: '2022-04', count: 0.75 },
]

/** 四个评分卡片 */
export const overviewScoresMock = {
  completeness: {
    score: 7.1,
    lastUpdate: '2022-04-11 01:00:00',
    items: [
      { label: '必须填写', current: 68, total: 958, percent: 7.1, color: 'red' as const },
      { label: '建议填写', current: 0, total: 958, percent: 0, color: 'orange' as const },
    ],
  },
  compliance: {
    score: 60,
    lastUpdate: '2022-04-11 01:00:05',
    items: [
      { label: '不重复的', current: 838, total: 958, percent: 87.47, color: 'green' as const },
      { label: '审计通过', current: 6, total: 10, percent: 60, color: 'red' as const },
    ],
  },
  accuracy: {
    score: 98.43,
    lastUpdate: '2022-04-11 01:00:09',
    items: [
      { label: '已报废', current: 3, total: 191, percent: 1.57, color: 'green' as const },
      { label: '出错的', current: 0, total: 191, percent: 0, color: 'red' as const },
    ],
  },
  maintenanceExpiration: {
    score: 81.36,
    lastUpdate: '2022-04-11 01:00:09',
    items: [
      { label: '已过保', current: 22, total: 118, percent: 18.64, color: 'red' as const },
      { label: '即将过保', current: 1, total: 118, percent: 0.85, color: 'volcano' as const },
    ],
  },
}

// ========== 维保提醒 ==========
export type MaintenanceStatus = 'expired' | 'expiring_30' | 'expiring_60' | 'expiring_90'

export interface MaintenanceRecord {
  id: string
  name: string
  category: string
  maintenanceEndDate: string
  daysRemaining: number
  owner: string
  status: MaintenanceStatus
}

export const maintenanceListMock: MaintenanceRecord[] = [
  { id: 'm1', name: 'LinuxServer', category: '服务器', maintenanceEndDate: '2022-01-05', daysRemaining: -35, owner: '管理员', status: 'expired' },
  { id: 'm2', name: 'MacBook Pro 15', category: '计算机', maintenanceEndDate: '2022-02-10', daysRemaining: -5, owner: '管理员', status: 'expired' },
  { id: 'm3', name: 'Tomcat', category: '中间件', maintenanceEndDate: '2022-03-28', daysRemaining: 12, owner: 'test', status: 'expiring_30' },
  { id: 'm4', name: 'Nginx', category: '中间件', maintenanceEndDate: '2022-04-15', daysRemaining: 30, owner: '管理员', status: 'expiring_30' },
  { id: 'm5', name: 'Mysql', category: '数据库', maintenanceEndDate: '2022-05-20', daysRemaining: 65, owner: 'test', status: 'expiring_60' },
  { id: 'm6', name: 'Oracle', category: '数据库', maintenanceEndDate: '2022-06-01', daysRemaining: 77, owner: 'test', status: 'expiring_90' },
  { id: 'm7', name: 'eth0', category: '网络适配器', maintenanceEndDate: '2021-12-01', daysRemaining: -70, owner: '管理员', status: 'expired' },
]

// ========== 合规性检测 ==========
export type ComplianceResult = 'pass' | 'fail' | 'pending'
export type ComplianceSchedule = 'manual' | 'daily' | 'weekly' | 'monthly'
export type ComplianceRuleType = 'uniqueness' | 'required' | 'format' | 'relation' | 'custom'

export interface ComplianceRecord {
  id: string
  policyName: string
  configClass: string
  result: ComplianceResult
  lastCheckTime: string
  failCount?: number
  totalCount?: number
  enabled: boolean
  description?: string
  schedule: ComplianceSchedule
  ruleType: ComplianceRuleType
  /** 仅当 ruleType 为 custom 时使用 */
  customExpression?: string
  createTime: string
  creator: string
}

/** 单次检测中不通过的配置项（兼容旧数据） */
export interface ComplianceCheckFailItem {
  id: string
  ciName: string
  reason?: string
}

/** 单次检测涉及的配置项实例（列表展示用） */
export interface ComplianceCheckedCIItem {
  id: string
  ciId: string
  name: string
  category: string
  result: 'pass' | 'fail'
  reason?: string
}

/** 单次检测历史 */
export interface ComplianceCheckHistoryItem {
  id: string
  checkTime: string
  result: ComplianceResult
  totalCount: number
  passCount: number
  failCount: number
  /** 不通过项列表（仅当 result 为 fail 时可能有，兼容） */
  failItems?: ComplianceCheckFailItem[]
  /** 本次检测涉及的配置项实例列表（名称、分类、检测结果等） */
  checkedItems?: ComplianceCheckedCIItem[]
}

/** 规则详情（含检测历史） */
export interface ComplianceDetail extends ComplianceRecord {
  checkHistory: ComplianceCheckHistoryItem[]
}

const _complianceList: ComplianceRecord[] = [
  { id: 'c1', policyName: '主机名唯一性', configClass: '服务器', result: 'pass', lastCheckTime: '2022-04-11 10:00:00', totalCount: 958, failCount: 0, enabled: true, schedule: 'daily', ruleType: 'uniqueness', createTime: '2021-06-01 09:00:00', creator: '管理员' },
  { id: 'c2', policyName: 'IP 地址唯一性', configClass: '服务器', result: 'fail', lastCheckTime: '2022-04-11 10:05:00', totalCount: 958, failCount: 12, enabled: true, schedule: 'daily', ruleType: 'uniqueness', createTime: '2021-06-02 10:00:00', creator: '管理员' },
  { id: 'c3', policyName: '必填项完整性', configClass: '全部', result: 'pass', lastCheckTime: '2022-04-11 09:30:00', totalCount: 958, failCount: 0, enabled: true, schedule: 'weekly', ruleType: 'required', createTime: '2021-05-15 14:00:00', creator: 'test' },
  { id: 'c4', policyName: '序列号重复检测', configClass: '服务器', result: 'fail', lastCheckTime: '2022-04-10 16:00:00', totalCount: 234, failCount: 3, enabled: true, schedule: 'weekly', ruleType: 'uniqueness', createTime: '2021-07-01 08:00:00', creator: '管理员' },
  { id: 'c5', policyName: '厂商命名规范', configClass: '网络设备', result: 'pending', lastCheckTime: '-', enabled: false, schedule: 'manual', ruleType: 'format', createTime: '2022-03-01 11:00:00', creator: 'test', description: '厂商名称需符合预定义枚举' },
  { id: 'c6', policyName: '维保到期关联', configClass: '全部', result: 'pass', lastCheckTime: '2022-04-11 08:00:00', totalCount: 118, failCount: 0, enabled: true, schedule: 'daily', ruleType: 'relation', createTime: '2021-08-10 09:00:00', creator: '管理员' },
]

export const complianceListMock = _complianceList

const checkHistoryMock: ComplianceCheckHistoryItem[][] = [
  [
    {
      id: 'h1-1',
      checkTime: '2022-04-11 10:00:00',
      result: 'pass',
      totalCount: 958,
      passCount: 958,
      failCount: 0,
      checkedItems: [
        { id: 'c1-1', ciId: '1', name: 'LinuxServer', category: '服务器', result: 'pass' },
        { id: 'c1-2', ciId: '2', name: 'MacBook Pro 15', category: '计算机', result: 'pass' },
        { id: 'c1-3', ciId: '3', name: 'Tomcat', category: '中间件', result: 'pass' },
      ],
    },
    {
      id: 'h1-2',
      checkTime: '2022-04-10 10:00:00',
      result: 'pass',
      totalCount: 958,
      passCount: 958,
      failCount: 0,
      checkedItems: [
        { id: 'c1-4', ciId: '4', name: 'Nginx', category: '中间件', result: 'pass' },
        { id: 'c1-5', ciId: '6', name: 'Mysql', category: '数据库', result: 'pass' },
      ],
    },
  ],
  [
    {
      id: 'h2-1',
      checkTime: '2022-04-11 10:05:00',
      result: 'fail',
      totalCount: 958,
      passCount: 946,
      failCount: 12,
      failItems: [
        { id: 'f1', ciName: 'Server-192.168.1.101', reason: 'IP 与已有配置项重复' },
        { id: 'f2', ciName: 'Server-192.168.1.102', reason: 'IP 与已有配置项重复' },
        { id: 'f3', ciName: 'Server-192.168.2.50', reason: 'IP 与已有配置项重复' },
      ],
      checkedItems: [
        { id: 'c2-1', ciId: '1', name: 'LinuxServer', category: '服务器', result: 'pass' },
        { id: 'c2-2', ciId: 'ci-101', name: 'Server-192.168.1.101', category: '服务器', result: 'fail', reason: 'IP 与已有配置项重复' },
        { id: 'c2-3', ciId: 'ci-102', name: 'Server-192.168.1.102', category: '服务器', result: 'fail', reason: 'IP 与已有配置项重复' },
        { id: 'c2-4', ciId: 'ci-50', name: 'Server-192.168.2.50', category: '服务器', result: 'fail', reason: 'IP 与已有配置项重复' },
      ],
    },
    {
      id: 'h2-2',
      checkTime: '2022-04-10 10:05:00',
      result: 'fail',
      totalCount: 958,
      passCount: 950,
      failCount: 8,
      failItems: [
        { id: 'f4', ciName: 'Server-192.168.1.201', reason: 'IP 与已有配置项重复' },
        { id: 'f5', ciName: 'Server-192.168.3.10', reason: 'IP 与已有配置项重复' },
      ],
      checkedItems: [
        { id: 'c2-5', ciId: '2', name: 'MacBook Pro 15', category: '计算机', result: 'pass' },
        { id: 'c2-6', ciId: 'ci-201', name: 'Server-192.168.1.201', category: '服务器', result: 'fail', reason: 'IP 与已有配置项重复' },
        { id: 'c2-7', ciId: 'ci-10', name: 'Server-192.168.3.10', category: '服务器', result: 'fail', reason: 'IP 与已有配置项重复' },
      ],
    },
  ],
  [
    {
      id: 'h3-1',
      checkTime: '2022-04-11 09:30:00',
      result: 'pass',
      totalCount: 958,
      passCount: 958,
      failCount: 0,
      checkedItems: [
        { id: 'c3-1', ciId: '1', name: 'LinuxServer', category: '服务器', result: 'pass' },
        { id: 'c3-2', ciId: '4', name: 'Nginx', category: '中间件', result: 'pass' },
        { id: 'c3-3', ciId: '6', name: 'Mysql', category: '数据库', result: 'pass' },
      ],
    },
  ],
  [
    {
      id: 'h4-1',
      checkTime: '2022-04-10 16:00:00',
      result: 'fail',
      totalCount: 234,
      passCount: 231,
      failCount: 3,
      failItems: [
        { id: 'f6', ciName: 'Dell-R720-001', reason: '序列号与 Server-Dell-002 重复' },
        { id: 'f7', ciName: 'HP-DL380-005', reason: '序列号与 HP-DL380-003 重复' },
        { id: 'f8', ciName: 'Lenovo-SR650-001', reason: '序列号与 Lenovo-SR650-002 重复' },
      ],
      checkedItems: [
        { id: 'c4-1', ciId: '1', name: 'LinuxServer', category: '服务器', result: 'pass' },
        { id: 'c4-2', ciId: 'ci-dell', name: 'Dell-R720-001', category: '服务器', result: 'fail', reason: '序列号与 Server-Dell-002 重复' },
        { id: 'c4-3', ciId: 'ci-hp', name: 'HP-DL380-005', category: '服务器', result: 'fail', reason: '序列号与 HP-DL380-003 重复' },
        { id: 'c4-4', ciId: 'ci-lenovo', name: 'Lenovo-SR650-001', category: '服务器', result: 'fail', reason: '序列号与 Lenovo-SR650-002 重复' },
      ],
    },
  ],
  [],
  [
    {
      id: 'h6-1',
      checkTime: '2022-04-11 08:00:00',
      result: 'pass',
      totalCount: 118,
      passCount: 118,
      failCount: 0,
      checkedItems: [
        { id: 'c6-1', ciId: '1', name: 'LinuxServer', category: '服务器', result: 'pass' },
        { id: 'c6-2', ciId: '8', name: 'eth0', category: '网络适配器', result: 'pass' },
      ],
    },
  ],
]

export function getComplianceDetail(id: string): ComplianceDetail | null {
  const record = _complianceList.find((r) => r.id === id)
  if (!record) return null
  const idx = _complianceList.findIndex((r) => r.id === id)
  const checkHistory = (checkHistoryMock[idx] ?? []).map((h) => ({ ...h }))
  return { ...record, checkHistory }
}

/** 用于新建规则的配置类选项（与现有 mock 一致） */
export const complianceConfigClassOptions = [
  { value: '全部', label: '全部' },
  { value: '服务器', label: '服务器' },
  { value: '网络设备', label: '网络设备' },
  { value: '数据库', label: '数据库' },
  { value: '中间件', label: '中间件' },
  { value: '计算机', label: '计算机' },
]

export const complianceRuleTypeOptions: { value: ComplianceRuleType; label: string }[] = [
  { value: 'uniqueness', label: '唯一性检测' },
  { value: 'required', label: '必填项完整性' },
  { value: 'format', label: '格式/规范' },
  { value: 'relation', label: '关联一致性' },
  { value: 'custom', label: '自定义表达式' },
]

export const complianceScheduleOptions: { value: ComplianceSchedule; label: string }[] = [
  { value: 'manual', label: '仅手动执行' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

/** 增删改合规规则（与列表、详情页联动） */
export function complianceAddRule(record: Omit<ComplianceRecord, 'id' | 'result' | 'lastCheckTime' | 'failCount' | 'totalCount'>): ComplianceRecord {
  const id = `c${Date.now()}`
  const newRecord: ComplianceRecord = {
    ...record,
    id,
    result: 'pending',
    lastCheckTime: '-',
    failCount: 0,
    totalCount: 0,
  }
  _complianceList.push(newRecord)
  checkHistoryMock.push([])
  return newRecord
}

export function complianceDeleteRule(id: string): boolean {
  const idx = _complianceList.findIndex((r) => r.id === id)
  if (idx === -1) return false
  _complianceList.splice(idx, 1)
  checkHistoryMock.splice(idx, 1)
  return true
}

export function complianceToggleEnabled(id: string): boolean {
  const r = _complianceList.find((x) => x.id === id)
  if (!r) return false
  r.enabled = !r.enabled
  return true
}

export function complianceUpdateRule(id: string, patch: Partial<Pick<ComplianceRecord, 'policyName' | 'configClass' | 'description' | 'schedule' | 'ruleType' | 'customExpression'>>): boolean {
  const r = _complianceList.find((x) => x.id === id)
  if (!r) return false
  Object.assign(r, patch)
  return true
}
