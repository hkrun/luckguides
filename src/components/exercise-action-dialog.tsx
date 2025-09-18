'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, AlertTriangle, Dumbbell, Heart } from 'lucide-react';
import { ExerciseAction, ExerciseItem } from '@/types/exercise-plan';

interface ExerciseActionDialogProps {
  exercise: ExerciseItem | null;
  action: ExerciseAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  i18n: any;
}

export function ExerciseActionDialog({ exercise, action, open, onOpenChange, i18n }: ExerciseActionDialogProps) {
  if (!exercise || !action) return null;

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityText = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return i18n.exercisePlan.exerciseActionDialog.intensity.low;
      case 'medium':
        return i18n.exercisePlan.exerciseActionDialog.intensity.medium;
      case 'high':
        return i18n.exercisePlan.exerciseActionDialog.intensity.high;
      default:
        return i18n.exercisePlan.exerciseActionDialog.intensity.unknown;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="w-6 h-6 text-blue-600" />
            {action.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getIntensityColor(exercise.intensity)}>
              {getIntensityText(exercise.intensity)}
            </Badge>
            <Badge variant="outline" className="text-blue-600">
              {exercise.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 运动描述 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">{i18n.exercisePlan.exerciseActionDialog.actionDescription}</h4>
            <p className="text-blue-800">{action.description}</p>
          </div>

          {/* 详细步骤 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              {i18n.exercisePlan.exerciseActionDialog.detailedSteps}
            </h4>
            <div className="space-y-3">
              {action.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 组数次数信息 */}
          {(action.sets || action.reps || action.duration) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {action.sets && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">{i18n.exercisePlan.exerciseActionDialog.sets}</span>
                  </div>
                  <p className="text-purple-800">{action.sets}</p>
                </div>
              )}
              {action.reps && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">{i18n.exercisePlan.exerciseActionDialog.reps}</span>
                  </div>
                  <p className="text-purple-800">{action.reps}</p>
                </div>
              )}
              {action.duration && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">{i18n.exercisePlan.exerciseActionDialog.duration}</span>
                  </div>
                  <p className="text-purple-800">{action.duration}</p>
                </div>
              )}
            </div>
          )}

          {/* 心率控制 */}
          {exercise.heartRateControl && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                {i18n.exercisePlan.exerciseActionDialog.heartRateControl}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-800">{i18n.exercisePlan.exerciseActionDialog.targetHeartRate}</span>
                  <span className="text-red-700">{exercise.heartRateControl.range}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-800">{i18n.exercisePlan.exerciseActionDialog.calculationMethod}</span>
                  <span className="text-red-700">{exercise.heartRateControl.calculation}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-red-800">{i18n.exercisePlan.exerciseActionDialog.monitoringMethod}</span>
                  <span className="text-red-700">{exercise.heartRateControl.monitoring}</span>
                </div>
              </div>
            </div>
          )}

          {/* 技巧提示 */}
          {action.tips && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                💡 {i18n.exercisePlan.exerciseActionDialog.tips}
              </h4>
              <p className="text-amber-800">{action.tips}</p>
            </div>
          )}

          {/* 注意事项 */}
          {exercise.precautions && exercise.precautions.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                {i18n.exercisePlan.exerciseActionDialog.precautions}
              </h4>
              <div className="space-y-2">
                {exercise.precautions.map((precaution, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{precaution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 所需器材 */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{i18n.exercisePlan.exerciseActionDialog.requiredEquipment}</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-gray-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 