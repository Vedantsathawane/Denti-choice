import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: { navigation: DashboardScreenNavigationProp }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    appointmentsCount: 0,
    doctorsCount: 0,
    activeSubscribers: 0
  });

  useEffect(() => {
    // Load dashboard counts from clinic usage stats
    api.get('/billing/usage')
      .then(res => {
        if (res.data.success) {
          const statsData = res.data.data;
          setStats({
            appointmentsCount: statsData.usage.appointments,
            doctorsCount: statsData.usage.doctors,
            activeSubscribers: 1
          });
        }
      })
      .catch(err => console.log('Failed to fetch dashboard metrics:', err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={user?.name || 'Clinic Dashboard'} titleStyle={styles.headerTitle} />
        <Appbar.Action icon="logout" onPress={logout} color="#EF4444" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Today's Statistics</Text>

        <View style={styles.grid}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Paragraph style={styles.cardLabel}>Appointments</Paragraph>
              <Title style={styles.cardVal}>{stats.appointmentsCount}</Title>
            </Card.Content>
          </Card>

          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Paragraph style={styles.cardLabel}>Active Doctors</Paragraph>
              <Title style={styles.cardVal}>{stats.doctorsCount}</Title>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.actionCard} mode="outlined">
          <Card.Content style={styles.actionContent}>
            <Title style={styles.actionTitle}>AI Clinical Assistant</Title>
            <Paragraph style={styles.actionDesc}>Generate SOAP patient logs and treatments timeline notes drafts.</Paragraph>
            <Button
              mode="contained"
              buttonColor="#0066FF"
              onPress={() => navigation.navigate('AiAssistant')}
              style={styles.actionButton}
            >
              Open AI Copilot
            </Button>
          </Card.Content>
        </Card>
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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  cardVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0066FF',
    marginTop: 4,
  },
  actionCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  actionContent: {
    padding: 20,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
  },
});
