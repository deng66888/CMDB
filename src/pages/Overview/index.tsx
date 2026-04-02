import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Card,
  Select,
  Button,
  Modal,
  Checkbox,
  Space,
  Typography,
  message,
} from 'antd'
import {
  PlusCircleOutlined,
  WarningOutlined,
  AuditOutlined,
  ExportOutlined,
  ProjectOutlined,
  SearchOutlined,
  DownOutlined,
  CloudServerOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import {
  CMDB_CATEGORIES,
  STATUS_KEYS,
  STATUS_COLORS,
  configData,
  trendData,
  depreciationMock,
  maintainMock,
  complianceMock,
  dqStandards,
  defaultActionDefs,
  type CmdbStatus,
  type TrendGranularity,
} from '@/mock/cmdbOverview'
import { CloudResourceView } from './CloudResourceView'
import styles from './index.module.css'

const PRIMARY = '#1a73e8'
const CHART_H = 360
const CHART_DEP_H = 260

const trendLineColors = { 新增: '#1a73e8', 变更: '#f9ab00', 故障: '#d93025' }

function getStackedOption(dataKey: string): EChartsOption {
  const pack = dataKey === 'all' ? configData.all : configData[dataKey]
  if (!pack) return {}
  const cats = pack.categories
  const series = STATUS_KEYS.map((name: CmdbStatus) => ({
    name,
    type: 'bar' as const,
    stack: 'total',
    emphasis: { focus: 'series' as const },
    itemStyle: { color: STATUS_COLORS[name] },
    data: pack.series[name],
  }))
  return {
    color: STATUS_KEYS.map((k) => STATUS_COLORS[k]),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params: unknown) {
        const arr = params as { axisValue: string; marker: string; seriesName: string; value: number }[]
        if (!arr?.length) return ''
        const lines = arr.map(
          (p) => `${p.marker} ${p.seriesName}：<b>${p.value}</b>`,
        )
        return `${arr[0].axisValue}<br/>${lines.join('<br/>')}`
      },
    },
    legend: { data: [...STATUS_KEYS], top: 0 },
    grid: {
      left: '3%',
      right: '4%',
      bottom: cats.length > 20 ? '28%' : cats.length > 12 ? '22%' : cats.length > 6 ? '14%' : '3%',
      top: 48,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: cats,
      axisLabel: {
        rotate: cats.length > 4 ? 32 : 0,
        interval: 0,
        fontSize: 11,
        hideOverlap: true,
      },
    },
    yAxis: { type: 'value', name: '数量' },
    series,
  }
}

function getTrendOption(trendClass: string, range: TrendGranularity): EChartsOption {
  const seriesMap =
    trendClass === 'all'
      ? trendData.all[range]
      : trendData.byCat[trendClass]?.[range] ?? trendData.all[range]
  let labels: string[]
  if (range === 'day') {
    labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  } else if (range === 'week') {
    labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else {
    labels = ['W1', 'W2', 'W3', 'W4']
  }
  const names = ['新增', '变更', '故障'] as const
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: [...names], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 44, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: labels },
    yAxis: { type: 'value', name: '件数' },
    series: names.map((name) => ({
      name,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 2 },
      itemStyle: { color: trendLineColors[name] },
      data: seriesMap[name],
    })),
  }
}

function getDepreciationOption(): EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: depreciationMock.buckets.map((b) => b.name),
    },
    yAxis: { type: 'value', name: '资产数量' },
    series: [
      {
        type: 'bar',
        data: depreciationMock.buckets.map((b) => b.value),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4285f4' },
            { offset: 1, color: PRIMARY },
          ]),
        },
        barMaxWidth: 48,
      },
    ],
  }
}

const actionIconMap: Record<string, React.ReactNode> = {
  add: <PlusCircleOutlined />,
  fault: <WarningOutlined />,
  audit: <AuditOutlined />,
  export: <ExportOutlined />,
  rel: <ProjectOutlined />,
  disc: <SearchOutlined />,
}

