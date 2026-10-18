import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);
type S = { name: string; data: [number, number][]; unit?: string };
export default function Chart({ series, colors, height = 280, area = true }: { series: S[]; colors: string[]; height?: number; area?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    c.setOption({
      animation: !reduce, color: colors, backgroundColor: 'transparent',
      textStyle: { fontFamily: 'Fira Sans', color: '#9CCCD4' },
      grid: { left: 44, right: 16, top: series.length > 1 ? 36 : 16, bottom: 28 },
      legend: series.length > 1 ? { top: 0, textStyle: { color: '#E6F5F7' }, icon: 'roundRect' } : undefined,
      tooltip: { trigger: 'axis', backgroundColor: '#024950', borderColor: '#2E7A82', textStyle: { color: '#E6F5F7', fontFamily: 'Fira Code' }, valueFormatter: (v: any) => (v == null ? '—' : Number(v).toFixed(2)) },
      xAxis: { type: 'value', min: 'dataMin', max: 'dataMax', axisLabel: { formatter: (v: number) => String(v), color: '#9CCCD4' }, axisLine: { lineStyle: { color: '#2E7A82' } }, splitLine: { show: false } },
      yAxis: { type: 'value', scale: true, axisLabel: { color: '#9CCCD4' }, splitLine: { lineStyle: { color: '#0C5A61' } } },
      series: series.map((s, i) => ({
        name: s.name, type: 'line', smooth: 0.3, showSymbol: false, data: s.data, lineStyle: { width: 2.5 },
        areaStyle: area && i === 0 ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[0] + '55' }, { offset: 1, color: colors[0] + '00' }]) } : undefined,
      })),
    });
    const ro = new ResizeObserver(() => c.resize()); ro.observe(ref.current);
    return () => { ro.disconnect(); c.dispose(); };
  }, []);
  return <div ref={ref} style={{ height }} role="img" aria-label={`Line chart: ${series.map(s => s.name).join(', ')}`} />;
}
