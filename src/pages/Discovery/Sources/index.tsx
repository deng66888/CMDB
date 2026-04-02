import { useState } from 'react'
import { Card, Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, CloudSyncOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  cloudAccountListMock,
  cloudProviderLabels,
  credentialListMock,
  credentialTypeLabels,
  discoveryScriptListMock,
  type CloudAccount,
  type CloudProvider,
  type Credential,
  type CredentialType,
  type DiscoveryScript,
} from '@/mock/discovery'
import styles from '../common.module.css'

export default function DiscoverySources() {
  const [cloudModalOpen, setCloudModalOpen] = useState(false)
  const [credModalOpen, setCredModalOpen] = useState(false)

  const cloudColumns: ColumnsType<CloudAccount> = [
    { title: '名称', dataIndex: 'name' },
    { title: '云厂商', dataIndex: 'provider', width: 100, render: (p: CloudProvider) => cloudProviderLabels[p] },
    { title: 'Region', dataIndex: 'regions', render: (r: string[]) => r?.join(', ') },
    { title: '状态', dataIndex: 'status', width: 90, render: (s) => <Tag color={s === 'ok' ? 'success' : 'error'}>{s === 'ok' ? '正常' : '异常'}</Tag> },
    { title: '上次同步', dataIndex: 'lastSyncTime', width: 160 },
    { title: '操作', key: 'action', width: 100, render: () => <Button type="link" size="small" icon={<CloudSyncOutlined />}>同步</Button> },
  ]

  const credColumns: ColumnsType<Credential> = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 90, render: (t: CredentialType) => credentialTypeLabels[t] },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '备注', dataIndex: 'notes' },
  ]

  const scriptColumns: ColumnsType<DiscoveryScript> = [
    { title: '脚本名称', dataIndex: 'name' },
    { title: '语言', dataIndex: 'language', width: 100 },
    { title: '描述', dataIndex: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    { title: '操作', key: 'action', width: 120, render: () => <Space><Button type="link" size="small">编辑</Button><Button type="link" size="small">上传新版本</Button></Space> },
  ]

  return (
    <div className={styles.wrap}>
      <Card title="发现源管理">
        <p style={{ color: '#666', marginBottom: 16 }}>
          管理云账号、网络扫描凭证与自定义发现脚本，供发现任务引用。
        </p>
        <Tabs
          items={[
            {
              key: 'cloud',
              label: '云账号',
              children: (
                <>
                  <div className={styles.toolbar} style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCloudModalOpen(true)}>添加云账号</Button>
                  </div>
                  <Table rowKey="id" size="small" columns={cloudColumns} dataSource={cloudAccountListMock} pagination={false} />
                </>
              ),
            },
            {
              key: 'credential',
              label: '凭证',
              children: (
                <>
                  <div className={styles.toolbar} style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCredModalOpen(true)}>添加凭证</Button>
                  </div>
                  <Table rowKey="id" size="small" columns={credColumns} dataSource={credentialListMock} pagination={false} />
                </>
              ),
            },
            {
              key: 'script',
              label: '脚本仓库',
              children: (
                <>
                  <div className={styles.toolbar} style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />}>上传脚本</Button>
                  </div>
                  <Table rowKey="id" size="small" columns={scriptColumns} dataSource={discoveryScriptListMock} pagination={false} />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="添加云账号" open={cloudModalOpen} onCancel={() => setCloudModalOpen(false)} onOk={() => setCloudModalOpen(false)} width={480}>
        <Form layout="vertical">
          <Form.Item label="账号名称" required><Input placeholder="如：生产阿里云主账号" /></Form.Item>
          <Form.Item label="云厂商" required><Select options={Object.entries(cloudProviderLabels).map(([k, v]) => ({ value: k, label: v }))} /></Form.Item>
          <Form.Item label="Region"><Select mode="multiple" placeholder="选择 Region" options={[{ value: 'cn-hangzhou', label: 'cn-hangzhou' }]} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="添加凭证" open={credModalOpen} onCancel={() => setCredModalOpen(false)} onOk={() => setCredModalOpen(false)} width={480}>
        <Form layout="vertical">
          <Form.Item label="凭证名称" required><Input placeholder="如：机房 SSH 默认" /></Form.Item>
          <Form.Item label="类型" required><Select options={Object.entries(credentialTypeLabels).map(([k, v]) => ({ value: k, label: v }))} /></Form.Item>
          <Form.Item label="用户名"><Input /></Form.Item>
          <Form.Item label="密码/密钥"><Input.Password placeholder="加密存储" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
