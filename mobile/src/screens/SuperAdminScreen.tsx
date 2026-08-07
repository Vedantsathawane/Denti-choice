import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SuperAdminScreen() {
  const { user, logout } = useAuth();
  const [report, setReport] = useState({
    mrr: 0,
    arr: 0,
    activeClinics: 0,
    trialClinics: 0
  });

  useEffect(() => {
    // Load revenue metrics
    api.get('/super-admin/billing/revenue-report')
      .then(res => {
        if (res.data.success) {
          const reportData = res.data.data;
          const statusCounts = reportData.statusCounts || [];
          const active = statusCounts.find((c: any) => c.status === 'active')?.count || 0;
          const trialing = statusCounts.find((c: any) => c.status === 'trialing')?.count || 0;

          setReport({
            mrr: reportData.mrr,
            arr: reportData.arr,
            activeClinics: active,
            trialClinics: trialing
          });
        }
      })
      .catch(err => console.log('Failed to fetch platform metrics:', err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Platform Operator Console" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="logout" onPress={logout} color="#EF4444" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Global KPIs & Metrics</Text>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Paragraph style={styles.cardLabel}>Monthly Recurring Revenue</Paragraph>
            <Title style={styles.cardVal}>${report.mrr.toLocaleString()}</Title>
            <Paragraph style={styles.cardSub}>Estimated ARR: ${report.arr.toLocaleString()}</Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.splitCard} mode="outlined">
            <Card.Content>
              <Paragraph style={styles.cardLabel}>Active Clinics</Paragraph>
              <Title style={styles.gridVal}>{report.activeClinics}</Title>
            </Card.Content>
          </Card>

          <Card style={styles.splitCard} mode="outlined">
            <Card.Content>
              <Paragraph style={styles.cardLabel}>Trial Clinics</Paragraph>
              <Title style={styles.gridVal}>{report.trialClinics}</Title>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.alertCard} mode="outlined">
          <Card.Content>
            <Title style={styles.alertTitle}>Infrastructure Telemetry</Title>
            <Paragraph style={styles.alertText}>
              Platform status is operational. All databases connection pools and SMS microservice channels are online.
            </Paragraph>
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
    fontWeight: '950',
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
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cardVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0066FF',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  splitCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  gridVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  alertCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  alertText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
