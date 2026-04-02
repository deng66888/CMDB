/**
 * 资产发现模块 - 数据模型与 Mock
 * 支持多云、混合环境自动化发现，与审批管理无缝衔接
 */

// ========== 发现任务 ==========
export type DiscoveryTaskType = 'network' | 'cloud' | 'agent' | 'script' | 'api'
export type DiscoveryTaskStatus = 'enabled' | 'disabled' | 'paused'
export type DiscoveryRunStatus = 'success' | 'partial_failed' | 'failed' | 'running'

export interface DiscoveryTask {
  id: string
  name: string
  type: DiscoveryTaskType
  targetConfig: Record<string, unknown>
  schedule: string | null
  credentialId: string | null
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  lastRunTime: string | null
  lastRunStatus: DiscoveryRunStatus | null
  tags: string[]
}

export const discoveryTaskTypeLabels: Record<DiscoveryTaskType, string> = {
  network: '网络扫描',
  cloud: '云账号同步',
  agent: 'Agent 采集',
  script: '脚本导入',
  api: 'API 拉取',
}

export const discoveryTaskListMock: DiscoveryTask[] = [
  {
    id: 't1',
    name: '核心机房 IP 段扫描',
    type: 'network',
    targetConfig: { ipRange: '10.0.0.0/24', ports: [22, 80, 443] },
    schedule: '0 2 * * *',
    credentialId: 'cred1',
    enabled: true,
    createdBy: '管理员',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-03-01 09:00:00',
    lastRunTime: '2024-03-12 02:00:15',
    lastRunStatus: 'success',
    tags: ['机房', '生产'],
  },
  {
    id: 't2',
    name: '阿里云华东 Region 同步',
    type: 'cloud',
    targetConfig: { cloudAccountId: 'ca1', regions: ['cn-hangzhou', 'cn-shanghai'] },
    schedule: '0 */6 * * *',
    credentialId: null,
    enabled: true,
    createdBy: '管理员',
    createdAt: '2024-02-01 14:00:00',
    updatedAt: '2024-03-10 11:00:00',
    lastRunTime: '2024-03-12 06:00:02',
    lastRunStatus: 'success',
    tags: ['阿里云'],
  },
  {
    id: 't3',
    name: 'Agent 主机采集',
    type: 'agent',
    targetConfig: { agentGroup: 'default' },
    schedule: '*/15 * * * *',
    credentialId: null,
    enabled: true,
    createdBy: 'test',
    createdAt: '2024-02-20 09:00:00',
    updatedAt: '2024-03-11 16:00:00',
    lastRunTime: '2024-03-12 10:15:00',
    lastRunStatus: 'partial_failed',
    tags: [],
  },
  {
    id: 't4',
    name: 'IDC 设备清单导入',
    type: 'script',
    targetConfig: { scriptId: 'scr1', path: '/data/idc.csv' },
    schedule: null,
    credentialId: null,
    enabled: false,
    createdBy: '管理员',
    createdAt: '2024-03-05 11:00:00',
    updatedAt: '2024-03-05 11:00:00',
    lastRunTime: null,
    lastRunStatus: null,
    tags: ['IDC'],
  },
]

// ========== 发现执行记录 ==========
export interface DiscoveryExecution {
  id: string
  taskId: string
  taskName: string
  startTime: string
  endTime: string | null
  status: DiscoveryRunStatus
  totalFound: number
  newCandidates: number
  duplicates: number
  errorLog: string | null
  resultSummary: Record<string, number>
}

export const discoveryExecutionListMock: DiscoveryExecution[] = [
  {
    id: 'e1',
    taskId: 't1',
    taskName: '核心机房 IP 段扫描',
    startTime: '2024-03-12 02:00:00',
    endTime: '2024-03-12 02:00:15',
    status: 'success',
    totalFound: 48,
    newCandidates: 2,
    duplicates: 46,
    errorLog: null,
    resultSummary: { server: 45, network_device: 3 },
  },
  {
    id: 'e2',
    taskId: 't3',
    taskName: 'Agent 主机采集',
    startTime: '2024-03-12 10:15:00',
    endTime: '2024-03-12 10:16:22',
    status: 'partial_failed',
    totalFound: 120,
    newCandidates: 5,
    duplicates: 112,
    errorLog: '3 台主机心跳超时',
    resultSummary: { server: 118, database: 2 },
  },
  {
    id: 'e3',
    taskId: 't2',
    taskName: '阿里云华东 Region 同步',
    startTime: '2024-03-12 06:00:00',
    endTime: '2024-03-12 06:00:02',
    status: 'success',
    totalFound: 256,
    newCandidates: 0,
    duplicates: 256,
    errorLog: null,
    resultSummary: { ecs: 200, rds: 30, slb: 26 },
  },
]

