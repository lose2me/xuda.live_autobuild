<template>
  <div class="score-chart-container">
    <!-- 选择区 -->
    <div class="selectors">
      <div class="selector-group">
        <label>选科</label>
        <select v-model="selectedKe" @change="onKeChange">
          <option value="">请选择</option>
          <option value="文科">文科（历史类）</option>
          <option value="理科">理科（物理类）</option>
        </select>
      </div>
      <div class="selector-group">
        <label>专业</label>
        <select v-model="selectedMajor">
          <option value="">请选择</option>
          <option v-for="m in majorList" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
    </div>

    <!-- 图表区 -->
    <div v-if="chartData" class="chart-area">
      <!-- 信息卡片 -->
      <div class="info-cards">
        <div class="info-card">
          <span class="info-label">选科限制</span>
          <span class="info-value">{{ chartData.限制 }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">学费</span>
          <span class="info-value">¥{{ chartData.学费.toLocaleString() }}/年</span>
        </div>
        <div class="info-card">
          <span class="info-label">置信度</span>
          <span class="info-value" :class="'confidence-' + chartData.置信度">
            {{ chartData.置信度 }}
          </span>
        </div>

      </div>

      <!-- SVG 折线图 -->
      <div class="chart-wrapper">
        <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="chart-svg">
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4A90D9" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#4A90D9" stop-opacity="0.02" />
            </linearGradient>
            <linearGradient id="predictGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#E8733A" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#E8733A" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <!-- Y轴网格线 -->
          <line
            v-for="tick in yTicks"
            :key="'grid-' + tick"
            :x1="marginL" :y1="y(tick)"
            :x2="svgW - marginR" :y2="y(tick)"
            stroke="#e8e8e8" stroke-width="1"
          />
          <!-- 实际录取分：填充区 + 曲线 + 数据点 -->
          <path v-if="actualPath.area" :d="actualPath.area" fill="url(#actualGrad)" />
          <path v-if="actualPath.line" :d="actualPath.line" fill="none" stroke="#4A90D9" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <g v-for="(pt, i) in actualPoints" :key="'ap-' + i">
            <circle :cx="pt.x" :cy="pt.y" r="4" fill="#fff" stroke="#4A90D9" stroke-width="2" />
          </g>

          <!-- 预测分：填充区 + 虚线 + 数据点 -->
          <path v-if="predictPath.area" :d="predictPath.area" fill="url(#predictGrad)" />
          <path v-if="predictPath.line" :d="predictPath.line" fill="none" stroke="#E8733A" stroke-width="2" stroke-dasharray="6,3" stroke-linejoin="round" stroke-linecap="round" />
          <g v-for="(pt, i) in predictPoints" :key="'pp-' + i">
            <circle :cx="pt.x" :cy="pt.y" r="4" fill="#fff" stroke="#E8733A" stroke-width="2" />
          </g>

          <!-- 2025 误差连接线 -->
          <g v-if="errorLine">
            <!-- 竖直虚线：连接两个2025点 -->
            <line
              :x1="errorLine.x" :y1="errorLine.y1"
              :x2="errorLine.x" :y2="errorLine.y2"
              stroke="#bbb" stroke-width="1.2" stroke-dasharray="3,3"
            />
            <!-- 水平线：从中点连到左侧标签 -->
            <line
              :x1="marginL - 16" :y1="errorLine.midY"
              :x2="errorLine.x" :y2="errorLine.midY"
              stroke="#bbb" stroke-width="1.2" stroke-dasharray="3,3"
            />
            <!-- 左侧误差标签 -->
            <text
              :x="marginL - 14" :y="errorLine.midY + 5"
              text-anchor="end" class="error-label"
            >{{ errorLine.text }}</text>
          </g>

          <!-- 数据点数字（最上层） -->
          <g v-for="(pt, i) in actualPoints" :key="'atl-' + i">
            <text :x="pt.x" :y="pt.labelAbove ? pt.y - 12 : pt.y + 20" text-anchor="middle" class="dot-value">{{ pt.value }}</text>
          </g>
          <g v-for="(pt, i) in predictPoints" :key="'ptl-' + i">
            <text :x="pt.x" :y="pt.labelAbove ? pt.y - 12 : pt.y + 20" text-anchor="middle" class="dot-value">{{ pt.value }}</text>
          </g>

          <!-- X轴标签 -->
          <text
            v-for="(label, i) in xLabels"
            :key="'xlabel-' + i"
            :x="xPos(i)" :y="svgH - marginB + 22"
            text-anchor="middle" class="x-label"
          >{{ label }}</text>

          <!-- X轴 -->
          <line
            :x1="marginL" :y1="svgH - marginB"
            :x2="svgW - marginR" :y2="svgH - marginB"
            stroke="#ccc" stroke-width="1"
          />
        </svg>
      </div>

      <!-- 图例 -->
      <div class="legend">
        <div class="legend-item">
          <span class="legend-line" style="background:#4A90D9"></span> 实际录取分
        </div>
        <div class="legend-item">
          <span class="legend-line dashed" style="border-color:#E8733A"></span> 预测分
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="selectedKe && selectedMajor" class="empty-state">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface MajorData {
  '26年预测最低分': number;
  '25年预测最低分': number;
  '25年最低分': number;
  '25年误差值': number;
  '23年最低分': number | null;
  '24年最低分': number | null;
  '限制': string;
  '学费': number;
  '置信度': string;
}

const selectedKe = ref('');
const selectedMajor = ref('');
const allData = ref<Record<string, Record<string, MajorData>> | null>(null);

fetch('/data/2026_score.json')
  .then(r => r.json())
  .then(d => {
    allData.value = d;
    selectedKe.value = '理科';
    selectedMajor.value = '电子信息工程';
  });

const majorList = computed(() => {
  if (!selectedKe.value || !allData.value) return [];
  const keData = allData.value[selectedKe.value];
  if (!keData) return [];
  return Object.keys(keData).sort((a, b) => {
    return keData[b]['26年预测最低分'] - keData[a]['26年预测最低分'];
  });
});

const chartData = computed(() => {
  if (!selectedKe.value || !selectedMajor.value || !allData.value) return null;
  return allData.value[selectedKe.value]?.[selectedMajor.value] ?? null;
});

function onKeChange() {
  selectedMajor.value = '';
}

// SVG 布局
const svgW = 520;
const svgH = 280;
const marginT = 30;
const marginR = 30;
const marginB = 40;
const marginL = 40;
const plotW = svgW - marginL - marginR;
const plotH = svgH - marginT - marginB;

interface Point { label: string; value: number; x: number; y: number; labelAbove: boolean }

const allPoints = computed(() => {
  const d = chartData.value;
  if (!d) return { actual: [] as Point[], predict: [] as Point[] };

  const actual: Point[] = [];
  if (d['23年最低分'] !== null) actual.push({ label: '2023', value: d['23年最低分']!, x: 0, y: 0, labelAbove: true });
  if (d['24年最低分'] !== null) actual.push({ label: '2024', value: d['24年最低分']!, x: 0, y: 0, labelAbove: true });
  actual.push({ label: '2025', value: d['25年最低分'], x: 0, y: 0, labelAbove: true });

  const predict: Point[] = [
    { label: '2025', value: d['25年预测最低分'], x: 0, y: 0, labelAbove: true },
    { label: '2026', value: d['26年预测最低分'], x: 0, y: 0, labelAbove: true },
  ];

  const allVals = [...actual.map(p => p.value), ...predict.map(p => p.value)];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad = Math.max(5, (maxV - minV) * 0.2);
  const yMin = Math.max(0, minV - pad);
  const yMax = maxV + pad;

  const toY = (v: number) => svgH - marginB - ((v - yMin) / (yMax - yMin)) * plotH;
  const yearSlots = ['2023', '2024', '2025', '2026'];
  const toX = (label: string) => {
    const idx = yearSlots.indexOf(label);
    return marginL + (idx / (yearSlots.length - 1)) * plotW;
  };

  const resultActual = actual.map(p => ({ ...p, x: toX(p.label), y: toY(p.value) }));
  const resultPredict = predict.map(p => ({ ...p, x: toX(p.label), y: toY(p.value) }));

  // 碰撞检测：2025 年位置，如果两个点的 Y 值差距 < 24px，低点的标签翻到下方
  const a25 = resultActual.find(p => p.label === '2025');
  const p25 = resultPredict.find(p => p.label === '2025');
  if (a25 && p25 && Math.abs(a25.y - p25.y) < 24) {
    // 较低的点（Y值更大=更靠近底部）标签翻到下方，较高的保持上方
    if (a25.y > p25.y) {
      a25.labelAbove = false;
    } else {
      p25.labelAbove = false;
    }
  }

  return { actual: resultActual, predict: resultPredict, yMin, yMax };
});

const actualPoints = computed(() => allPoints.value.actual);
const predictPoints = computed(() => allPoints.value.predict);

const errorLine = computed(() => {
  const a25 = actualPoints.value.find(p => p.label === '2025');
  const p25 = predictPoints.value.find(p => p.label === '2025');
  if (!a25 || !p25) return null;
  const err = p25.value - a25.value;
  return {
    x: a25.x,
    y1: Math.min(a25.y, p25.y),
    y2: Math.max(a25.y, p25.y),
    midY: (a25.y + p25.y) / 2,
    text: (err > 0 ? '+' : '') + err,
  };
});

// 平滑曲线 + 填充区域生成
function makePath(pts: Point[], baseY: number) {
  if (pts.length < 2) return { line: '', area: '' };
  const n = pts.length;
  // 线段
  let lineD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < n; i++) {
    const px = (pts[i - 1].x + pts[i].x) / 2;
    const py = (pts[i - 1].y + pts[i].y) / 2;
    lineD += ` Q ${pts[i - 1].x} ${pts[i - 1].y} ${px} ${py}`;
    lineD += ` Q ${pts[i].x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  // 填充区域：曲线 → 右下达基线 → 回起点
  let areaD = lineD;
  areaD += ` L ${pts[n - 1].x} ${baseY}`;
  areaD += ` L ${pts[0].x} ${baseY} Z`;
  return { line: lineD, area: areaD };
}

const baseY = computed(() => svgH - marginB);

const actualPath = computed(() => makePath(allPoints.value.actual, baseY.value));
const predictPath = computed(() => makePath(allPoints.value.predict, baseY.value));

const xLabels = ['2023', '2024', '2025', '2026'];
const xPos = (i: number) => marginL + (i / (xLabels.length - 1)) * plotW;

const yTicks = computed(() => {
  const d = chartData.value;
  if (!d) return [];
  const allVals = [d['23年最低分'], d['24年最低分'], d['25年最低分'], d['25年预测最低分'], d['26年预测最低分']]
    .filter(v => v !== null) as number[];
  if (allVals.length === 0) return [];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad = Math.max(5, (maxV - minV) * 0.2);
  const yMin = Math.max(0, minV - pad);
  const yMax = maxV + pad;
  const step = Math.max(5, Math.ceil((yMax - yMin) / 5 / 5) * 5);
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / 5) * 5; v <= yMax; v += step) ticks.push(v);
  return ticks;
});

function y(val: number): number {
  const d = chartData.value;
  if (!d) return 0;
  const allVals = [d['23年最低分'], d['24年最低分'], d['25年最低分'], d['25年预测最低分'], d['26年预测最低分']]
    .filter(v => v !== null) as number[];
  if (allVals.length === 0) return 0;
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad = Math.max(5, (maxV - minV) * 0.2);
  const yMin = Math.max(0, minV - pad);
  const yMax = maxV + pad;
  return svgH - marginB - ((val - yMin) / (yMax - yMin)) * plotH;
}
</script>

<style scoped>
.score-chart-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 0;
}

.selectors {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.selector-group label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selector-group select {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23999'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.selector-group select:focus {
  outline: none;
  border-color: #4A90D9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.12);
}

.info-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.info-card {
  flex: 1;
  min-width: 100px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px 14px;
  text-align: center;
}

.info-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.confidence-高 { color: #27ae60; }
.confidence-中 { color: #f39c12; }
.confidence-低 { color: #e74c3c; }
.err-pos { color: #e74c3c; }
.err-neg { color: #27ae60; }
.err-zero { color: #999; }

.error-label {
  font-size: 14px;
  font-weight: 700;
  fill: #e74c3c;
}

.chart-wrapper {
  background: #fafbfc;
  border-radius: 12px;
  padding: 8px 0 0 0;
  overflow-x: auto;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}

.x-label {
  font-size: 12px;
  fill: #666;
}

.dot-value {
  font-size: 11px;
  font-weight: 600;
  fill: #333;
}

.legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}

.legend-line.dashed {
  background: none;
  border-bottom: 3px dashed #E8733A;
  height: 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
