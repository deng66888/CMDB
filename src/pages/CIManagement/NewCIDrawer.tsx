import { useState } from 'react'
import { Drawer, Form, Input, InputNumber, Select, Button, Collapse, Space } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  assetPickerMock,
  modelIdPickerMock,
  manufacturerPickerMock,
  cpuManufacturerPickerMock,
  cabinetPickerMock,
  formatAssetPick,
  formatModelIdPick,
  formatManufacturerPick,
  formatCpuManufacturerPick,
  formatCabinetPick,
  type AssetPickerRow,
  type ModelIdPickerRow,
  type ManufacturerPickerRow,
  type CpuManufacturerPickerRow,
  type CabinetPickerRow,
} from '@/mock/ciPickers'
import { ReferencePickerModal } from './ReferencePickerModal'
import styles from './NewCIDrawer.module.css'

const STATUS_OPTIONS = [
  { value: '已安装', label: '已安装' },
  { value: '未安装', label: '未安装' },
]
const ENV_OPTIONS = [
  { value: '测试', label: '测试' },
  { value: '生产', label: '生产' },
  { value: '开发', label: '开发' },
]
const OS_OPTIONS = [
  { value: 'Windows XP', label: 'Windows XP' },
  { value: 'Windows Server', label: 'Windows Server' },
  { value: 'Linux', label: 'Linux' },
]

type PickerKey = 'asset' | 'modelId' | 'manufacturer' | 'cpuManufacturer' | 'cabinet'

const assetColumns: ColumnsType<AssetPickerRow> = [
  { title: '资产编号', dataIndex: 'code', width: 150, ellipsis: true },
  { title: '资产名称', dataIndex: 'name', width: 200, ellipsis: true },
  { title: '位置', dataIndex: 'location', ellipsis: true },
  { title: '状态', dataIndex: 'status', width: 88 },
]

const modelIdColumns: ColumnsType<ModelIdPickerRow> = [
  { title: '型号标识(SKU)', dataIndex: 'sku', width: 160, ellipsis: true },
  { title: '型号名称', dataIndex: 'name', width: 200, ellipsis: true },
  { title: '产品线', dataIndex: 'productLine', ellipsis: true },
]

const manufacturerColumns: ColumnsType<ManufacturerPickerRow> = [
  { title: '厂商编码', dataIndex: 'code', width: 120 },
  { title: '厂商名称', dataIndex: 'name', ellipsis: true },
  { title: '地区', dataIndex: 'region', width: 100 },
]

const cpuMfrColumns: ColumnsType<CpuManufacturerPickerRow> = [
  { title: '品牌编码', dataIndex: 'code', width: 140 },
  { title: '品牌名称', dataIndex: 'name', width: 160 },
]

const cabinetColumns: ColumnsType<CabinetPickerRow> = [
  { title: '机柜编码', dataIndex: 'code', width: 150, ellipsis: true },
  { title: '机柜名称', dataIndex: 'name', width: 180, ellipsis: true },
  { title: '所属机房', dataIndex: 'room', ellipsis: true },
  { title: 'U位', dataIndex: 'uTotal', width: 72, render: (v: number) => `${v}U` },
]

/** 表单项：只读展示 +「选择」打开引用弹窗 */
function RefPickerField({
  value,
  onChange: _onChange,
  onOpen,
  placeholder = '请点击「选择」从列表中选取',
}: {
  value?: string
  onChange?: (v: string) => void
  onOpen: () => void
  placeholder?: string
}) {
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        readOnly
        placeholder={placeholder}
        value={value}
        onClick={onOpen}
        style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
      />
      <Button type="default" onClick={onOpen} style={{ flexShrink: 0 }}>
        选择
      </Button>
    </Space.Compact>
  )
}

interface NewCIDrawerProps {
  open: boolean
  category: string
  onClose: () => void
  onSaveDraft: (values: Record<string, unknown>) => void
  onSubmit: (values: Record<string, unknown>) => void
}

