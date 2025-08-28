# Docker Setup for MSRT Bot

This directory contains Docker configuration files for running the MSRT Discord bot in containerized environments.

## 📋 Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Discord bot token

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set your Discord bot token and other configurations:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DB_PASSWORD=your_secure_database_password
```

### 2. Production Deployment

Run the bot with PostgreSQL database:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop all services
docker-compose down
```

### 3. Development Mode

For development with hot reloading:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f bot-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## 📁 File Structure

```
.
├── Dockerfile              # Production Docker image
├── Dockerfile.dev          # Development Docker image with hot reload
├── docker-compose.yml      # Production Docker Compose
├── docker-compose.dev.yml  # Development Docker Compose
├── .dockerignore           # Files to exclude from Docker context
├── init.sql                # Database initialization script
└── .env.example            # Environment variables template
```

## 🗄️ Database

The setup includes a PostgreSQL database that:

- Runs on port `5432`
- Creates database `msrtbot` automatically
- Persists data using Docker volumes
- Includes health checks
- Runs initialization scripts from `init.sql`

### Database Connection

The bot connects to PostgreSQL using these environment variables:

- `DB_HOST`: Database hostname (set to `postgres` in Docker)
- `DB_PORT`: Database port (default: `5432`)
- `DB_NAME`: Database name (default: `msrtbot`)
- `DB_USER`: Database user (default: `postgres`)
- `DB_PASSWORD`: Database password

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | **Required** |
| `DB_HOST` | Database hostname | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `msrtbot` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `Hyg57aff` |
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `info` |

### Volumes

- `postgres_data`: PostgreSQL data persistence
- `bot_logs`: Bot application logs

## 🛠️ Common Commands

### Production Commands

```bash
# Start services in background
docker-compose up -d

# View real-time logs
docker-compose logs -f

# Restart bot service
docker-compose restart bot

# Update and restart
docker-compose pull && docker-compose up -d

# Backup database
docker exec msrt-bot-db pg_dump -U postgres msrtbot > backup.sql

# Restore database
cat backup.sql | docker exec -i msrt-bot-db psql -U postgres -d msrtbot
```

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Rebuild development image
docker-compose -f docker-compose.dev.yml build --no-cache bot-dev

# Access development container shell
docker-compose -f docker-compose.dev.yml exec bot-dev sh

# View database logs
docker-compose logs -f postgres
```

### Maintenance Commands

```bash
# Remove all containers and volumes (CAUTION: This will delete data!)
docker-compose down -v

# Clean up unused Docker resources
docker system prune -a

# View container resource usage
docker stats
```

## 🔍 Troubleshooting

### Bot Won't Start

1. Check logs: `docker-compose logs bot`
2. Verify Discord token in `.env`
3. Ensure database is healthy: `docker-compose ps`

### Database Connection Issues

1. Check database health: `docker-compose exec postgres pg_isready -U postgres`
2. Verify database credentials in `.env`
3. Check network connectivity: `docker-compose exec bot ping postgres`

### Permission Issues

1. Check file ownership: `ls -la`
2. Rebuild with no cache: `docker-compose build --no-cache`

### Memory Issues

1. Monitor resource usage: `docker stats`
2. Increase Docker memory limits in Docker Desktop settings
3. Optimize bot code for memory usage

## 🔒 Security Notes

- Change default database password
- Use secrets management for production
- Keep Discord token secure
- Regularly update base images
- Use non-root user in containers

## 📈 Monitoring

### Health Checks

The setup includes health checks for:

- PostgreSQL database connectivity
- Bot application status

### Logging

Logs are available via:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs bot
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f bot
```

## 🚀 Production Deployment

For production deployment:

1. Use proper secrets management
2. Set up log rotation
3. Configure backup strategies
4. Monitor resource usage
5. Set up reverse proxy if needed
6. Use Docker Swarm or Kubernetes for scaling

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify environment configuration
3. Ensure Docker and Docker Compose are up to date
4. Check Discord API status
5. Review database connectivity
