import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from '@/layouts/MainLayout'
import { configManagementRoutes, defaultRoute } from '@/router/config'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          <Route path="/config" element={<MainLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            {configManagementRoutes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Route>
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
