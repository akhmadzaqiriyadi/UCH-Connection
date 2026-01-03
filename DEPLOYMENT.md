# Panduan Deployment Multi-Server (App & DB Terpisah)

Dokumen ini menjelaskan langkah-langkah setup dan deploy aplikasi UCH Connection menggunakan arsitektur Cloud VPS terpisah untuk Aplikasi dan Database.

## 🏗️ Arsitektur Infrastruktur

```mermaid
graph LR
    User[User / Client] -->|HTTPS| AppVPS[App VPS (10.10.10.201)]
    
    subgraph "App Server (10.10.10.201)"
        PM2[PM2 Process Manager]
        App[UCH Connection API]
        Redis[Redis (Cache/Session)]
    end
    
    subgraph "Database Server (10.10.10.100)"
        PG[PostgreSQL Database]
    end

    PM2 --> App
    App -->|Port 6379| Redis
    App -->|Port 2100| PG
```

---

## 📋 Prasyarat

1.  **Akses VPN**: Pastikan VPN kampus terhubung.
2.  **SSH Key**: File private key (misal: `~/uch`) harus ada di laptop local.
3.  **OS Server**: Ubuntu 24.04 LTS (Recommended).

---

## 🛠️ Langkah 1: Setup Database VPS (10.10.10.100)

Server ini khusus menjalankan PostgreSQL.

### 1. Install PostgreSQL
Login ke VPS Database:
```bash
ssh -i ~/uch uch@10.10.10.100
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

### 2. Konfigurasi Port & Listen Address
Edit file konfigurasi utama:
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```
Ubah/tambahkan baris berikut:
```conf
listen_addresses = '*'          # Listen ke semua IP
port = 2100                     # Custom port (Security)
```

### 3. Konfigurasi Client Access (pg_hba.conf)
Izinkan App VPS (10.10.10.201) untuk connect:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```
Tambahkan di paling bawah:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    uch_connection_db uch_user      10.10.10.201/32        scram-sha-256
```

### 4. Setup Database & User
```bash
sudo systemctl restart postgresql
sudo -u postgres psql
```
SQL Commands:
```sql
CREATE DATABASE uch_connection_db;
CREATE USER uch_user WITH PASSWORD 'password_sangat_kuat_dan_rahasia';
GRANT ALL PRIVILEGES ON DATABASE uch_connection_db TO uch_user;
\q
```

---

## 🚀 Langkah 2: Setup App VPS (10.10.10.201)

Server ini menjalankan Aplikasi API dan Redis.

### 1. Install Dependencies
```bash
ssh -i ~/uch uch@10.10.10.201

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Redis
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2 (Process Manager)
npm install -g pm2
```

### 2. Setup Project Directory
```bash
mkdir -p /home/uch/UCH-Connection
```

### 3. Environment Variables (.env.production)
Buat file environment di `/home/uch/UCH-Connection/.env.production`:

```env
# DATABASE (arah ke IP 10.10.10.100 port 2100)
DATABASE_URL=postgresql://uch_user:password_sangat_kuat_dan_rahasia@10.10.10.100:2100/uch_connection_db

# REDIS (Localhost karena di server yang sama dengan app)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# APP & SECURITY
PORT=2201
NODE_ENV=production
JWT_SECRET=random_string_panjang_64_karakter
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 4. PM2 Configuration (ecosystem.config.cjs)
Config ini harus ada di root project repo git anda:

```javascript
module.exports = {
  apps: [{
    name: 'uch-app',
    script: 'bun',
    args: 'run src/index.ts',
    cwd: '/home/uch/UCH-Connection',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env.production',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true
  }]
};
```

---

## 🔄 Langkah 3: Script Deployment Otomatis

Gunakan script `deploy.sh` di laptop local untuk update aplikasi.

**Cara Kerja Script:**
1. Cek koneksi VPN.
2. SSH ke App VPS.
3. `git pull` source code terbaru.
4. `bun install` dependencies.
5. `bun run db:migrate` (Migrasi skema database ke DB VPS).
6. Restart aplikasi via PM2.

**Cara Pakai:**
```bash
./deploy.sh
```

---

## 🔍 Troubleshooting

### 1. App tidak bisa konek ke Database
*   **Cek Ping:** Dari App VPS, coba `ping 10.10.10.100`.
*   **Cek Port:** Dari App VPS, coba `telnet 10.10.10.100 2100`.
*   **Cek User/Pass:** Pastikan kredensial di `.env.production` benar.
*   **Cek pg_hba.conf:** Pastikan IP App VPS sudah di-whitelist di DB VPS.

### 2. Aplikasi Error / Tidak Jalan
*   Cek Logs PM2:
    ```bash
    pm2 logs uch-app
    ```
*   Cek Status PM2:
    ```bash
    pm2 status
    ```

### 3. Redis Error
*   Pastikan service jalan: `sudo systemctl status redis-server`.
*   Test koneksi local: `redis-cli ping`.
