import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
  monthNames?: string[];
  daySuffix?: string;
}

export function DatePicker({
  value,
  onChange,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  className,
  monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  daySuffix = '日'
}: DatePickerProps) {
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // 生成选项数组
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 获取指定年月的天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 生成日期选项
  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const ITEM_HEIGHT = 48; // 每个选项的高度
  const OFFSET_HEIGHT = 120; // 顶部偏移高度

  // 根据滚动位置获取选中项索引
  const getSelectedIndex = (scrollTop: number): number => {
    return Math.round((scrollTop) / ITEM_HEIGHT);
  };

  // 处理滚动事件
  const handleScroll = (
    element: HTMLDivElement,
    items: number[],
    setter: (value: number) => void
  ) => {
    const scrollTop = element.scrollTop;
    const index = getSelectedIndex(scrollTop);
    if (index >= 0 && index < items.length) {
      setter(items[index]);
    }
  };

  // 添加滚动事件监听
  useEffect(() => {
    const yearElement = yearScrollRef.current;
    const monthElement = monthScrollRef.current;
    const dayElement = dayScrollRef.current;

    if (yearElement) {
      const handleYearScroll = () => handleScroll(yearElement, years, setSelectedYear);
      yearElement.addEventListener('scroll', handleYearScroll);
      return () => yearElement.removeEventListener('scroll', handleYearScroll);
    }
  }, [years]);

  useEffect(() => {
    const monthElement = monthScrollRef.current;
    if (monthElement) {
      const handleMonthScroll = () => handleScroll(monthElement, months, setSelectedMonth);
      monthElement.addEventListener('scroll', handleMonthScroll);
      return () => monthElement.removeEventListener('scroll', handleMonthScroll);
    }
  }, [months]);

  useEffect(() => {
    const dayElement = dayScrollRef.current;
    if (dayElement) {
      const handleDayScroll = () => handleScroll(dayElement, days, setSelectedDay);
      dayElement.addEventListener('scroll', handleDayScroll);
      return () => dayElement.removeEventListener('scroll', handleDayScroll);
    }
  }, [days]);

  // 滚动到选中项
  const scrollToSelected = (
    container: HTMLDivElement | null,
    index: number
  ) => {
    if (container) {
      const targetScroll = index * ITEM_HEIGHT;
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // 处理选择
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const index = years.indexOf(year);
    scrollToSelected(yearScrollRef.current, index);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const index = months.indexOf(month);
    scrollToSelected(monthScrollRef.current, index);
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const index = days.indexOf(day);
    scrollToSelected(dayScrollRef.current, index);
  };

  // 当选择改变时更新日期
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    const validDay = Math.min(selectedDay, maxDays);
    const newDate = new Date(selectedYear, selectedMonth - 1, validDay);
    onChange(newDate);
  }, [selectedYear, selectedMonth, selectedDay]);

  // 初始化滚动位置
  useEffect(() => {
    const yearIndex = years.indexOf(selectedYear);
    const monthIndex = months.indexOf(selectedMonth);
    const dayIndex = days.indexOf(selectedDay);

    scrollToSelected(yearScrollRef.current, yearIndex);
    scrollToSelected(monthScrollRef.current, monthIndex);
    scrollToSelected(dayScrollRef.current, dayIndex);
  }, []);

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      <div className="flex justify-between h-[280px] bg-white/80 dark:bg-muted/80 backdrop-blur-sm rounded-xl overflow-hidden">
        {/* 年份选择器 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute top-1/2 left-0 right-0 h-[48px] -translate-y-1/2 bg-primary/5 dark:bg-primary/10 border-y border-primary/10 dark:border-primary/20" />
          </div>
          
          <div 
            ref={yearScrollRef}
            className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="h-[120px]" />
            {years.map(year => (
              <div
                key={year}
                className={cn(
                  "h-[48px] flex items-center justify-center snap-center cursor-pointer transition-colors text-lg",
                  selectedYear === year ? "text-blue-500 font-semibold" : "text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </div>
            ))}
            <div className="h-[120px]" />
          </div>
        </div>

        {/* 月份选择器 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute top-1/2 left-0 right-0 h-[48px] -translate-y-1/2 bg-primary/5 dark:bg-primary/10 border-y border-primary/10 dark:border-primary/20" />
          </div>
          
          <div 
            ref={monthScrollRef}
            className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="h-[120px]" />
            {months.map(month => (
              <div
                key={month}
                className={cn(
                  "h-[48px] flex items-center justify-center snap-center cursor-pointer transition-colors text-lg",
                  selectedMonth === month ? "text-blue-500 font-semibold" : "text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
                onClick={() => handleMonthSelect(month)}
              >
                {monthNames[month - 1]}
              </div>
            ))}
            <div className="h-[120px]" />
          </div>
        </div>

        {/* 日期选择器 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-white dark:from-muted via-white/90 dark:via-muted/90 to-transparent z-10" />
            <div className="absolute top-1/2 left-0 right-0 h-[48px] -translate-y-1/2 bg-primary/5 dark:bg-primary/10 border-y border-primary/10 dark:border-primary/20" />
          </div>
          
          <div 
            ref={dayScrollRef}
            className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="h-[120px]" />
            {days.map(day => (
              <div
                key={day}
                className={cn(
                  "h-[48px] flex items-center justify-center snap-center cursor-pointer transition-colors text-lg",
                  selectedDay === day ? "text-blue-500 font-semibold" : "text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
                onClick={() => handleDaySelect(day)}
              >
                {day}{daySuffix}
              </div>
            ))}
            <div className="h-[120px]" />
          </div>
        </div>
      </div>
    </div>
  );
} 