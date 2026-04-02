import { useState } from 'react'
import { Input, Button, Switch } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ListView } from './viewTypes'
import styles from './index.module.css'

interface ViewPanelProps {
  visible: boolean
  onClose: () => void
  views: ListView[]
  currentViewId: string
  onSelectView: (id: string) => void
  onCreateView: () => void
  onEditView: (v: ListView) => void
  onDeleteView: (id: string) => void
}

export default function ViewPanel({
  visible,
  onClose,
  views,
  currentViewId,
  onSelectView,
  onCreateView,
  onEditView,
  onDeleteView,
}: ViewPanelProps) {
  const [viewSearch, setViewSearch] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)

  const filteredViews = views.filter((v) => {
    const matchName = !viewSearch || v.name.toLowerCase().includes(viewSearch.toLowerCase())
    const matchMine = !onlyMine || v.isMine
    return matchName && matchMine
  })

  if (!visible) return null

  return (
    <>
      <div className={styles.viewPanelMask} onClick={onClose} aria-hidden />
      <div className={styles.viewPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.viewPanelHead}>
          <span className={styles.viewPanelTitle}>视图</span>
          <button type="button" className={styles.viewPanelClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.viewPanelBody}>
          <div className={styles.viewPanelSearchRow}>
            <Input
              placeholder="根据名称搜索"
              prefix={<SearchOutlined className={styles.panelSearchIcon} />}
              value={viewSearch}
              onChange={(e) => setViewSearch(e.target.value)}
              allowClear
              size="small"
              className={styles.viewPanelSearch}
            />
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={onCreateView} title="新建视图" />
          </div>
          <div className={styles.viewPanelList}>
            {filteredViews.map((v) => (
              <div
                key={v.id}
                className={currentViewId === v.id ? styles.viewPanelItemActive : styles.viewPanelItem}
                onClick={() => onSelectView(v.id)}
              >
                <span className={styles.viewPanelItemName}>{v.name || '未命名视图'}</span>
                <span className={styles.viewPanelItemActions}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => { e.stopPropagation(); onEditView(v) }}
                    title="编辑"
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => { e.stopPropagation(); onDeleteView(v.id) }}
                    title="删除"
                    disabled={v.isSystem}
                  />
                </span>
              </div>
            ))}
          </div>
          <div className={styles.viewPanelFooter}>
            <span className={styles.viewPanelOnlyMine}>仅看我的</span>
            <Switch size="small" checked={onlyMine} onChange={setOnlyMine} />
          </div>
        </div>
      </div>
    </>
  )
}
