import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Button, Space, Tag } from 'antd'
import {
  CloudOutlined,
  DollarOutlined,
  DashboardOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { cloudData, sumVendorTotal, type CloudCostRange } from '@/mock/cloudOverview'
import styles from './cloudResource.module.css'

const PRIMARY = '#1a73e8'

function getStackedCostOption(range: CloudCostRange): EChartsOption {
  const pack = cloudData.costTrend[range]
  const names = ['计算资源', '存储资源', '网络资源'] as const
  const colors = ['#1a73e8', '#34a853', '#f9ab00']
  return {
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: { data: [...names], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 44, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: pack.months },
    yAxis: { type: 'value', name: '成本（万元）' },
    series: names.map((name, i) => ({
      name,
      type: 'line' as const,
      stack: 'Total',
      smooth: true,
      areaStyle: { opacity: 0.35 },
      lineStyle: { width: 2 },
      itemStyle: { color: colors[i] },
      emphasis: { focus: 'series' as const },
      data: pack[name],
    })),
  }
}

function getOpsBarOption(): EChartsOption {
  const o = cloudData.opsAutomation
  const cats = ['创建', '变更', '释放']
  const vals = [o['创建'], o['变更'], o['释放']]
  const barColors = [PRIMARY, '#f9ab00', '#9aa0a6']
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 28, containLabel: true },
    xAxis: { type: 'category', data: cats },
    yAxis: { type: 'value', name: '数量（件）' },
    series: [
      {
        name: '操作量',
        type: 'bar',
        barMaxWidth: 56,
        data: vals.map((v, i) => ({
          value: v,
          itemStyle: { color: barColors[i] },
        })),
      },
    ],
  }
}

function getVendorDonutOption(): EChartsOption {
  const data = cloudData.vendors.map((v) => ({ name: v.name, value: v.value, itemStyle: { color: v.color } }))
  const total = sumVendorTotal()
  const totalFmt = total.toLocaleString('zh-CN')
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const x = p as { name: string; value: number; percent: number; marker: string }
        return `${x.marker} ${x.name}<br/>数量：<b>${x.value.toLocaleString('zh-CN')}</b>（${x.percent}%）`
      },
    },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        name: '云平台',
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontWeight: 'bold' },
        },
        data,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: totalFmt,
          fill: '#1f1f1f',
          fontSize: 22,
          fontWeight: 700,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: '总量',
          fill: '#5f6368',
          fontSize: 13,
        },
      },
    ],
  }
}

function getResourceTypeBarOption(): EChartsOption {
  const sorted = [...cloudData.resourceTypes].sort((a, b) => a.value - b.value)
  const names = sorted.map((x) => x.name)
  const vals = sorted.map((x) => x.value)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '12%', right: '8%', bottom: '3%', top: 8, containLabel: true },
    xAxis: { type: 'value', name: '数量' },
    yAxis: { type: 'category', data: names, axisLabel: { interval: 0 } },
    series: [
      {
        type: 'bar',
        data: vals,
        barMaxWidth: 22,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#4285f4' },
            { offset: 1, color: PRIMARY },
          ]),
        },
      },
    ],
  }
}

type ChartKey = 'cost' | 'ops' | 'vendor' | 'rtype'

export type CloudResourceViewProps = {
  /** 与 Tab 同步：可见时初始化/resize 图表 */
  visible: boolean
}

/**
 * 云资源概览主体：KPI + 左（成本堆叠面积、运维柱图）+ 右（环形图、条形图、异常列表）
 */
