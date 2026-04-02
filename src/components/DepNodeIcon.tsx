import {
  CloudServerOutlined,
  DatabaseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  CloudOutlined,
  DesktopOutlined,
  HddOutlined,
  ClusterOutlined,
  GatewayOutlined,
  RocketOutlined,
  WifiOutlined,
  PartitionOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons'

/** 配置类节点图标：按名称匹配，供关系图等使用，避免依赖整页 ConfigClassNew */
export function DepNodeIcon({ name, className }: { name: string; className?: string }) {
  const n = (name || '').trim()
  if (n.includes('服务器') || n.includes('ESX')) return <CloudServerOutlined className={className} />
  if (n.includes('集群') || n.includes('K8s')) return <ClusterOutlined className={className} />
  if (n.includes('存储') || n.includes('内存') || n.includes('磁盘') || n.includes('对象存储') || n.includes('NAS')) return <HddOutlined className={className} />
  if (n.includes('应用')) return <AppstoreOutlined className={className} />
  if (n.includes('数据库') || n.includes('Redis')) return <DatabaseOutlined className={className} />
  if (n.includes('网关')) return <GatewayOutlined className={className} />
  if (n.includes('负载均衡')) return <NodeIndexOutlined className={className} />
  if (n.includes('交换机') || n.includes('路由器')) return <WifiOutlined className={className} />
  if (n.includes('容器') && !n.includes('容器节点')) return <PartitionOutlined className={className} />
  if (n.includes('消息队列') || n.includes('中间件') || n.includes('API服务')) return <ApiOutlined className={className} />
  if (n.includes('虚拟机')) return <CloudOutlined className={className} />
  if (n.includes('物理机') || n.includes('物理服务器') || n === '服务' || n.includes('计算机')) return <DesktopOutlined className={className} />
  if (n === 'Service' || n.includes('Deployment') || n.includes('Pod')) return <RocketOutlined className={className} />
  if (n.includes('数据源')) return <DatabaseOutlined className={className} />
  if (n.includes('虚拟服务器')) return <CloudOutlined className={className} />
  if (n.includes('容器节点')) return <NodeIndexOutlined className={className} />
  return <CloudOutlined className={className} />
}
