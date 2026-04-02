import {
  FolderOutlined,
  FontSizeOutlined,
  FileTextOutlined,
  NumberOutlined,
  SearchOutlined,
  LinkOutlined,
  CalendarOutlined,
  BankOutlined,
  UserOutlined,
  TableOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ApartmentOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import type { ComponentType, CSSProperties } from 'react'

const BLUE = '#1890ff'

/** 字段类型 key -> 统一图标组件，用于侧栏「字段类型」展示（图标 + 类型名称，蓝色） */
export const FIELD_TYPE_ICONS: Record<string, ComponentType<{ style?: CSSProperties; className?: string }>> = {
  group: FolderOutlined,
  singleline: FontSizeOutlined,
  multiline: FileTextOutlined,
  counter: NumberOutlined,
  lookup: SearchOutlined,
  reference: LinkOutlined,
  datetime: CalendarOutlined,
  department: BankOutlined,
  person: UserOutlined,
  table: TableOutlined,
  radio: CheckCircleOutlined,
  checkbox: CheckSquareOutlined,
  cascader: ApartmentOutlined,
  usergroup: TeamOutlined,
}

export function getFieldTypeIcon(key: string) {
  return FIELD_TYPE_ICONS[key] || AppstoreOutlined
}

/** 渲染字段类型展示：统一蓝色图标 + 类型名称 */
export function FieldTypeDisplay({
  typeKey,
  label,
  style,
}: {
  typeKey: string
  label: string
  style?: CSSProperties
}) {
  const Icon = getFieldTypeIcon(typeKey)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, ...style }}>
      <Icon style={{ fontSize: 14, color: BLUE }} />
      <span style={{ color: BLUE, fontSize: 13 }}>{label}</span>
    </span>
  )
}
