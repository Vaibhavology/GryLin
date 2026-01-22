import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
}

interface ToastProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

const alertConfig = {
  success: { 
    icon: CheckCircle, 
    bg: '#FFF', 
    iconBg: '#E6F4EA',
    iconColor: '#34A853', 
    textColor: '#202124',
    accentColor: '#34A853',
  },
  error: { 
    icon: AlertCircle, 
    bg: '#FFF', 
    iconBg: '#FCE8E6',
    iconColor: '#EA4335', 
    textColor: '#202124',
    accentColor: '#EA4335',
  },
  warning: { 
    icon: AlertTriangle, 
    bg: '#FFF', 
    iconBg: '#FEF7E0',
    iconColor: '#EA8600', 
    textColor: '#202124',
    accentColor: '#EA8600',
  },
  info: { 
    icon: Info, 
    bg: '#FFF', 
    iconBg: '#E8F0FE',
    iconColor: '#1A73E8', 
    textColor: '#202124',
    accentColor: '#1A73E8',
  },
};

function Toast({ alert, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 }),
    ]).start();

    const timer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(alert.id));
  };

  return (
    <Animated.View 
      style={[
        styles.toast, 
        { 
          transform: [{ translateY }, { scale }], 
          opacity, 
          backgroundColor: config.bg,
        }
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />
      <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
        <Icon size={18} color={config.iconColor} strokeWidth={2.5} />
      </View>
      <Text style={[styles.toastText, { color: config.textColor }]} numberOfLines={2}>
        {alert.message}
      </Text>
      <TouchableOpacity 
        onPress={dismiss} 
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.closeBtn}
        activeOpacity={0.7}
      >
        <X size={16} color="#80868B" strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ToastContainerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ alerts, onDismiss }: ToastContainerProps) {
  if (alerts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {alerts.map((alert) => (
        <Toast key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 12,
    lineHeight: 20,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
