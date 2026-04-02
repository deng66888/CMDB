import { Result } from 'antd'

interface PlaceholderProps {
  title: string
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <div style={{ padding: 48 }}>
      <Result
        status="info"
        title={title}
        subTitle="该功能页面开发中，敬请期待。"
      />
    </div>
  )
}
