import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Breadcrumb, Button, Dropdown, Space, Tooltip } from 'antd'
import {
  MenuFoldOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  FileTextOutlined,
  EditOutlined,
  AuditOutlined,
  SafetyOutlined,
  CloudServerOutlined,
  ToolOutlined,
  DashboardOutlined,
  ApartmentOutlined,
  LinkOutlined,
  ControlOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { configManagementRoutes, getBreadcrumb } from '@/router/config'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import styles from './MainLayout.module.css'
import { Outlet } from 'react-router-dom'

const { Header, Sider, Content, Footer } = Layout

const topNavItems = [
  { key: 'self-service', label: '自助服务' },
  { key: 'itsm', label: 'ITSM' },
  { key: 'service-intel', label: '服务智能' },
  { key: 'monitor', label: '基础监控' },
  { key: 'alert', label: '告警平台' },
  { key: 'auto-ops', label: '自动化运维' },
  { key: 'config', label: '配置管理' },
  { key: 'visual', label: '可视化大屏' },
  { key: 'report', label: '报表管理' },
  { key: 'data-report', label: '数据上报' },
  { key: 'backend', label: '后台管理' },
]

const mainSidebarPaths = [
  'overview', 'ci', 'draft', 'approval',
  'audit', 'maintenance', 'compliance',
]
const discoverySubPaths = ['discovery-tasks', 'discovery-agent', 'discovery-history', 'discovery-rules', 'discovery-sources']
const backendSubPaths = ['backend-config-class', 'backend-relation-model', 'backend-relation-type', 'backend-params', 'backend-migration']

const sidebarIconMap: Record<string, React.ReactNode> = {
  overview: <DashboardOutlined />,
  ci: <FileTextOutlined />,
  draft: <EditOutlined />,
  approval: <AuditOutlined />,
  audit: <SafetyOutlined />,
  maintenance: <BellOutlined />,
  compliance: <SafetyOutlined />,
  discovery: <CloudServerOutlined />,
  backend: <ToolOutlined />,
  'backend-config-class': <FileTextOutlined />,
  'backend-relation-model': <ApartmentOutlined />,
  'backend-relation-type': <LinkOutlined />,
  'backend-params': <ControlOutlined />,
  'backend-migration': <SwapOutlined />,
}

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openKeysState, setOpenKeysState] = useState<string[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  const currentTopKey = 'config'
  const pathParts = location.pathname.split('/').filter(Boolean)
  let currentSideKey = pathParts[pathParts.length - 1] || 'overview'
  if (currentSideKey === 'new' && pathParts[pathParts.length - 2] === 'backend-config-class') currentSideKey = 'backend-config-class'
  if (currentSideKey === 'ci-relation-graph') currentSideKey = 'ci'
  if (currentSideKey === 'compliance-detail') currentSideKey = 'compliance'
  if (currentSideKey === 'discovery-task-detail') currentSideKey = 'discovery-tasks'
  if (discoverySubPaths.includes(currentSideKey)) { /* keep currentSideKey */ } else if (pathParts.includes('discovery')) currentSideKey = 'discovery-tasks'

  const breadcrumbTitles = getBreadcrumb(location.pathname)
  const breadcrumbItems = breadcrumbTitles.map((title) => ({ title }))

  // 受控展开：当前在发现/后台子页时保持对应父菜单展开；用户点击父菜单时通过 onOpenChange 更新
  const openKeys = useMemo(() => {
    const fromPath =
      discoverySubPaths.includes(currentSideKey) ? ['discovery'] :
      backendSubPaths.includes(currentSideKey) ? ['backend'] : []
    if (fromPath.length) return fromPath
    return openKeysState
  }, [currentSideKey, openKeysState])

  const sidebarItems: MenuProps['items'] = useMemo(() => {
    const mainItems: MenuProps['items'] = mainSidebarPaths.map((path) => {
      const route = configManagementRoutes.find((r) => r.path === path)
      return {
        key: path,
        icon: sidebarIconMap[path] ?? <FileTextOutlined />,
        label: route?.title ?? path,
      }
    })
    const discoveryChildren: MenuProps['items'] = discoverySubPaths.map((path) => {
      const route = configManagementRoutes.find((r) => r.path === path)
      return { key: path, icon: <CloudServerOutlined />, label: route?.title ?? path }
    })
    const backendChildren: MenuProps['items'] = backendSubPaths.map((path) => {
      const route = configManagementRoutes.find((r) => r.path === path)
      return { key: path, icon: sidebarIconMap[path], label: route?.title ?? path }
    })
    return [
      ...mainItems,
      {
        key: 'discovery',
        icon: <CloudServerOutlined />,
        label: '资产发现',
        children: discoveryChildren,
      },
      {
        key: 'backend',
        icon: <ToolOutlined />,
        label: '后台管理',
        children: backendChildren,
      },
    ]
  }, [])

  const handleOpenChange = (keys: string[]) => {
    setOpenKeysState(keys)
    if (keys.includes('discovery') && !discoverySubPaths.includes(currentSideKey)) {
      navigate('/config/discovery-tasks')
    }
    if (keys.includes('backend') && !backendSubPaths.includes(currentSideKey)) {
      navigate('/config/backend-config-class')
    }
  }

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心' },
    { key: 'password', label: '修改密码' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', danger: true },
  ]

  const handleSidebarSelect = ({ key }: { key: string }) => {
    if (key === 'backend') {
      navigate('/config/backend-config-class')
      return
    }
    if (key === 'discovery') {
      navigate('/config/discovery-tasks')
      return
    }
    navigate(`/config/${key}`)
  }

  return (
    <Layout className={styles.root}>
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button type="text" icon={<MenuFoldOutlined />} className={styles.trigger} />
          <span className={styles.logo}>智能运维管理</span>
          <Menu
            mode="horizontal"
            selectedKeys={[currentTopKey]}
            items={topNavItems}
            className={styles.topMenu}
            onClick={({ key }) => {
              if (key === 'config') navigate('/config/overview')
              if (key === 'backend') navigate('/config/backend-config-class')
            }}
          />
        </div>
        <div className={styles.headerRight}>
          <Tooltip title="通知">
            <Button type="text" icon={<BellOutlined />} className={styles.iconBtn} />
          </Tooltip>
          <Tooltip title="帮助">
            <Button type="text" icon={<QuestionCircleOutlined />} className={styles.iconBtn} />
          </Tooltip>
          <Tooltip title="设置">
            <Button type="text" icon={<SettingOutlined />} className={styles.iconBtn} />
          </Tooltip>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />} className={styles.userBtn}>
              超级管理员
            </Button>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider
          width={sidebarCollapsed ? 48 : 200}
          collapsedWidth={48}
          collapsed={sidebarCollapsed}
          theme="light"
          className={styles.sider}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentSideKey]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={sidebarItems}
            onClick={handleSidebarSelect}
            style={{ height: 'calc(100% - 48px)', borderRight: 0 }}
            inlineCollapsed={sidebarCollapsed}
          />
          <div className={styles.siderFooter}>
            <Button
              type="text"
              size="small"
              icon={sidebarCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </Sider>

        <Layout>
          <Content className={styles.content}>
            <div className={styles.breadcrumbBar}>
              <Breadcrumb items={breadcrumbItems} />
              <Space>
                <Tooltip title="后退">
                  <Button type="text" size="small" icon={<LeftOutlined />} onClick={() => window.history.back()} />
                </Tooltip>
                <Tooltip title="前进">
                  <Button type="text" size="small" icon={<RightOutlined />} onClick={() => window.history.forward()} />
                </Tooltip>
                <Tooltip title="刷新">
                  <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
                </Tooltip>
              </Space>
            </div>
            <div className={styles.contentBody}>
              <PageErrorBoundary>
                <Outlet />
              </PageErrorBoundary>
            </div>
          </Content>
          <Footer className={styles.footer}>
            智能运维管理平台 · CMDB 配置管理 © {new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  )
}
