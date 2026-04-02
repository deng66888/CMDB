/**
 * 参数配置 Mock：名称、创建人、创建时间、更新时间、描述
 */

export interface ParamRecord {
  id: string
  name: string
  creator: string
  createTime: string
  updateTime: string
  description: string
}

const time = '2021-09-02 14:28:28'

export const paramsConfigListMock: ParamRecord[] = [
  { id: '1', name: '国家', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '2', name: '状态', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '3', name: '环境', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '4', name: '类型', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '5', name: '审核状态', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '6', name: '操作系统类型', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '7', name: '发布方式', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '8', name: '身份级别', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '9', name: '资产级别', creator: '管理员', createTime: time, updateTime: time, description: '' },
  { id: '10', name: '测试环境', creator: 'test', createTime: time, updateTime: time, description: '' },
]
