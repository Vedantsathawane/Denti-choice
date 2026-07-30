# Scalability Audit Report

## 1. Stateless App Servers
- **JWT Authentication**: User sessions are stateless and decoded dynamically on each request. The Node.js application servers can scale out horizontally behind load balancers with no session synchronization requirements.
- **Dockerization**: Containers can be distributed across multi-region Kubernetes clusters or AWS ECS instances.

## 2. Distributed Socket.IO & Caching (Redis Recommendations)
- **Redis Adapter**: When scaling to multiple server instances, configure the Socket.IO Redis Adapter (`socket.io-redis`) to sync dashboard updates across instances.
- **API Caching**: Cache common lookup requests (like clinic public site layout details) in Redis, reducing database load.

## 3. Database Scaling
- **Read Replicas**: Aiven Cloud MySQL databases support read replicas. Read-only queries (like public website layout details) can be routed to replicas, freeing up primary databases for appointments bookings and payments transactions.
- **Connection Pools**: Adjust pool configurations dynamically based on container sizes.
