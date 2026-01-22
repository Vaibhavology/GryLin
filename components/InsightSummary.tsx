import React from 'react';
import { View, Text } from 'react-native';
import { FileText, Calendar, AlertTriangle } from 'lucide-react-native';

interface InsightSummaryProps {
  obligation: string;
  deadline: string;
  consequence: string;
}

export function InsightSummary({ obligation, deadline, consequence }: InsightSummaryProps) {
  const bullets = [
    {
      icon: FileText,
      color: '#3B82F6',
      bgColor: 'bg-blue-50',
      label: 'Obligation',
      text: obligation,
    },
    {
      icon: Calendar,
      color: '#8B5CF6',
      bgColor: 'bg-purple-50',
      label: 'Deadline',
      text: deadline,
    },
    {
      icon: AlertTriangle,
      color: '#F59E0B',
      bgColor: 'bg-amber-50',
      label: 'Consequence',
      text: consequence,
    },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <Text className="text-slate-900 font-semibold text-lg mb-4">Summary</Text>

      {bullets.map((bullet, index) => {
        const Icon = bullet.icon;
        return (
          <View
            key={index}
            className={`${bullet.bgColor} rounded-xl p-3 ${
              index < bullets.length - 1 ? 'mb-3' : ''
            }`}
          >
            <View className="flex-row items-start">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${bullet.color}20` }}
              >
                <Icon size={16} color={bullet.color} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: bullet.color }}
                >
                  {bullet.label}
                </Text>
                <Text className="text-slate-700">{bullet.text}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default InsightSummary;
