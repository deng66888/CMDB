import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'

const Placeholder = lazy(() => import('@/pages/Placeholder'))
const ConfigAudit = lazy(() => import('@/pages/ConfigAudit'))
const CIManagement = lazy(() => import('@/pages/CIManagement'))
const CIDetail = lazy(() => import('@/pages/CIDetail'))
const RelationGraph = lazy(() => import('@/pages/RelationGraph'))
const ConfigClassManagement = lazy(() => import('@/pages/ConfigClassManagement'))
const ConfigClassNew = lazy(() => import('@/pages/ConfigClassNew'))
const RelationType = lazy(() => import('@/pages/RelationType'))
import ParamsConfigPage from '@/pages/ParamsConfig'
const RelationModel = lazy(() => import('@/pages/RelationModel'))
const DataMigration = lazy(() => import('@/pages/DataMigration'))
const Overview = lazy(() => import('@/pages/Overview'))
const Maintenance = lazy(() => import('@/pages/Maintenance'))
const Compliance = lazy(() => import('@/pages/Compliance'))
const ComplianceDetail = lazy(() => import('@/pages/Compliance/Detail'))
const DraftManagement = lazy(() => import('@/pages/DraftManagement'))
const ApprovalManagement = lazy(() => import('@/pages/ApprovalManagement'))
const DiscoveryTasks = lazy(() => import('@/pages/Discovery/Tasks'))
const DiscoveryTaskDetail = lazy(() => import('@/pages/Discovery/TaskDetail'))
const DiscoveryAgent = lazy(() => import('@/pages/Discovery/Agent'))
const DiscoveryHistory = lazy(() => import('@/pages/Discovery/History'))
const DiscoveryRules = lazy(() => import('@/pages/Discovery/Rules'))
const DiscoverySources = lazy(() => import('@/pages/Discovery/Sources'))

function SuspenseWrap({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>}>
      {children}
    </Suspense>
  )
}

/** 路由与面包屑：path -> [面包屑项] */
export const routeBreadcrumb: Record<string, string[]> = {
  overview: ['工作台', '配置管理', '概览'],
  ci: ['工作台', '配置管理', '资源管理', '配置项管理'],
  'ci-detail': ['工作台', '配置管理', '配置项详情'],
  'ci-relation-graph': ['工作台', '配置管理', '资源管理', '关系图'],
  draft: ['工作台', '配置管理', '草稿管理'],
  approval: ['工作台', '配置管理', '审批管理'],
  audit: ['工作台', '配置管理', '配置审计'],
  maintenance: ['工作台', '配置管理', '维保提醒'],
  compliance: ['工作台', '配置管理', '合规性检测'],
  'compliance-detail': ['工作台', '配置管理', '合规性检测', '规则详情'],
  discovery: ['工作台', '配置管理', '资产发现'],
  'discovery-tasks': ['工作台', '配置管理', '资产发现', '发现任务管理'],
  'discovery-task-detail': ['工作台', '配置管理', '资产发现', '任务详情'],
  'discovery-agent': ['工作台', '配置管理', '资产发现', 'Agent 管理'],
  'discovery-history': ['工作台', '配置管理', '资产发现', '发现历史'],
  'discovery-rules': ['工作台', '配置管理', '资产发现', '数据预处理规则'],
  'discovery-sources': ['工作台', '配置管理', '资产发现', '发现源管理'],
  backend: ['工作台', '配置管理', '后台管理'],
  'backend-config-class': ['工作台', '配置管理', '配置类应用'],
  'backend-relation-model': ['工作台', '配置管理', '关系建模'],
  'backend-relation-type': ['工作台', '配置管理', '关系类型'],
  'backend-params': ['工作台', '配置管理', '参数配置'],
  'backend-migration': ['工作台', '配置管理', '数据迁移'],
  'new': ['工作台', '配置管理', '新建配置类'],
}

export const configManagementRoutes: { path: string; title: string; element: ReactNode }[] = [
  { path: 'overview', title: '概览', element: <SuspenseWrap><Overview /></SuspenseWrap> },
  { path: 'ci', title: '配置项管理', element: <SuspenseWrap><CIManagement /></SuspenseWrap> },
  { path: 'ci-detail', title: '配置项详情', element: <SuspenseWrap><CIDetail /></SuspenseWrap> },
  { path: 'ci-relation-graph', title: '关系图', element: <SuspenseWrap><RelationGraph /></SuspenseWrap> },
  { path: 'draft', title: '草稿管理', element: <SuspenseWrap><DraftManagement /></SuspenseWrap> },
  { path: 'approval', title: '审批管理', element: <SuspenseWrap><ApprovalManagement /></SuspenseWrap> },
  { path: 'discovery-approval', title: '发现审批', element: <Navigate to="approval?source=discovery" replace /> },
  { path: 'audit', title: '配置审计', element: <SuspenseWrap><ConfigAudit /></SuspenseWrap> },
  { path: 'maintenance', title: '维保提醒', element: <SuspenseWrap><Maintenance /></SuspenseWrap> },
  { path: 'compliance', title: '合规性检测', element: <SuspenseWrap><Compliance /></SuspenseWrap> },
  { path: 'compliance-detail', title: '规则详情', element: <SuspenseWrap><ComplianceDetail /></SuspenseWrap> },
  { path: 'discovery', title: '资产发现', element: <Navigate to="/config/discovery-tasks" replace /> },
  { path: 'discovery-tasks', title: '发现任务管理', element: <SuspenseWrap><DiscoveryTasks /></SuspenseWrap> },
  { path: 'discovery-task-detail', title: '任务详情', element: <SuspenseWrap><DiscoveryTaskDetail /></SuspenseWrap> },
  { path: 'discovery-agent', title: 'Agent 管理', element: <SuspenseWrap><DiscoveryAgent /></SuspenseWrap> },
  { path: 'discovery-history', title: '发现历史', element: <SuspenseWrap><DiscoveryHistory /></SuspenseWrap> },
  { path: 'discovery-rules', title: '数据预处理规则', element: <SuspenseWrap><DiscoveryRules /></SuspenseWrap> },
  { path: 'discovery-sources', title: '发现源管理', element: <SuspenseWrap><DiscoverySources /></SuspenseWrap> },
  { path: 'backend', title: '后台管理', element: <SuspenseWrap><Placeholder title="后台管理" /></SuspenseWrap> },
  { path: 'backend-config-class', title: '配置类管理', element: <SuspenseWrap><ConfigClassManagement /></SuspenseWrap> },
  { path: 'backend-relation-model', title: '关系建模', element: <SuspenseWrap><RelationModel /></SuspenseWrap> },
  { path: 'backend-relation-type', title: '关系类型', element: <SuspenseWrap><RelationType /></SuspenseWrap> },
  { path: 'backend-params', title: '参数配置', element: <ParamsConfigPage /> },
  { path: 'backend-migration', title: '数据迁移', element: <SuspenseWrap><DataMigration /></SuspenseWrap> },
  { path: 'backend-config-class/new', title: '新建配置类', element: <SuspenseWrap><ConfigClassNew /></SuspenseWrap> },
]

export const defaultRoute = '/config/overview'

export function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  if (last === 'new' && parts[parts.length - 2] === 'backend-config-class') return routeBreadcrumb['new']
  if (last === 'ci-relation-graph') return routeBreadcrumb['ci-relation-graph']
  if (last === 'compliance-detail') return routeBreadcrumb['compliance-detail']
  if (last === 'discovery-task-detail') return routeBreadcrumb['discovery-task-detail']
  return routeBreadcrumb[last] ?? routeBreadcrumb['overview']
}
