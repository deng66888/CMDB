/**
 * 表单控件选项数据：部门、内部人员、用户组等，用于人员/部门/引用类控件
 * 实际项目可替换为接口请求
 */

export interface DeptOption {
  id: string
  name: string
}

export interface PersonOption {
  id: string
  name: string
  departmentId: string
  departmentName?: string
}

export interface UserGroupOption {
  id: string
  name: string
}

/** 部门列表（组织架构） */
export const DEPARTMENTS: DeptOption[] = [
  { id: 'dept_tech', name: '技术部' },
  { id: 'dept_ops', name: '运维部' },
  { id: 'dept_product', name: '产品部' },
  { id: 'dept_hr', name: '人力资源部' },
  { id: 'dept_finance', name: '财务部' },
  { id: 'dept_admin', name: '行政部' },
]

/** 内部人员（含所属部门），可按部门筛选 */
export const PERSONS: PersonOption[] = [
  { id: 'user_zhangsan', name: '张三', departmentId: 'dept_tech', departmentName: '技术部' },
  { id: 'user_lisi', name: '李四', departmentId: 'dept_tech', departmentName: '技术部' },
  { id: 'user_wangwu', name: '王五', departmentId: 'dept_ops', departmentName: '运维部' },
  { id: 'user_zhaoliu', name: '赵六', departmentId: 'dept_ops', departmentName: '运维部' },
  { id: 'user_sunqi', name: '孙七', departmentId: 'dept_product', departmentName: '产品部' },
  { id: 'user_zhouba', name: '周八', departmentId: 'dept_product', departmentName: '产品部' },
  { id: 'user_wujiu', name: '吴九', departmentId: 'dept_hr', departmentName: '人力资源部' },
  { id: 'user_zhengshi', name: '郑十', departmentId: 'dept_finance', departmentName: '财务部' },
]

/** 用户组（支持团队、角色等） */
export const USER_GROUPS: UserGroupOption[] = [
  { id: 'grp_infra', name: '基础设施组' },
  { id: 'grp_app', name: '应用开发组' },
  { id: 'grp_sec', name: '安全运维组' },
  { id: 'grp_support', name: '一线支持组' },
]

export function getPersonOptions(filter?: { departmentId?: string; groupId?: string }): { value: string; label: string }[] {
  let list = PERSONS
  if (filter?.departmentId) {
    list = list.filter((p) => p.departmentId === filter.departmentId)
  }
  return list.map((p) => ({
    value: p.id,
    label: p.departmentName ? `${p.name}（${p.departmentName}）` : p.name,
  }))
}

export function getDepartmentOptions(): { value: string; label: string }[] {
  return DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))
}

export function getUserGroupOptions(): { value: string; label: string }[] {
  return USER_GROUPS.map((g) => ({ value: g.id, label: g.name }))
}

/** 所属公司（实际可接 core_company 表） */
export const COMPANIES = [
  { id: 'co_1', name: '总公司' },
  { id: 'co_2', name: '华南分公司' },
  { id: 'co_3', name: '华北分公司' },
]

export function getCompanyOptions(): { value: string; label: string }[] {
  return COMPANIES.map((c) => ({ value: c.id, label: c.name }))
}

/** 物理位置（实际可接 cmn_location 表） */
export const LOCATIONS = [
  { id: 'loc_1', name: '北京总部' },
  { id: 'loc_2', name: '上海机房' },
  { id: 'loc_3', name: '广州办公室' },
]

export function getLocationOptions(): { value: string; label: string }[] {
  return LOCATIONS.map((l) => ({ value: l.id, label: l.name }))
}
