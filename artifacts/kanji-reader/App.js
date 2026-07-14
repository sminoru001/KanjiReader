import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { scanOCR } from 'react-native-vision-camera-ocr';
import { runOnJS } from 'react-native-reanimated';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [loading, setLoading] = useState(true);
  const [textoDetectado, setTextoDetectado] = useState([]);
  
  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await requestPermission();
      if (!status) {
        Alert.alert("Permissão Necessária", "Precisamos de acesso à câmera para ler os Kanjis.");
      }
      setLoading(false);
    })();
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const ocr = scanOCR(frame);
    
    if (ocr && ocr.blocks && ocr.blocks.length > 0) {
      const blocosJaponeses = ocr.blocks.filter(block => 
        /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]/.test(block.text)
      );
      
      runOnJS(setTextoDetectado)(blocosJaponeses);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.containerCentrado}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.textoStatus}>Carregando permissões...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.containerCentrado}>
        <Text style={styles.textoStatus}>Sem acesso à câmera.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.containerCentrado}>
        <Text style={styles.textoStatus}>Câmera traseira não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      {textoDetectado.map((bloco, index) => {
        const yomikataEstimada = bloco.text === "日本語" ? "にほんご" : "読み方 (A processar...)";

        return (
          <View 
            key={index} 
            style={[
              styles.caixaDinamica, 
              { 
                top: bloco.boundingBox.top, 
                left: bloco.boundingBox.left 
              }
            ]}
          >
            <Text style={styles.yomikataText}>{yomikataEstimada}</Text>
            <Text style={styles.kanjiText}>{bloco.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  containerCentrado: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  textoStatus: { color: '#fff', marginTop: 15, fontSize: 16 },
  caixaDinamica: {
    position: 'absolute',
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderColor: '#e74c3c',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    elevation: 5
  },
  yomikataText: { color: '#e74c3c', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  kanjiText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
