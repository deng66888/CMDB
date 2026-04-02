import { useState } from 'react'
import { Input, Dropdown } from 'antd'
import { SearchOutlined, StarFilled, StarOutlined, MoreOutlined, RightOutlined, DownOutlined } from '@ant-design/icons'
import { configClassTreeMock, type ConfigClassTreeNode, type AppItem } from '@/mock/ci'
import styles from './index.module.css'

/** 配置类树节点总数（与当前展示树一致；搜索时为过滤后的节点数） */
function countConfigClassTreeNodes(nodes: ConfigClassTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + (n.children?.length ? countConfigClassTreeNodes(n.children) : 0), 0)
}

interface ConfigClassPanelProps {
  categoryFilter: string | undefined
  setCategoryFilter: (v: string | undefined) => void
  applications: AppItem[]
  onToggleFavorite: (id: string) => void
}

/** 递归过滤树：按关键词匹配节点或其任意子节点 */
function filterTree(nodes: ConfigClassTreeNode[], keyword: string): ConfigClassTreeNode[] {
  if (!keyword.trim()) return nodes
  const q = keyword.toLowerCase()
  return nodes
    .map((node) => {
      const matchSelf = node.title.toLowerCase().includes(q)
      const filteredChildren = node.children ? filterTree(node.children, keyword) : undefined
      const matchChild = filteredChildren && filteredChildren.length > 0
      if (matchSelf) return node
      if (matchChild) return { ...node, children: filteredChildren }
      return null
    })
    .filter((n): n is ConfigClassTreeNode => n != null)
}

/** 单层树节点渲染 */
function TreeNodeList({
  nodes,
  level,
  expandedKeys,
  toggleExpand,
  categoryFilter,
  setCategoryFilter,
  applications,
  onToggleFavorite,
}: {
  nodes: ConfigClassTreeNode[]
  level: number
  expandedKeys: Set<string>
  toggleExpand: (key: string) => void
  categoryFilter: string | undefined
  setCategoryFilter: (v: string | undefined) => void
  applications: AppItem[]
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div className={styles.panelTreeNodeList} style={{ marginLeft: level > 0 ? 12 : 0 }}>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedKeys.has(node.key)
        const app = applications.find((a) => a.name === node.title)

        return (
          <div key={node.key} className={styles.panelTreeNode}>
            <div
              className={categoryFilter === node.key ? styles.panelClassItemActive : styles.panelClassItem}
              style={{ paddingLeft: 4 }}
              onClick={() => setCategoryFilter(categoryFilter === node.key ? undefined : node.key)}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={styles.panelTreeExpand}
                  onClick={(e) => { e.stopPropagation(); toggleExpand(node.key) }}
                >
                  {isExpanded ? <DownOutlined /> : <RightOutlined />}
                </button>
              ) : (
                <span className={styles.panelTreeExpandPlaceholder} />
              )}
              <span className={styles.panelTreeNodeTitle}>{node.title}</span>
              {app && (
                <span className={styles.panelAppActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.panelStarBtn}
                    onClick={() => onToggleFavorite(app.id)}
                    title={app.favorited ? '取消收藏' : '收藏'}
                  >
                    {app.favorited ? <StarFilled className={styles.starFilled} /> : <StarOutlined />}
                  </button>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'open', label: '打开' },
                        { key: 'remove', label: '取消收藏', disabled: !app.favorited, onClick: () => onToggleFavorite(app.id) },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <button type="button" className={styles.panelMoreBtn}><MoreOutlined /></button>
                  </Dropdown>
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <TreeNodeList
                nodes={node.children!}
                level={level + 1}
                expandedKeys={expandedKeys}
                toggleExpand={toggleExpand}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                applications={applications}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ConfigClassPanel({
  categoryFilter,
  setCategoryFilter,
  applications,
  onToggleFavorite,
}: ConfigClassPanelProps) {
  const [activeTab, setActiveTab] = useState<'class' | 'favorite'>('class')
  const [keyword, setKeyword] = useState('')
  const [rootExpand, setRootExpand] = useState(true)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['应用', '服务器', '中间件', '数据库', '存储设备', '安全设备', '虚拟化']))

  const filteredTree = filterTree(configClassTreeMock, keyword)
  const classNodeCount = countConfigClassTreeNodes(filteredTree)
  const favoriteApps = applications.filter((a) => a.favorited)

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className={styles.panelContent}>
      <Input
        placeholder="搜索配置类"
        prefix={<SearchOutlined className={styles.panelSearchIcon} />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        allowClear
        className={styles.panelSearch}
      />
      <div className={styles.panelTabs}>
        <button
          type="button"
          className={activeTab === 'class' ? styles.panelTabActive : styles.panelTab}
          onClick={() => setActiveTab('class')}
        >
          配置类
        </button>
        <button
          type="button"
          className={activeTab === 'favorite' ? styles.panelTabActive : styles.panelTab}
          onClick={() => setActiveTab('favorite')}
        >
          收藏
        </button>
      </div>

      {activeTab === 'class' && (
        <div className={styles.panelSection}>
          <button
            type="button"
            className={styles.panelSectionHead}
            onClick={() => setRootExpand((e) => !e)}
          >
            <span>配置类({classNodeCount})</span>
            {rootExpand ? <DownOutlined /> : <RightOutlined />}
          </button>
          {rootExpand && (
            <TreeNodeList
              nodes={filteredTree}
              level={0}
              expandedKeys={expandedKeys}
              toggleExpand={toggleExpand}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              applications={applications}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </div>
      )}

      {activeTab === 'favorite' && (
        <div className={styles.panelSection}>
          <div className={styles.panelSectionHeadStatic}>收藏</div>
          <div className={styles.panelAppList}>
            {favoriteApps.length === 0 ? (
              <div className={styles.panelEmpty}>暂无收藏</div>
            ) : (
              favoriteApps.map((app) => (
                <div key={app.id} className={styles.panelAppItem}>
                  <span className={styles.panelAppName}>{app.name}</span>
                  <span className={styles.panelAppActions}>
                    <button
                      type="button"
                      className={styles.panelStarBtn}
                      onClick={() => onToggleFavorite(app.id)}
                      title="取消收藏"
                    >
                      <StarFilled className={styles.starFilled} />
                    </button>
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'open', label: '打开' },
                          { key: 'remove', label: '取消收藏', onClick: () => onToggleFavorite(app.id) },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <button type="button" className={styles.panelMoreBtn}><MoreOutlined /></button>
                    </Dropdown>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
