'use client';
import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { toast } from 'react-toastify';
import { FiTrash2, FiCalendar } from 'react-icons/fi';

export default function DeviceGraph({ config, token, deviceId, onRemove }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d', 'custom'
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let startTs, endTs;
      const now = new Date();
      endTs = now.getTime();

      if (timeRange === '24h') {
        startTs = now.setDate(now.getDate() - 1);
      } else if (timeRange === '7d') {
        startTs = now.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        startTs = now.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'custom' && customRange.start && customRange.end) {
        startTs = new Date(customRange.start).getTime();
        endTs = new Date(customRange.end).getTime();
      } else {
        startTs = new Date().setDate(new Date().getDate() - 1);
      }

      try {
        const res = await fetch(`/api/iot/getReadings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deviceId, startTs, endTs }),
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        const result = await res.json();
        const chartData = result.readings.map(r => ({
          value: [new Date(r.createdAt), r[config.key]]
        })).sort((a, b) => a.value[0] - b.value[0]);
        setData(chartData);
      } catch (err) {
        toast.error(`Failed to load data for ${config.key} graph.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, deviceId, config.key, timeRange, customRange]);

  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'time' },
    yAxis: { type: 'value' },
    series: [{
      data: data,
      type: config.type,
      name: config.key.charAt(0).toUpperCase() + config.key.slice(1)
    }],
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
  };

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{config.key.charAt(0).toUpperCase() + config.key.slice(1)} ({config.type} chart)</h3>
        <div className="flex items-center gap-2">
           <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="p-1 border rounded text-sm">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
            </select>
          <button onClick={onRemove} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
        </div>
      </div>
      {timeRange === 'custom' && (
        <div className="flex gap-2 mb-4 items-center">
            <input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({...p, start: e.target.value}))} className="p-1 border rounded text-sm"/>
            <input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({...p, end: e.target.value}))} className="p-1 border rounded text-sm"/>
        </div>
      )}
      {loading ? (
        <div className="h-64 flex items-center justify-center">Loading...</div>
      ) : (
        <ReactECharts option={option} style={{ height: '300px' }} />
      )}
    </div>
  );
}