// ========== 发现原始数据（单次执行下的分组） ==========
export type DiscoveryRawStatus = 'pending' | 'duplicate' | 'merged' | 'ignored'

export interface DiscoveryRawData {
  id: string
  executionId: string
  sourceType: 'task' | 'agent'
  sourceId: string
  ciType: string
  rawData: Record<string, unknown>
  hash: string
  status: DiscoveryRawStatus
  createdAt: string
}

export const discoveryRawDataByExecutionMock: Record<string, DiscoveryRawData[]> = {
  e1: [
    { id: 'r1', executionId: 'e1', sourceType: 'task', sourceId: 't1', ciType: 'server', rawData: { ip: '10.0.0.1', hostname: 'web-01', cpu: 8, memory: 16384 }, hash: 'h1', status: 'merged', createdAt: '2024-03-12 02:00:10' },
    { id: 'r2', executionId: 'e1', sourceType: 'task', sourceId: 't1', ciType: 'server', rawData: { ip: '10.0.0.2', hostname: 'web-02', cpu: 8, memory: 16384 }, hash: 'h2', status: 'pending', createdAt: '2024-03-12 02:00:11' },
  ],
}

// ========== Agent 实例 ==========
export type AgentStatus = 'online' | 'offline' | 'installing' | 'upgrading' | 'abnormal'

