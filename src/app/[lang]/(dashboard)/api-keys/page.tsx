'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useFeaturePermission } from '@/hooks/use-subscription-plan'
import { Feature } from '@/lib/subscription-plans'
import { FeatureGuard } from '@/components/subscription/feature-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar, 
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface ApiKey {
  id: number
  apiKey: string
  name: string
  description?: string
  status: '1' | '0'
  lastUsedAt?: string
  usageCount: number
  monthlyUsage: number
  monthlyLimit: number
  expiresAt?: string
  createdAt: string
}

export default function ApiKeysPage({ params }: { params: { lang: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [showNewApiKey, setShowNewApiKey] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyLimit: '10000',
    expiresAt: ''
  })

  // 获取API密钥列表
  const fetchApiKeys = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/api-keys')
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      if (data.success) {
        setApiKeys(data.data || [])
      }
    } catch (error) {
      console.error('获取API密钥失败:', error)
      toast({
        title: '获取失败',
        description: '无法获取API密钥列表，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 创建API密钥
  const createApiKey = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: 'API密钥名称不能为空',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          monthlyLimit: parseInt(formData.monthlyLimit) || 10000,
          expiresAt: formData.expiresAt || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      if (data.success) {
        setNewApiKey(data.apiKey)
        setShowNewApiKey(true)
        setShowCreateDialog(false)
        setFormData({
          name: '',
          description: '',
          monthlyLimit: '10000',
          expiresAt: ''
        })
        await fetchApiKeys()
        
        toast({
          title: '创建成功',
          description: 'API密钥已创建，请妥善保存',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('创建API密钥失败:', error)
      toast({
        title: '创建失败',
        description: error.message || '创建API密钥失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // 删除API密钥
  const deleteApiKey = async (id: number) => {
    try {
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete API key')
      }

      if (data.success) {
        await fetchApiKeys()
        toast({
          title: '删除成功',
          description: 'API密钥已删除',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('删除API密钥失败:', error)
      toast({
        title: '删除失败',
        description: error.message || '删除API密钥失败，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  // 切换API密钥状态
  const toggleApiKeyStatus = async (id: number, currentStatus: '1' | '0') => {
    const newStatus = currentStatus === '1' ? '0' : '1'
    
    try {
      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update API key status')
      }

      if (data.success) {
        await fetchApiKeys()
        toast({
          title: '更新成功',
          description: `API密钥已${newStatus === '1' ? '启用' : '禁用'}`,
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('更新API密钥状态失败:', error)
      toast({
        title: '更新失败',
        description: error.message || '更新API密钥状态失败，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: '复制成功',
        description: 'API密钥已复制到剪贴板',
        variant: 'default'
      })
    } catch (error) {
      console.error('复制失败:', error)
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板，请手动复制',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    if (session) {
      fetchApiKeys()
    }
  }, [session])

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <Button onClick={() => router.push('/auth/signin')}>
            登录
          </Button>
        </div>
      </div>
    )
  }

  return (
    <FeatureGuard feature={Feature.API_ACCESS} currentLang={params.lang}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API密钥管理</h1>
          <p className="text-gray-600">
            管理您的API密钥，用于集成LuckGuides翻译服务到您的应用程序中
          </p>
        </div>

        {/* 创建API密钥按钮 */}
        <div className="mb-6">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                创建API密钥
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>创建新的API密钥</DialogTitle>
                <DialogDescription>
                  创建一个新的API密钥用于访问LuckGuides API
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：我的应用API密钥"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    placeholder="API密钥的用途描述（可选）"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyLimit">月度调用限制</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">过期时间（可选）</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  取消
                </Button>
                <Button onClick={createApiKey} disabled={isCreating}>
                  {isCreating ? '创建中...' : '创建'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 新创建的API密钥显示 */}
        {newApiKey && (
          <Dialog open={showNewApiKey} onOpenChange={setShowNewApiKey}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  API密钥创建成功
                </DialogTitle>
                <DialogDescription>
                  请妥善保存您的API密钥，出于安全考虑，我们不会再次显示完整密钥
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono break-all">{newApiKey}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  请立即复制并保存此API密钥，关闭此对话框后将无法再次查看完整密钥
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setShowNewApiKey(false)
                  setNewApiKey(null)
                }}>
                  我已保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* API密钥列表 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无API密钥</h3>
                <p className="text-gray-600 mb-4">创建您的第一个API密钥来开始使用LuckGuides API</p>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                      {apiKey.description && (
                        <CardDescription>{apiKey.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.status === '1' ? 'default' : 'secondary'}>
                        {apiKey.status === '1' ? '活跃' : '禁用'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* API密钥显示 */}
                    <div>
                      <Label className="text-sm font-medium">API密钥</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                          {apiKey.apiKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey.apiKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 使用统计 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">总调用次数</Label>
                        <p className="font-medium">{apiKey.usageCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">本月使用</Label>
                        <p className="font-medium">
                          {apiKey.monthlyUsage.toLocaleString()} / {apiKey.monthlyLimit.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">最后使用</Label>
                        <p className="font-medium">
                          {apiKey.lastUsedAt 
                            ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                            : '从未使用'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">创建时间</Label>
                        <p className="font-medium">
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleApiKeyStatus(apiKey.id, apiKey.status)}
                      >
                        {apiKey.status === '1' ? '禁用' : '启用'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除API密钥 "{apiKey.name}" 吗？此操作无法撤销，使用此密钥的应用程序将无法继续访问API。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApiKey(apiKey.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* API文档链接 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">API文档</CardTitle>
            <CardDescription>
              了解如何在您的应用程序中集成LuckGuides API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>API端点：</strong> <code>https://luckguides.com/api/v1/translate</code>
              </p>
              <p className="text-sm">
                <strong>认证方式：</strong> Bearer Token（使用您的API密钥）
              </p>
              <p className="text-sm">
                <strong>请求示例：</strong>
              </p>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`curl -X POST https://luckguides.com/api/v1/translate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, world!",
    "from": "en",
    "to": "zh"
  }'`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGuard>
  )
}
