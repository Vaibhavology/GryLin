import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { CheckCircle2, AlertTriangle, Clock, Calendar, ChevronRight } from 'lucide-react-native';
import { Item, GuardianAlert } from '../types';

interface AlertRowProps {
  alert: GuardianAlert;
  item: Item | undefined;
  onPress: () => void;
  onMarkPaid: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

export function AlertRow({ alert, item, onPress, onMarkPaid }: AlertRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;

  // Calculate urgency
  const now = new Date();
  const triggerDate = new Date(alert.trigger_date);
  const daysUntil = Math.ceil((triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Urgency styling
  const getUrgencyStyle = () => {
    if (daysUntil < 0) {
      return {
        bg: '#FEF2F2',
        border: '#FECACA',
        dateBoxBg: '#EF4444',
        dateBoxText: '#FFF',
        statusDot: '#EF4444',
        label: 'OVERDUE',
        labelColor: '#DC2626',
      };
    }
    if (daysUntil <= 3) {
      return {
        bg: '#FFF7ED',
        border: '#FED7AA',
        dateBoxBg: '#F97316',
        dateBoxText: '#FFF',
        statusDot: '#F97316',
        label: 'URGENT',
        labelColor: '#EA580C',
      };
    }
    if (daysUntil <= 7) {
      return {
        bg: '#FFFBEB',
        border: '#FDE68A',
        dateBoxBg: '#F59E0B',
        dateBoxText: '#FFF',
        statusDot: '#F59E0B',
        label: 'THIS WEEK',
        labelColor: '#D97706',
      };
    }
    return {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      dateBoxBg: '#1A73E8',
      dateBoxText: '#FFF',
      statusDot: '#1A73E8',
      label: 'UPCOMING',
      labelColor: '#1A73E8',
    };
  };

  const urgency = getUrgencyStyle();

  // Format date for date box
  const formatDateBox = () => {
    const day = triggerDate.getDate();
    const month = triggerDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const dateBox = formatDateBox();

  // Format due text
  const getDueText = () => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) > 1 ? 's' : ''} overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  // Pan responder for swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -SCREEN_WIDTH * 0.4));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe complete - mark as paid
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rowOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onMarkPaid();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  if (!item) return null;

  return (
    <View style={styles.container}>
      {/* Swipe background */}
      <View style={styles.swipeBackground}>
        <View style={styles.swipeAction}>
          <CheckCircle2 size={24} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.swipeText}>Mark Paid</Text>
        </View>
      </View>

      {/* Main row */}
      <Animated.View
        style={[
          styles.row,
          {
            backgroundColor: urgency.bg,
            borderColor: urgency.border,
            transform: [{ translateX }],
            opacity: rowOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.rowContent} onPress={onPress} activeOpacity={0.7}>
          {/* Date Box */}
          <View style={[styles.dateBox, { backgroundColor: urgency.dateBoxBg }]}>
            <Text style={[styles.dateDay, { color: urgency.dateBoxText }]}>{dateBox.day}</Text>
            <Text style={[styles.dateMonth, { color: urgency.dateBoxText }]}>{dateBox.month}</Text>
          </View>

          {/* Details */}
          <View style={styles.details}>
            <View style={styles.titleRow}>
              <Text style={styles.vendor} numberOfLines={1}>{item.title}</Text>
              {daysUntil < 0 && (
                <AlertTriangle size={14} color="#DC2626" strokeWidth={2.5} />
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{item.category}</Text>
              <View style={styles.metaDot} />
              <Text style={[styles.dueText, { color: urgency.labelColor }]}>{getDueText()}</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            {item.amount ? (
              <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
            ) : (
              <Text style={styles.noAmount}>-</Text>
            )}
          </View>

          {/* Status Dot */}
          <View style={[styles.statusDot, { backgroundColor: urgency.statusDot }]} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    position: 'relative',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  swipeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  details: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  noAmount: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AlertRow;
