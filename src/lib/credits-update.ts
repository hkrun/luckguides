/**
 * 积分更新工具函数
 * 用于在换脸成功后触发导航栏积分显示更新
 */

/**
 * 触发积分更新事件
 * 这会通知所有监听 'creditsUpdated' 事件的组件更新积分显示
 */
export function triggerCreditsUpdate() {
  console.log('触发积分更新事件');
  
  // 创建自定义事件
  const event = new CustomEvent('creditsUpdated', {
    detail: {
      timestamp: Date.now(),
      source: 'luck-guides-success'
    }
  });
  
  // 派发事件
  window.dispatchEvent(event);
}

/**
 * 触发积分更新事件
 * 让积分显示组件重新获取最新的积分数据
 */
export function refreshCreditsAndNotify() {
  console.log('触发积分更新事件，让组件重新获取积分');
  triggerCreditsUpdate();
}
