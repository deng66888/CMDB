/**
 * 数据迁移 Mock：迁移任务（环境间配置项/配置类数据迁移）
 */

export type MigrationStatus = 'draft' | 'running' | 'success' | 'failed'

export interface MigrationTaskRecord {
  id: string
  name: string
  sourceEnv: string
  targetEnv: string
  status: MigrationStatus
  creator: string
  createTime: string
  updateTime: string
  lastRunTime?: string
  lastRunResult?: string
}

const t = '2024-03-01 10:00:00'

export const migrationTaskListMock: MigrationTaskRecord[] = [
  { id: '1', name: '配置类结构迁移-测试到生产', sourceEnv: '测试环境', targetEnv: '生产环境', status: 'success', creator: '管理员', createTime: t, updateTime: t, lastRunTime: '2024-03-05 14:30:00', lastRunResult: '成功，迁移 12 个配置类' },
  { id: '2', name: '配置项数据同步-开发到测试', sourceEnv: '开发环境', targetEnv: '测试环境', status: 'draft', creator: '管理员', createTime: t, updateTime: t },
  { id: '3', name: '关系类型与参数迁移', sourceEnv: '生产环境', targetEnv: '灾备环境', status: 'draft', creator: '管理员', createTime: t, updateTime: t },
]

export const MIGRATION_ENV_OPTIONS = ['开发环境', '测试环境', '预发环境', '生产环境', '灾备环境']
