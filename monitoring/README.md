# EventSphere Monitoring Dashboard

This directory contains the Grafana dashboard configuration for monitoring the EventSphere Management Platform API.

## Dashboard Overview

The dashboard visualizes the following key metrics:

### Core Metrics
- **Request Rate (Throughput)**: Requests per second by method and route
- **Error Rate**: 4xx and 5xx errors per second
- **Response Time**: p50, p95, and p99 latency percentiles
- **Average Response Time**: Overall average response time

### Database Performance
- **Active Connections**: Current MongoDB connections
- **Operations/sec**: MongoDB operations rate
- **Query Duration**: MongoDB query performance
- **Query Performance**: p95 query time and queries per second

### Additional Metrics
- **Active Socket.io Connections**: Real-time connection count
- **Error Rate Percentage**: Overall error rate percentage
- **Request Count by Endpoint**: Breakdown by API route
- **Cache Hit Rate**: Redis cache performance (hits, misses, hit rate %)
- **Job Queue Status**: Bull queue metrics (waiting, active, completed, failed)

## Prerequisites

1. **Prometheus**: Metrics collection server
2. **Grafana**: Visualization and dashboard platform
3. **Metrics Middleware**: Backend must expose Prometheus metrics (see T260)

## Setup Instructions

### 1. Import Dashboard into Grafana

1. Open Grafana UI (typically http://localhost:3000)
2. Navigate to **Dashboards** → **Import**
3. Click **Upload JSON file** or paste the contents of `grafana-dashboard.json`
4. Configure the Prometheus datasource (UID: `prometheus`)
5. Click **Import**

### 2. Configure Prometheus Data Source

Ensure Grafana has a Prometheus data source configured:
- **Name**: Prometheus
- **Type**: Prometheus
- **URL**: http://localhost:9090 (or your Prometheus server URL)
- **UID**: prometheus (must match the dashboard configuration)

### 3. Metrics Collection

The dashboard expects the following Prometheus metrics:

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests (counter with labels: method, route, status)
- `http_request_duration_seconds` - Request duration histogram

#### Database Metrics
- `mongodb_connections_current` - Current MongoDB connections
- `mongodb_operations_total` - Total MongoDB operations
- `mongodb_query_duration_seconds` - MongoDB query duration histogram
- `mongodb_queries_total` - Total MongoDB queries

#### Cache Metrics
- `redis_cache_hits_total` - Redis cache hits
- `redis_cache_misses_total` - Redis cache misses

#### Socket.io Metrics
- `socket_io_connections_active` - Active Socket.io connections

#### Job Queue Metrics
- `bull_queue_waiting` - Jobs waiting in queue
- `bull_queue_active` - Active jobs
- `bull_queue_completed` - Completed jobs
- `bull_queue_failed` - Failed jobs

### 4. Customization

The dashboard can be customized:
- **Time Range**: Default is last 6 hours, adjustable via time picker
- **Refresh Interval**: Default is 30 seconds
- **Environment Variable**: Filter by environment (if configured)
- **Thresholds**: Adjust color thresholds in panel settings

## Notes

- The dashboard uses Prometheus query language (PromQL) for all metrics
- Metric names may need to be adjusted based on your actual Prometheus exporter implementation
- Ensure the metrics middleware (T260) is properly configured to expose these metrics
- The dashboard assumes standard Prometheus metric naming conventions

## Related Tasks

- **T260**: Add metrics collection middleware (required for this dashboard to work)
- **T261**: This dashboard configuration (completed)

