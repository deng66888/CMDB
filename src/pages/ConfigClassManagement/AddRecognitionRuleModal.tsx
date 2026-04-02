import { useState, useEffect } from 'react'
import { Modal, Radio, Button, Select, Transfer, Tabs, Space } from 'antd'
import type { ConfigClassAttribute } from '@/mock/configClass'
import { otherConfigClassesMock } from '@/mock/configClass'

export type SourceType = 'main' | 'another' | 'mixed'

/** 弹窗保存时回传的一行（用于生成 RecognitionRuleRow，无权重/必填） */
export interface RecognitionRuleFieldInput {
  fieldName: string
  technicalName?: string
}

export interface InitialForEdit {
  source: SourceType
  mainKeys?: string[]
  otherClassId?: string | null
  otherKeys?: string[]
}

interface AddRecognitionRuleModalProps {
  open: boolean
  onClose: () => void
  /** (fields, source, editId?) 选中的字段；editId 时表示编辑该条 */
  onSave: (fields: RecognitionRuleFieldInput[], source: SourceType, editId?: string) => void
  /** 主表属性（当前配置类：继承+添加） */
  mainTableAttributes: ConfigClassAttribute[]
  /** 已添加的字段（用于提示），主表用 technicalName */
  alreadyAddedFieldKeys?: string[]
  /** 编辑时传入：当前行 id 与初始值 */
  editingRuleId?: string | null
  initialForEdit?: InitialForEdit | null
}

