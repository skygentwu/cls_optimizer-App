import { useState, useEffect } from 'react';
import { NavBar, Card, Tag, Toast, PullToRefresh, Input, Button, Popup } from 'antd-mobile';
import { fetchPrices, updatePriceRecord } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatNumber, formatDate } from '@/utils/format';
import type { PriceRecord, PricePayload } from '@/types';
import './prices.css';

export default function PricesPage() {
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PriceRecord | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editPrices, setEditPrices] = useState<PricePayload>({ liquid_chlorine: 0, hcl31: 0, naclo10: 0, naoh32: 0 });

  const loadPrices = async () => {
    setLoading(true);
    try {
      const res = await fetchPrices(30);
      setRecords([...res.records].reverse());
    } catch {
      Toast.show({ icon: 'fail', content: '加载价格数据失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const handleEdit = (record: PriceRecord) => {
    setEditingRecord(record);
    setEditPrices({ ...record.prices });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editingRecord) return;
    try {
      await updatePriceRecord(editingRecord.date, editPrices);
      Toast.show({ icon: 'success', content: '保存成功' });
      setShowEditor(false);
      loadPrices();
    } catch {
      Toast.show({ icon: 'fail', content: '保存失败' });
    }
  };

  const getFlagColor = (flag: string) => {
    if (flag.includes('预测')) return 'primary';
    if (flag.includes('手动')) return 'warning';
    return 'success';
  };

  return (
    <div className="prices-page">
      <NavBar back={null}>价格数据</NavBar>

      <div className="page-content">
        <PullToRefresh onRefresh={loadPrices}>
          <div>
            {records.map((record) => (
              <Card key={record.date} style={{ margin: '8px 12px' }}>
                <div className="price-record-header" onClick={() => handleEdit(record)}>
                  <div className="price-date-row">
                    <span className="price-date">{formatDate(record.date)}</span>
                    <Tag color={getFlagColor(record.data_flag)}>{record.data_flag}</Tag>
                  </div>
                  <div className="price-source">{record.data_source}</div>
                </div>
                <div className="price-values">
                  {Object.entries(record.prices).map(([key, value]) => (
                    <div key={key} className="price-value-item">
                      <div className="price-value-name">{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</div>
                      <div className="price-value-num">{formatNumber(value, 0)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            {loading && <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>加载中...</div>}
          </div>
        </PullToRefresh>
      </div>

      {/* 编辑弹窗 */}
      <Popup visible={showEditor} onMaskClick={() => setShowEditor(false)} bodyStyle={{ borderRadius: '16px 16px 0 0' }}>
        <div className="price-editor">
          <div className="price-editor-header">
            <h3>编辑价格 - {editingRecord ? formatDate(editingRecord.date) : ''}</h3>
          </div>
          <div className="price-editor-body">
            {Object.entries(editPrices).map(([key, value]) => (
              <div key={key} className="price-editor-row">
                <label htmlFor={`price-${key}`}>{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</label>
                <Input
                  id={`price-${key}`}
                  name={`price-${key}`}
                  type="number"
                  value={String(value)}
                  onChange={(val) => {
                    const num = val === '' ? 0 : Number(val);
                    setEditPrices((prev) => ({ ...prev, [key]: Number.isNaN(num) ? prev[key as keyof PricePayload] : num }));
                  }}
                />
              </div>
            ))}
          </div>
          <div className="price-editor-actions">
            <Button block onClick={() => setShowEditor(false)}>取消</Button>
            <Button color="primary" block onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
