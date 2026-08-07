import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, Card, Title, Paragraph, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type AiAssistantScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AiAssistant'>;

export default function AiAssistantScreen({ navigation }: { navigation: AiAssistantScreenNavigationProp }) {
  const [patientId, setPatientId] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [soapChart, setSoapChart] = useState<any>(null);

  const handleGenerateSOAP = async () => {
    if (!notes) {
      Alert.alert('Empty Input', 'Please enter some clinical findings first.');
      return;
    }
    setLoading(true);
    setSoapChart(null);
    try {
      const res = await api.post('/ai/doctor/chart', {
        appointmentId: 1, // Mock linking ID
        notes: notes
      });
      if (res.data.success) {
        setSoapChart(res.data.data);
      }
    } catch (err: any) {
      Alert.alert('Generation Failed', err.response?.data?.message || 'Failed to communicate with AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="AI Clinical Copilot" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Input Clinical Findings</Text>

        <TextInput
          label="Symptom findings, vitals, or doctor notes..."
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={styles.textArea}
          outlineColor="#E2E8F0"
          activeOutlineColor="#0066FF"
        />

        <Button
          mode="contained"
          onPress={handleGenerateSOAP}
          loading={loading}
          disabled={loading || !notes}
          style={styles.button}
          buttonColor="#0066FF"
        >
          Generate SOAP Records
        </Button>

        {soapChart && (
          <Card style={styles.resultCard} mode="outlined">
            <Card.Content style={styles.resultContent}>
              <Title style={styles.resultTitle}>SOAP Output Draft</Title>

              <Text style={styles.soapLabel}>Subjective (S)</Text>
              <Paragraph style={styles.soapText}>{soapChart.subjective || 'No details'}</Paragraph>

              <Text style={styles.soapLabel}>Objective (O)</Text>
              <Paragraph style={styles.soapText}>{soapChart.objective || 'No details'}</Paragraph>

              <Text style={styles.soapLabel}>Assessment (A)</Text>
              <Paragraph style={styles.soapText}>{soapChart.assessment || 'No details'}</Paragraph>

              <Text style={styles.soapLabel}>Plan (P)</Text>
              <Paragraph style={styles.soapText}>{soapChart.plan || 'No details'}</Paragraph>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    marginBottom: 24,
    paddingVertical: 4,
  },
  resultCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  resultContent: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  soapLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0066FF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
  },
  soapText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    lineHeight: 18,
  },
});