export default function Overview() {
  const [mainTab, setMainTab] = useState<'ci' | 'cloud'>('ci')
  const [stackFilter, setStackFilter] = useState<string>('all')
  const [trendClass, setTrendClass] = useState<string>('all')
  const [trendRange, setTrendRange] = useState<TrendGranularity>('week')
  const [depModalOpen, setDepModalOpen] = useState(false)
  const [dqModal, setDqModal] = useState<{ open: boolean; title: string; body: string }>({
    open: false,
    title: '',
    body: '',
  })
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [actionDefs, setActionDefs] = useState(() => defaultActionDefs.map((a) => ({ ...a })))
  const [complianceIssuesOpen, setComplianceIssuesOpen] = useState(false)

  const barRef = useRef<HTMLDivElement>(null)
  const trendRef = useRef<HTMLDivElement>(null)
  const depRef = useRef<HTMLDivElement>(null)
  const barChart = useRef<echarts.ECharts | null>(null)
  const trendChart = useRef<echarts.ECharts | null>(null)
  const depChart = useRef<echarts.ECharts | null>(null)

  const categorySelectOptions = useMemo(
    () => [
      { value: 'all', label: '全部配置类' },
      ...CMDB_CATEGORIES.map((c) => ({ value: c, label: c })),
    ],
    [],
  )

  const trendClassOptions = useMemo(
    () => [
      { value: 'all', label: '全部配置类' },
      ...CMDB_CATEGORIES.map((c) => ({ value: c, label: c })),
    ],
    [],
  )

  const bindResize = useCallback((el: HTMLElement | null, chart: echarts.ECharts | null) => {
    if (!el || !chart) return () => {}
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    const onWin = () => chart.resize()
    window.addEventListener('resize', onWin)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWin)
    }
  }, [])

  useEffect(() => {
    if (!barRef.current) return
    const c = echarts.init(barRef.current)
    barChart.current = c
    c.setOption(getStackedOption(stackFilter), true)
    const un = bindResize(barRef.current, c)
    return () => {
      un()
      c.dispose()
      barChart.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; updates via effect below
  }, [])

  useEffect(() => {
    barChart.current?.setOption(getStackedOption(stackFilter), true)
  }, [stackFilter])

  useEffect(() => {
    if (!trendRef.current) return
    const c = echarts.init(trendRef.current)
    trendChart.current = c
    c.setOption(getTrendOption(trendClass, trendRange), true)
    const un = bindResize(trendRef.current, c)
    return () => {
      un()
      c.dispose()
      trendChart.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    trendChart.current?.setOption(getTrendOption(trendClass, trendRange), { notMerge: true })
  }, [trendClass, trendRange])

  useEffect(() => {
    if (!depRef.current) return
    const c = echarts.init(depRef.current)
    depChart.current = c
    c.setOption(getDepreciationOption(), true)
    const un = bindResize(depRef.current, c)
    return () => {
      un()
      c.dispose()
      depChart.current = null
    }
  }, [bindResize])

  /** 从云资源 Tab 切回配置项时，容器由 display:none 变为可见，需 resize 避免宽度为 0 */
  useEffect(() => {
    if (mainTab !== 'ci') return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        barChart.current?.resize()
        trendChart.current?.resize()
        depChart.current?.resize()
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [mainTab])

  const openDqDim = (dim: string) => {
    setDqModal({
      open: true,
      title: `${dim} · 计算标准`,
      body: dqStandards[dim] ?? '暂无说明',
    })
  }

  const saveCustomize = (checks: Record<string, boolean>) => {
    setActionDefs((prev) =>
      prev.map((a) => ({ ...a, show: checks[a.id] ?? a.show })),
    )
    setCustomizeOpen(false)
    message.success('已保存自定义操作')
  }

  return (
    <div className={styles.page}>
      <header className={styles.topNav}>
        <div className={styles.topTitle}>
          <CloudServerOutlined className={styles.topTitleIcon} />
          <span>CMDB 运维中心</span>
        </div>
        <nav className={styles.tabs} aria-label="概览切换">
          <button
            type="button"
            className={mainTab === 'ci' ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setMainTab('ci')}
          >
            配置项概览
          </button>
          <button
            type="button"
            className={mainTab === 'cloud' ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setMainTab('cloud')}
          >
            云资源概览
          </button>
        </nav>
      </header>

      <div
        id="config-view"
        className={mainTab === 'ci' ? styles.viewPane : styles.viewHidden}
        aria-hidden={mainTab !== 'ci'}
      >
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <Card
              bordered={false}
              className={styles.card}
              title="配置项分类统计"
              extra={
                <Select
                  className={styles.filterSelect}
                  value={stackFilter}
                  onChange={setStackFilter}
                  options={categorySelectOptions}
                  popupMatchSelectWidth={false}
                />
              }
            >
              <div className={styles.chartBox} style={{ height: CHART_H }} ref={barRef} />
            </Card>

            <Card
              bordered={false}
              className={styles.card}
              title="配置项动态时序"
              extra={
                <Space wrap size="middle">
                  <Select
                    className={styles.filterSelect}
                    value={trendClass}
                    onChange={setTrendClass}
                    options={trendClassOptions}
                    popupMatchSelectWidth={false}
                  />
                  <div className={styles.btnGroup}>
                    {(['day', 'week', 'month'] as const).map((r) => (
                      <Button
                        key={r}
                        type={trendRange === r ? 'primary' : 'default'}
                        className={styles.rangeBtn}
                        onClick={() => setTrendRange(r)}
                      >
                        {r === 'day' ? '天' : r === 'week' ? '周' : '月'}
                      </Button>
                    ))}
                  </div>
                </Space>
              }
            >
              <div className={styles.chartBox} style={{ height: CHART_H }} ref={trendRef} />
            </Card>

            <Card
              bordered={false}
              className={styles.card}
              title="资产折旧率报表"
              extra={
                <Button type="link" onClick={() => setDepModalOpen(true)}>
                  计算说明
                </Button>
              }
            >
              <div className={styles.statRow}>
                {[
                  { label: '资产原值', val: depreciationMock.stats.originalValue },
                  { label: '累计折旧', val: depreciationMock.stats.accumulated },
                  { label: '平均折旧率', val: depreciationMock.stats.avgRate },
                  { label: '残值率', val: depreciationMock.stats.residualRate },
                ].map((s) => (
                  <div key={s.label} className={styles.miniStat}>
                    <div className={styles.miniStatLabel}>{s.label}</div>
                    <div className={styles.miniStatVal}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className={styles.chartBox} style={{ height: CHART_DEP_H }} ref={depRef} />
            </Card>
          </div>

          <aside className={styles.rightCol}>
            <Card bordered={false} className={styles.card} title="数据质量评分">
              <div className={styles.scoreBig}>92.5%</div>
              <div className={styles.progressBar}>
                <i style={{ width: '92.5%' }} />
              </div>
              <div className={styles.dimCards}>
                {[
                  { dim: '完整性', val: '92.5%' },
                  { dim: '准确性', val: '88.3%' },
                  { dim: '及时性', val: '95.2%' },
                ].map((d) => (
                  <button
                    key={d.dim}
                    type="button"
                    className={styles.dimCard}
                    onClick={() => openDqDim(d.dim)}
                  >
                    <div className={styles.dimName}>{d.dim}</div>
                    <div className={styles.dimVal}>{d.val}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card bordered={false} className={styles.card} title="维保到期率">
              {maintainMock.map((m) => (
                <div key={m.key} className={styles.maintRow}>
                  <span>
                    <span className={styles.dot} style={{ background: m.color }} />
                    {m.key}
                  </span>
                  <span>
                    <strong>{m.count}</strong>
                    <span className={styles.maintPct}>（{m.pct}%）</span>
                  </span>
                </div>
              ))}
            </Card>

            <Card bordered={false} className={styles.card} title="合规性检查">
              {complianceMock.map((row) => (
                <div key={row.name} className={styles.complianceItem}>
                  {row.expandable && row.issues ? (
                    <>
                      <button
                        type="button"
                        className={styles.complianceHd}
                        onClick={() => setComplianceIssuesOpen((v) => !v)}
                      >
                        <span>{row.name}</span>
                        <span className={styles.complianceRate}>
                          {row.rate}{' '}
                          <DownOutlined
                            rotate={complianceIssuesOpen ? 180 : 0}
                            className={styles.chevron}
                          />
                        </span>
                      </button>
                      {complianceIssuesOpen && (
                        <div className={styles.complianceDetail}>
                          <ul>
                            {row.issues.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.complianceHdStatic}>
                      <span>{row.name}</span>
                      <span className={styles.complianceRate}>{row.rate}</span>
                    </div>
                  )}
                </div>
              ))}
            </Card>

            <Card
              bordered={false}
              className={`${styles.card} ${styles.actionsRightCard}`}
              title="高频操作"
              extra={
                <Button type="link" size="small" icon={<SlidersOutlined />} onClick={() => setCustomizeOpen(true)}>
                  自定义
                </Button>
              }
            >
              <div className={styles.actionsGridRight} role="group" aria-label="高频操作">
                {(() => {
                  const visible = actionDefs.filter((a) => a.show)
                  const minSlots = 6
                  const pad = Math.max(0, minSlots - visible.length)
                  return (
                    <>
                      {visible.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={styles.actionCardCompact}
                          onClick={() => message.info(`演示：${a.title}`)}
                        >
                          <div className={styles.actionIconCompact}>{actionIconMap[a.id]}</div>
                          <div className={styles.actionTitleCompact}>{a.title}</div>
                        </button>
                      ))}
                      {Array.from({ length: pad }, (_, i) => (
                        <div key={`action-empty-${i}`} className={styles.actionCellEmpty} aria-hidden />
                      ))}
                    </>
                  )
                })()}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <div
        id="cloud-view"
        className={mainTab === 'cloud' ? styles.viewPane : styles.viewHidden}
        aria-hidden={mainTab !== 'cloud'}
      >
        <CloudResourceView visible={mainTab === 'cloud'} />
      </div>

      <Modal
        title="折旧计算说明"
        open={depModalOpen}
        onCancel={() => setDepModalOpen(false)}
        footer={
          <Button type="primary" onClick={() => setDepModalOpen(false)}>
            知道了
          </Button>
        }
        destroyOnClose
      >
        <Typography.Paragraph>
          本报表采用<strong>直线法（年限平均法）</strong>计提折旧：
        </Typography.Paragraph>
        <pre className={styles.formulaBlock}>
          {`年折旧额 = (资产原值 − 预计净残值) ÷ 预计使用年限
月折旧额 = 年折旧额 ÷ 12`}
        </pre>
        <Typography.Paragraph type="secondary">
          平均折旧率 = 累计折旧 ÷ 资产原值 × 100%；残值率一般按原值的一定比例（如 5%）估算。以上为演示说明，实际以贵司财务与 CMDB
          对接规则为准。
        </Typography.Paragraph>
      </Modal>

      <Modal
        title={dqModal.title}
        open={dqModal.open}
        onCancel={() => setDqModal((s) => ({ ...s, open: false }))}
        footer={
          <Button type="primary" onClick={() => setDqModal((s) => ({ ...s, open: false }))}>
            关闭
          </Button>
        }
        destroyOnClose
      >
        <p>{dqModal.body}</p>
      </Modal>

      <CustomizeActionsModal
        open={customizeOpen}
        defs={actionDefs}
        onCancel={() => setCustomizeOpen(false)}
        onSave={saveCustomize}
      />
    </div>
  )
}

function CustomizeActionsModal({
  open,
  defs,
  onCancel,
  onSave,
}: {
  open: boolean
  defs: { id: string; title: string; show: boolean }[]
  onCancel: () => void
  onSave: (checks: Record<string, boolean>) => void
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) {
      const next: Record<string, boolean> = {}
      defs.forEach((d) => {
        next[d.id] = d.show
      })
      setChecks(next)
    }
  }, [open, defs])

  return (
    <Modal
      title="自定义高频操作"
      open={open}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={() => onSave(checks)}>
            保存
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        勾选要在底部展示的操作卡片：
      </Typography.Paragraph>
      <Checkbox.Group
        style={{ width: '100%' }}
        value={Object.entries(checks)
          .filter(([, v]) => v)
          .map(([k]) => k)}
        onChange={(vals) => {
          const vset = new Set(vals as string[])
          setChecks((prev) => {
            const n = { ...prev }
            defs.forEach((d) => {
              n[d.id] = vset.has(d.id)
            })
            return n
          })
        }}
      >
        <Space direction="vertical">
          {defs.map((d) => (
            <Checkbox key={d.id} value={d.id}>
              {d.title}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    </Modal>
  )
}
