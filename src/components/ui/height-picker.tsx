import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HeightPickerProps {
  value: number;
  onChange: (height: number) => void;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export function HeightPicker({
  value,
  onChange,
  minHeight = 140,
  maxHeight = 220,
  className
}: HeightPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // 计算身高比例
  const heightToPosition = (height: number): number => {
    return ((height - minHeight) / (maxHeight - minHeight)) * 100;
  };

  // 计算位置对应的身高
  const positionToHeight = (position: number): number => {
    return Math.round(((position / 100) * (maxHeight - minHeight)) + minHeight);
  };

  // 处理拖动事件
  const handleDrag = (clientY: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const relativeY = clientY - rect.top;
      
      // 计算百分比位置（从下往上）
      let percentage = 100 - (relativeY / containerHeight * 100);
      
      // 限制在0-100之间
      percentage = Math.max(0, Math.min(100, percentage));
      
      // 转换为身高值
      const newHeight = positionToHeight(percentage);
      setDisplayValue(newHeight);
      onChange(newHeight);
    }
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleDrag(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleDrag(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      e.preventDefault(); // 阻止页面滚动
      handleDrag(e.touches[0].clientY);
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

  // 计算当前高度的位置百分比
  const currentPosition = heightToPosition(displayValue);
  
  // 设置人形图案的最小和最大高度，确保始终有适当的间隙
  const minDisplayHeight = 45; // 增大最小高度，确保假人始终足够大
  const maxDisplayHeight = 85; // 最高不超过85%，留出顶部间隙
  const personHeight = Math.max(minDisplayHeight, Math.min(currentPosition, maxDisplayHeight));

  // 生成刻度尺刻度
  const generateScaleMarkers = () => {
    const markers = [];
    const step = 10; // 每10cm一个刻度
    const majorStep = 50; // 每50cm一个主要刻度
    
    for (let height = minHeight; height <= maxHeight; height += step) {
      const position = 100 - heightToPosition(height); // 反转位置计算，因为CSS中0%是顶部
      const isMajor = height % majorStep === 0;
      
      markers.push(
        <div 
          key={height}
          className={cn(
            "absolute right-0 flex items-center",
            isMajor ? "h-5" : "h-3"
          )}
          style={{ top: `${position}%` }}
        >
          <div 
            className={cn(
              "h-[1px] bg-gray-400",
              isMajor ? "w-4" : "w-2"
            )}
          />
          {isMajor && (
            <span className="text-xs font-medium text-gray-600 ml-1">
              {height}
            </span>
          )}
        </div>
      );
    }
    
    return markers;
  };

  // 生成当前高度指示器
  const getCurrentHeightIndicator = () => {
    const position = 100 - heightToPosition(displayValue);
    
    return (
      <div 
        className="absolute right-0 flex items-center"
        style={{ top: `${position}%` }}
      >
        <div className="h-[2px] w-5 bg-blue-500" />
        <div className="ml-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md">
          {displayValue} cm
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative w-full max-w-sm mx-auto", className)}>
      {/* 显示当前身高值 */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="relative inline-block">
          <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {displayValue}
          </span>
          <span className="text-xl sm:text-2xl text-gray-500 ml-2">cm</span>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* 身高选择器容器 */}
      <div 
        ref={containerRef}
        className="relative h-[240px] sm:h-[280px] md:h-[320px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl overflow-hidden cursor-pointer shadow-inner border border-gray-200"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 背景网格 */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>

        {/* 刻度尺 */}
        <div className="absolute top-0 bottom-0 right-0 w-10">
          {/* 刻度线 */}
          {generateScaleMarkers()}
          
          {/* 当前高度指示器 */}
          {getCurrentHeightIndicator()}
        </div>

        {/* 人物轮廓 SVG - 改进的设计 */}
        <div 
          className="absolute left-1/2 bottom-0 transform -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ height: `${personHeight}%` }}
        >
          <svg
            width="80"
            height="100%"
            viewBox="0 0 80 300"
            preserveAspectRatio="xMidYMax meet"
            className="drop-shadow-lg"
          >
            {/* 定义渐变 */}
            <defs>
              <linearGradient id="personGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="personStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 人物轮廓 - 更详细的设计 */}
            <g fill="url(#personGradient)" stroke="url(#personStroke)" strokeWidth="2" filter="url(#glow)">
              {/* 头部 */}
              <circle cx="40" cy="25" r="18" />
              
              {/* 颈部 */}
              <rect x="37" y="43" width="6" height="12" rx="3" />
              
              {/* 身体主体 */}
              <rect x="25" y="55" width="30" height="80" rx="15" />
              
              {/* 手臂 */}
              <ellipse cx="15" cy="75" rx="8" ry="25" />
              <ellipse cx="65" cy="75" rx="8" ry="25" />
              
              {/* 腿部 */}
              <ellipse cx="32" cy="155" rx="8" ry="35" />
              <ellipse cx="48" cy="155" rx="8" ry="35" />
              
              {/* 脚部 */}
              <ellipse cx="30" cy="195" rx="12" ry="6" />
              <ellipse cx="50" cy="195" rx="12" ry="6" />
            </g>

            {/* 面部特征 */}
            <g fill="#1d4ed8" opacity="0.7">
              <circle cx="35" cy="22" r="2" />
              <circle cx="45" cy="22" r="2" />
              <path d="M35 28 Q40 32 45 28" stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
            </g>
          </svg>
        </div>

        {/* 底部阴影 */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-200/50 to-transparent"></div>
      </div>
    </div>
  );
} 