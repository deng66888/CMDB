/**
 * 关系类型管理 Mock：配置项 / 配置项/用户 / 配置项/组 三类下的关系类型
 */

export type RelationTypeCategory = 'ci' | 'ci_user' | 'ci_group'

export interface RelationTypeRecord {
  id: string
  name: string
  parentDesc: string
  childDesc: string
  creator: string
  createTime: string
  updateTime: string
  category: RelationTypeCategory
}

const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
const lastWeek = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')

/** 配置项 - 关系类型 Mock（名称、父级描述、子级描述等） */
export const relationTypeListMock: RelationTypeRecord[] = [
  { id: '1', name: '包含', parentDesc: '父级包含', childDesc: '子级被包含', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '2', name: '托管在', parentDesc: '父级托管在', childDesc: '子级被托管', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '3', name: '虚拟化的', parentDesc: '父级虚拟化', childDesc: '子级被虚拟化', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '4', name: '属于', parentDesc: '父级属于', childDesc: '子级所属', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '5', name: '依赖于', parentDesc: '父级依赖于', childDesc: '子级被依赖', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '6', name: '运行在', parentDesc: '父级运行在', childDesc: '子级运行环境', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '7', name: '成员', parentDesc: '父级成员', childDesc: '子级成员', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '8', name: '接收的数据', parentDesc: '父级接收', childDesc: '子级数据', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci' },
  { id: '9', name: '负责人', parentDesc: '父级负责人', childDesc: '子级负责人', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci_user' },
  { id: '10', name: '支持团队', parentDesc: '父级支持团队', childDesc: '子级支持团队', creator: '管理员', createTime: lastWeek, updateTime: now, category: 'ci_group' },
]

export function getRelationTypeListByCategory(category: RelationTypeCategory): RelationTypeRecord[] {
  return relationTypeListMock.filter((r) => r.category === category)
}
