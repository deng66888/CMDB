import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Table, Tag, Space, Dropdown, message, Badge, Tooltip, Modal } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, MoreOutlined, AppstoreOutlined, QuestionCircleOutlined, FilterOutlined, UpOutlined, DownOutlined, ApartmentOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ciListMock, applicationListMock, type CIRecord, type AppItem } from '@/mock/ci'
import VersionDrawer from './VersionDrawer'
import ConfigClassModal from './ConfigClassModal'
import NewCIDrawer from './NewCIDrawer'
import ConfigClassPanel from './ConfigClassPanel'
import ViewPanel from './ViewPanel'
import ViewModal from './ViewModal'
import { defaultViews, type ListView, getColumnTitle } from './viewTypes'
import styles from './index.module.css'

type FilterLogic = 'and' | 'or'
interface FilterRow {
  id: string
  field: 'creator' | 'status'
  value: string
  logic: FilterLogic
}
interface SortRow {
  id: string
  field: 'creator' | 'createTime'
  order: 'asc' | 'desc'
}

export default function CIManagement() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [pinned, setPinned] = useState(false)
  const [hoverVisible, setHoverVisible] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [applications, setApplications] = useState<AppItem[]>(() => [...applicationListMock])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activityLogOpen, setActivityLogOpen] = useState(false)
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false)
  const [versionDrawerRecord, setVersionDrawerRecord] = useState<CIRecord | null>(null)
  const [configClassModalOpen, setConfigClassModalOpen] = useState(false)
  const [newDrawerOpen, setNewDrawerOpen] = useState(false)
  const [newDrawerCategory, setNewDrawerCategory] = useState('')
  const [filters, setFilters] = useState<FilterRow[]>([
    { id: 'f1', field: 'creator', value: '是我(当前用户)', logic: 'and' },
    { id: 'f2', field: 'status', value: '已安装', logic: 'and' },
  ])
  const [sorts, setSorts] = useState<SortRow[]>([
    { id: 's1', field: 'creator', order: 'desc' },
    { id: 's2', field: 'createTime', order: 'desc' },
  ])
  const [filterApplied, setFilterApplied] = useState(true)
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [views, setViews] = useState<ListView[]>(() => [...defaultViews])
  const [currentViewId, setCurrentViewId] = useState('standard')
  const [viewPanelVisible, setViewPanelVisible] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editingView, setEditingView] = useState<ListView | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(0)

  const hasActiveFilters = filterApplied && (filters.length > 0 || sorts.length > 0)
  const activeFilterCount = filters.length + sorts.length
  const currentView = views.find((v) => v.id === currentViewId) ?? views[0]

  const toggleFavorite = (id: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, favorited: !a.favorited } : a))
    )
  }

  let filteredList = categoryFilter
    ? ciListMock.filter((r) => r.category === categoryFilter)
    : ciListMock
  if (keyword) {
    filteredList = filteredList.filter(
      (r) => r.name.includes(keyword) || r.category.includes(keyword) || (r.vendor && r.vendor.includes(keyword))
    )
  }
  if (filterApplied && filters.length > 0) {
    filteredList = filteredList.filter((row) => {
      let result: boolean | null = null
      for (const f of filters) {
        let match = false
        if (f.field === 'creator') {
          match = f.value === '是我(当前用户)' ? row.creator === '管理员' : row.creator === f.value
        } else if (f.field === 'status') {
          match = row.status === f.value
        }
        if (result === null) result = match
        else result = f.logic === 'and' ? result && match : result || match
      }
      return result ?? true
    })
  }
  const sortedList = [...filteredList].sort((a, b) => {
    for (const s of sorts) {
      const va = s.field === 'creator' ? a.creator : a.createTime
      const vb = s.field === 'creator' ? b.creator : b.createTime
      const cmp = String(va).localeCompare(String(vb))
      if (cmp !== 0) return s.order === 'desc' ? -cmp : cmp
    }
    return 0
  })

  const paginatedList = sortedList.slice((page - 1) * pageSize, page * pageSize)
  const total = sortedList.length

  const handleMouseLeave = () => {
    hoverTimerRef.current = window.setTimeout(() => setHoverVisible(false), 150)
  }
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = 0
    }
    setHoverVisible(true)
  }

  const addFilter = () => {
    setFilters((prev) => [...prev, { id: `f${Date.now()}`, field: 'creator', value: '是我(当前用户)', logic: 'and' }])
  }
  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id))
  const updateFilter = (id: string, patch: Partial<FilterRow>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }
  const addSort = () => {
    setSorts((prev) => [...prev, { id: `s${Date.now()}`, field: 'createTime', order: 'desc' }])
  }
  const removeSort = (id: string) => setSorts((prev) => prev.filter((s) => s.id !== id))
  const updateSort = (id: string, patch: Partial<SortRow>) => {
    setSorts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const handleCreateView = () => {
    setEditingView(null)
    setViewModalOpen(true)
    setViewPanelVisible(false)
  }
  const handleEditView = (v: ListView) => {
    setEditingView(v)
    setViewModalOpen(true)
    setViewPanelVisible(false)
  }
  const handleDeleteView = (id: string) => {
    if (views.find((x) => x.id === id)?.isSystem) return
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该视图吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setViews((prev) => prev.filter((x) => x.id !== id))
        if (currentViewId === id) setCurrentViewId('standard')
        message.success('已删除')
      },
    })
  }
  const handleSaveView = (view: ListView) => {
    setViews((prev) => {
      const idx = prev.findIndex((v) => v.id === view.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = view
        return next
      }
      return [...prev, view]
    })
    setCurrentViewId(view.id)
    setEditingView(null)
    message.success('已保存并使用该视图')
  }

  const columns: ColumnsType<CIRecord> = useMemo(() => {
    const colKeys = currentView.columnKeys.filter((k) => k !== 'action')
    const base: ColumnsType<CIRecord> = [
      { title: '', dataIndex: 'id', width: 48, render: () => <input type="checkbox" /> },
    ]
    const dataIndexMap: Record<string, keyof CIRecord | undefined> = {
      name: 'name',
      category: 'category',
      vendor: 'vendor',
      assetId: 'assetId',
      creator: 'creator',
      createTime: 'createTime',
      status: 'status',
    }
    colKeys.forEach((key) => {
      const title = getColumnTitle(key)
      if (key === 'name') {
        base.push({
          title,
          dataIndex: 'name',
          sorter: (a, b) => a.name.localeCompare(b.name),
          render: (name: string, record: CIRecord) => (
            <a onClick={() => navigate(`/config/ci-detail?id=${record.id}`)}>{name}</a>
          ),
        })
        return
      }
      if (key === 'status') {
        base.push({
          title,
          dataIndex: 'status',
          render: (v: string) => v && <Tag color="success">{v}</Tag>,
        })
        return
      }
      if (key === 'action') return
      const dataIndex = dataIndexMap[key]
      base.push({
        title,
        dataIndex: dataIndex ?? key,
        sorter: dataIndex ? (a, b) => String(a[dataIndex] ?? '').localeCompare(String(b[dataIndex] ?? '')) : undefined,
      })
    })
    if (currentView.columnKeys.includes('action')) {
      base.push({
        title: '操作',
        key: 'action',
        width: 140,
        render: (_: unknown, record: CIRecord) => (
          <Space>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/config/ci-detail?id=${record.id}&edit=1`)} />
            <Dropdown
              menu={{
                items: [
                  { key: 'log', label: '活动日志', onClick: () => setActivityLogOpen(true) },
                  { key: 'share', label: '分享' },
                  {
                    key: 'relation',
                    label: '关系图',
                    icon: <ApartmentOutlined />,
                    onClick: () => {
                      const q = new URLSearchParams()
                      q.set('id', record.id)
                      q.set('name', record.name)
                      q.set('category', record.category || '服务器')
                      navigate(`/config/ci-relation-graph?${q.toString()}`)
                    },
                  },
                  { key: 'version', label: '版本管理', onClick: () => { setVersionDrawerRecord(record); setVersionDrawerOpen(true) } },
                  { key: 'draft', label: '草稿管理', onClick: () => navigate('/config/draft') },
                  { key: 'batch', label: '批量修改' },
                  { key: 'import', label: '导入' },
                  { key: 'export', label: '导出' },
                  { key: 'delete', label: '删除', danger: true },
                ],
              }}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      })
    }
    return base
  }, [currentView.columnKeys, navigate])

  const tableClassName = [
    currentView.personalization.zebra && styles.tableZebra,
    currentView.personalization.border && styles.tableBorder,
    currentView.personalization.highlightRow && styles.tableHighlightRow,
  ].filter(Boolean).join(' ')
  const onRow = currentView.personalization.doubleClickDetail
    ? (record: CIRecord) => ({
        onDoubleClick: () => navigate(`/config/ci-detail?id=${record.id}`),
      })
    : undefined

  const showFloatPanel = !pinned && hoverVisible
  const showFixedPanel = pinned

  return (
    <div className={styles.wrap}>
      <div className={styles.helpBar}>
        <span className={styles.helpLink}><QuestionCircleOutlined /> 如何使用IT资源管理?</span>
      </div>
      <div className={styles.toolbar}>
        <Space wrap>
          <div
            className={styles.configClassTrigger}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Button
              type={pinned ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setPinned((v) => !v)}
            >
              配置类
            </Button>
            {showFloatPanel && (
              <div className={styles.floatPanel} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <ConfigClassPanel
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  applications={applications}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setConfigClassModalOpen(true)}>新建</Button>
        </Space>
        <Space wrap>
          <Select defaultValue="all" style={{ width: 140 }} options={[{ value: 'all', label: '所有配置项' }]} />
          <Tooltip title={filterExpanded ? '收起筛选条件' : '展开筛选条件'}>
            <Badge count={hasActiveFilters ? activeFilterCount : 0} size="small" offset={[-2, 2]}>
              <Button
                type={filterExpanded ? 'primary' : hasActiveFilters ? 'primary' : 'default'}
                icon={<FilterOutlined />}
                onClick={() => setFilterExpanded((v) => !v)}
                className={styles.filterTriggerBtn}
              >
                筛选
              </Button>
            </Badge>
          </Tooltip>
          <Input
            placeholder="请输入关键字搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Button
            onClick={() => setViewPanelVisible((v) => !v)}
            icon={<DownOutlined />}
            style={{ width: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>{currentView.name || '标准视图'}</span>
          </Button>
          <ViewPanel
            visible={viewPanelVisible}
            onClose={() => setViewPanelVisible(false)}
            views={views}
            currentViewId={currentViewId}
            onSelectView={(id) => { setCurrentViewId(id); setViewPanelVisible(false) }}
            onCreateView={handleCreateView}
            onEditView={handleEditView}
            onDeleteView={handleDeleteView}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'activity', label: '活动日志', onClick: () => setActivityLogOpen(true) },
                { key: 'share', label: '分享' },
                { key: 'batch', label: '批量修改' },
                { key: 'import', label: '导入' },
                { key: 'export', label: '导出' },
                { key: 'delete', label: '删除', danger: true },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>

      {/* 过滤与排序：点击筛选图标展开，再点或点击收起按钮收起 */}
      {filterExpanded && (
        <div className={styles.filterBar}>
          <div className={styles.filterBarHead}>
            <span className={styles.filterBarTitle}><FilterOutlined /> 筛选条件</span>
            <Button type="text" size="small" icon={<UpOutlined />} onClick={() => setFilterExpanded(false)}>
              收起
            </Button>
          </div>
          <Space wrap className={styles.filterTags}>
          <span className={styles.filterTag}>已用</span>
          <Button type="link" size="small">另存为...</Button>
          <span className={styles.filterTag}>且</span>
          <Button type="link" size="small">或</Button>
          <Button type="link" size="small">排序</Button>
        </Space>
        <div className={styles.filterSectionTitle}>
          <FilterOutlined /> 设置过滤条件
        </div>
        <div className={styles.filterRows}>
          {filters.map((f) => (
            <div key={f.id} className={styles.filterRow}>
              <Select
                value={f.field}
                onChange={(v) => updateFilter(f.id, { field: v as FilterRow['field'] })}
                options={[
                  { value: 'creator', label: '创建人' },
                  { value: 'status', label: '状态' },
                ]}
                style={{ width: 100 }}
              />
              {f.field === 'creator' && (
                <>
                  <label className={styles.filterCheck}><input type="checkbox" /> 是动态的</label>
                  <Select
                    value={f.value}
                    onChange={(v) => updateFilter(f.id, { value: v })}
                    options={[
                      { value: '是我(当前用户)', label: '是我(当前用户)' },
                      { value: '管理员', label: '管理员' },
                      { value: 'test', label: 'test' },
                    ]}
                    style={{ width: 140 }}
                  />
                </>
              )}
              {f.field === 'status' && (
                <Select
                  value={f.value}
                  onChange={(v) => updateFilter(f.id, { value: v })}
                  options={[
                    { value: '已安装', label: '已安装' },
                    { value: '已发布', label: '已发布' },
                  ]}
                  style={{ width: 100 }}
                />
              )}
              <Space>
                <Button type={f.logic === 'and' ? 'primary' : 'default'} size="small" onClick={() => updateFilter(f.id, { logic: 'and' })}>且</Button>
                <Button type={f.logic === 'or' ? 'primary' : 'default'} size="small" onClick={() => updateFilter(f.id, { logic: 'or' })}>或</Button>
              </Space>
              <Button type="text" size="small" danger onClick={() => removeFilter(f.id)}>×</Button>
            </div>
          ))}
        </div>
        <div className={styles.filterSectionTitle}>设置排序规则</div>
        <div className={styles.sortRows}>
          {sorts.map((s) => (
            <div key={s.id} className={styles.filterRow}>
              <Select
                value={s.field}
                onChange={(v) => updateSort(s.id, { field: v as SortRow['field'] })}
                options={[
                  { value: 'creator', label: '创建人' },
                  { value: 'createTime', label: '创建时间' },
                ]}
                style={{ width: 100 }}
              />
              <Select
                value={s.order}
                onChange={(v) => updateSort(s.id, { order: v as 'asc' | 'desc' })}
                options={[
                  { value: 'asc', label: '升序' },
                  { value: 'desc', label: '降序' },
                ]}
                style={{ width: 80 }}
              />
              <Button type="text" size="small" danger onClick={() => removeSort(s.id)}>×</Button>
            </div>
          ))}
        </div>
          <div className={styles.filterActions}>
            <Button type="primary" onClick={() => { setFilterApplied(true); message.success('已应用筛选条件'); }}>应用</Button>
            <Button onClick={() => message.info('已保存筛选条件')}>另存为...</Button>
            <Button onClick={addFilter}>添加过滤条件</Button>
            <Button onClick={addSort}>添加排序</Button>
          </div>
        </div>
      )}

      <div className={styles.main}>
        {showFixedPanel && (
          <div className={styles.sideFilter}>
            <ConfigClassPanel
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              applications={applications}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        )}
        <div className={styles.tableArea}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={paginatedList}
            className={tableClassName}
            onRow={onRow}
            pagination={{
              total: total,
              current: page,
              pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共${t}条`,
              onChange: (p, ps) => { setPage(p); if (ps) setPageSize(ps) },
            }}
          />
        </div>
      </div>
      {activityLogOpen && (
        <div className={styles.drawerMask} onClick={() => setActivityLogOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>活动日志 <button onClick={() => setActivityLogOpen(false)}>×</button></div>
            <div className={styles.drawerBody}>
              <p>2021-12-17 17:43:31 · 操作者: admin</p>
              <p>描述: [所属业务服务由""改为"aaa"] [管理员由""改为"超级管理员"]</p>
            </div>
          </div>
        </div>
      )}
      <VersionDrawer open={versionDrawerOpen} onClose={() => { setVersionDrawerOpen(false); setVersionDrawerRecord(null) }} record={versionDrawerRecord} />
      <ConfigClassModal
        open={configClassModalOpen}
        onCancel={() => setConfigClassModalOpen(false)}
        onNext={(category) => { setNewDrawerCategory(category); setNewDrawerOpen(true) }}
      />
      <NewCIDrawer
        open={newDrawerOpen}
        category={newDrawerCategory}
        onClose={() => { setNewDrawerOpen(false); setNewDrawerCategory('') }}
        onSaveDraft={() => message.success('已保存草稿')}
        onSubmit={() => message.success('已提交审核')}
      />
      <ViewModal
        open={viewModalOpen}
        editingView={editingView}
        onCancel={() => { setViewModalOpen(false); setEditingView(null) }}
        onSave={handleSaveView}
      />
    </div>
  )
}
