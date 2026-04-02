/**
 * 配置类应用 / 新建配置类 - 后台管理 Mock
 * 属性来源：继承的（来自 cmdb_ci 基类）/ 添加的（当前类自定义）/ 所有（继承+添加）
 *
 * 配置类树与「配置项管理」侧栏树同源：由 @/mock/ci 的 configClassTreeMock 转换，保持 id/名称一致。
 */

import { configClassTreeMock as ciConfigClassSidebarTree } from './ci'

export interface ConfigClassBasicInfo {
  id: string
  className: string
  description: string
  classCode: string
  icon: string
}

export interface ConfigClassAttribute {
  id: string
  /** 业务名称（如“名称”“运行状态”） */
  fieldName: string
  /** 技术字段名（如 name, sys_id），继承属性有 */
  technicalName?: string
  /** 数据类型：Reference | datetime | string | integer | 选择列表 | 日期 */
  type: string
  /** 仅 Reference 类型：关联目标表 */
  reference: string
  maxLength: number | null
  defaultValue: string
  optional: boolean
  required: boolean
  hidden: boolean
  /** 继承的：来自父类 cmdb_ci；添加的：当前类自定义 */
  source?: 'inherited' | 'added'
  /** 说明（继承属性带业务语义说明） */
  description?: string
}

export interface ConfigClassRecognitionRule {
  id: string
  source: string
  primaryKey: string
  attributes: string
}

/** 当前编辑的配置类（如“应用”）基础信息 */
export const configClassBasicInfoMock: ConfigClassBasicInfo = {
  id: 'app',
  className: '应用',
  description: '业务应用系统、服务等',
  classCode: 'u_cmdb_cl_application',
  icon: 'application',
}

/** 基类 cmdb_ci 的预置属性（所有 CI 类默认继承） */
export const cmdbCiInheritedAttributes: Omit<ConfigClassAttribute, 'id' | 'source'>[] = [
  { fieldName: '名称', technicalName: 'name', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: false, required: true, hidden: false, description: '配置项名称' },
  { fieldName: '唯一编码', technicalName: 'sys_id', type: 'string', reference: '', maxLength: 32, defaultValue: '', optional: true, required: false, hidden: false, description: '全局唯一标识（系统自动生成）' },
  { fieldName: '配置类名称', technicalName: 'sys_class_name', type: 'string', reference: '', maxLength: 100, defaultValue: '', optional: true, required: false, hidden: true, description: '配置类名称' },
  { fieldName: '资产标签号', technicalName: 'asset_tag', type: 'string', reference: '', maxLength: 40, defaultValue: '', optional: true, required: false, hidden: false, description: '资产标签号' },
  { fieldName: '运行状态', technicalName: 'operational_status', type: '选择列表', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '在线/离线/维护中' },
  { fieldName: '安装状态', technicalName: 'install_status', type: '选择列表', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '已安装/库存/报废' },
  { fieldName: '支持团队', technicalName: 'supported_by', type: 'Reference', reference: 'sys_user_group', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '支持团队' },
  { fieldName: '负责人', technicalName: 'owned_by', type: 'Reference', reference: 'sys_user', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '负责人' },
  { fieldName: '创建时间', technicalName: 'sys_created_on', type: 'datetime', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: true, description: '创建时间' },
  { fieldName: '最后更新时间', technicalName: 'sys_updated_on', type: 'datetime', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: true, description: '最后更新时间' },
  { fieldName: '创建人', technicalName: 'sys_created_by', type: 'Reference', reference: 'sys_user', maxLength: null, defaultValue: '', optional: true, required: false, hidden: true, description: '创建人' },
  { fieldName: '最后更新人', technicalName: 'sys_updated_by', type: 'Reference', reference: 'sys_user', maxLength: null, defaultValue: '', optional: true, required: false, hidden: true, description: '最后更新人' },
  { fieldName: '开始使用日期', technicalName: 'start_date', type: '日期', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '开始使用日期' },
  { fieldName: '停用日期', technicalName: 'end_date', type: '日期', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '停用日期' },
  { fieldName: '所属公司', technicalName: 'company', type: 'Reference', reference: 'core_company', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '所属公司' },
  { fieldName: '所属部门', technicalName: 'department', type: 'Reference', reference: 'cmn_department', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '所属部门' },
  { fieldName: '物理位置', technicalName: 'location', type: 'Reference', reference: 'cmn_location', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '物理位置' },
  { fieldName: '分配组', technicalName: 'assignment_group', type: 'Reference', reference: 'sys_user_group', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '分配组' },
  { fieldName: '数据域', technicalName: 'domain', type: 'Reference', reference: 'sys_domain', maxLength: null, defaultValue: '', optional: true, required: false, hidden: true, description: '数据域（多租户隔离）' },
  { fieldName: '域路径', technicalName: 'sys_domain_path', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: true, required: false, hidden: true, description: '域路径' },
  { fieldName: '修改次数', technicalName: 'sys_mod_count', type: 'integer', reference: '', maxLength: null, defaultValue: '0', optional: true, required: false, hidden: true, description: '修改次数' },
  { fieldName: '系统标签', technicalName: 'sys_tags', type: 'string', reference: '', maxLength: 1024, defaultValue: '', optional: true, required: false, hidden: false, description: '系统标签' },
  { fieldName: '审计确认状态', technicalName: 'attestation_status', type: '选择列表', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '审计确认状态' },
  { fieldName: '最后审计日期', technicalName: 'last_audit_date', type: '日期', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, description: '最后审计日期' },
  { fieldName: '发现来源', technicalName: 'discovery_source', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: true, required: false, hidden: false, description: '发现来源' },
  { fieldName: '数据来源', technicalName: 'source', type: 'string', reference: '', maxLength: 255, defaultValue: '', optional: true, required: false, hidden: false, description: '数据来源' },
]