export function CloudResourceView({ visible }: CloudResourceViewProps) {
  const [costRange, setCostRange] = useState<CloudCostRange>('6m')
  const costRangeRef = useRef(costRange)
  costRangeRef.current = costRange

  const costRef = useRef<HTMLDivElement>(null)
  const opsRef = useRef<HTMLDivElement>(null)
  const vendorRef = useRef<HTMLDivElement>(null)
  const rtypeRef = useRef<HTMLDivElement>(null)
  const charts = useRef<Partial<Record<ChartKey, echarts.ECharts>>>({})
  const inited = useRef(false)
  const resizeCleanups = useRef<(() => void)[]>([])

  const bindResize = useCallback((el: HTMLElement | null, key: ChartKey) => {
    if (!el) return () => {}
    const chart = charts.current[key]
    if (!chart) return () => {}
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    const onWin = () => chart.resize()
    window.addEventListener('resize', onWin)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWin)
    }
  }, [])

  const ensureChart = useCallback((el: HTMLDivElement | null, key: ChartKey, option: EChartsOption) => {
    if (!el) return
    let c = charts.current[key]
    if (!c || (typeof c.isDisposed === 'function' && c.isDisposed())) {
      c?.dispose()
      c = echarts.init(el)
      charts.current[key] = c
    }
    c.setOption(option, true)
    c.resize()
  }, [])

  const initCloudCharts = useCallback(() => {
    const range = costRangeRef.current
    ensureChart(costRef.current, 'cost', getStackedCostOption(range))
    ensureChart(opsRef.current, 'ops', getOpsBarOption())
    ensureChart(vendorRef.current, 'vendor', getVendorDonutOption())
    ensureChart(rtypeRef.current, 'rtype', getResourceTypeBarOption())
    inited.current = true
  }, [ensureChart])

  /** Tab 显示云资源：布局为 block 后 init + resize；隐藏时仅卸载监听 */
  useEffect(() => {
    if (!visible) {
      resizeCleanups.current.forEach((fn) => fn())
      resizeCleanups.current = []
      return
    }

    let cancelled = false
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return
        initCloudCharts()
        resizeCleanups.current.forEach((fn) => fn())
        resizeCleanups.current = [
          bindResize(costRef.current, 'cost'),
          bindResize(opsRef.current, 'ops'),
          bindResize(vendorRef.current, 'vendor'),
          bindResize(rtypeRef.current, 'rtype'),
        ]
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      resizeCleanups.current.forEach((fn) => fn())
      resizeCleanups.current = []
    }
  }, [visible, initCloudCharts, bindResize])

  /** 成本周期切换 */
  useEffect(() => {
    if (!visible || !inited.current) return
    charts.current.cost?.setOption(getStackedCostOption(costRange), true)
    requestAnimationFrame(() => charts.current.cost?.resize())
  }, [costRange, visible])

  useEffect(() => {
    return () => {
      resizeCleanups.current.forEach((fn) => fn())
      resizeCleanups.current = []
      ;(['cost', 'ops', 'vendor', 'rtype'] as ChartKey[]).forEach((k) => {
        charts.current[k]?.dispose()
        delete charts.current[k]
      })
      inited.current = false
    }
  }, [])

  const k = cloudData.kpi
  const fmtMom = (n: number) => (
    <span className={n >= 0 ? styles.momUp : styles.momDown}>
      环比 {n >= 0 ? '+' : ''}
      {n}%
    </span>
  )

  return (
    <div className={styles.cloudRoot}>
      <div className={styles.cloudKpiGrid}>
        <div className={`${styles.cloudKpiCard} ${styles.kpiBorderBlue}`}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(26, 115, 232, 0.12)' }}>
            <CloudOutlined style={{ color: PRIMARY, fontSize: 22 }} />
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiLabel}>多云资源总数</div>
            <div className={styles.kpiValue}>{k.totalResources.value.toLocaleString('zh-CN')}</div>
            <div className={styles.kpiSub}>{fmtMom(k.totalResources.momPct)}</div>
          </div>
        </div>
        <div className={`${styles.cloudKpiCard} ${styles.kpiBorderOrange}`}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(249, 171, 0, 0.15)' }}>
            <DollarOutlined style={{ color: '#f9ab00', fontSize: 22 }} />
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiLabel}>本月云成本</div>
            <div className={styles.kpiValue}>
              ¥ {k.monthlyCostWan.value.toFixed(1)} <span className={styles.kpiUnit}>万</span>
            </div>
            <div className={styles.kpiSub}>{fmtMom(k.monthlyCostWan.momPct)}</div>
          </div>
        </div>
        <div className={`${styles.cloudKpiCard} ${styles.kpiBorderGreen}`}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(30, 142, 62, 0.12)' }}>
            <DashboardOutlined style={{ color: '#1e8e3e', fontSize: 22 }} />
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiLabel}>平均资源利用率</div>
            <div className={styles.kpiValue}>{k.avgUtilization.value}%</div>
            <div className={styles.kpiSubMuted}>{k.avgUtilization.peakHint}</div>
          </div>
        </div>
        <div className={`${styles.cloudKpiCard} ${styles.kpiBorderPurple}`}>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(114, 46, 209, 0.12)' }}>
            <HeartOutlined style={{ color: '#722ed1', fontSize: 22 }} />
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiLabel}>健康度评分</div>
            <div className={styles.kpiValue}>
              {k.healthScore.value}{' '}
              <span className={styles.kpiStatus}>{k.healthScore.status}</span>
            </div>
            <div className={styles.kpiSubMuted}>综合可用性、告警、成本偏差加权</div>
          </div>
        </div>
      </div>

      <div className={styles.cloudMainGrid}>
        <div className={styles.cloudLeft}>
          <Card
            bordered={false}
            className={styles.cloudCard}
            title="云资源成本趋势"
            extra={
              <Space size={4} className={styles.cloudRangeBtns}>
                <Button
                  type={costRange === '6m' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setCostRange('6m')}
                >
                  近6月
                </Button>
                <Button
                  type={costRange === '12m' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setCostRange('12m')}
                >
                  近1年
                </Button>
              </Space>
            }
          >
            <div className={styles.chartBox} style={{ height: 320 }} ref={costRef} />
          </Card>

          <Card bordered={false} className={styles.cloudCard} title="资源变更与自动化">
            <div className={styles.chartBox} style={{ height: 280 }} ref={opsRef} />
          </Card>
        </div>

        <div className={styles.cloudRight}>
          <Card bordered={false} className={styles.cloudCard} title="多云平台分布">
            <div className={styles.chartBox} style={{ height: 300 }} ref={vendorRef} />
          </Card>

          <Card bordered={false} className={styles.cloudCard} title="资源类型构成">
            <div className={styles.chartBox} style={{ height: 280 }} ref={rtypeRef} />
          </Card>

          <Card bordered={false} className={styles.cloudCard} title="资源异常 Top5">
            <ul className={styles.anomalyList}>
              {cloudData.anomalies.map((a) => (
                <li key={a.id} className={styles.anomalyItem}>
                  <div className={styles.anomalyHd}>
                    <Tag color={a.severity === 'high' ? 'error' : 'warning'} className={styles.sevTag}>
                      {a.severity === 'high' ? '高' : '中'}
                    </Tag>
                    <span className={styles.anomalyTitle}>{a.title}</span>
                  </div>
                  <div className={styles.anomalyDetail}>{a.detail}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
