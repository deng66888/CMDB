/**
 * 相关配置：按 CI 类型过滤、业务友好名称、按业务场景分组
 */

export type RelationGroupKey = '硬件组成' | '软件环境' | '位置信息' | '网络关系'

/** 用于过滤关系类型的 CI 类型 */
export type CITypeForRelation = '服务器' | '网络设备' | '应用'

/** 关系类型元数据：技术 key、业务显示名、所属分组、适用的 CI 类型 */
export interface RelationTypeMeta {
  key: string
  displayName: string
  group: RelationGroupKey
  ciTypes: CITypeForRelation[]
}

/** 所有关系类型定义（技术 key -> 业务名 + 分组） */
export const relationTypeMetaList: RelationTypeMeta[] = [
  // 硬件组成
  { key: '网络适配器->配置项', displayName: '网卡', group: '硬件组成', ciTypes: ['服务器'] },
  { key: '存储设备->计算机', displayName: '存储设备', group: '硬件组成', ciTypes: ['服务器'] },
  { key: '文件系统->提供者', displayName: '文件系统', group: '硬件组成', ciTypes: ['服务器'] },
  // 软件环境
  { key: '安装的软件', displayName: '安装的软件', group: '软件环境', ciTypes: ['服务器'] },
  { key: '补丁->配置项', displayName: '补丁', group: '软件环境', ciTypes: ['服务器'] },
  { key: '运行进程->计算机', displayName: '运行进程', group: '软件环境', ciTypes: ['服务器'] },
  { key: '序列号->配置项', displayName: '序列号', group: '软件环境', ciTypes: ['服务器'] },
  // 位置信息
  { key: '数据中心->重复', displayName: '所属数据中心', group: '位置信息', ciTypes: ['服务器', '网络设备'] },
  { key: '数据中心区->重复', displayName: '所属机房/区', group: '位置信息', ciTypes: ['服务器', '网络设备'] },
  { key: '机柜', displayName: '所属机柜', group: '位置信息', ciTypes: ['服务器', '网络设备'] },
  // 网络关系
  { key: '配置项 IP', displayName: 'IP地址', group: '网络关系', ciTypes: ['服务器', '网络设备'] },
  { key: 'CI的DNS 名称', displayName: 'DNS 名称', group: '网络关系', ciTypes: ['服务器'] },
  { key: '连接的交换机', displayName: '连接的交换机', group: '网络关系', ciTypes: ['服务器', '网络设备'] },
  // 网络设备专用
  { key: '端口', displayName: '端口', group: '网络关系', ciTypes: ['网络设备'] },
  { key: 'VLAN', displayName: 'VLAN', group: '网络关系', ciTypes: ['网络设备'] },
  { key: '路由', displayName: '路由', group: '网络关系', ciTypes: ['网络设备'] },
  // 应用专用
  { key: '依赖服务', displayName: '依赖服务', group: '软件环境', ciTypes: ['应用'] },
  { key: '数据库->应用', displayName: '数据库', group: '软件环境', ciTypes: ['应用'] },
  { key: '中间件->应用', displayName: '中间件', group: '软件环境', ciTypes: ['应用'] },
  // 其他可选（用于“可用的”列表）
  { key: '定制规格->服务器', displayName: '定制规格', group: '硬件组成', ciTypes: ['服务器'] },
  { key: '数据电源->重复', displayName: '数据电源', group: '位置信息', ciTypes: ['服务器'] },
]

const metaByKey = new Map(relationTypeMetaList.map((m) => [m.key, m]))

export function getRelationDisplayName(key: string): string {
  return metaByKey.get(key)?.displayName ?? key
}

export function getRelationGroup(key: string): RelationGroupKey | undefined {
  return metaByKey.get(key)?.group
}

/** 根据 CI 类型（或分类）得到适用的关系类型列表 */
export function getRelationTypesByCIType(ciType: CITypeForRelation): RelationTypeMeta[] {
  return relationTypeMetaList.filter((m) => m.ciTypes.includes(ciType))
}

/** 将分类映射为关系维度的 CI 类型 */
export function categoryToCIType(category: string): CITypeForRelation {
  const lower = category.toLowerCase()
  if (['服务器', '计算机'].includes(category)) return '服务器'
  if (['交换机', '路由器', '防火墙', '网络设备'].includes(category) || lower.includes('交换机') || lower.includes('路由器')) return '网络设备'
  if (['应用', '应用系统'].includes(category) || lower.includes('应用')) return '应用'
  return '服务器'
}

/** 已选关系项（带关联数量），用于卡片展示 */
export interface RelatedConfigItem {
  relationKey: string
  displayName: string
  group: RelationGroupKey
  count: number
}

const groupOrder: RelationGroupKey[] = ['硬件组成', '软件环境', '位置信息', '网络关系']

export const defaultRelatedSelectedKeys = [
  '网络适配器->配置项',
  '存储设备->计算机',
  '文件系统->提供者',
  '补丁->配置项',
  '运行进程->计算机',
  '序列号->配置项',
  '配置项 IP',
  'CI的DNS 名称',
  '安装的软件',
  '数据中心->重复',
  '机柜',
  '连接的交换机',
]

const countMock: Record<string, number> = {
  '网络适配器->配置项': 3,
  '存储设备->计算机': 2,
  '文件系统->提供者': 2,
  '补丁->配置项': 1,
  '运行进程->计算机': 5,
  '序列号->配置项': 1,
  '配置项 IP': 1,
  'CI的DNS 名称': 1,
  '安装的软件': 8,
  '数据中心->重复': 1,
  '机柜': 1,
  '连接的交换机': 4,
}

/** 获取某关系类型当前关联数量（用于弹窗展示「关联 N 个」） */
export function getRelationCount(key: string): number {
  return countMock[key] ?? 0
}

/** 按分组排序并带组内数量的已选关系；selectedKeys 为空时使用默认已选列表 */
export function getRelatedConfigGrouped(
  ciType: CITypeForRelation,
  selectedKeys: string[] = defaultRelatedSelectedKeys
): { group: RelationGroupKey; total: number; items: RelatedConfigItem[] }[] {
  const keys = selectedKeys.length ? selectedKeys : defaultRelatedSelectedKeys
  const selectedItems = keys
    .map((key) => {
      const meta = metaByKey.get(key)
      if (!meta || !meta.ciTypes.includes(ciType)) return null
      return {
        relationKey: key,
        displayName: meta.displayName,
        group: meta.group,
        count: countMock[key] ?? 0,
      } as RelatedConfigItem
    })
    .filter((n): n is RelatedConfigItem => n != null)

  const byGroup = new Map<RelationGroupKey, RelatedConfigItem[]>()
  selectedItems.forEach((item) => {
    const list = byGroup.get(item.group) ?? []
    list.push(item)
    byGroup.set(item.group, list)
  })

  return groupOrder
    .filter((g) => byGroup.get(g)?.length)
    .map((group) => {
      const items = byGroup.get(group)!
      const total = items.reduce((s, i) => s + i.count, 0)
      return { group, total, items }
    })
}

/** 可用的关系类型（未选），按分组；已选的在右侧。用于添加弹窗 */
export function getAvailableAndSelectedByCIType(
  ciType: CITypeForRelation,
  selectedKeys: string[]
): { available: RelationTypeMeta[]; selected: RelationTypeMeta[] } {
  const all = getRelationTypesByCIType(ciType)
  const selectedSet = new Set(selectedKeys)
  const available = all.filter((m) => !selectedSet.has(m.key))
  const selected = all.filter((m) => selectedSet.has(m.key))
  return { available, selected }
}
