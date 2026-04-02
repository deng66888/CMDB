/** CMDB 配置项概览 — ECharts 用 Mock（配置类已细分为多级） */

/** 细分配置类：在原有八大类基础上拆分子类，便于统计粒度更细 */
export const CMDB_CATEGORIES = [
  '物理服务器·机架式',
  '物理服务器·刀片',
  '物理服务器·塔式/小型机',
  '虚拟机·云主机',
  '虚拟机·自建虚拟化',
  '网络设备·核心/汇聚',
  '网络设备·接入交换',
  '网络设备·路由/WAN',
  '存储设备·SAN',
  '存储设备·NAS/文件',
  '存储设备·对象/分布式',
  '数据库·关系型',
  '数据库·NoSQL/缓存',
  '应用系统·中间件',
  '应用系统·业务应用',
  '安全设备·防火墙',
  '安全设备·WAF/IDS',
  '终端设备·办公PC',
  '终端设备·移动/瘦客户',
  /* 再扩展 10 类：运维与基础设施相关 CI */
  '负载均衡·四层/七层',
  'DNS·域名与解析',
  '证书·SSL/TLS',
  '消息队列·Kafka/Rabbit',
  '容器服务·K8S/编排',
  '日志平台·采集归档',
  '备份介质·磁带/虚拟带库',
  '监控探针·Agent/Exporter',
  '机房设施·机柜与U位',
  '网络专线·VPN/MPLS',
] as const

export type CmdbCategory = (typeof CMDB_CATEGORIES)[number]

export const STATUS_KEYS = ['使用中', '闲置', '维修中', '故障', '报废'] as const
export type CmdbStatus = (typeof STATUS_KEYS)[number]

export const STATUS_COLORS: Record<CmdbStatus, string> = {
  使用中: '#1e8e3e',
  闲置: '#1a73e8',
  维修中: '#f9ab00',
  故障: '#d93025',
  报废: '#9aa0a6',
}

export type ConfigPack = { categories: string[]; series: Record<CmdbStatus, number[]> }

/** 各细分类的「使用中」基准数量（其余状态按比例派生） */
const IN_USE_BASE: number[] = [
  220, 95, 105, 380, 290, 118, 156, 86, 72, 58, 65, 142, 98, 168, 352, 44, 38, 620, 580,
  128, 86, 64, 92, 205, 138, 48, 176, 72, 54,
]

function buildConfigData(): { all: ConfigPack } & Record<string, ConfigPack> {
  const n = CMDB_CATEGORIES.length
  const 使用中 = IN_USE_BASE.slice(0, n)

  const 闲置 = 使用中.map((b) => Math.max(3, Math.round(b * 0.11 + (b % 7))))
  const 维修中 = 使用中.map((b) => Math.max(1, Math.round(b * 0.045 + (b % 5))))
  const 故障 = 使用中.map((b) => Math.max(0, Math.round(b * 0.018 + (b % 3))))
  const 报废 = 使用中.map((b) => Math.max(2, Math.round(b * 0.055 + (b % 4))))

  const all: ConfigPack = {
    categories: [...CMDB_CATEGORIES],
    series: { 使用中, 闲置, 维修中, 故障, 报废 },
  }

  const byCat: Record<string, ConfigPack> = {}
  CMDB_CATEGORIES.forEach((cat, idx) => {
    const base = 使用中[idx] ?? 200
    byCat[cat] = {
      categories: [cat],
      series: {
        使用中: [Math.round(base * 0.78)],
        闲置: [Math.round(base * 0.12)],
        维修中: [Math.round(base * 0.05)],
        故障: [Math.round(base * 0.02)],
        报废: [Math.round(base * 0.03)],
      },
    }
  })
  return { all, ...byCat }
}

export const configData = buildConfigData()

export type TrendGranularity = 'day' | 'week' | 'month'

export type TrendSeriesMap = { 新增: number[]; 变更: number[]; 故障: number[] }

function buildTrendMock(): {
  all: Record<TrendGranularity, TrendSeriesMap>
  byCat: Record<string, Record<TrendGranularity, TrendSeriesMap>>
} {
  const gran: Record<TrendGranularity, { labels: string[] }> = {
    day: { labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
    week: { labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    month: { labels: ['W1', 'W2', 'W3', 'W4'] },
  }
  const out: {
    all: Record<TrendGranularity, TrendSeriesMap>
    byCat: Record<string, Record<TrendGranularity, TrendSeriesMap>>
  } = { all: {} as Record<TrendGranularity, TrendSeriesMap>, byCat: {} }

  function series(seed: number, n: number): TrendSeriesMap {
    const 新增: number[] = []
    const 变更: number[] = []
    const 故障: number[] = []
    for (let i = 0; i < n; i++) {
      新增.push(Math.round(20 + seed * 3 + Math.sin(i + seed) * 8 + i * 2))
      变更.push(Math.round(35 + seed * 2 + Math.cos(i * 0.7 + seed) * 12))
      故障.push(Math.round(2 + (seed % 3) + (i % 2)))
    }
    return { 新增, 变更, 故障 }
  }

  ;(['day', 'week', 'month'] as const).forEach((g) => {
    const n = gran[g].labels.length
    out.all[g] = series(7, n)
    CMDB_CATEGORIES.forEach((c, si) => {
      if (!out.byCat[c]) out.byCat[c] = {} as Record<TrendGranularity, TrendSeriesMap>
      out.byCat[c][g] = series(3 + si, n)
    })
  })
  return out
}

export const trendData = buildTrendMock()

export const depreciationMock = {
  stats: {
    originalValue: '¥ 128,560,000',
    accumulated: '¥ 42,180,000',
    avgRate: '32.8%',
    residualRate: '5.0%',
  },
  buckets: [
    { name: '1年内', value: 3200 },
    { name: '1-2年', value: 4100 },
    { name: '2-3年', value: 2800 },
    { name: '3-5年', value: 1900 },
    { name: '5年以上', value: 850 },
  ],
}

export const maintainMock = [
  { key: '已过保', count: 186, pct: 4.2, color: '#d93025' },
  { key: '即将过保', count: 512, pct: 11.5, color: '#f9ab00' },
  { key: '正常', count: 3745, pct: 84.3, color: '#1e8e3e' },
]

export const complianceMock = [
  { name: '必填属性完整率', rate: '98.2%' },
  { name: '关系拓扑一致率', rate: '94.6%' },
  {
    name: '待处理问题',
    rate: '6 项',
    expandable: true,
    issues: [
      '服务器 A-01 缺少维保到期日',
      '数据库 ORA-PRD 责任人未绑定',
      '网络设备 SW-CORE 未关联机柜',
      '应用系统订单服务 CI 编码重复',
      '安全设备 FW-DMZ 审计日志未接入',
    ],
  },
]

export const dqStandards: Record<string, string> = {
  完整性: '必填字段覆盖率、关联关系完备度、附件/文档齐备度加权计算。',
  准确性: '与源系统对账一致率、抽样校验通过率、自动发现差异闭环率。',
  及时性: '变更入库时效、发现数据同步延迟、审批完成 SLA 达成率。',
}

export type ActionDef = { id: string; title: string; show: boolean }

/** 默认 6 项铺满右侧 2×3 高频操作区，可在「自定义」中关闭 */
export const defaultActionDefs: ActionDef[] = [
  { id: 'add', title: '新增配置项', show: true },
  { id: 'fault', title: '故障登记', show: true },
  { id: 'audit', title: '配置审计', show: true },
  { id: 'export', title: '批量导出', show: true },
  { id: 'rel', title: '关系图谱', show: true },
  { id: 'disc', title: '资产发现', show: true },
]
