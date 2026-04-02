/** 配置项列视图：类型与默认数据 */

export type ViewVisibility = 'self' | 'public'
export type CellAlign = 'left' | 'center' | 'right'
export type ColumnWidthMode = 'auto' | 'custom'
export type FixedColumnMode = 'none' | 'custom'

export interface ViewPersonalization {
  zebra: boolean
  border: boolean
  highlightRow: boolean
  wrap: boolean
  doubleClickDetail: boolean
  align: CellAlign
  tagField?: string
  columnWidth: ColumnWidthMode
  fixedColumn: FixedColumnMode
}

export interface ColumnView {
  key: string
  title: string
}

export interface ListView {
  id: string
  name: string
  visibility: ViewVisibility
  description?: string
  columnKeys: string[]
  personalization: ViewPersonalization
  isMine: boolean
  isSystem?: boolean
}

const defaultPersonalization: ViewPersonalization = {
  zebra: false,
  border: false,
  highlightRow: true,
  wrap: false,
  doubleClickDetail: true,
  align: 'left',
  columnWidth: 'auto',
  fixedColumn: 'none',
}

/** 所有可用的表格列（可配置可见与顺序） */
export const AVAILABLE_COLUMNS: ColumnView[] = [
  { key: 'name', title: '名称' },
  { key: 'category', title: '分类' },
  { key: 'vendor', title: '供应商' },
  { key: 'assetId', title: '资产' },
  { key: 'creator', title: '创建人' },
  { key: 'createTime', title: '创建时间' },
  { key: 'status', title: '状态' },
  { key: 'manufacturer', title: '制造商' },
  { key: 'updateTime', title: '更新时间' },
  { key: 'company', title: '公司' },
  { key: 'department', title: '部门' },
  { key: 'domain', title: '领域' },
  { key: 'purchaseDate', title: '购买日期' },
  { key: 'installTime', title: '安装时间' },
  { key: 'warrantyDate', title: '保修日期' },
  { key: 'action', title: '操作' },
]

const defaultColumnKeys = ['name', 'category', 'vendor', 'creator', 'createTime', 'status', 'action']

export const defaultViews: ListView[] = [
  {
    id: 'standard',
    name: '标准视图',
    visibility: 'public',
    description: '系统默认视图',
    columnKeys: defaultColumnKeys,
    personalization: { ...defaultPersonalization },
    isMine: false,
    isSystem: true,
  },
  {
    id: 'sales',
    name: '业务员视图',
    visibility: 'public',
    columnKeys: ['name', 'category', 'company', 'creator', 'createTime', 'action'],
    personalization: { ...defaultPersonalization },
    isMine: false,
  },
  {
    id: 'tech',
    name: '技术员视图',
    visibility: 'public',
    columnKeys: ['name', 'category', 'vendor', 'assetId', 'status', 'creator', 'createTime', 'action'],
    personalization: { ...defaultPersonalization, zebra: true },
    isMine: false,
  },
]

export function createEmptyView(isMine: boolean): ListView {
  return {
    id: `view_${Date.now()}`,
    name: '',
    visibility: 'public',
    columnKeys: [...defaultColumnKeys],
    personalization: { ...defaultPersonalization },
    isMine,
  }
}

export function getColumnTitle(key: string): string {
  return AVAILABLE_COLUMNS.find((c) => c.key === key)?.title ?? key
}
