import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, X, Zap, Sparkles, FileText, Shield, AlertCircle, CheckCircle2, FolderOpen, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ReviewModal } from '../../components/ReviewModal';
import { useAuthStore } from '../../stores/authStore';
import { useItemsStore, ScanResult } from '../../stores/itemsStore';
import { useAlertStore } from '../../stores/alertStore';
import { useGuardianStore } from '../../stores/guardianStore';
import { DocumentAnalysis } from '../../types';

// Dynamic import for expo-camera
let CameraView: any = null;
let useCameraPermissions: any = null;

try {
  const camera = require('expo-camera');
  CameraView = camera.CameraView;
  useCameraPermissions = camera.useCameraPermissions;
} catch (e) {
  console.log('Camera module not available - using fallback');
}

const SCAN_STEPS = [
  { id: 1, label: 'Capturing image', icon: CameraIcon },
  { id: 2, label: 'AI analysis', icon: Sparkles },
  { id: 3, label: 'Auto-categorizing', icon: FolderOpen },
  { id: 4, label: 'Scam detection', icon: Shield },
];

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [capturedImagePath, setCapturedImagePath] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const cameraRef = useRef<any>(null);
  
  const { user } = useAuthStore();
  const { scanDocument, addItem, createAlertForItem, isScanning, scanProgress } = useItemsStore();
  const { showAlert } = useAlertStore();
  const { fetchAlerts } = useGuardianStore();
  
  const userId = user?.id || '';
  const isCameraAvailable = CameraView !== null;

  const handleCapture = async () => {
    if (!cameraRef.current || !userId) {
      showAlert('Please sign in to scan documents', 'error');
      return;
    }

    try {
      setCurrentStep(1);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('Failed to capture photo');

      setCurrentStep(2);
      const result = await scanDocument(photo.uri, userId);
      
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 200));
      
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 200));
      
      setAnalysisResult(result.analysis);
      setScanResult(result);
      setCapturedImagePath(result.imageUrl);
      setCurrentStep(0);
      setShowReviewModal(true);
    } catch (error) {
      setCurrentStep(0);
      showAlert(error instanceof Error ? error.message : 'Failed to analyze document', 'error');
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult || !capturedImagePath || !userId || !scanResult) return;

    try {
      // Create the item with auto-assigned folder
      const newItem = await addItem({
        user_id: userId,
        title: analysisResult.title,
        category: analysisResult.category,
        amount: analysisResult.amount,
        due_date: analysisResult.due_date,
        summary: analysisResult.summary_bullets,
        status: 'new',
        image_url: capturedImagePath,
        is_scam: analysisResult.is_scam,
        folder_id: scanResult.autoAssignedFolderId, // Auto-assigned folder!
        source_type: 'scan',
        email_id: null,
        email_account_id: null,
        life_stack_id: null,
        risk_score: analysisResult.risk_score ?? 0,
      });

      // Auto-create alert if due date exists
      let alertInfo = { created: false, alertType: null as any };
      if (analysisResult.due_date) {
        alertInfo = await createAlertForItem(newItem, userId);
        // Refresh alerts to show the new one
        await fetchAlerts(userId);
      }

      // Build success message
      let successMessage = 'Document saved';
      const extras: string[] = [];
      
      if (scanResult.autoAssignedFolderName) {
        extras.push(`→ ${scanResult.autoAssignedFolderName}`);
      }
      if (alertInfo.created) {
        extras.push('🔔 Reminder set');
      }
      if (analysisResult.is_scam) {
        extras.push('⚠️ Flagged as potential scam');
      }
      
      if (extras.length > 0) {
        successMessage += ` (${extras.join(', ')})`;
      }

      showAlert(
        successMessage, 
        analysisResult.is_scam ? 'warning' : 'success'
      );
      
      setShowReviewModal(false);
      setAnalysisResult(null);
      setScanResult(null);
      setCapturedImagePath(null);
      router.push('/(tabs)/vault');
    } catch (error) {
      showAlert('Failed to save document', 'error');
    }
  };

  const handleCancel = () => {
    setShowReviewModal(false);
    setAnalysisResult(null);
    setScanResult(null);
    setCapturedImagePath(null);
  };

  // Camera not available
  if (!isCameraAvailable) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={[styles.permissionIcon, { backgroundColor: '#FEF3C7' }]}>
            <AlertCircle size={48} color="#D97706" strokeWidth={1.5} />
          </View>
          
          <Text style={styles.permissionTitle}>Camera Not Available</Text>
          <Text style={styles.permissionText}>
            Camera features require a development build. Use the web version or build the app to access scanning.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Sparkles size={18} color="#7C3AED" strokeWidth={2} />
              <Text style={styles.featureText}>AI-powered text extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={18} color="#16A34A" strokeWidth={2} />
              <Text style={styles.featureText}>Automatic scam detection</Text>
            </View>
            <View style={styles.featureItem}>
              <FileText size={18} color="#1A73E8" strokeWidth={2} />
              <Text style={styles.featureText}>Smart categorization</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.permissionButton} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
            <Text style={styles.permissionButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <CameraIcon size={48} color="#1A73E8" strokeWidth={1.5} />
          </View>
          
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            GryLin needs camera access to scan your documents and extract information automatically.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Sparkles size={18} color="#7C3AED" strokeWidth={2} />
              <Text style={styles.featureText}>AI-powered extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={18} color="#16A34A" strokeWidth={2} />
              <Text style={styles.featureText}>Scam detection</Text>
            </View>
            <View style={styles.featureItem}>
              <FileText size={18} color="#1A73E8" strokeWidth={2} />
              <Text style={styles.featureText}>Auto-categorization</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>
              {permission.canAskAgain ? 'Allow Camera Access' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      
      <SafeAreaView style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
            <X size={24} color="#FFF" strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.aiTag}>
            <Zap size={14} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.aiTagText}>AI Scanner</Text>
          </View>
          
          <View style={{ width: 48 }} />
        </View>

        {/* Frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            {/* Processing overlay */}
            {(isScanning || currentStep > 0) && (
              <View style={styles.processingOverlay}>
                <View style={styles.processingContent}>
                  <View style={styles.stepsContainer}>
                    {SCAN_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = currentStep === step.id;
                      const isComplete = currentStep > step.id;
                      return (
                        <View key={step.id} style={styles.stepItem}>
                          <View style={[
                            styles.stepIconWrap,
                            isActive && styles.stepIconActive,
                            isComplete && styles.stepIconComplete,
                          ]}>
                            {isComplete ? (
                              <CheckCircle2 size={20} color="#22C55E" strokeWidth={2.5} />
                            ) : (
                              <StepIcon 
                                size={18} 
                                color={isActive ? '#FFF' : 'rgba(255,255,255,0.4)'} 
                                strokeWidth={2} 
                              />
                            )}
                          </View>
                          <Text style={[
                            styles.stepLabel,
                            isActive && styles.stepLabelActive,
                            isComplete && styles.stepLabelComplete,
                          ]}>
                            {step.label}
                          </Text>
                          {isActive && (
                            <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 8 }} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>
          
          <Text style={styles.hint}>Position document within frame</Text>
          <Text style={styles.subHint}>Bills, receipts, invoices, or any document</Text>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, (isScanning || currentStep > 0) && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isScanning || currentStep > 0}
              activeOpacity={0.85}
            >
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner}>
                  {(isScanning || currentStep > 0) ? (
                    <ActivityIndicator size="small" color="#1A73E8" />
                  ) : (
                    <CameraIcon size={28} color="#1A73E8" strokeWidth={2} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.captureHint}>
              {(isScanning || currentStep > 0) ? 'Processing...' : 'Tap to scan'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ReviewModal
        visible={showReviewModal}
        analysis={analysisResult}
        autoFolderName={scanResult?.autoAssignedFolderName}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8F9FA',
  },
  camera: { 
    flex: 1,
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject,
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  closeButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  aiTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    gap: 6,
  },
  aiTagText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#FFF',
  },
  frameContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 32,
  },
  frame: { 
    width: '100%', 
    aspectRatio: 0.7, 
    position: 'relative',
  },
  corner: { 
    position: 'absolute', 
    width: 36, 
    height: 36, 
    borderColor: '#FFF',
  },
  cornerTL: { 
    top: 0, 
    left: 0, 
    borderTopWidth: 4, 
    borderLeftWidth: 4, 
    borderTopLeftRadius: 12,
  },
  cornerTR: { 
    top: 0, 
    right: 0, 
    borderTopWidth: 4, 
    borderRightWidth: 4, 
    borderTopRightRadius: 12,
  },
  cornerBL: { 
    bottom: 0, 
    left: 0, 
    borderBottomWidth: 4, 
    borderLeftWidth: 4, 
    borderBottomLeftRadius: 12,
  },
  cornerBR: { 
    bottom: 0, 
    right: 0, 
    borderBottomWidth: 4, 
    borderRightWidth: 4, 
    borderBottomRightRadius: 12,
  },
  processingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 12,
  },
  processingContent: { 
    alignItems: 'center', 
    padding: 24,
    width: '100%',
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIconActive: {
    backgroundColor: '#1A73E8',
  },
  stepIconComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  stepLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    flex: 1,
  },
  stepLabelActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  stepLabelComplete: {
    color: '#22C55E',
  },
  hint: { 
    fontSize: 17, 
    fontWeight: '500', 
    color: '#FFF', 
    marginTop: 32, 
    textAlign: 'center',
  },
  subHint: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.7)', 
    marginTop: 8, 
    textAlign: 'center',
  },
  bottomBar: { 
    alignItems: 'center', 
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
  },
  captureContainer: { 
    alignItems: 'center',
  },
  captureButton: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: { 
    opacity: 0.7,
  },
  captureButtonOuter: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 4, 
    borderColor: '#1A73E8', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  captureButtonInner: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    backgroundColor: '#EFF6FF', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  captureHint: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 16, 
    fontWeight: '500',
  },
  permissionContainer: { 
    flex: 1, 
    backgroundColor: '#FFF',
  },
  permissionContent: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 40,
  },
  permissionIcon: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#EFF6FF', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 32,
  },
  permissionTitle: { 
    fontSize: 28, 
    fontWeight: '600', 
    color: '#1F2937', 
    marginBottom: 12, 
    textAlign: 'center',
  },
  permissionText: { 
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 32,
  },
  featureList: { 
    gap: 16, 
    marginBottom: 40, 
    width: '100%',
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14,
  },
  featureText: { 
    fontSize: 16, 
    color: '#4B5563',
  },
  permissionButton: { 
    backgroundColor: '#1A73E8', 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    borderRadius: 14,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: '#FFF',
  },
});
