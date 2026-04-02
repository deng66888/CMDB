/**
 * 云资源概览 — 完整 Mock（成本趋势、厂商分布、资源类型、运维柱状、KPI、异常 Top5）
 */

export type CloudCostRange = '6m' | '12m'

export const cloudData = {
  kpi: {
    /** 多云资源总数 */
    totalResources: { value: 12480, momPct: 2.3 },
    /** 本月云成本（万元） */
    monthlyCostWan: { value: 328.5, momPct: -1.2 },
    /** 平均资源利用率 % */
    avgUtilization: { value: 68.5, peakHint: '峰值 92%（昨晚 22:00）' },
    /** 健康度 0-100 */
    healthScore: { value: 86, status: '良好' },
  },

  /** 堆叠面积图：近 6 月 / 近 1 年（单位：万元） */
  costTrend: {
    '6m': {
      months: ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'],
      计算资源: [118, 122, 128, 131, 125, 130],
      存储资源: [42, 44, 45, 48, 46, 49],
      网络资源: [18, 19, 20, 21, 20, 22],
    },
    '12m': {
      months: [
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
        '2024-09',
        '2024-10',
        '2024-11',
        '2024-12',
        '2025-01',
        '2025-02',
      ],
      计算资源: [95, 98, 102, 105, 110, 115, 118, 122, 128, 131, 125, 130],
      存储资源: [32, 34, 36, 38, 40, 41, 42, 44, 45, 48, 46, 49],
      网络资源: [14, 15, 15, 16, 17, 17, 18, 19, 20, 21, 20, 22],
    },
  } satisfies Record<CloudCostRange, { months: string[]; 计算资源: number[]; 存储资源: number[]; 网络资源: number[] }>,

  /** 资源变更与自动化 — 柱状对比（件） */
  opsAutomation: {
    创建: 186,
    变更: 342,
    释放: 52,
  },

  /** 多云平台分布 */
  vendors: [
    { name: '阿里云', value: 4280, color: '#ff6a00' },
    { name: '腾讯云', value: 3120, color: '#006eff' },
    { name: '华为云', value: 2650, color: '#cf0a2c' },
    { name: 'AWS', value: 2430, color: '#ff9900' },
  ],

  /** 资源类型构成（数量） */
  resourceTypes: [
    { name: 'ECS', value: 2100 },
    { name: 'RDS', value: 680 },
    { name: 'OSS', value: 520 },
    { name: 'SLB', value: 410 },
    { name: 'Redis', value: 360 },
    { name: 'VPC', value: 290 },
    { name: 'ACK/K8S', value: 245 },
  ],

  /** 资源异常 Top5 */
  anomalies: [
    {
      id: '1',
      title: 'prod-ecs-web-07 CPU 持续高负载',
      detail: '近 1h 平均 CPU 91%，超过策略阈值 85%',
      severity: 'high' as const,
    },
    {
      id: '2',
      title: 'RDS 只读实例连接数逼近上限',
      detail: '连接数 1180/1200，建议扩容或限流',
      severity: 'high' as const,
    },
    {
      id: '3',
      title: 'SLB 公网带宽多次触顶',
      detail: '昨日峰值带宽达规格 98%',
      severity: 'medium' as const,
    },
    {
      id: '4',
      title: '对象存储桶跨域访问异常升高',
      detail: '疑似热点对象拉取，需核对 CDN 回源策略',
      severity: 'medium' as const,
    },
    {
      id: '5',
      title: '自动化编排任务失败率上升',
      detail: '近 24h 释放/变更流水线失败 6 次',
      severity: 'medium' as const,
    },
  ],
}

export function sumVendorTotal(): number {
  return cloudData.vendors.reduce((s, v) => s + v.value, 0)
}
