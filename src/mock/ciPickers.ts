/**
 * 新建配置项 / 引用类字段 — 弹窗列表 Mock
 */

export type AssetPickerRow = {
  id: string
  code: string
  name: string
  location: string
  status: string
}

export const assetPickerMock: AssetPickerRow[] = [
  { id: 'a1', code: 'ASSET-2024-001', name: '核心交换机 SW-CORE-01', location: 'DC1·B栋3F·A列·机柜05', status: '在库' },
  { id: 'a2', code: 'ASSET-2024-018', name: '刀片机箱 C7000-02', location: 'DC1·B栋3F·B列·机柜02', status: '在库' },
  { id: 'a3', code: 'ASSET-2023-156', name: '存储控制器 CT-PRD-A', location: 'DC2·主机房·冷通道-08', status: '已上架' },
  { id: 'a4', code: 'ASSET-2024-042', name: '机架服务器 R740-备机', location: 'DC1·备件库·货架B-3', status: '备件' },
  { id: 'a5', code: 'ASSET-2024-055', name: '防火墙 FW-DMZ-01', location: 'DC1·B栋2F·边界区', status: '在库' },
  { id: 'a6', code: 'ASSET-2024-067', name: 'KVM 切换器 KVM-08', location: 'DC1·运维库房', status: '在库' },
  { id: 'a7', code: 'ASSET-2023-089', name: '磁带库 TL-4000', location: 'DC2·备份中心', status: '已上架' },
  { id: 'a8', code: 'ASSET-2024-102', name: 'PDU 电源分配单元 P-32A', location: 'DC1·B栋3F·A列·机柜05', status: '已上架' },
]

export type ModelIdPickerRow = {
  id: string
  sku: string
  name: string
  productLine: string
}

export const modelIdPickerMock: ModelIdPickerRow[] = [
  { id: 'm1', sku: 'SKU-DELL-R740', name: 'PowerEdge R740', productLine: '通用机架服务器' },
  { id: 'm2', sku: 'SKU-HPE-DL380-G10', name: 'ProLiant DL380 Gen10', productLine: '通用机架服务器' },
  { id: 'm3', sku: 'SKU-LENOVO-SR650-V2', name: 'ThinkSystem SR650 V2', productLine: '通用机架服务器' },
  { id: 'm4', sku: 'SKU-CISCO-C9300-48', name: 'Catalyst 9300-48T', productLine: '核心/汇聚交换' },
  { id: 'm5', sku: 'SKU-H3C-S12500X', name: 'S12500X-AF', productLine: '核心交换' },
  { id: 'm6', sku: 'SKU-NETAPP-FAS2750', name: 'FAS2750 统一存储', productLine: 'SAN/NAS' },
  { id: 'm7', sku: 'SKU-DELL-ME4024', name: 'ME4 Series 4024', productLine: 'SAN' },
  { id: 'm8', sku: 'SKU-HUAWEI-2288H-V5', name: 'FusionServer 2288H V5', productLine: '通用机架服务器' },
]

export type ManufacturerPickerRow = {
  id: string
  code: string
  name: string
  region: string
}

export const manufacturerPickerMock: ManufacturerPickerRow[] = [
  { id: 'mf1', code: 'MFR-DELL', name: '戴尔（中国）有限公司', region: '美国/中国' },
  { id: 'mf2', code: 'MFR-HPE', name: '惠普企业（HPE）', region: '美国' },
  { id: 'mf3', code: 'MFR-LENOVO', name: '联想（北京）有限公司', region: '中国' },
  { id: 'mf4', code: 'MFR-CISCO', name: '思科系统（中国）', region: '美国' },
  { id: 'mf5', code: 'MFR-H3C', name: '新华三技术有限公司', region: '中国' },
  { id: 'mf6', code: 'MFR-HW', name: '华为技术有限公司', region: '中国' },
  { id: 'mf7', code: 'MFR-DELL-EMC', name: '戴尔易安信', region: '美国' },
  { id: 'mf8', code: 'MFR-INSPUR', name: '浪潮电子信息产业股份有限公司', region: '中国' },
]

export type CpuManufacturerPickerRow = {
  id: string
  code: string
  name: string
}

export const cpuManufacturerPickerMock: CpuManufacturerPickerRow[] = [
  { id: 'c1', code: 'CPU-INTEL', name: 'Intel' },
  { id: 'c2', code: 'CPU-AMD', name: 'AMD' },
  { id: 'c3', code: 'CPU-HW-KUNPENG', name: '华为鲲鹏' },
  { id: 'c4', code: 'CPU-HYGON', name: '海光' },
  { id: 'c5', code: 'CPU-PHYTIUM', name: '飞腾' },
  { id: 'c6', code: 'CPU-APPLE', name: 'Apple Silicon' },
]

export type CabinetPickerRow = {
  id: string
  code: string
  name: string
  room: string
  uTotal: number
}

export const cabinetPickerMock: CabinetPickerRow[] = [
  { id: 'k1', code: 'CAB-DC1-B3-A05', name: 'A列-05# 42U 机柜', room: 'DC1·B栋3F主机房', uTotal: 42 },
  { id: 'k2', code: 'CAB-DC1-B3-B02', name: 'B列-02# 42U 机柜', room: 'DC1·B栋3F主机房', uTotal: 42 },
  { id: 'k3', code: 'CAB-DC2-M1-C08', name: 'C列-08# 47U 机柜', room: 'DC2·主机房', uTotal: 47 },
  { id: 'k4', code: 'CAB-DC1-B2-E01', name: '边界区-E01# 27U', room: 'DC1·B栋2F网络间', uTotal: 27 },
  { id: 'k5', code: 'CAB-DC1-B4-D03', name: 'D列-03# 48U', room: 'DC1·B栋4F扩展机房', uTotal: 48 },
  { id: 'k6', code: 'CAB-DC2-BK-01', name: '备份区-01# 37U', room: 'DC2·备份中心', uTotal: 37 },
]

/** 写入表单的展示文案（与业务系统可对齐） */
export function formatAssetPick(row: AssetPickerRow): string {
  return `${row.code} · ${row.name}`
}

export function formatModelIdPick(row: ModelIdPickerRow): string {
  return `${row.sku} · ${row.name}`
}

export function formatManufacturerPick(row: ManufacturerPickerRow): string {
  return `${row.name}（${row.code}）`
}

export function formatCpuManufacturerPick(row: CpuManufacturerPickerRow): string {
  return `${row.name}（${row.code}）`
}

export function formatCabinetPick(row: CabinetPickerRow): string {
  return `${row.code} · ${row.name}`
}