export default function NewCIDrawer({ open, category, onClose, onSaveDraft, onSubmit }: NewCIDrawerProps) {
  const [form] = Form.useForm()
  const [picker, setPicker] = useState<PickerKey | null>(null)
  const closePicker = () => setPicker(null)

  const handleSaveDraft = () => {
    form
      .validateFields()
      .then((values) => {
        onSaveDraft(values)
        form.resetFields()
        onClose()
      })
      .catch(() => {})
  }

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values)
        form.resetFields()
        onClose()
      })
      .catch(() => {})
  }

  return (
    <>
      <Drawer
        title={
          <span className={styles.drawerTitle}>
            <LeftOutlined className={styles.backIcon} onClick={onClose} />
            新建{category}
          </span>
        }
        placement="right"
        width={560}
        onClose={onClose}
        open={open}
        destroyOnClose
        className={styles.drawer}
        styles={{ body: { paddingBottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        <div className={styles.body}>
          <Form form={form} layout="vertical" initialValues={{ 操作系统: 'Windows XP', 状态: '已安装', 环境: '测试' }}>
            <div className={styles.section}>
              <Form.Item name="资产" label="资产">
                <RefPickerField onOpen={() => setPicker('asset')} />
              </Form.Item>
              <Form.Item name="型号标识" label="型号标识">
                <RefPickerField onOpen={() => setPicker('modelId')} />
              </Form.Item>
              <Form.Item name="制造商" label="制造商">
                <RefPickerField onOpen={() => setPicker('manufacturer')} />
              </Form.Item>
            </div>

            <Collapse
              defaultActiveKey={['config']}
              className={styles.collapse}
              items={[
                {
                  key: 'config',
                  label: '配置信息',
                  children: (
                    <>
                      <Form.Item name="型号" label="型号">
                        <Input placeholder="可手填或根据型号标识带出" />
                      </Form.Item>
                      <Form.Item name="CPU速度" label="CPU速度(MHz)">
                        <Input />
                      </Form.Item>
                      <Form.Item name="操作系统" label="操作系统">
                        <Select options={OS_OPTIONS} placeholder="请选择" />
                      </Form.Item>
                      <Form.Item name="CPU数量" label="CPU数量">
                        <Input />
                      </Form.Item>
                      <Form.Item name="操作系统版本" label="操作系统版本">
                        <Input />
                      </Form.Item>
                      <Form.Item name="CPU制造商" label="CPU制造商">
                        <RefPickerField onOpen={() => setPicker('cpuManufacturer')} />
                      </Form.Item>
                      <Form.Item name="操作系统服务器包" label="操作系统服务器包">
                        <Input />
                      </Form.Item>
                      <Form.Item name="CPU类型" label="CPU类型">
                        <Input />
                      </Form.Item>
                      <Form.Item name="磁盘空间" label="磁盘空间(GB)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="CPU名称" label="CPU名称">
                        <Input />
                      </Form.Item>
                      <Form.Item name="内存" label="内存(MB)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="CPU核数" label="CPU核数">
                        <Input />
                      </Form.Item>
                      <Form.Item name="CPU插槽数" label="CPU插槽数">
                        <Input />
                      </Form.Item>
                      <Form.Item name="CPU线程数" label="CPU线程数">
                        <Input />
                      </Form.Item>
                      <Form.Item name="状态" label="状态">
                        <Select options={STATUS_OPTIONS} />
                      </Form.Item>
                      <Form.Item name="所属机柜" label="所属机柜">
                        <RefPickerField onOpen={() => setPicker('cabinet')} placeholder="请点击「选择」选择机柜" />
                      </Form.Item>
                      <Form.Item name="操作系统补丁包" label="操作系统补丁包">
                        <Input />
                      </Form.Item>
                      <Form.Item name="环境" label="环境">
                        <Select options={ENV_OPTIONS} />
                      </Form.Item>
                      <Form.Item name="ssh密码" label="ssh密码">
                        <Input.Password placeholder="请输入" />
                      </Form.Item>
                      <Form.Item name="telnet用户名" label="telnet用户名">
                        <Input />
                      </Form.Item>
                      <Form.Item name="telnet密码" label="telnet密码">
                        <Input.Password placeholder="请输入" />
                      </Form.Item>
                      <Form.Item name="描述" label="描述">
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          </Form>
        </div>

        <div className={styles.footer}>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={handleSaveDraft}>保存草稿</Button>
          <Button type="primary" onClick={handleSubmit}>
            提交审核
          </Button>
        </div>
      </Drawer>

      <ReferencePickerModal<AssetPickerRow>
        open={picker === 'asset'}
        title="选择资产"
        columns={assetColumns}
        dataSource={assetPickerMock}
        filterKeys={['code', 'name', 'location', 'status']}
        searchPlaceholder="搜索资产编号、名称、位置、状态"
        onCancel={closePicker}
        onConfirm={(row) => {
          form.setFieldsValue({ 资产: formatAssetPick(row) })
          closePicker()
        }}
      />
      <ReferencePickerModal<ModelIdPickerRow>
        open={picker === 'modelId'}
        title="选择型号标识"
        columns={modelIdColumns}
        dataSource={modelIdPickerMock}
        filterKeys={['sku', 'name', 'productLine']}
        searchPlaceholder="搜索 SKU、型号名称、产品线"
        onCancel={closePicker}
        onConfirm={(row) => {
          form.setFieldsValue({ 型号标识: formatModelIdPick(row), 型号: row.name })
          closePicker()
        }}
      />
      <ReferencePickerModal<ManufacturerPickerRow>
        open={picker === 'manufacturer'}
        title="选择制造商"
        columns={manufacturerColumns}
        dataSource={manufacturerPickerMock}
        filterKeys={['code', 'name', 'region']}
        searchPlaceholder="搜索厂商编码、名称、地区"
        onCancel={closePicker}
        onConfirm={(row) => {
          form.setFieldsValue({ 制造商: formatManufacturerPick(row) })
          closePicker()
        }}
      />
      <ReferencePickerModal<CpuManufacturerPickerRow>
        open={picker === 'cpuManufacturer'}
        title="选择 CPU 制造商"
        columns={cpuMfrColumns}
        dataSource={cpuManufacturerPickerMock}
        filterKeys={['code', 'name']}
        searchPlaceholder="搜索品牌编码、名称"
        onCancel={closePicker}
        onConfirm={(row) => {
          form.setFieldsValue({ CPU制造商: formatCpuManufacturerPick(row) })
          closePicker()
        }}
      />
      <ReferencePickerModal<CabinetPickerRow>
        open={picker === 'cabinet'}
        title="选择所属机柜"
        columns={cabinetColumns}
        dataSource={cabinetPickerMock}
        filterKeys={['code', 'name', 'room']}
        searchPlaceholder="搜索机柜编码、名称、机房"
        onCancel={closePicker}
        onConfirm={(row) => {
          form.setFieldsValue({ 所属机柜: formatCabinetPick(row) })
          closePicker()
        }}
      />
    </>
  )
}