export const configClassInheritedAttributesMock: ConfigClassAttribute[] = cmdbCiInheritedAttributes.map((a, i) => ({
  ...a,
  id: `inherited-${i}`,
  source: 'inherited',
}))

/** 当前类「添加的」自定义属性（扩展业务特征） */
export const configClassAttributesMock: ConfigClassAttribute[] = [
  { id: 'a1', fieldName: '版本号', technicalName: 'version', type: 'string', reference: '', maxLength: 50, defaultValue: '', optional: true, required: false, hidden: false, source: 'added' },
  { id: 'a2', fieldName: '部署环境', technicalName: 'deploy_env', type: '选择列表', reference: '', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, source: 'added' },
  { id: 'a3', fieldName: '审批人', type: 'Reference', reference: 'sys_user', maxLength: null, defaultValue: '', optional: true, required: false, hidden: false, source: 'added' },
]

/** 识别规则 Mock */
export const configClassRecognitionRulesMock: ConfigClassRecognitionRule[] = [
  { id: 'r1', source: '在表上搜索', primaryKey: '序列号', attributes: '序列号, 序列号类型' },
  { id: 'r2', source: '在表上搜索', primaryKey: '序列号', attributes: '序列号, 序列号类型' },
]

/** 识别规则来源：主表 / 其它表 / 混合 */
export type RecognitionRuleSource = 'main' | 'another' | 'mixed'

/** 识别规则行（卡片展示，选中的字段 100% 匹配才判定同一 CI） */
export interface RecognitionRuleRow {
  id: string
  fieldName: string
  technicalName?: string
  /** 来源，用于卡片背景色：主表=淡蓝、其它表=淡黄、混合=淡粉 */
  source?: RecognitionRuleSource
  weight?: number
  required?: boolean
  matchMode?: 'exact' | 'ignoreCase' | 'trim'
}