export default function AddRecognitionRuleModal({
  open,
  onClose,
  onSave,
  mainTableAttributes,
  alreadyAddedFieldKeys = [],
  editingRuleId = null,
  initialForEdit = null,
}: AddRecognitionRuleModalProps) {
  const [source, setSource] = useState<SourceType>('main')
  const [step, setStep] = useState(1)
  const [selectedMainKeys, setSelectedMainKeys] = useState<string[]>([])
  const [selectedOtherClassId, setSelectedOtherClassId] = useState<string | null>(null)
  const [selectedOtherKeys, setSelectedOtherKeys] = useState<string[]>([])
  const [mixedTab, setMixedTab] = useState<'main' | 'other'>('main')

  const otherClass = selectedOtherClassId
    ? otherConfigClassesMock.find((c) => c.id === selectedOtherClassId)
    : null

  const mainDataSource = mainTableAttributes.map((a) => ({
    key: a.technicalName || a.fieldName,
    title: `${a.fieldName}（${a.technicalName || a.fieldName}）`,
  }))
  const otherDataSource = otherClass
    ? otherClass.columns.map((c) => ({ key: c.key, title: `${c.label}（${c.key}）` }))
    : []

  useEffect(() => {
    if (!open) return
    if (editingRuleId && initialForEdit) {
      setSource(initialForEdit.source)
      setSelectedMainKeys(initialForEdit.mainKeys ?? [])
      setSelectedOtherClassId(initialForEdit.otherClassId ?? null)
      setSelectedOtherKeys(initialForEdit.otherKeys ?? [])
      setMixedTab('main')
      setStep(2)
    } else {
      setStep(1)
      setSource('main')
      setSelectedMainKeys([...alreadyAddedFieldKeys])
      setSelectedOtherClassId(null)
      setSelectedOtherKeys([])
      setMixedTab('main')
    }
  }, [open, editingRuleId, initialForEdit, alreadyAddedFieldKeys])

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
      if (source === 'another' && !selectedOtherClassId && otherConfigClassesMock.length) setSelectedOtherClassId(otherConfigClassesMock[0]!.id)
      return
    }
    handleSubmit()
  }

  const buildFields = (keys: string[], isMain: boolean): RecognitionRuleFieldInput[] => {
    const fields: RecognitionRuleFieldInput[] = []
    if (isMain) {
      keys.forEach((key) => {
        const attr = mainTableAttributes.find((a) => (a.technicalName || a.fieldName) === key)
        fields.push({ fieldName: attr?.fieldName ?? key, technicalName: key })
      })
    } else if (otherClass) {
      keys.forEach((key) => {
        const col = otherClass.columns.find((c) => c.key === key)
        fields.push({ fieldName: col?.label ?? key, technicalName: key })
      })
    }
    return fields
  }

  const handleSubmit = () => {
    if (editingRuleId) {
      const fields = buildFields(source === 'main' ? selectedMainKeys : source === 'mixed' ? selectedMainKeys : [], true)
        .concat(buildFields(source === 'another' ? selectedOtherKeys : source === 'mixed' ? selectedOtherKeys : [], false))
      if (fields.length === 0) return
      onSave(fields, source, editingRuleId)
      onClose()
      return
    }
    const addedSet = new Set(alreadyAddedFieldKeys)
    const newMainKeys = (source === 'main' || source === 'mixed') ? selectedMainKeys.filter((k) => !addedSet.has(k)) : []
    const newOtherKeys = (source === 'another' || source === 'mixed') ? selectedOtherKeys : []
    const newFields = buildFields(newMainKeys, true).concat((source === 'another' || source === 'mixed') && otherClass ? buildFields(newOtherKeys, false) : [])
    if (newFields.length === 0) return
    onSave(newFields, source)
    onClose()
  }

  const canNext = () => {
    if (step === 1) return true
    const addedSet = new Set(alreadyAddedFieldKeys)
    const newMainCount = (source === 'main' || source === 'mixed') ? selectedMainKeys.filter((k) => !addedSet.has(k)).length : 0
    if (source === 'main') return newMainCount > 0
    if (source === 'another') return selectedOtherClassId && selectedOtherKeys.length > 0
    if (source === 'mixed') return newMainCount + selectedOtherKeys.length > 0
    return false
  }

  const renderTransferMain = () => (
    <div style={{ marginTop: 8 }}>
      {alreadyAddedFieldKeys.length > 0 && (
        <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
          已添加的字段：{alreadyAddedFieldKeys.map((k) => mainTableAttributes.find((a) => (a.technicalName || a.fieldName) === k)?.fieldName || k).join('、')}
        </div>
      )}
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>从左侧选择需要参与识别的字段，移至右侧「已选」</div>
      <Transfer
        dataSource={mainDataSource}
        targetKeys={selectedMainKeys}
        onChange={(keys) => setSelectedMainKeys(keys as string[])}
        render={(item) => item.title}
        listStyle={{ width: 220, height: 280 }}
        showSearch
        filterOption={(input, item) => (item.title ?? '').toLowerCase().includes(input.toLowerCase())}
        locale={{ itemUnit: '项', itemsUnit: '项', searchPlaceholder: '搜索', notFoundContent: '暂无数据' }}
        titles={['可用的', '已选']}
      />
    </div>
  )

  const renderTransferOther = () => (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 8 }}>选择配置类</div>
      <Select
        value={selectedOtherClassId}
        onChange={(id) => { setSelectedOtherClassId(id); setSelectedOtherKeys([]) }}
        options={otherConfigClassesMock.map((c) => ({ value: c.id, label: c.name }))}
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="请选择配置类"
      />
      {otherClass && (
        <>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>从左侧选择该配置类的字段，移至右侧「已选」</div>
          <Transfer
            dataSource={otherDataSource}
            targetKeys={selectedOtherKeys}
            onChange={(keys) => setSelectedOtherKeys(keys as string[])}
            render={(item) => item.title}
            listStyle={{ width: 220, height: 280 }}
            showSearch
            filterOption={(input, item) => (item.title ?? '').toLowerCase().includes(input.toLowerCase())}
            locale={{ itemUnit: '项', itemsUnit: '项', searchPlaceholder: '搜索', notFoundContent: '暂无数据' }}
            titles={['可用的', '已选']}
          />
        </>
      )}
    </div>
  )

  return (
    <Modal
      title={editingRuleId ? '编辑识别规则' : '添加识别规则'}
      open={open}
      onCancel={onClose}
      width={step === 2 && (source === 'main' || source === 'another') ? 520 : step === 2 && source === 'mixed' ? 560 : 480}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        step === 1 ? (
          <Button key="next" type="primary" onClick={handleNext}>下一步</Button>
        ) : (
          <>
            <Button key="back" onClick={() => setStep(1)}>上一步</Button>
            <Button key="save" type="primary" onClick={handleNext} disabled={!canNext()}>保存</Button>
          </>
        ),
      ]}
    >
      {step === 1 && (
        <div>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>选择数据来源</div>
          <Radio.Group
            value={source}
            onChange={(e) => { setSource(e.target.value); setSelectedOtherClassId(null); setSelectedOtherKeys([]) }}
          >
            <Space direction="vertical">
              <Radio value="main">使用主表中的属性</Radio>
              <Radio value="another">使用另一个表的属性</Radio>
              <Radio value="mixed">使用主表和另一个表的属性（混合）</Radio>
            </Space>
          </Radio.Group>
        </div>
      )}
      {step === 2 && source === 'main' && renderTransferMain()}
      {step === 2 && source === 'another' && renderTransferOther()}
      {step === 2 && source === 'mixed' && (
        <Tabs
          activeKey={mixedTab}
          onChange={(k) => setMixedTab(k as 'main' | 'other')}
          items={[
            { key: 'main', label: '主表', children: renderTransferMain() },
            {
              key: 'other',
              label: '其它表',
              children: (
                <div>
                  <div style={{ marginBottom: 8 }}>选择配置类</div>
                  <Select
                    value={selectedOtherClassId}
                    onChange={(id) => { setSelectedOtherClassId(id); setSelectedOtherKeys([]) }}
                    options={otherConfigClassesMock.map((c) => ({ value: c.id, label: c.name }))}
                    style={{ width: '100%', marginBottom: 12 }}
                    placeholder="请选择配置类"
                  />
                  {otherClass && (
                    <>
                      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>从左侧选择该配置类的字段，移至右侧「已选」</div>
                      <Transfer
                        dataSource={otherDataSource}
                        targetKeys={selectedOtherKeys}
                        onChange={(keys) => setSelectedOtherKeys(keys as string[])}
                        render={(item) => item.title}
                        listStyle={{ width: 220, height: 260 }}
                        showSearch
                        filterOption={(input, item) => (item.title ?? '').toLowerCase().includes(input.toLowerCase())}
                        locale={{ itemUnit: '项', itemsUnit: '项', searchPlaceholder: '搜索', notFoundContent: '暂无数据' }}
                        titles={['可用的', '已选']}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </Modal>
  )
}
