import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number  // 1-5的评分
  maxStars?: number  // 最大星数，默认5
  className?: string
  color?: 'default' | 'yellow' | 'red' | 'green'  // 星星颜色主题
}

export function StarRating({ 
  rating, 
  maxStars = 5, 
  className = "", 
  color = 'default' 
}: StarRatingProps) {
  // 确保评分在有效范围内
  const safeRating = Math.max(1, Math.min(maxStars, Math.round(rating)))
  
  // 根据颜色主题选择样式
  const getStarColors = () => {
    switch (color) {
      case 'yellow':
        return {
          filled: 'text-yellow-400 fill-yellow-400',
          empty: 'text-gray-300'
        }
      case 'red':
        return {
          filled: 'text-red-500 fill-red-500',
          empty: 'text-gray-300'
        }
      case 'green':
        return {
          filled: 'text-green-500 fill-green-500',
          empty: 'text-gray-300'
        }
      default:
        return {
          filled: 'text-blue-500 fill-blue-500',
          empty: 'text-gray-300'
        }
    }
  }
  
  const colors = getStarColors()
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < safeRating ? colors.filled : colors.empty
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-1">
        {safeRating}/{maxStars}
      </span>
    </div>
  )
} 