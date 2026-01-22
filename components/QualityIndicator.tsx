import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';

interface QualityIndicatorProps {
  score: number; // 0-100
  feedback?: string;
}

export function QualityIndicator({ score, feedback }: QualityIndicatorProps) {
  const getConfig = () => {
    if (score >= 70) {
      return {
        icon: CheckCircle,
        color: '#10B981',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Good Quality',
      };
    } else if (score >= 50) {
      return {
        icon: AlertCircle,
        color: '#F59E0B',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'Fair Quality',
      };
    } else {
      return {
        icon: XCircle,
        color: '#EF4444',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Poor Quality',
      };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <View className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-4`}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Icon size={20} color={config.color} />
          <Text className="ml-2 font-semibold" style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>
        <Text className="font-bold text-lg" style={{ color: config.color }}>
          {score}%
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-white rounded-full overflow-hidden mb-2">
        <View
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: config.color,
          }}
        />
      </View>

      {feedback && (
        <Text className="text-slate-600 text-sm mt-2">{feedback}</Text>
      )}

      {score < 70 && (
        <Text className="text-slate-500 text-xs mt-2">
          Improve quality for better AI extraction accuracy
        </Text>
      )}
    </View>
  );
}

export default QualityIndicator;