export interface AgentInstance {
  id: string
  agentId: string
  hostname: string
  ip: string
  osType: string
  osVersion: string
  agentVersion: string
  status: AgentStatus
  lastHeartbeat: string
  labels: string[]
  tags: string[]
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export const agentStatusLabels: Record<AgentStatus, string> = {
  online: '在线',
  offline: '离线',
  installing: '待安装',
  upgrading: '升级中',
  abnormal: '异常',
}

export const agentListMock: AgentInstance[] = [
  { id: 'a1', agentId: 'agt-001', hostname: 'prod-web-01', ip: '10.0.1.11', osType: 'Linux', osVersion: 'CentOS 7.9', agentVersion: '2.1.0', status: 'online', lastHeartbeat: '2024-03-12 10:20:00', labels: ['prod', 'web'], tags: [], config: {}, createdAt: '2024-01-10 09:00:00', updatedAt: '2024-03-12 10:20:00' },
  { id: 'a2', agentId: 'agt-002', hostname: 'prod-db-01', ip: '10.0.1.12', osType: 'Linux', osVersion: 'CentOS 7.9', agentVersion: '2.1.0', status: 'online', lastHeartbeat: '2024-03-12 10:19:58', labels: ['prod', 'db'], tags: [], config: {}, createdAt: '2024-01-10 09:00:00', updatedAt: '2024-03-12 10:19:58' },
  { id: 'a3', agentId: 'agt-003', hostname: 'test-node-01', ip: '10.0.2.21', osType: 'Linux', osVersion: 'Ubuntu 20.04', agentVersion: '2.0.5', status: 'offline', lastHeartbeat: '2024-03-11 18:00:00', labels: ['test'], tags: [], config: {}, createdAt: '2024-02-01 14:00:00', updatedAt: '2024-03-11 18:00:00' },
  { id: 'a4', agentId: 'agt-004', hostname: 'prod-app-02', ip: '10.0.1.13', osType: 'Linux', osVersion: 'CentOS 7.9', agentVersion: '2.1.0', status: 'abnormal', lastHeartbeat: '2024-03-12 10:15:00', labels: ['prod'], tags: [], config: {}, createdAt: '2024-01-15 10:00:00', updatedAt: '2024-03-12 10:15:00' },
]

export const agentOverviewMock = { online: 2, offline: 1, installing: 0, abnormal: 1 }

// ========== Agent 事件日志 ==========
export interface AgentEvent {
  id: string
  agentId: string
  hostname: string
  eventType: 'register' | 'online' | 'offline' | 'abnormal' | 'upgrade'
  message: string
  createdAt: string
}

export const agentEventListMock: AgentEvent[] = [
  { id: 'ev1', agentId: 'agt-004', hostname: 'prod-app-02', eventType: 'abnormal', message: '心跳间隔异常，超过 5 分钟未上报', createdAt: '2024-03-12 10:16:00' },
  { id: 'ev2', agentId: 'agt-003', hostname: 'test-node-01', eventType: 'offline', message: '超过 30 分钟未心跳，标记为离线', createdAt: '2024-03-11 18:30:00' },
  { id: 'ev3', agentId: 'agt-001', hostname: 'prod-web-01', eventType: 'upgrade', message: 'Agent 升级至 2.1.0 成功', createdAt: '2024-03-10 02:00:00' },
]

// ========== 云账号 ==========
export type CloudProvider = 'aws' | 'azure' | 'aliyun' | 'tencent'

export interface CloudAccount {
  id: string
  name: string
  provider: CloudProvider
  regions: string[]
  status: 'ok' | 'error' | 'syncing'
  lastSyncTime: string | null
  createdAt: string
}

export const cloudProviderLabels: Record<CloudProvider, string> = {
  aws: 'AWS',
  azure: 'Azure',
  aliyun: '阿里云',
  tencent: '腾讯云',
}

export const cloudAccountListMock: CloudAccount[] = [
  { id: 'ca1', name: '生产阿里云主账号', provider: 'aliyun', regions: ['cn-hangzhou', 'cn-shanghai'], status: 'ok', lastSyncTime: '2024-03-12 06:00:00', createdAt: '2024-01-01 10:00:00' },
  { id: 'ca2', name: 'AWS 海外区', provider: 'aws', regions: ['us-east-1'], status: 'ok', lastSyncTime: '2024-03-12 00:00:00', createdAt: '2024-02-10 14:00:00' },
]

// ========== 凭证 ==========
export type CredentialType = 'ssh' | 'snmp' | 'winrm' | 'api'

export interface Credential {
  id: string
  name: string
  type: CredentialType
  username: string | null
  notes: string | null
  createdAt: string
}

export const credentialTypeLabels: Record<CredentialType, string> = {
  ssh: 'SSH',
  snmp: 'SNMP',
  winrm: 'WinRM',
  api: 'API',
}

export const credentialListMock: Credential[] = [
  { id: 'cred1', name: '机房 SSH 默认', type: 'ssh', username: 'root', notes: '核心机房跳板机', createdAt: '2024-01-01 09:00:00' },
  { id: 'cred2', name: '网络设备 SNMP', type: 'snmp', username: null, notes: 'community 只读', createdAt: '2024-01-05 11:00:00' },
]

// ========== 预处理规则 ==========
export type PreprocessRuleType = 'dedup' | 'enrich' | 'auto_approve'

export interface PreprocessRule {
  id: string
  name: string
  ruleType: PreprocessRuleType
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  priority: number
  enabled: boolean
  createdAt: string
}

export const preprocessRuleTypeLabels: Record<PreprocessRuleType, string> = {
  dedup: '去重规则',
  enrich: '自动补全',
  auto_approve: '自动入库',
}

export const preprocessRuleListMock: PreprocessRule[] = [
  { id: 'pr1', name: '服务器 IP+主机名去重', ruleType: 'dedup', conditions: { keys: ['ip', 'hostname'] }, actions: { weight: 1 }, priority: 100, enabled: true, createdAt: '2024-01-01 10:00:00' },
  { id: 'pr2', name: '网络设备 IP+型号去重', ruleType: 'dedup', conditions: { keys: ['ip', 'model'] }, actions: {}, priority: 90, enabled: true, createdAt: '2024-01-02 10:00:00' },
  { id: 'pr3', name: 'IP 归属机房补全', ruleType: 'enrich', conditions: { field: 'ip' }, actions: { source: 'ipam', targetField: 'idc' }, priority: 80, enabled: true, createdAt: '2024-01-10 14:00:00' },
  { id: 'pr4', name: '信任 Agent 直接入库', ruleType: 'auto_approve', conditions: { sourceType: 'agent', labelMatch: 'trusted' }, actions: {}, priority: 50, enabled: true, createdAt: '2024-02-01 09:00:00' },
]

// ========== 脚本仓库 ==========
export interface DiscoveryScript {
  id: string
  name: string
  language: 'python' | 'shell' | 'powershell'
  description: string | null
  createdAt: string
}

export const discoveryScriptListMock: DiscoveryScript[] = [
  { id: 'scr1', name: 'IDC 设备清单解析', language: 'python', description: '解析 CSV 导入服务器与网络设备', createdAt: '2024-03-01 10:00:00' },
  { id: 'scr2', name: 'Windows 主机信息采集', language: 'powershell', description: null, createdAt: '2024-03-05 14:00:00' },
]

// ========== 执行异常记录 ==========
export interface DiscoveryException {
  id: string
  executionId: string
  taskName: string
  target: string
  errorType: 'timeout' | 'auth_failed' | 'parse_failed' | 'network'
  message: string
  createdAt: string
}

export const discoveryExceptionListMock: DiscoveryException[] = [
  { id: 'ex1', executionId: 'e2', taskName: 'Agent 主机采集', target: '10.0.2.21', errorType: 'timeout', message: '心跳超时', createdAt: '2024-03-12 10:16:00' },
  { id: 'ex2', executionId: 'e2', taskName: 'Agent 主机采集', target: '10.0.2.22', errorType: 'timeout', message: '心跳超时', createdAt: '2024-03-12 10:16:00' },
]
