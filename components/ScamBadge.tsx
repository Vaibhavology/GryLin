import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

interface ScamBadgeProps {
  riskScore: number;
  scamIndicators?: string[];
  recommendation?: string;
}

export function ScamBadge({ riskScore, scamIndicators = [], recommendation }: ScamBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (riskScore < 70) {
    return null; // Only show badge for high-risk items
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowDetails(true)}
        className="flex-row items-center bg-red-500 px-2 py-1 rounded-full"
      >
        <AlertTriangle size={14} color="#FFFFFF" />
        <Text className="text-white text-xs font-semibold ml-1">SCAM WARNING</Text>
      </TouchableOpacity>

      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center p-4"
          onPress={() => setShowDetails(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <AlertTriangle size={24} color="#EF4444" />
                <Text className="text-lg font-bold text-red-500 ml-2">Scam Warning</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-700 font-semibold mb-2">
                Risk Score: {riskScore}/100
              </Text>
              <View className="h-2 bg-red-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${riskScore}%` }}
                />
              </View>
            </View>

            {scamIndicators.length > 0 && (
              <View className="mb-4">
                <Text className="font-semibold text-slate-900 mb-2">
                  Warning Signs Detected:
                </Text>
                {scamIndicators.map((indicator, index) => (
                  <View key={index} className="flex-row items-start mb-1">
                    <Text className="text-red-500 mr-2">•</Text>
                    <Text className="text-slate-600 flex-1">{indicator}</Text>
                  </View>
                ))}
              </View>
            )}

            {recommendation && (
              <View className="bg-amber-50 rounded-xl p-4">
                <Text className="text-amber-800 font-medium">{recommendation}</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default ScamBadge;
