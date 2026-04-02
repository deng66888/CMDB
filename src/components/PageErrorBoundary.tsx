import { Component, type ReactNode } from 'react'
import { Button } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** 捕获子页面报错，避免整站白屏或反复刷新 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PageErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 48, textAlign: 'center', background: '#fff', minHeight: 300, borderRadius: 8 }}>
          <p style={{ color: '#ff4d4f', marginBottom: 16 }}>页面加载出错</p>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 24, wordBreak: 'break-all' }}>
            {this.state.error.message}
          </p>
          <Button
            type="primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => window.location.replace('/config/overview')}
          >
            返回工作台
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