/** 匹配模式选项 */
export const RECOGNITION_MATCH_MODES = [
  { value: 'exact', label: '精确匹配' },
  { value: 'ignoreCase', label: '忽略大小写' },
  { value: 'trim', label: '去空格后匹配' },
] as const

/** 默认识别字段 technicalName：序列号、主机名（主表用 asset_tag + name） */
export const DEFAULT_RECOGNITION_FIELD_NAMES = ['asset_tag', 'name'] as const

/** 外部表（另一张表）Mock - 用于识别规则「使用另一个表的属性」 */
export interface DiscoveryTableColumn {
  key: string
  label: string
}

export interface DiscoveryTable {
  id: string
  name: string
  columns: DiscoveryTableColumn[]
}

export const discoveryTablesMock: DiscoveryTable[] = [
  {
    id: 'u_discovery_server',
    name: '主机发现表',
    columns: [
      { key: 'serial_number', label: '序列号' },
      { key: 'hostname', label: '主机名' },
      { key: 'ip_address', label: 'IP 地址' },
      { key: 'mac_address', label: 'MAC 地址' },
      { key: 'os', label: '操作系统' },
    ],
  },
  {
    id: 'u_discovery_network',
    name: '网络设备发现表',
    columns: [
      { key: 'serial_number', label: '序列号' },
      { key: 'name', label: '名称' },
      { key: 'ip_address', label: 'IP 地址' },
    ],
  },
]

/** 其他配置类列表（识别规则「其它表」下拉用，可选字段根据所选配置类展示） */
export const otherConfigClassesMock: { id: string; name: string; columns: DiscoveryTableColumn[] }[] = [
  { id: 'cmdb_ci_server', name: '服务器', columns: discoveryTablesMock[0]!.columns },
  { id: 'cmdb_ci_network', name: '网络设备', columns: discoveryTablesMock[1]!.columns },
  { id: 'cmdb_ci_database', name: '数据库', columns: [{ key: 'instance_name', label: '实例名' }, { key: 'host', label: '主机' }, { key: 'port', label: '端口' }] },
  { id: 'cmdb_ci_application', name: '应用', columns: [{ key: 'name', label: '名称' }, { key: 'version', label: '版本' }, { key: 'vendor', label: '厂商' }] },
]

/** 字段类型（右侧面板拖拽/选择） */
export const configClassFieldTypes = [
  { key: 'group', label: '分组', icon: '📁' },
  { key: 'singleline', label: '单行文本', icon: 'Aa' },
  { key: 'multiline', label: '多行文本', icon: '¶' },
  { key: 'counter', label: '计数器', icon: '123' },
  { key: 'lookup', label: '查找', icon: '🔍' },
  { key: 'reference', label: '引用', icon: '📋' },
  { key: 'datetime', label: '时间日期', icon: '📅' },
  { key: 'department', label: '部门', icon: '🏢' },
  { key: 'person', label: '人员', icon: '👤' },
  { key: 'table', label: '表格', icon: '▦' },
  { key: 'radio', label: '单选', icon: '○' },
  { key: 'checkbox', label: '多选', icon: '☑' },
  { key: 'cascader', label: '级联', icon: '⊞' },
  { key: 'usergroup', label: '用户组', icon: '👥' },
]

/** 依赖关系图 - 以当前配置类为中心的关系组（配置类管理/旧版图示用） */
export const configClassDependencyGroupsMock = [
  { relation: '托管在', items: ['集群节点', '数据库'] },
  { relation: '虚拟化的', items: ['ESX服务器'] },
  { relation: '依赖于', items: ['服务', '计算机'] },
  { relation: '成员', items: ['集群'] },
  { relation: '运行在', items: ['应用程序', 'Windows服务'] },
  { relation: '包含', items: ['存储池', '磁盘分区', '存储卷', '存储设备', '内存模块'] },
  { relation: '实例', items: ['VMware虚拟机实例'] },
  { relation: '接收的数据', items: ['大容量存储器'] },
]

