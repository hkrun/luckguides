import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface WeightGaugeProps {
  value: number;
  onChange: (value: number) => void;
  minWeight?: number;
  maxWeight?: number;
  className?: string;
  label?: string;
  rangeFormat?: string;
}

export function WeightGauge({
  value,
  onChange,
  minWeight = 30,
  maxWeight = 200,
  className,
  label = "体重",
  rangeFormat = "范围: {min} - {max} kg"
}: WeightGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // 计算角度（-135度到135度，总共270度）
  const valueToAngle = (val: number): number => {
    const percentage = (val - minWeight) / (maxWeight - minWeight);
    return -135 + percentage * 270;
  };

  // 计算角度对应的数值
  const angleToValue = (angle: number): number => {
    const normalizedAngle = angle + 135; // 转换为0-270度
    const percentage = normalizedAngle / 270;
    return Math.round(minWeight + percentage * (maxWeight - minWeight));
  };

  // 处理拖动事件
  const handleDrag = (clientX: number, clientY: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // 计算相对于中心的角度
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // 处理角度范围：仪表盘从-135度到+135度
      // 如果角度在无效区域（135度到225度之间），选择最近的有效边界
      if (angle > 135 && angle <= 180) {
        // 在右上象限超出范围，限制到最大值
        angle = 135;
      } else if (angle > 180 && angle < 225) {
        // 在左上象限超出范围，限制到最小值  
        angle = -135;
      } else if (angle >= 225) {
        // 角度过大，转换到负角度范围
        angle = angle - 360;
      }
      
      // 最终限制在有效范围内
      angle = Math.max(-135, Math.min(135, angle));
      
      const newValue = angleToValue(angle);
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      e.preventDefault();
      handleDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // 添加事件监听
  useEffect(() => {
    if (isDragging) {
      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      // 恢复页面滚动
      document.body.style.overflow = '';
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // 计算当前角度
  const currentAngle = valueToAngle(displayValue);

  // 生成刻度线
  const generateTicks = () => {
    const ticks = [];
    const tickCount = 18; // 270度分成18个刻度
    
    for (let i = 0; i <= tickCount; i++) {
      const angle = -135 + (i * 270) / tickCount;
      const tickValue = minWeight + (i * (maxWeight - minWeight)) / tickCount;
      const isMainTick = i % 3 === 0; // 每3个刻度显示一个主刻度
      
      const radian = (angle * Math.PI) / 180;
      const innerRadius = isMainTick ? 85 : 90;
      const outerRadius = 100;
      
      const x1 = 110 + innerRadius * Math.cos(radian);
      const y1 = 110 + innerRadius * Math.sin(radian);
      const x2 = 110 + outerRadius * Math.cos(radian);
      const y2 = 110 + outerRadius * Math.sin(radian);
      
      ticks.push(
        <g key={i}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isMainTick ? "#374151" : "#9CA3AF"}
            strokeWidth={isMainTick ? "2" : "1"}
          />
          {isMainTick && (
            <text
              x={110 + 75 * Math.cos(radian)}
              y={110 + 75 * Math.sin(radian)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-600"
              fontSize="10"
            >
              {Math.round(tickValue)}
            </text>
          )}
        </g>
      );
    }
    
    return ticks;
  };

  return (
    <div className={cn("flex flex-col items-center space-y-2 sm:space-y-3", className)}>
      {/* 数值显示 */}
      <div className="text-center">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {displayValue}
        </div>
        <div className="text-base sm:text-lg text-gray-500">kg</div>
      </div>

      {/* 仪表盘 */}
      <div 
        ref={containerRef}
        className="relative cursor-pointer"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 220 220"
          className="drop-shadow-lg w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[220px] md:h-[220px]"
        >
          {/* 背景圆弧 */}
          <path
            d="M 33 187 A 77 77 0 1 1 187 187"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* 进度圆弧 */}
          <path
            d="M 33 187 A 77 77 0 1 1 187 187"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(displayValue - minWeight) / (maxWeight - minWeight) * 242} 242`}
            className="transition-all duration-300"
          />
          
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          
          {/* 刻度线 */}
          {generateTicks()}
          
          {/* 中心圆 */}
          <circle
            cx="110"
            cy="110"
            r="8"
            fill="#374151"
          />
          
          {/* 指针 */}
          <line
            x1="110"
            y1="110"
            x2={110 + 65 * Math.cos((currentAngle * Math.PI) / 180)}
            y2={110 + 65 * Math.sin((currentAngle * Math.PI) / 180)}
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          
          {/* 指针箭头 */}
          <g
            transform={`translate(${110 + 65 * Math.cos((currentAngle * Math.PI) / 180)}, ${110 + 65 * Math.sin((currentAngle * Math.PI) / 180)}) rotate(${currentAngle + 90})`}
            className="transition-all duration-200"
          >
            <path
              d={isDragging ? "M0,-10 L8,6 L0,2 L-8,6 Z" : "M0,-8 L6,4 L0,1 L-6,4 Z"}
              fill="#374151"
              stroke="#ffffff"
              strokeWidth="1"
            />
          </g>
        </svg>
        
        {/* 中心标签 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center mt-8">
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </div>
        </div>
      </div>
      
      {/* 范围提示 */}
      <div className="text-xs sm:text-sm text-gray-500 text-center -mt-2">
        {rangeFormat.replace('{min}', minWeight.toString()).replace('{max}', maxWeight.toString())}
      </div>
    </div>
  );
} 