/** 创建配置类 - 依赖关系（与配置项详情同款：上游/下游，全生命周期 + 故障影响） */
export interface ConfigClassDependencyItem {
  relation: string
  target: string
}

/** 上游：当前类“从哪里来”（如被 ESX 虚拟化、属于哪个集群）；上游宕机则本 CI 受影响 */
export const configClassDependencyUpstreamMock: ConfigClassDependencyItem[] = [
  { relation: '虚拟化的', target: 'ESX服务器' },
  { relation: '属于', target: '集群' },
  { relation: '依赖于', target: '服务' },
  { relation: '依赖于', target: '计算机' },
]

/** 下游：当前类“由什么组成”（包含内存、磁盘等）；下游故障则本 CI 数据/能力受影响 */
export const configClassDependencyDownstreamMock: ConfigClassDependencyItem[] = [
  { relation: '包含', target: '存储设备' },
  { relation: '包含', target: '内存模块' },
  { relation: '包含', target: '磁盘分区' },
  { relation: '托管在', target: '集群节点' },
  { relation: '托管在', target: '数据库' },
  { relation: '运行在', target: '应用程序' },
  { relation: '成员', target: '集群' },
]

/** 配置类树节点（用于配置类管理左侧树与层级浮层） */
export interface ConfigClassTreeNode {
  id: string
  name: string
  parentId?: string
  children?: ConfigClassTreeNode[]
}

type CiSidebarBranch = { key: string; title: string; children?: CiSidebarBranch[] }

function ciSidebarTreeToManagement(nodes: CiSidebarBranch[]): ConfigClassTreeNode[] {
  return nodes.map((n) => ({
    id: n.key,
    name: n.title,
    children: n.children?.length ? ciSidebarTreeToManagement(n.children) : undefined,
  }))
}

/** 与配置项管理页同一套配置类层级（数十个节点，含应用/服务器/中间件等子类） */
export const configClassTreeMock: ConfigClassTreeNode[] = ciSidebarTreeToManagement(
  ciConfigClassSidebarTree as CiSidebarBranch[],
)

/** 查看配置类时按 viewId 拉取的数据（含是否有关联数据，用于删除前校验） */
export interface ConfigClassViewData {
  basicInfo: ConfigClassBasicInfo
  uniqueCodePrefix: string
  uniqueCodeFields: string[]
  attributes: ConfigClassAttribute[]
  recognitionRuleRows: RecognitionRuleRow[]
  dependencyUpstream: ConfigClassDependencyItem[]
  dependencyDownstream: ConfigClassDependencyItem[]
  dependencyCount: number
  configItemCount: number
}

function findNodeName(tree: ConfigClassTreeNode[], id: string): string {
  for (const n of tree) {
    if (n.id === id) return n.name
    if (n.children) {
      const found = findNodeName(n.children, id)
      if (found) return found
    }
  }
  return id
}

/** CMDB 内置图标 value，与 ConfigClassNew 中 CMDB_ICONS 一致 */
function iconTokenForClassName(className: string): string {
  const n = className
  if (/应用|系统|服务|TNS|ESB|中心|平台|门户|中台|流水线|订单|支付|消息|配置|监控|日志|运维|API管理|DevOps|批处理|定时|数据中台|门户/i.test(n))
    return 'application'
  if (/数据库|实例|Oracle RAC|DataGuard|SQL Server|PostgreSQL|MongoDB/i.test(n)) return 'database'
  if (/Linux|Windows|Unix服务器|^Unix$|ESX/i.test(n)) return 'cloud-server'
  if (/^服务器$/.test(n)) return 'cloud-server'
  if (/计算机|办公设备|笔记本|显示器/i.test(n)) return 'laptop'
  if (/中间件|Tomcat|Nginx|Redis|Kafka|负载均衡|Zookeeper|Consul|RabbitMQ|Web应用|API网关/i.test(n))
    return 'code'
  if (/网络适配器|网络接口|交换机|路由器|DNS|DHCP|NTP|CDN/i.test(n)) return 'network'
  if (/存储|磁盘|磁带|SAN|NAS|对象存储/i.test(n)) return 'storage'
  if (/防火墙|安全设备|WAF/i.test(n)) return 'safety'
  if (/虚拟化|VMware|Docker|K8s/i.test(n)) return 'cloud'
  if (/公有云|私有云|Serverless|云资源/i.test(n)) return 'cloud'
  if (/集群(?!节点)/.test(n) && !/K8s/.test(n)) return 'cluster'
  if (/节点|搜索集群|大数据|GPU|高性能|Kafka集群|中间件集群/.test(n)) return 'node'
  if (/打印机/.test(n)) return 'printer'
  if (/网关/.test(n)) return 'gateway'
  if (/磁盘分区|分区/.test(n)) return 'partition'
  return 'server'
}

function demoConfigItemCount(viewId: string): number {
  let h = 0
  for (let i = 0; i < viewId.length; i++) h = (h * 31 + viewId.charCodeAt(i)) >>> 0
  return 6 + (h % 94)
}

function technicalClassCode(viewId: string): string {
  const safe = viewId.replace(/[^\w\u4e00-\u9fa5-]/g, '_')
  return `u_cmdb_cl_${safe}`
}

export function getConfigClassViewData(viewId: string): ConfigClassViewData {
  const name = findNodeName(configClassTreeMock, viewId) || viewId
  /** 兼容旧书签 ?view=app / view=server，并与中文树 id 对齐 */
  const isApp = viewId === '应用' || viewId === 'app'
  const isServer = viewId === '服务器' || viewId === 'server'

  const baseInfo: ConfigClassBasicInfo = {
    id: viewId,
    className: name,
    description: `${name}类配置项`,
    classCode: technicalClassCode(viewId),
    icon: iconTokenForClassName(name),
  }
  const dependencyUpstream = isApp
    ? configClassDependencyUpstreamMock
    : isServer
      ? configClassDependencyUpstreamMock.slice(0, 2)
      : []
  const dependencyDownstream = isApp
    ? configClassDependencyDownstreamMock
    : isServer
      ? configClassDependencyDownstreamMock.slice(0, 3)
      : []
  const dependencyCount = dependencyUpstream.length + dependencyDownstream.length
  const configItemCount = isApp ? 12 : isServer ? 28 : demoConfigItemCount(viewId)
  const recognitionRuleRows: RecognitionRuleRow[] = isApp
    ? [
        { id: 'r1', fieldName: '名称', technicalName: 'name', source: 'main' },
        { id: 'r2', fieldName: '序列号', technicalName: 'asset_tag', source: 'main' },
      ]
    : isServer
      ? [{ id: 'r1', fieldName: '主机名', technicalName: 'name', source: 'main' }]
      : [{ id: 'r1', fieldName: '名称', technicalName: 'name', source: 'main' }]
  const attributes = isApp
    ? [...configClassAttributesMock]
    : isServer
      ? configClassAttributesMock.slice(0, 2).map((a, i) => ({ ...a, id: `a${i}` }))
      : configClassAttributesMock.slice(0, 2).map((a, i) => ({ ...a, id: `a-${viewId}-${i}` }))
  return {
    basicInfo: baseInfo,
    uniqueCodePrefix: isApp ? 'APP' : isServer ? 'SRV' : name.replace(/\s/g, '').slice(0, 4).toUpperCase().slice(0, 4) || 'CLS',
    uniqueCodeFields: isApp ? ['name', 'asset_tag'] : ['name'],
    attributes,
    recognitionRuleRows,
    dependencyUpstream,
    dependencyDownstream,
    dependencyCount,
    configItemCount,
  }
}
