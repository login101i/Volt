export interface QuizOption {
  id: string;
  text: string;
  explanation: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface RoadmapItem {
  id: string;
  week: string;
  title: string;
  description: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  isBreak?: boolean; // Czy to tydzień przerwy
  tasks: {
    id: string;
    text: string;
    category: 'aws' | 'sql' | 'python' | 'airflow' | 'dbt' | 'monitoring' | 'cicd' | 'other';
    description?: string; // Szczegółowy opis zadania w języku polskim
  }[];
  output: string;
  detailedDescription?: string; // Szczegółowy opis z markdown
  exercises?: {
    title: string;
    description: string;
    code?: string;
  }[];
  quiz?: Quiz; // Mini quiz dla tygodnia
}

export const roadmapData: RoadmapItem[] = [
  {
    id: 'week1',
    week: 'Tydzień 1',
    title: 'AWS & Architektura',
    description: 'Cel: rozumiesz, co gdzie stoi i dlaczego',
    startDate: '2024-12-29',
    endDate: '2025-01-04',
    isBreak: false,
    tasks: [
      { 
        id: 'vpc', 
        text: 'VPC', 
        category: 'aws',
        description: `VPC (Virtual Private Cloud) to izolowana sieć wirtualna w chmurze AWS, która pozwala na stworzenie własnej prywatnej sieci w ramach infrastruktury AWS.

**Co to jest:**
- Logiczna izolacja zasobów AWS od innych użytkowników
- Pełna kontrola nad konfiguracją sieci (adresy IP, routing, bramy sieciowe)
- Możliwość połączenia z siecią lokalną przez VPN lub Direct Connect

**Gdzie jest stosowane:**
- Każda aplikacja produkcyjna wymaga własnego VPC dla bezpieczeństwa
- Projekty wymagające separacji środowisk (dev/staging/prod)
- Integracja z infrastrukturą on-premise

**Przykłady użycia:**
- VPC dla aplikacji webowej: publiczne subnety dla load balancerów, prywatne dla serwerów aplikacji
- VPC dla pipeline'ów danych: prywatne subnety dla EC2 z Airflow, dostęp do RDS tylko z wewnątrz VPC
- Multi-VPC architecture: osobne VPC dla różnych projektów z możliwością komunikacji przez VPC Peering

**Kluczowe koncepcje:**
- CIDR blocks: zakres adresów IP (np. 10.0.0.0/16)
- Internet Gateway: umożliwia dostęp do internetu
- NAT Gateway: pozwala zasobom w prywatnych subnetach na wychodzący dostęp do internetu
- VPC Peering: połączenie między VPC dla komunikacji między nimi

**Przykład praktyczny:**

Tworzenie VPC przez AWS Console:
1. Przejdź do VPC Dashboard → Create VPC
2. Wybierz "VPC and more" dla automatycznej konfiguracji
3. Ustaw CIDR: 10.0.0.0/16
4. Wybierz 2 Availability Zones (np. eu-central-1a, eu-central-1b)
5. Utwórz 2 publiczne subnety (10.0.1.0/24, 10.0.2.0/24) i 2 prywatne (10.0.3.0/24, 10.0.4.0/24)
6. Włącz Internet Gateway i NAT Gateway

Tworzenie VPC przez Terraform:
\`\`\`hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "data-platform-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "main-nat"
  }
}
\`\`\`

Tworzenie VPC przez AWS CLI:
\`\`\`bash
# Utwórz VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=data-platform-vpc}]'

# Utwórz Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=main-igw}]'

# Podłącz Internet Gateway do VPC
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxx --vpc-id vpc-xxx
\`\`\``
      },
      { 
        id: 'subnets', 
        text: 'public / private subnet', 
        category: 'aws',
        description: `Subnety to podsieci w ramach VPC, które pozwalają na logiczną separację zasobów i kontrolę dostępu.

**Public Subnet:**
- Ma bezpośredni dostęp do internetu przez Internet Gateway
- Zasoby otrzymują publiczne adresy IP
- Używane dla: Load Balancerów, Bastion Hosts, NAT Gateways

**Private Subnet:**
- Brak bezpośredniego dostępu do internetu
- Zasoby mają tylko prywatne adresy IP
- Używane dla: serwerów aplikacji, baz danych, serwerów Airflow

**Gdzie jest stosowane:**
- Architektura multi-tier: publiczne subnety dla warstwy prezentacji, prywatne dla logiki biznesowej i danych
- Bezpieczeństwo: bazy danych zawsze w prywatnych subnetach, nigdy publicznie dostępne
- Compliance: wymagania bezpieczeństwa często wymuszają użycie prywatnych subnetów

**Przykłady:**
- **Public subnet (10.0.1.0/24):** Load Balancer, Bastion Host
- **Private subnet (10.0.2.0/24):** EC2 z aplikacją, Airflow workers
- **Private subnet (10.0.3.0/24):** RDS, ElastiCache

**Best practices:**
- Minimum 2 subnety w różnych Availability Zones dla wysokiej dostępności
- Publiczne subnety tylko dla zasobów wymagających bezpośredniego dostępu z internetu
- Wszystkie wrażliwe dane (bazy danych) w prywatnych subnetach

**Przykład praktyczny:**

Tworzenie subnetów przez AWS Console:
1. VPC Dashboard → Subnets → Create subnet
2. Wybierz VPC: data-platform-vpc
3. Publiczny subnet 1:
   - Name: public-subnet-1a
   - AZ: eu-central-1a
   - CIDR: 10.0.1.0/24
   - Włącz "Auto-assign public IPv4 address"
4. Publiczny subnet 2:
   - Name: public-subnet-1b
   - AZ: eu-central-1b
   - CIDR: 10.0.2.0/24
   - Włącz "Auto-assign public IPv4 address"
5. Prywatny subnet 1:
   - Name: private-subnet-1a
   - AZ: eu-central-1a
   - CIDR: 10.0.3.0/24
6. Prywatny subnet 2:
   - Name: private-subnet-1b
   - AZ: eu-central-1b
   - CIDR: 10.0.4.0/24

Tworzenie subnetów przez Terraform:
\`\`\`hcl
# Publiczne subnety
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-\${count.index + 1}"
  }
}

# Prywatne subnety
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 3}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-\${count.index + 1}"
  }
}

# Route table dla publicznych subnetów
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt"
  }
}

# Route table dla prywatnych subnetów (z NAT Gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "private-rt"
  }
}
\`\`\`

Tworzenie subnetów przez AWS CLI:
\`\`\`bash
# Publiczny subnet w AZ 1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone eu-central-1a

# Prywatny subnet w AZ 1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.3.0/24 --availability-zone eu-central-1a

# Włącz auto-assign public IP dla publicznego subnetu
aws ec2 modify-subnet-attribute --subnet-id subnet-xxx --map-public-ip-on-launch
\`\`\``
      },
      { 
        id: 'security-groups', 
        text: 'security groups', 
        category: 'aws',
        description: `Security Groups to wirtualne zapory sieciowe działające na poziomie instancji EC2, które kontrolują ruch przychodzący i wychodzący.

**Co to jest:**
- Stateful firewall: jeśli ruch wychodzący jest dozwolony, odpowiedź jest automatycznie dozwolona
- Domyślnie blokuje cały ruch przychodzący, pozwala cały wychodzący
- Reguły działają na poziomie instancji, nie subnetu

**Gdzie jest stosowane:**
- Każda instancja EC2 powinna mieć przypisany Security Group
- RDS, ElastiCache również używają Security Groups
- Load Balancery mają własne Security Groups

**Przykłady konfiguracji:**
- **Web Server SG:** Port 80/443 z internetu, port 22 tylko z Bastion Host
- **Database SG:** Port 5432 (Postgres) tylko z Web Server SG, brak dostępu z internetu
- **Airflow SG:** Port 8080 tylko z wewnątrz VPC, port 22 z Bastion Host

**Kluczowe zasady:**
- Zasada najmniejszych uprawnień: otwieraj tylko potrzebne porty
- Używaj referencji do innych Security Groups zamiast IP addresses
- Różne Security Groups dla różnych warstw aplikacji

**Przykład praktyczny:**

Tworzenie Security Groups przez AWS Console:
1. EC2 Dashboard → Security Groups → Create security group
2. Web Server SG:
   - Name: web-server-sg
   - Description: Security group for web servers
   - VPC: data-platform-vpc
   - Inbound rules:
     - Type: HTTP, Port: 80, Source: 0.0.0.0/0
     - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
     - Type: SSH, Port: 22, Source: bastion-sg (wybierz Security Group)
   - Outbound rules: All traffic
3. Database SG:
   - Name: database-sg
   - Description: Security group for PostgreSQL database
   - VPC: data-platform-vpc
   - Inbound rules:
     - Type: PostgreSQL, Port: 5432, Source: web-server-sg (wybierz Security Group)
   - Outbound rules: None

Tworzenie Security Groups przez Terraform:
\`\`\`hcl
# Security Group dla web serwerów
resource "aws_security_group" "web_server" {
  name        = "web-server-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-server-sg"
  }
}

# Security Group dla bazy danych
resource "aws_security_group" "database" {
  name        = "database-sg"
  description = "Security group for PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from web servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_server.id]
  }

  # Brak egress - baza nie inicjuje połączeń

  tags = {
    Name = "database-sg"
  }
}
\`\`\`

Tworzenie Security Groups przez AWS CLI:
\`\`\`bash
# Utwórz Security Group dla web serwerów
aws ec2 create-security-group --group-name web-server-sg --description "Security group for web servers" --vpc-id vpc-xxx

# Dodaj regułę HTTP
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 80 --cidr 0.0.0.0/0

# Dodaj regułę SSH z innego Security Group
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 22 --source-group sg-bastion-xxx

# Utwórz Security Group dla bazy danych
aws ec2 create-security-group --group-name database-sg --description "Security group for PostgreSQL" --vpc-id vpc-xxx

# Dodaj regułę PostgreSQL z web-server-sg
aws ec2 authorize-security-group-ingress --group-id sg-db-xxx --protocol tcp --port 5432 --source-group sg-web-xxx
\`\`\``
      },
      { 
        id: 'ec2-public', 
        text: 'EC2 public + private', 
        category: 'aws',
        description: `EC2 (Elastic Compute Cloud) to wirtualne serwery w chmurze AWS. Można je konfigurować jako publiczne (dostępne z internetu) lub prywatne (tylko wewnątrz VPC).

**EC2 Public:**
- Ma publiczny adres IP i Elastic IP
- Dostępny bezpośrednio z internetu
- Używany dla: Load Balancerów, Bastion Hosts, serwerów webowych

**EC2 Private:**
- Tylko prywatny adres IP
- Dostępny tylko z wewnątrz VPC
- Używany dla: serwerów aplikacji, workers Airflow, serwerów przetwarzających dane

**Gdzie jest stosowane:**
- **Public EC2:** Bastion Host do zarządzania, Load Balancery
- **Private EC2:** Serwery aplikacji, Airflow schedulers/workers, serwery ETL

**Przykłady architektury:**
- **3-tier architecture:**
  - Public: Load Balancer
  - Private: Application Servers (EC2)
  - Private: Database (RDS)
  
- **Data Pipeline:**
  - Private: EC2 z Airflow (scheduler + workers)
  - Private: EC2 z Python ETL scripts
  - Private: RDS dla metadanych Airflow

**Best practices:**
- Wszystkie produkcyjne serwery aplikacji w prywatnych subnetach
- Publiczne EC2 tylko gdy absolutnie konieczne (np. Bastion Host)
- Używaj Auto Scaling Groups dla wysokiej dostępności
- Instance Types: t3.micro dla dev, m5.large dla prod

**Przykład praktyczny:**

Tworzenie EC2 przez AWS Console:
1. EC2 Dashboard → Launch Instance
2. Public EC2 (Bastion Host):
   - Name: bastion-host
   - AMI: Amazon Linux 2023
   - Instance type: t3.micro
   - Key pair: wybierz lub utwórz nowy
   - Network: wybierz VPC i publiczny subnet (10.0.1.0/24)
   - Auto-assign Public IP: Enable
   - Security Group: bastion-sg (port 22 z Twojego IP)
   - Storage: 8GB gp3
3. Private EC2 (Airflow):
   - Name: airflow-scheduler
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: m5.large
   - Key pair: ten sam co dla bastion
   - Network: wybierz VPC i prywatny subnet (10.0.3.0/24)
   - Auto-assign Public IP: Disable
   - Security Group: airflow-sg (port 8080 tylko z VPC, port 22 z bastion-sg)
   - Storage: 30GB gp3

Tworzenie EC2 przez Terraform:
\`\`\`hcl
# Bastion Host (public EC2)
resource "aws_instance" "bastion" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023
  instance_type = "t3.micro"
  key_name      = aws_key_pair.main.key_name

  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids  = [aws_security_group.bastion.id]
  associate_public_ip_address = true

  tags = {
    Name = "bastion-host"
  }
}

# Airflow Scheduler (private EC2)
resource "aws_instance" "airflow" {
  ami           = "ami-0abcdef1234567890" # Ubuntu 22.04
  instance_type = "m5.large"
  key_name      = aws_key_pair.main.key_name

  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids  = [aws_security_group.airflow.id]
  associate_public_ip_address = false

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose
              # Instalacja Airflow...
              EOF

  tags = {
    Name = "airflow-scheduler"
  }
}
\`\`\`

Tworzenie EC2 przez AWS CLI:
\`\`\`bash
# Utwórz publiczny EC2 (Bastion)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name my-key \
  --subnet-id subnet-public-xxx \
  --security-group-ids sg-bastion-xxx \
  --associate-public-ip-address

# Utwórz prywatny EC2 (Airflow)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type m5.large \
  --key-name my-key \
  --subnet-id subnet-private-xxx \
  --security-group-ids sg-airflow-xxx \
  --no-associate-public-ip-address
\`\`\`

Połączenie z prywatnym EC2 przez Bastion:
\`\`\`bash
# 1. Połącz się z Bastion Host
ssh -i my-key.pem ec2-user@bastion-public-ip

# 2. Z Bastion Host połącz się z prywatnym EC2
ssh -i my-key.pem ubuntu@10.0.3.50  # prywatny IP Airflow EC2
\`\`\``
      },
      { 
        id: 'rds', 
        text: 'RDS (Postgres)', 
        category: 'aws',
        description: `RDS (Relational Database Service) to zarządzana usługa baz danych AWS. PostgreSQL to popularny wybór dla aplikacji i pipeline'ów danych.

**Co to jest:**
- Zarządzana usługa: AWS obsługuje backup, patche, monitoring
- Wspiera wiele silników: PostgreSQL, MySQL, MariaDB, Oracle, SQL Server
- Automatyczne backup i point-in-time recovery

**Gdzie jest stosowane:**
- Bazy danych aplikacji (użytkownicy, sesje, konfiguracja)
- Metadane dla Airflow (DAGs, task instances, connections)
- Staging area dla danych przed transformacją w warehouse
- Hurtownie danych mniejszych projektów (przed migracją do Redshift)

**Przykłady użycia:**
- **Aplikacja webowa:** PostgreSQL dla danych użytkowników i transakcji
- **Airflow metadata:** PostgreSQL przechowuje stan DAGów, historię wykonania
- **Data staging:** PostgreSQL jako staging area przed ładowaniem do S3/Redshift

**Kluczowe funkcje:**
- Multi-AZ deployment: automatyczna replikacja w różnych AZ dla wysokiej dostępności
- Read Replicas: repliki tylko do odczytu dla rozłożenia obciążenia
- Automated Backups: codzienne backupy z możliwością przywrócenia do dowolnego momentu (7-35 dni)

**Best practices:**
- Zawsze w prywatnych subnetach, nigdy publicznie dostępne
- Używaj Security Groups do kontroli dostępu
- Włącz szyfrowanie at rest i in transit
- Monitoruj metryki: CPU, Memory, Connections, Storage

**Przykład praktyczny:**

Tworzenie RDS przez AWS Console:
1. RDS Dashboard → Create database
2. Engine: PostgreSQL (wybierz wersję, np. 15.4)
3. Template: Production (dla Multi-AZ) lub Dev/Test
4. Settings:
   - DB instance identifier: airflow-metadata-db
   - Master username: airflow_admin
   - Master password: (bezpieczne hasło)
5. Instance configuration:
   - DB instance class: db.t3.medium
6. Storage:
   - Storage type: General Purpose SSD (gp3)
   - Allocated storage: 100 GB
   - Enable storage autoscaling: Yes (max 200 GB)
7. Connectivity:
   - VPC: data-platform-vpc
   - Subnet group: (utwórz nowy z prywatnych subnetów)
   - Public access: No
   - VPC security group: database-sg
   - Availability Zone: eu-central-1a
8. Database authentication: Password authentication
9. Backup:
   - Automated backups: Enabled
   - Backup retention period: 7 days
   - Backup window: 03:00-04:00 UTC
10. Monitoring: Enable Enhanced monitoring
11. Maintenance: Enable auto minor version upgrade

Tworzenie RDS przez Terraform:
\`\`\`hcl
# Subnet group dla RDS (prywatne subnety w różnych AZ)
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = [aws_subnet.private[0].id, aws_subnet.private[1].id]

  tags = {
    Name = "Main DB subnet group"
  }
}

# RDS PostgreSQL instance
resource "aws_db_instance" "airflow_metadata" {
  identifier     = "airflow-metadata-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  max_allocated_storage = 200

  db_name  = "airflow"
  username = "airflow_admin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  multi_az               = true
  publicly_accessible    = false
  skip_final_snapshot    = false
  final_snapshot_identifier = "airflow-db-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "airflow-metadata-db"
  }
}
\`\`\`

Tworzenie RDS przez AWS CLI:
\`\`\`bash
# Utwórz subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name main-db-subnet-group \
  --db-subnet-group-description "Main DB subnet group" \
  --subnet-ids subnet-private-1a subnet-private-1b

# Utwórz RDS instance
aws rds create-db-instance \
  --db-instance-identifier airflow-metadata-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username airflow_admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-database-xxx \
  --db-subnet-group-name main-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --no-publicly-accessible
\`\`\`

Połączenie z RDS z prywatnego EC2:
\`\`\`bash
# Z EC2 w prywatnym subnetcie
psql -h airflow-metadata-db.xxxxx.eu-central-1.rds.amazonaws.com \
     -U airflow_admin \
     -d airflow \
     -p 5432
\`\`\``
      },
      { 
        id: 'route53', 
        text: 'Route53', 
        category: 'aws',
        description: `Route53 to usługa DNS (Domain Name System) AWS, która tłumaczy nazwy domen na adresy IP i zarządza routingiem ruchu.

**Co to jest:**
- Zarządzana usługa DNS z wysoką dostępnością
- Routing policies: Simple, Weighted, Latency-based, Failover, Geolocation
- Health checks: automatyczne przełączanie na backup w przypadku awarii

**Gdzie jest stosowane:**
- Rejestracja i zarządzanie domenami
- Routing ruchu do Load Balancerów, CloudFront, S3 buckets
- Failover między regionami AWS
- Subdomainy dla różnych środowisk (dev.example.com, prod.example.com)

**Przykłady użycia:**
- **Aplikacja webowa:** example.com → Application Load Balancer
- **Data platform:** api.data.example.com → API Gateway
- **Failover:** Główny region + backup region z automatycznym przełączaniem

**Routing Policies:**
- **Simple:** Jeden rekord → jeden zasób
- **Weighted:** Rozłożenie ruchu między wiele zasobów (np. 80% prod, 20% canary)
- **Latency-based:** Routing do regionu z najniższym opóźnieniem
- **Failover:** Aktywny/pasywny routing z automatycznym failover

**Przykład praktyczny:**

Tworzenie rekordów DNS przez AWS Console:
1. Route53 Dashboard → Hosted zones → wybierz domenę (lub utwórz nową)
2. Utwórz rekord dla głównej domeny:
   - Record name: (pozostaw puste dla root domain) lub www
   - Record type: A
   - Alias: Yes
   - Route traffic to: Alias to Application Load Balancer
   - Region: eu-central-1
   - Wybierz ALB: prod-alb-xxxxx
   - Routing policy: Simple routing
   - Evaluate target health: Yes
3. Utwórz rekord dla API:
   - Record name: api
   - Record type: A
   - Alias: Yes
   - Route traffic to: Alias to API Gateway
   - Wybierz API Gateway: data-platform-api
4. Utwórz rekord dla środowiska dev:
   - Record name: dev
   - Record type: A
   - Alias: Yes
   - Route traffic to: Alias to Application Load Balancer
   - Wybierz ALB: dev-alb-xxxxx

Tworzenie rekordów DNS przez Terraform:
\`\`\`hcl
# Hosted Zone (jeśli nie masz jeszcze)
resource "aws_route53_zone" "main" {
  name = "example.com"

  tags = {
    Name = "main-zone"
  }
}

# Rekord A dla głównej domeny (Alias do ALB)
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "example.com"
  type    = "A"

  alias {
    name                   = aws_lb.prod.dns_name
    zone_id                = aws_lb.prod.zone_id
    evaluate_target_health = true
  }
}

# Rekord A dla www (redirect do głównej domeny)
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.prod.dns_name
    zone_id                = aws_lb.prod.zone_id
    evaluate_target_health = true
  }
}

# Rekord A dla API (Alias do API Gateway)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.hosted_zone_id
    evaluate_target_health = false
  }
}

# Rekord dla środowiska dev
resource "aws_route53_record" "dev" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "dev.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.dev.dns_name
    zone_id                = aws_lb.dev.zone_id
    evaluate_target_health = true
  }
}

# Health check dla głównej domeny
resource "aws_route53_health_check" "main" {
  fqdn              = "example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "main-health-check"
  }
}
\`\`\`

Tworzenie rekordów DNS przez AWS CLI:
\`\`\`bash
# Utwórz Hosted Zone (jeśli nie masz)
aws route53 create-hosted-zone --name example.com --caller-reference $(date +%s)

# Utwórz rekord A (Alias) dla głównej domeny
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "example.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "prod-alb-xxxxx.eu-central-1.elb.amazonaws.com",
          "HostedZoneId": "Z3F0SRJ5LGBH90",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Utwórz rekord dla API
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "api-id.execute-api.eu-central-1.amazonaws.com",
          "HostedZoneId": "Z3F0SRJ5LGBH90",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
\`\`\`

**Best practices:**
- Używaj Alias records dla zasobów AWS (bezpłatne, automatyczna aktualizacja IP)
- Konfiguruj health checks dla krytycznych endpointów
- Używaj Route53 dla wewnętrznych DNS w VPC (Private Hosted Zones)`
      },
      { 
        id: 'reverse-proxy', 
        text: 'Reverse proxy (Caddy / Nginx)', 
        category: 'aws',
        description: `Reverse proxy to serwer pośredniczący między klientami a serwerami backendowymi. Caddy i Nginx to popularne rozwiązania.

**Co to jest:**
- Odbiera żądania od klientów i przekierowuje je do odpowiednich serwerów backendowych
- Może obsługiwać SSL/TLS, load balancing, caching, compression
- Działa jako pojedynczy punkt wejścia dla wielu serwisów

**Caddy vs Nginx:**
- **Caddy:** Automatyczne SSL (Let's Encrypt), łatwa konfiguracja, nowoczesny
- **Nginx:** Bardziej dojrzały, większa społeczność, więcej funkcji zaawansowanych

**Gdzie jest stosowane:**
- Przed Application Load Balancerem dla dodatkowej warstwy routingu
- Dla aplikacji self-hosted (np. Airflow UI, monitoring tools)
- Jako SSL termination point
- Dla routingu wielu aplikacji pod jedną domeną

**Przykłady użycia:**
- **Airflow UI:** Reverse proxy przed Airflow webserver dla SSL i routing
- **Multiple services:** Jeden reverse proxy routuje do różnych aplikacji:
  - /airflow → Airflow webserver
  - /grafana → Grafana
  - /api → API Gateway

**Przykład praktyczny:**

Instalacja i konfiguracja Caddy na EC2:
\`\`\`bash
# 1. Instalacja Caddy na Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# 2. Konfiguracja Caddyfile (/etc/caddy/Caddyfile)
airflow.example.com {
    reverse_proxy localhost:8080 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
    
    tls {
        dns route53 {
            access_key_id YOUR_AWS_ACCESS_KEY
            secret_access_key YOUR_AWS_SECRET_KEY
        }
    }
    
    log {
        output file /var/log/caddy/access.log
    }
    
    encode gzip
}

# 3. Uruchomienie Caddy
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
\`\`\`

Instalacja i konfiguracja Nginx na EC2:
\`\`\`bash
# 1. Instalacja Nginx
sudo apt update
sudo apt install -y nginx

# 2. Konfiguracja Nginx (/etc/nginx/sites-available/airflow)
server {
    listen 80;
    server_name airflow.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name airflow.example.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/airflow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/airflow.example.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Reverse proxy do Airflow
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support dla Airflow
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Logging
    access_log /var/log/nginx/airflow_access.log;
    error_log /var/log/nginx/airflow_error.log;
}

# 3. Włącz konfigurację
sudo ln -s /etc/nginx/sites-available/airflow /etc/nginx/sites-enabled/
sudo nginx -t  # Test konfiguracji
sudo systemctl reload nginx

# 4. Instalacja SSL przez Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d airflow.example.com
\`\`\`

Konfiguracja Docker Compose z Nginx:
\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - airflow-webserver

  airflow-webserver:
    image: apache/airflow:2.7.0
    environment:
      - AIRFLOW__CORE__EXECUTOR=LocalExecutor
    ports:
      - "8080:8080"
\`\`\`

Konfiguracja wielu serwisów pod jedną domeną (Nginx):
\`\`\`nginx
# /etc/nginx/sites-available/data-platform
server {
    listen 443 ssl http2;
    server_name data.example.com;

    ssl_certificate /etc/letsencrypt/live/data.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/data.example.com/privkey.pem;

    # Airflow UI
    location /airflow {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        rewrite ^/airflow(.*)$ $1 break;
    }

    # Grafana
    location /grafana {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API Gateway
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

**Best practices:**
- Używaj reverse proxy dla SSL termination
- Konfiguruj health checks dla backendów
- Włącz compression i caching gdzie możliwe
- Loguj żądania dla monitoringu i debugowania
- Używaj WebSocket support dla aplikacji real-time (np. Airflow UI)`
      },
    ],
    output: 'diagram architektury (draw.io), README: "dlaczego taka architektura"',
    quiz: {
      id: 'week1-quiz',
      questions: [
        {
          id: 'q1-rds-location',
          question: 'Gdzie powinny być umieszczone bazy danych RDS w architekturze AWS?',
          options: [
            {
              id: 'public-subnet',
              text: 'W publicznych subnetach z bezpośrednim dostępem z internetu',
              explanation: 'Bazy danych NIGDY nie powinny być w publicznych subnetach. To poważne naruszenie bezpieczeństwa - baza byłaby dostępna z całego internetu.',
              isCorrect: false
            },
            {
              id: 'private-subnet',
              text: 'W prywatnych subnetach z dostępem tylko z wewnątrz VPC',
              explanation: 'Poprawnie! Bazy danych zawsze powinny być w prywatnych subnetach. Dostęp tylko przez Security Groups z innych zasobów w VPC (np. serwerów aplikacji). To zapewnia bezpieczeństwo i zgodność z best practices.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q2-vpc-purpose',
          question: 'Co to jest VPC i jaki jest jego główny cel?',
          options: [
            {
              id: 'vpc-storage',
              text: 'VPC to miejsce do przechowywania plików w chmurze',
              explanation: 'Nieprawda. VPC to Virtual Private Cloud - izolowana sieć wirtualna, nie miejsce na pliki. Pliki przechowujesz w S3.',
              isCorrect: false
            },
            {
              id: 'vpc-network',
              text: 'VPC to izolowana sieć wirtualna pozwalająca na pełną kontrolę nad konfiguracją sieci i bezpieczeństwem zasobów',
              explanation: 'Poprawnie! VPC tworzy prywatną, izolowaną sieć w AWS z pełną kontrolą nad adresami IP, routingiem i bezpieczeństwem. To fundament architektury AWS.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q3-public-vs-private',
          question: 'Jaka jest główna różnica między publicznym a prywatnym subnetem?',
          options: [
            {
              id: 'subnet-no-diff',
              text: 'Nie ma różnicy - oba działają tak samo',
              explanation: 'Nieprawda. Publiczne subnety mają dostęp do internetu przez Internet Gateway, prywatne nie mają bezpośredniego dostępu.',
              isCorrect: false
            },
            {
              id: 'subnet-diff',
              text: 'Publiczne subnety mają bezpośredni dostęp do internetu, prywatne nie - wymagają NAT Gateway dla wychodzącego ruchu',
              explanation: 'Poprawnie! Publiczne subnety używają Internet Gateway dla dostępu do/z internetu. Prywatne subnety są izolowane - zasoby mogą komunikować się tylko w VPC lub przez NAT Gateway dla wychodzącego ruchu.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q4-security-groups',
          question: 'Jak działają Security Groups w AWS?',
          options: [
            {
              id: 'sg-block-all',
              text: 'Security Groups domyślnie pozwalają cały ruch przychodzący i wychodzący',
              explanation: 'Nieprawda. Security Groups domyślnie BLOKUJĄ cały ruch przychodzący i pozwalają cały wychodzący. Musisz jawnie otworzyć potrzebne porty.',
              isCorrect: false
            },
            {
              id: 'sg-stateful',
              text: 'Security Groups są stateful - domyślnie blokują ruch przychodzący, pozwalają wychodzący, i automatycznie pozwalają odpowiedzi',
              explanation: 'Poprawnie! Security Groups działają jak stateful firewall - jeśli pozwalasz ruch wychodzący, odpowiedź jest automatycznie dozwolona. Domyślnie blokują przychodzący, pozwalają wychodzący.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q5-ec2-public-private',
          question: 'Kiedy używać publicznego EC2, a kiedy prywatnego?',
          options: [
            {
              id: 'ec2-always-public',
              text: 'Zawsze używaj publicznego EC2 - jest szybszy',
              explanation: 'Nieprawda. Publiczne EC2 są potrzebne tylko dla zasobów wymagających bezpośredniego dostępu z internetu (np. Load Balancery, Bastion Hosts). Większość serwerów powinna być prywatna.',
              isCorrect: false
            },
            {
              id: 'ec2-context',
              text: 'Publiczne EC2 tylko dla zasobów wymagających bezpośredniego dostępu z internetu (Load Balancery, Bastion), prywatne dla serwerów aplikacji i workers',
              explanation: 'Poprawnie! Publiczne EC2 tylko gdy konieczne (Bastion Host do zarządzania, Load Balancery). Wszystkie serwery aplikacji, workers Airflow, serwery ETL powinny być prywatne dla bezpieczeństwa.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q6-route53',
          question: 'Do czego służy Route53 w architekturze AWS?',
          options: [
            {
              id: 'route53-compute',
              text: 'Route53 to usługa compute do uruchamiania aplikacji',
              explanation: 'Nieprawda. Route53 to usługa DNS (Domain Name System), nie compute. Compute to EC2, Lambda, ECS.',
              isCorrect: false
            },
            {
              id: 'route53-dns',
              text: 'Route53 to usługa DNS do zarządzania domenami, routingiem ruchu i health checks',
              explanation: 'Poprawnie! Route53 tłumaczy nazwy domen na adresy IP, zarządza routingiem (Simple, Weighted, Latency-based, Failover) i monitoruje zdrowie zasobów przez health checks.',
              isCorrect: true
            }
          ]
        },
        {
          id: 'q7-reverse-proxy',
          question: 'Kiedy warto użyć reverse proxy (Caddy/Nginx) w architekturze?',
          options: [
            {
              id: 'proxy-never',
              text: 'Reverse proxy nigdy nie jest potrzebny - AWS Load Balancer wystarczy',
              explanation: 'Nie zawsze. Reverse proxy jest przydatny dla aplikacji self-hosted (Airflow UI, Grafana), SSL termination, routingu wielu aplikacji pod jedną domeną, gdy Load Balancer nie wystarcza.',
              isCorrect: false
            },
            {
              id: 'proxy-useful',
              text: 'Dla aplikacji self-hosted (Airflow UI), SSL termination, routingu wielu serwisów pod jedną domeną',
              explanation: 'Poprawnie! Reverse proxy jest przydatny dla aplikacji self-hosted wymagających SSL, routingu wielu aplikacji (/airflow, /grafana), lub gdy potrzebujesz dodatkowej warstwy przed Load Balancerem.',
              isCorrect: true
            }
          ]
        }
      ]
    }
  },
  {
    id: 'week2',
    week: 'Tydzień 2',
    title: 'SQL & Model Danych',
    description: 'Cel: myślisz jak Data Engineer, nie jak "SELECT *"',
    startDate: '2025-01-06',
    endDate: '2025-01-12',
    isBreak: false,
    tasks: [
      {
        id: 'postgres-basics',
        text: 'Postgres / Redshift basics',
        category: 'sql',
        description: `PostgreSQL i Amazon Redshift to dwa kluczowe systemy bazodanowe dla Data Engineering.

**PostgreSQL:**
- Open-source relacyjna baza danych
- Świetna do małych/możliwych aplikacji i analizy danych
- Wspiera zaawansowane funkcje SQL, JSON, geospatial
- Może działać jako OLTP (transakcyjna) i OLAP (analityczna)

**Amazon Redshift:**
- Rozproszona hurtownia danych w chmurze AWS
- Zoptymalizowana pod masywne zapytania analityczne
- Kolumnowa struktura danych (lepsza kompresja i wydajność)
- Integracja z całym ekosystemem AWS

**Podstawowe różnice:**
- Postgres: uniwersalny, lepszy do złożonych zapytań pojedynczych rekordów
- Redshift: hurtownia danych, lepszy do agregacji na dużych zbiorach

**Praktyczne użycie:**
- Postgres: staging databases, małe hurtownie, development
- Redshift: produkcyjne hurtownie danych, big data analytics

**Podstawowe komendy:**
\`\`\`sql
-- PostgreSQL
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));
INSERT INTO users (name, email) VALUES ('Jan Kowalski', 'jan@example.com');
SELECT * FROM users WHERE name LIKE 'Jan%';

-- Redshift
COPY users FROM 's3://bucket/users.csv'
CREDENTIALS 'aws_iam_role=arn:aws:iam::123456789012:role/RedshiftRole'
CSV;
\`\`\``
      },
      {
        id: 'cte',
        text: 'CTE',
        category: 'sql',
        description: `CTE (Common Table Expressions) to tymczasowe nazwane zestawy wyników, które istnieją tylko w ramach pojedynczego zapytania.

**Składnia:**
\`\`\`sql
WITH cte_name AS (
    SELECT column1, column2
    FROM table_name
    WHERE condition
)
SELECT * FROM cte_name WHERE column1 > 100;
\`\`\`

**Zalety CTE:**
- Zwiększają czytelność złożonych zapytań
- Mogą być rekursywne (recursive CTE)
- Łatwiejsze debugowanie niż subqueries
- Można używać wielokrotnie w tym samym zapytaniu

**Przykłady użycia:**

**Proste CTE:**
\`\`\`sql
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) as month,
        SUM(amount) as total_sales
    FROM orders
    GROUP BY DATE_TRUNC('month', order_date)
)
SELECT month, total_sales
FROM monthly_sales
WHERE total_sales > 10000
ORDER BY month DESC;
\`\`\`

**Rekursywne CTE (hierarchie):**
\`\`\`sql
WITH RECURSIVE employee_hierarchy AS (
    -- Anchor member (poziom główny)
    SELECT id, name, manager_id, 0 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive member (poziomy niższe)
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy ORDER BY level, name;
\`\`\`

**W Data Engineering:**
- Budowanie złożonych transformacji danych
- Generowanie sekwencji dat
- Analiza ścieżek i grafów
- Hierarchical aggregations`
      },
      {
        id: 'window-functions',
        text: 'window functions',
        category: 'sql',
        description: `Window Functions wykonują obliczenia na "oknie" wierszy powiązanych z bieżącym wierszem, bez grupowania danych.

**Podstawowa składnia:**
\`\`\`sql
SELECT
    column1,
    column2,
    WINDOW_FUNCTION() OVER (
        PARTITION BY partition_column
        ORDER BY order_column
        ROWS/RANGE frame_specification
    ) as result_column
FROM table_name;
\`\`\`

**Typy Window Functions:**

**Ranking Functions:**
- ROW_NUMBER(): numeruje wiersze (1, 2, 3...)
- RANK(): ranking z uwzględnieniem remisów (1, 1, 3...)
- DENSE_RANK(): ranking gęsty (1, 1, 2...)
- PERCENT_RANK(): pozycja procentowa

**Aggregate Functions jako Window:**
- SUM(), AVG(), COUNT(), MAX(), MIN()
- działają na oknie zamiast całej grupy

**Analytic Functions:**
- LEAD()/LAG(): wartości z następnego/poprzedniego wiersza
- FIRST_VALUE()/LAST_VALUE(): pierwsza/ostatnia wartość w oknie
- NTH_VALUE(): n-ta wartość w oknie

**Przykłady praktyczne:**

**Ranking sprzedaży:**
\`\`\`sql
SELECT
    salesperson,
    month,
    sales_amount,
    RANK() OVER (ORDER BY sales_amount DESC) as sales_rank,
    SUM(sales_amount) OVER (PARTITION BY month) as monthly_total
FROM sales;
\`\`\`

**Porównanie z poprzednim okresem:**
\`\`\`sql
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) as prev_month_revenue,
    revenue - LAG(revenue) OVER (ORDER BY month) as revenue_change
FROM monthly_revenue;
\`\`\`

**Moving averages:**
\`\`\`sql
SELECT
    date,
    price,
    AVG(price) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day
FROM stock_prices;
\`\`\`

**W Data Engineering:**
- Time series analysis
- Running totals i cumulative metrics
- Percentiles i statystyki rozkładów
- Deduplikacja z zachowaniem najnowszych rekordów`
      },
      {
        id: 'indexing',
        text: 'indexing (teoria + praktyka)',
        category: 'sql',
        description: `Indeksy to struktury danych przyspieszające wyszukiwanie i łączenie tabel, kosztem wolniejszego wstawiania i aktualizacji.

**Typy indeksów:**

**B-Tree Index (domyślny):**
- Najpopularniejszy typ indeksu
- Efektywny dla równości (=) i zakresów (>, <, BETWEEN)
- Działa dobrze z LIKE dla prefiksów ('abc%')
- Automatycznie używany przez optymalizator zapytań

**Hash Index:**
- Tylko dla dokładnych dopasowań (=)
- Szybszy niż B-Tree dla równości
- Nie obsługuje zakresów ani sortowania

**GIN (Generalized Inverted Index):**
- Dla tablic, JSON, full-text search
- Używany w PostgreSQL dla złożonych typów danych

**BRIN (Block Range Index):**
- Dla dużych tabel z danymi posortowanymi
- Mniejszy rozmiar, mniej narzutu na INSERT

**Tworzenie indeksów:**

**Podstawowy indeks:**
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
\`\`\`

**Partial Index (warunkowy):**
\`\`\`sql
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
\`\`\`

**Expression Index:**
\`\`\`sql
CREATE INDEX idx_lower_email ON users(LOWER(email));
\`\`\`

**Composite Index:**
\`\`\`sql
CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date DESC);
\`\`\`

**Kiedy tworzyć indeksy:**
- Kolumny w WHERE klauzulach
- Kolumny w JOIN warunkach (foreign keys)
- Kolumny w ORDER BY (jeśli często używane)
- Unikalne ograniczenia (automatycznie tworzą indeks)

**Kiedy NIE tworzyć indeksów:**
- Małe tabele (< 1000 wierszy)
- Kolumny z niską kardynalnością (wiele duplikatów)
- Kolumny często aktualizowane (INSERT/UPDATE kosztowny)

**Analiza wydajności:**
\`\`\`sql
-- PostgreSQL: sprawdź plan wykonania
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Sprawdź wykorzystanie indeksów
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
\`\`\`

**W Redshift:**
- Indeksy działają inaczej (kolumnowa baza)
- SORT KEY = indeks klastrowy
- DIST KEY określa dystrybucję danych
- Kompromis między szybkością zapytań a ładowaniem danych`
      },
      {
        id: 'schema-design',
        text: 'schema bazy: raw tables, staging, marts',
        category: 'sql',
        description: `Architektura wielowarstwowa bazy danych to podstawa skalowalnych rozwiązań Data Engineering.

**Warstwy architektury:**

**1. Raw Layer (Surowe dane):**
- Dane w oryginalnej postaci
- Minimalne przetwarzanie (tylko walidacja schematu)
- Zachowanie pełnej historii danych
- Tabele z suffixem _raw lub w schemacie raw

**Struktura:**
\`\`\`sql
-- Raw table: wszystkie kolumny z źródła
CREATE TABLE raw_orders (
    order_id VARCHAR(50),
    customer_id VARCHAR(50),
    order_date TIMESTAMP,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    raw_json JSONB,  -- pełne dane źródłowe
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_file VARCHAR(255)
);
\`\`\`

**2. Staging Layer (Przygotowanie):**
- Lekkie czyszczenie i standaryzacja
- Normalizacja typów danych
- Usuwanie duplikatów
- Dodanie metadanych jakości danych

**Struktura:**
\`\`\`sql
-- Staging table: wyczyszczone dane
CREATE TABLE stg_orders (
    order_id BIGINT PRIMARY KEY,
    customer_id BIGINT,
    order_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    data_quality_score DECIMAL(3,2),  -- ocena jakości
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(50)
);
\`\`\`

**3. Marts Layer (Business-ready):**
- Dane gotowe do analizy biznesowej
- Zdenormalizowane dla wydajności
- Obliczone metryki biznesowe
- Optymalizacja pod konkretne przypadki użycia

**Struktura:**
\`\`\`sql
-- Mart table: dane biznesowe
CREATE TABLE mart_customer_orders (
    customer_id BIGINT PRIMARY KEY,
    customer_name VARCHAR(100),
    total_orders INT,
    total_revenue DECIMAL(12,2),
    avg_order_value DECIMAL(10,2),
    last_order_date DATE,
    customer_segment VARCHAR(20),  -- VIP, Regular, New
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Zalety wielowarstwowej architektury:**
- **Izolacja:** problemy w jednej warstwie nie wpływają na inne
- **Wydajność:** różne optymalizacje dla różnych zastosowań
- **Łatwość utrzymania:** każda warstwa ma jedno przeznaczenie
- **Debugowanie:** łatwiej znaleźć źródło problemów

**Praktyczne wzorce:**

**Slowly Changing Dimensions (SCD):**
\`\`\`sql
-- SCD Type 2: historia zmian
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    name VARCHAR(100),
    email VARCHAR(100),
    effective_date DATE,
    expiry_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);
\`\`\`

**Fact Tables:**
\`\`\`sql
-- Fact table z kluczami obcymi do wymiarów
CREATE TABLE fact_sales (
    sale_key SERIAL PRIMARY KEY,
    date_key INT REFERENCES dim_date(date_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    product_key INT REFERENCES dim_product(product_key),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2)
);
\`\`\`

**W Data Engineering:**
- Raw: immutable, append-only
- Staging: cleaned, transformed
- Marts: aggregated, business-logic applied
- Każda warstwa ma własne schematy uprawnień`
      },
    ],
    output: 'schema bazy: raw tables, staging, marts',
    quiz: {
      id: 'week2-quiz',
      questions: [
        {
          id: 'q1-staging-marts',
          question: 'Jaka jest różnica między warstwą staging a marts w architekturze danych?',
          options: [
            {
              id: 'staging-marts-same',
              text: 'Staging i marts to ta sama warstwa - tylko różne nazwy',
              explanation: 'Nieprawda. Staging i marts to różne warstwy z różnymi celami. Staging to minimalne czyszczenie danych, a marts to modele biznesowe gotowe do użycia.',
              isCorrect: false
            },
            {
              id: 'staging-marts-different',
              text: 'Staging to minimalne czyszczenie danych, marts to modele biznesowe gotowe do użycia',
              explanation: 'Poprawnie! Staging to warstwa pośrednia z minimalnym czyszczeniem (normalizacja, typy danych). Marts to warstwa analityczna z modelami biznesowymi (star schema, fact tables) gotowymi do raportowania i analizy.',
              isCorrect: true
            }
          ]
        }
      ]
    }
  },
  {
    id: 'week3',
    week: 'Tydzień 3',
    title: 'S3 jako Data Lake',
    description: 'Cel: separacja storage vs compute',
    startDate: '2025-01-13',
    endDate: '2025-01-19',
    isBreak: false,
    tasks: [
      {
        id: 's3-buckets',
        text: 'bucket: raw/, staging/, mart/',
        category: 'aws',
        description: `Organizacja Amazon S3 bucket jako data lake wymaga przemyślanej struktury katalogów odzwierciedlającej architekturę wielowarstwową.

**Podstawowa struktura data lake:**

\`\`\`
s3://my-data-lake/
├── raw/                    # Dane surowe, niemodyfikowane
│   ├── source1/
│   │   ├── 2025/
│   │   │   ├── 01/
│   │   │   │   ├── data_2025-01-01.json
│   │   │   │   └── data_2025-01-02.json
│   │   └── 02/
│   └── source2/
├── staging/                # Dane wyczyszczone i przetworzone
│   ├── customers/
│   │   └── customers_cleaned.parquet
│   └── orders/
│       └── orders_staging.parquet
└── mart/                   # Dane gotowe do analizy biznesowej
    ├── customer_summary/
    │   └── customer_metrics.parquet
    └── sales_dashboard/
        └── monthly_sales.parquet
\`\`\`

**Zasady organizacji:**

**Raw Zone:**
- **Immutable:** dane nigdy nie są modyfikowane
- **Append-only:** tylko dodajemy nowe dane
- **Partitioned by time:** podział na lata/miesiące/dni
- **Source-specific folders:** osobne katalogi dla różnych źródeł

**Staging Zone:**
- **Cleaned data:** usunięte duplikaty, standaryzacja formatów
- **Schema validation:** sprawdzona struktura danych
- **Performance optimization:** optymalne formaty plików
- **Business rules applied:** podstawowe reguły biznesowe

**Mart Zone:**
- **Business-ready:** dane gotowe do konsumpcji
- **Aggregated:** zagregowane metryki biznesowe
- **Optimized for queries:** zoptymalizowane pod konkretne zapytania
- **Documentation:** jasne nazwy tabel i kolumn

**Praktyczne implementacje:**

**Terraform dla bucket struktury:**
\`\`\`hcl
resource "aws_s3_bucket" "data_lake" {
  bucket = "my-company-data-lake"

  tags = {
    Environment = "production"
    Purpose     = "data-lake"
  }
}

# Lifecycle policy dla automatycznego przenoszenia danych
resource "aws_s3_bucket_lifecycle_configuration" "data_lake_lifecycle" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "raw_data_transition"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}
\`\`\`

**AWS Glue Catalog dla metadanych:**
\`\`\`sql
-- Tabela dla raw danych
CREATE EXTERNAL TABLE raw_orders (
    order_id string,
    customer_id string,
    order_date timestamp,
    total_amount decimal(10,2),
    raw_json string
)
PARTITIONED BY (
    year int,
    month int,
    day int
)
STORED AS JSON
LOCATION 's3://my-data-lake/raw/orders/';

-- Tabela dla staging
CREATE EXTERNAL TABLE stg_orders (
    order_id bigint,
    customer_id bigint,
    order_date date,
    total_amount decimal(10,2),
    order_status string
)
STORED AS PARQUET
LOCATION 's3://my-data-lake/staging/orders/';
\`\`\`

**Zalety strukturyzacji:**
- **Cost optimization:** różne klasy storage dla różnych danych
- **Access control:** granularne uprawnienia per warstwa
- **Data discovery:** łatwe znajdowanie potrzebnych danych
- **Performance:** optymalizacja pod konkretne przypadki użycia`
      },
      {
        id: 'parquet',
        text: 'format: CSV → Parquet',
        category: 'aws',
        description: `Parquet to kolumnowy format plików optymalny dla analitycznych obciążeń big data, znacznie wydajniejszy niż CSV.

**Dlaczego Parquet zamiast CSV:**

**CSV problemy:**
- **Row-oriented:** czyta wszystkie kolumny nawet jeśli potrzebna jest tylko jedna
- **No compression:** duże pliki, wysokie koszty storage
- **No schema:** brak informacji o typach danych
- **Slow queries:** parsowanie tekstu przy każdym odczycie

**Parquet zalety:**
- **Column-oriented:** czyta tylko potrzebne kolumny
- **Excellent compression:** 75-90% mniejsze pliki
- **Schema included:** metadane o typach danych
- **Predicate pushdown:** filtry na poziomie storage
- **Splittable:** równoległe przetwarzanie przez wiele workerów

**Struktura pliku Parquet:**
- **Row Groups:** grupy wierszy (typ. 64MB-1GB)
- **Column Chunks:** fragmenty kolumn w każdym row group
- **Pages:** najmniejsze jednostki (typ. 8KB)
- **Metadata:** statystyki kolumn dla optymalizacji zapytań

**Przykład konwersji:**

**Dane źródłowe (CSV):**
\`\`\`csv
order_id,customer_id,order_date,total_amount,product_name,category
1001,501,2025-01-15,299.99,iPhone 15,Electronics
1002,502,2025-01-15,49.99,Book Title,Books
1003,501,2025-01-16,149.99,Headphones,Electronics
\`\`\`

**Konwersja do Parquet:**
\`\`\`python
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Wczytaj CSV
df = pd.read_csv('orders.csv')

# Konwertuj typy danych
df['order_date'] = pd.to_datetime(df['order_date'])
df['total_amount'] = df['total_amount'].astype('float64')
df['order_id'] = df['order_id'].astype('int64')
df['customer_id'] = df['customer_id'].astype('int64')

# Zapisz jako Parquet z kompresją
table = pa.Table.from_pandas(df)
pq.write_table(
    table,
    'orders.parquet',
    compression='snappy',  # lub 'gzip', 'brotli'
    row_group_size=100000  # optymalny rozmiar grupy
)
\`\`\`

**AWS Glue ETL Job:**
\`\`\`python
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)

# Wczytaj dane z S3 (CSV)
datasource = glueContext.create_dynamic_frame.from_catalog(
    database="raw_database",
    table_name="orders_csv",
    transformation_ctx="datasource"
)

# Konwertuj do Parquet
datasink = glueContext.write_dynamic_frame.from_options(
    frame=datasource,
    connection_type="s3",
    connection_options={
        "path": "s3://my-bucket/staging/orders/",
        "partitionKeys": ["year", "month"]
    },
    format="parquet",
    format_options={
        "compression": "snappy"
    },
    transformation_ctx="datasink"
)

job.commit()
\`\`\`

**Partitioning w Parquet:**
\`\`\`
# Dobra praktyka: partition by date columns
s3://bucket/orders/
├── year=2025/
│   ├── month=01/
│   │   ├── part-00001.parquet
│   │   └── part-00002.parquet
│   └── month=02/
└── year=2024/
\`\`\`

**Optymalizacje:**
- **Snappy compression:** dobry balans szybkość/kompresja
- **Row group size:** 64MB-1GB dla optymalnej wydajności
- **Dictionary encoding:** dla kolumn z powtarzającymi się wartościami
- **Column pruning:** czytaj tylko potrzebne kolumny`
      },
      {
        id: 's3-lifecycle',
        text: 'S3 lifecycle policies',
        category: 'aws',
        description: `S3 Lifecycle Policies automatyzują przenoszenie danych między klasami storage w zależności od ich wieku i częstotliwości dostępu.

**Klasy storage w S3:**

**Standard (S3 Standard):**
- Najwyższa dostępność i wydajność
- Dla danych często używanych
- Najwyższy koszt

**Standard-IA (Infrequent Access):**
- Niższy koszt niż Standard
- Dla danych używanych raz na miesiąc
- Minimalny czas przechowywania 30 dni

**Glacier Instant Retrieval:**
- Bardzo niski koszt
- Dostęp w milisekundy
- Dla danych archiwalnych z wymaganiem szybkiego dostępu

**Glacier Flexible Retrieval:**
- Najniższy koszt długoterminowego storage
- Dostęp w 1-5 minut (expedited), 3-5 godzin (standard), lub 5-12 godzin (bulk)
- Dla danych archiwalnych bez pilnego dostępu

**Glacier Deep Archive:**
- Najtańszy storage (0.00099$/GB/miesiąc)
- Dostęp w 12 godzinach
- Dla compliance i backup długoterminowego

**Strategie Lifecycle:**

**Hot → Warm → Cold:**
\`\`\`json
{
    "Rules": [
        {
            "ID": "Transition to IA",
            "Status": "Enabled",
            "Prefix": "raw/",
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                }
            ]
        },
        {
            "ID": "Transition to Glacier",
            "Status": "Enabled",
            "Prefix": "raw/",
            "Transitions": [
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ]
        },
        {
            "ID": "Delete old raw data",
            "Status": "Enabled",
            "Prefix": "raw/",
            "Expiration": {
                "Days": 365
            }
        }
    ]
}
\`\`\`

**Inteligentne Tiering:**
\`\`\`json
{
    "ID": "IntelligentTiering",
    "Status": "Enabled",
    "Prefix": "staging/",
    "IntelligentTieringConfiguration": {
        "Prefix": "documents/"
    }
}
\`\`\`

**Praktyczne wzorce:**

**Data Lake Lifecycle:**
- **Raw zone:** 30 dni Standard → 60 dni IA → 90 dni Glacier → 1 rok delete
- **Staging zone:** 90 dni Standard → 180 dni IA → 365 dni Glacier
- **Mart zone:** zawsze w Standard (często używane)

**Terraform implementation:**
\`\`\`hcl
resource "aws_s3_bucket_lifecycle_configuration" "data_lake_lifecycle" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "raw_data_lifecycle"
    status = "Enabled"
    prefix = "raw/"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "staging_data_lifecycle"
    status = "Enabled"
    prefix = "staging/"

    transition {
      days          = 60
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "mart_data_intelligent_tiering"
    status = "Enabled"
    prefix = "mart/"

    intelligent_tiering {
      prefix = ""
    }
  }
}
\`\`\`

**Monitoring i optymalizacja:**
\`\`\`sql
-- Sprawdź użycie storage przez klasę
SELECT
    storage_class,
    SUM(bytes) / 1024 / 1024 / 1024 as gb_used,
    COUNT(*) as object_count
FROM inventory
GROUP BY storage_class
ORDER BY gb_used DESC;

-- Znajdź obiekty bez lifecycle policies
SELECT
    bucket,
    key,
    last_modified,
    storage_class,
    size
FROM inventory
WHERE storage_class = 'STANDARD'
  AND last_modified < CURRENT_DATE - INTERVAL '90' DAY;
\`\`\`

**Best practices:**
- **Testuj policies:** zacznij od małych subsetów danych
- **Monitoruj koszty:** śledź wpływ na billing
- **Dokumentuj reguły:** dlaczego dana polityka istnieje
- **Backup przed delete:** nigdy nie usuwaj danych produkcyjnych bez backupu
- **Compliance:** zachowaj dane wymagane przez prawo`
      },
    ],
    output: 'dane lądują w S3, README: "data lake layout"',
    quiz: {
      id: 'week3-quiz',
      questions: [
        {
          id: 'q1-s3-lake',
          question: 'Dlaczego S3 jest lepszym wyborem na data lake niż lokalny dysk?',
          options: [
        {
          id: 's3-cheaper',
          text: 'S3 jest zawsze tańszy niż lokalny dysk',
          explanation: 'Nie zawsze - dla małych wolumenów lokalny dysk może być tańszy. Główną zaletą S3 jest separacja storage od compute, skalowalność i trwałość danych.',
          isCorrect: false
        },
        {
          id: 's3-separation',
          text: 'S3 oddziela storage od compute, umożliwia skalowanie i zapewnia trwałość danych',
          explanation: 'Poprawnie! S3 pozwala na separację storage (dane) od compute (przetwarzanie). Możesz skalować przetwarzanie niezależnie od danych, dane są trwałe i dostępne z wielu miejsc jednocześnie.',
          isCorrect: true
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week4',
    week: 'Tydzień 4',
    title: 'Python + AWS S3 (boto3) - podstawy z Volt',
    description: 'Cel: opanować boto3 i podstawowe operacje S3 używając danych z aplikacji Volt',
    startDate: '2025-01-27',
    endDate: '2025-01-30',
    isBreak: false,
    tasks: [
      { id: 'boto3-install', text: 'Instalacja boto3', category: 'python', description: 'pip install boto3 - podstawowa biblioteka do pracy z AWS' },
      { id: 'aws-configure', text: 'Konfiguracja AWS credentials', category: 'aws', description: 'aws configure - IAM role z uprawnieniami do S3' },
      { id: 's3-bucket-create', text: 'Tworzenie bucketów S3', category: 'aws', description: 'Stwórz bucket volt-data-lake dla danych aplikacji Volt' },
      { id: 's3-upload-download', text: 'Upload/download plików', category: 'python', description: 'Prześlij przykładowe pliki CSV i zdjęcia z aplikacji Volt' },
      { id: 'presigned-urls', text: 'Generowanie presigned URLs', category: 'python', description: 'Wygeneruj bezpieczne linki do zdjęć komponentów' },
      { id: 'iam-policies', text: 'Zarządzanie uprawnieniami IAM', category: 'aws', description: 'Skonfiguruj IAM policies z least privilege' },
    ],
    output: 'Bucket S3 z przykładowymi danymi, działające presigned URLs',
    detailedDescription: `### Dzień 1-2: Python + AWS S3 (boto3) - podstawy z Volt

**Cel:** Opanować boto3 i podstawowe operacje S3 używając danych z aplikacji Volt.

**Zadania:**
- [ ] **Instalacja boto3:** \`pip install boto3\`
- [ ] **Konfiguracja AWS:** \`aws configure\`, IAM role z uprawnieniami S3
- [ ] **Tworzenie bucketów:** Stwórz bucket \`volt-data-lake\`
- [ ] **Upload/download plików:** Prześlij przykładowe pliki CSV i zdjęcia z Volt
- [ ] **Presigned URLs:** Wygeneruj bezpieczne linki do zdjęć komponentów
- [ ] **Zarządzanie uprawnieniami:** Skonfiguruj IAM policies z least privilege

**Ćwiczenie praktyczne z Volt:**
\`\`\`python
# Stwórz bucket → wgraj dane komponentów z PostgreSQL → pobierz je → usuń testowe pliki
from scripts.python.week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3
components = export_components_to_json()
upload_components_to_s3(components)
\`\`\`

**Output:** Bucket S3 z przykładowymi danymi, działające presigned URLs.

---

### Dzień 3-4: Praca z danymi – CSV/JSON/Parquet + Volt

**Cel:** Nauczyć się transformacji danych używając rzeczywistych danych z aplikacji Volt.

**Zadania:**
- [ ] **Pandas basics:** \`pip install pandas pyarrow\`
- [ ] **Wczytywanie danych:** CSV/JSON z PostgreSQL Volt
- [ ] **Transformacje:** Czyszczenie, filtrowanie danych komponentów
- [ ] **Zapis Parquet:** Konwersja danych Volt do formatu Parquet
- [ ] **Upload do S3:** Przesyłanie przetworzonych danych

**Ćwiczenie z Volt:**
\`\`\`python
# Pobierz dane komponentów z Postgres → Pandas → Parquet → S3
import pandas as pd
from scripts.python.week4.volt_data_to_s3 import get_postgres_connection

conn = get_postgres_connection()
df = pd.read_sql("SELECT * FROM electrical_components WHERE price > 0", conn)
df.to_parquet("volt_components.parquet")
# Upload do S3...
\`\`\`

**Output:** Dane komponentów w formacie Parquet w S3, skrypt transformacji.

---

### Dzień 5: Eventy S3 + Lambda (Python) + Volt

**Cel:** Event-driven processing dla automatycznej obróbki danych z aplikacji Volt.

**Zadania:**
- [ ] **Lambda function:** Stwórz funkcję do konwersji CSV→Parquet
- [ ] **S3 events:** Skonfiguruj trigger na upload plików do S3
- [ ] **Testowanie lokalnie:** Użyj AWS SAM lub mocków boto3
- [ ] **Integracja z Volt:** Lambda wywołuje się przy uploadzie zdjęć

**Ćwiczenie z Volt:**
\`\`\`python
# Upload zdjęcia komponentu → Lambda zmniejsza rozmiar → zapis do innego bucketu
# Użyj scripts/python/week5/lambda_csv_to_parquet.py jako template
\`\`\`

**Output:** Lambda function reagująca na uploady plików z aplikacji Volt.

---

### Dzień 6-7: Integracja z API / Secrets Manager + Volt

**Cel:** Łączenie danych z aplikacji Volt z zewnętrznymi źródłami.

**Zadania:**
- [ ] **API Gateway:** REST API do pobierania danych
- [ ] **Secrets Manager:** Bezpieczne przechowywanie kluczy bazy danych
- [ ] **Łączenie danych:** API + PostgreSQL Volt + S3
- [ ] **Error handling:** Retry, timeout, logging błędów

**Ćwiczenie z Volt:**
\`\`\`python
# Pobierz dane z zewnętrznego API → połącz z danymi komponentów → zapisz do S3 → log w Postgres
# Integracja z istniejącym Node.js API Volt
\`\`\`

**Output:** Python API endpoints komunikujące się z aplikacją Volt.`,
    exercises: [
      {
        title: 'Podstawowe operacje S3',
        description: 'Przećwicz tworzenie bucketu, upload plików i generowanie presigned URLs',
        code: `# Przykład kodu do ćwiczenia
from scripts.python.week4.volt_data_to_s3 import export_components_to_json, upload_components_to_s3

# Eksport danych z aplikacji Volt
components = export_components_to_json()
print(f"Pobrano {len(components)} komponentów")

# Upload do S3
s3_key = upload_components_to_s3(components)
print(f"Dane przesłane do S3: {s3_key}")
`
      }
    ],
    quiz: {
      id: 'week4-quiz',
      questions: [
        {
          id: 'q1-s3-bucket-naming',
          question: 'Jakie są zasady nazywania bucketów S3?',
          options: [
        {
          id: 'bucket-global-unique',
          text: 'Buckety muszą mieć unikalne nazwy globalnie w całym AWS',
          explanation: 'Poprawnie! Nazwy bucketów S3 są globalnie unikalne - nie możesz mieć dwóch bucketów o tej samej nazwie, nawet w różnych regionach.',
          isCorrect: true
        },
        {
          id: 'bucket-local-unique',
          text: 'Buckety muszą mieć unikalne nazwy tylko w ramach jednego regionu',
          explanation: 'Nieprawda. Buckety mają globalnie unikalne nazwy. Jeśli ktoś już używa nazwy "my-bucket", nie możesz jej użyć.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week5',
    week: 'Tydzień 5',
    title: 'Airflow + Analytics - dni 8-14',
    description: 'Cel: kompletny pipeline od danych do analizy',
    startDate: '2025-02-08',
    endDate: '2025-02-14',
    isBreak: false,
    detailedDescription: `### Dzień 8-9: Airflow + S3 + Volt

**Cel:** Orkiestracja pipeline'ów danych dla aplikacji Volt.

**Zadania:**
- [ ] **Instalacja Airflow:** \`pip install apache-airflow\`
- [ ] **Podstawy DAG:** Directed Acyclic Graphs
- [ ] **Operatorzy:** S3Hook, PythonOperator, PostgresOperator
- [ ] **Monitoring:** Logi, alerty, status zadań

**Ćwiczenie z Volt:**
\`\`\`python
# DAG: Pobierz nowe komponenty z Postgres → transform Pandas → upload do S3
# Użyj danych z aplikacji Volt jako przykład
\`\`\`

**Output:** Działaący DAG Airflow przetwarzający dane z Volt.

---

### Dzień 10-11: Redshift/Athena (opcjonalnie Postgres) + Volt

**Cel:** Analiza danych z S3 używając różnych narzędzi.

**Zadania:**
- [ ] **Schematy w Postgres:** Tabele analityczne dla danych Volt
- [ ] **COPY z S3:** Ładowanie danych Parquet do Postgres
- [ ] **Query danych:** Agregacje, JOIN z oryginalnymi danymi Volt
- [ ] **Athena:** Query bezpośrednio na S3 (bez kopiowania)

**Ćwiczenie z Volt:**
\`\`\`python
# Z S3 wrzuć dane komponentów → Postgres → zapytanie o top komponenty → wynik do S3
# Połącz z istniejącą tabelą electrical_components
\`\`\`

**Output:** Analityczna baza danych z danymi z aplikacji Volt.

---

### Dzień 12: Transformacje i automatyzacja + Volt

**Cel:** Zaawansowane transformacje danych z aplikacji Volt.

**Zadania:**
- [ ] **Pandas transformacje:** Zaawansowane operacje na danych
- [ ] **Walidacja danych:** Sprawdzenie poprawności danych Volt
- [ ] **Filtrowanie:** Usuwanie błędnych/duplikatów komponentów
- [ ] **Testowanie:** Unit tests dla funkcji transformacji

**Ćwiczenie z Volt:**
\`\`\`python
# Walidacja danych komponentów: cena > 0, nazwa nie pusta, prawidłowe typy
# Transformacje: normalizacja nazw, kategorie, obliczone kolumny
\`\`\`

**Output:** Czysty, przetworzony dataset z aplikacji Volt.

---

### Dzień 13: Monitoring i logowanie + Volt

**Cel:** Monitoring pipeline'ów przetwarzających dane z aplikacji Volt.

**Zadania:**
- [ ] **CloudWatch:** Logi dla Lambda i S3 (jeśli AWS)
- [ ] **Python logging:** Szczegółowe logi operacji
- [ ] **Airflow monitoring:** Status DAG, alerty błędów
- [ ] **Metrics:** Czas wykonania, liczba przetworzonych rekordów

**Ćwiczenie z Volt:**
\`\`\`python
# Logowanie każdej operacji na danych komponentów
# Alert przy błędzie w pipeline Volt → S3
\`\`\`

**Output:** Kompletny monitoring pipeline'ów Volt.

---

### Dzień 14: Mini-projekt końcowy - Pełny Pipeline Volt

**Cel:** Zintegrowanie wszystkiego w działający end-to-end pipeline.

**Zadania:**
- [ ] **Pełny pipeline:** Postgres Volt + API → Pandas → Parquet → S3
- [ ] **Lambda trigger:** Automatyczna obróbka uploadów
- [ ] **Airflow orchestration:** DAG zarządzający całym procesem
- [ ] **Monitoring:** Logi, alerty, dashboard statusu

**Mini-projekt Volt:**
\`\`\`
1. Pobierz nowe komponenty z Postgres Volt
2. Pobierz dodatkowe dane z API (np. ceny rynkowe)
3. Transformacja Pandas (oczyszczanie, agregacje)
4. Konwersja do Parquet
5. Upload do S3 z partycjonowaniem
6. Lambda walidacja i dodatkowe transformacje
7. Załadunek do analitycznej bazy danych
8. Monitoring i alerty
\`\`\`

**Output:** Produkcyjny pipeline dla aplikacji Volt z pełnym monitoringiem!`,
    exercises: [
      {
        title: 'Transformacje danych z Pandas',
        description: 'Przećwicz wczytywanie danych z PostgreSQL, czyszczenie i konwersję do Parquet',
        code: `# Przykład ćwiczenia z Pandas
import pandas as pd
from scripts.python.week4.volt_data_to_s3 import get_postgres_connection

# Połącz z bazą danych Volt
conn = get_postgres_connection()

# Wczytaj dane komponentów
df = pd.read_sql("""
    SELECT id, name, price, type, voltage, current
    FROM electrical_components
    WHERE price > 0 AND price < 1000
""", conn)

print(f"Wczytano {len(df)} komponentów")
print(f"Kolumny: {list(df.columns)}")

# Transformacje danych
df['price_category'] = pd.cut(df['price'], bins=[0, 100, 500, float('inf')],
                             labels=['budget', 'standard', 'premium'])

# Zapisz jako Parquet
df.to_parquet('volt_components_clean.parquet', index=False)
print("Dane zapisane jako Parquet")
`
      }
    ],
    tasks: [
      { id: 'pandas-basics', text: 'Pandas basics - wczytywanie danych z PostgreSQL Volt', category: 'python', description: 'pip install pandas pyarrow - podstawowe operacje na danych' },
      { id: 'data-cleaning', text: 'Czyszczenie i filtrowanie danych komponentów', category: 'python', description: 'Usuwanie NULLi, normalizacja, walidacja danych z aplikacji Volt' },
      { id: 'parquet-conversion', text: 'Konwersja do Parquet i upload do S3', category: 'python', description: 'Zamiana danych z PostgreSQL na format Parquet optymalny dla analizy' },
      { id: 'data-validation', text: 'Walidacja struktury danych', category: 'python', description: 'Sprawdzenie poprawności schematu i typów danych' },
    ],
    output: 'Dane komponentów w formacie Parquet w S3, skrypt transformacji',
    quiz: {
      id: 'week5-quiz',
      questions: [
        {
          id: 'q1-parquet-csv',
          question: 'Dlaczego Parquet jest lepszy niż CSV dla analitycznych obciążeń?',
          options: [
        {
          id: 'parquet-compression',
          text: 'Parquet ma lepszą kompresję i czyta tylko potrzebne kolumny',
          explanation: 'Poprawnie! Parquet to format kolumnowy z doskonałą kompresją (75-90% mniej miejsca) i optymalizacją - czyta tylko potrzebne kolumny, co jest idealne dla zapytań analitycznych.',
          isCorrect: true
        },
        {
          id: 'parquet-human-readable',
          text: 'Parquet jest czytelny dla ludzi jak CSV',
          explanation: 'Nieprawda. Parquet to binarny format kolumnowy - nie jest czytelny dla ludzi jak CSV. Jest zoptymalizowany pod maszyny, nie ludzi.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week6',
    week: 'Tydzień 6',
    title: 'Eventy S3 + Lambda (Python) + Volt',
    description: 'Cel: event-driven processing dla automatycznej obróbki danych z aplikacji Volt',
    startDate: '2025-02-08',
    endDate: '2025-02-14',
    isBreak: false,
    tasks: [
      { id: 'lambda-csv-parquet', text: 'Lambda function do CSV→Parquet konwersji', category: 'aws', description: 'Stwórz funkcję Lambda automatycznie konwertującą pliki' },
      { id: 's3-event-triggers', text: 'S3 event triggers dla automatycznej obróbki', category: 'aws', description: 'Skonfiguruj wyzwalacze S3 wywołujące Lambda przy uploadzie' },
      { id: 'lambda-testing', text: 'Testowanie Lambda lokalnie', category: 'python', description: 'Użyj AWS SAM lub mocków boto3 do testowania' },
      { id: 'volt-integration', text: 'Integracja z aplikacją Volt', category: 'python', description: 'Lambda reaguje na uploady plików z aplikacji Volt' },
    ],
    output: 'Lambda function reagująca na uploady plików z aplikacji Volt',
    quiz: {
      id: 'week6-quiz',
      questions: [
        {
          id: 'q1-lambda-cold-start',
          question: 'Co to jest "cold start" w AWS Lambda?',
          options: [
        {
          id: 'lambda-cold-start',
          text: 'Opóźnienie przy pierwszym wywołaniu Lambda po okresie bezczynności',
          explanation: 'Poprawnie! Cold start to czas potrzebny na zainicjalizowanie środowiska Lambda przy pierwszym wywołaniu lub po okresie bezczynności. Może trwać od 100ms do kilku sekund.',
          isCorrect: true
        },
        {
          id: 'lambda-cold-start-wrong',
          text: 'Błąd Lambda przy zbyt niskiej temperaturze',
          explanation: 'Nieprawda. Cold start to termin techniczny związany z czasem uruchamiania funkcji Lambda, nie ma nic wspólnego z temperaturą.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week7',
    week: 'Tydzień 7',
    title: 'Integracja z API / Secrets Manager + Volt',
    description: 'Cel: łączenie danych z aplikacji Volt z zewnętrznymi źródłami',
    startDate: '2025-02-15',
    endDate: '2025-02-21',
    isBreak: false,
    tasks: [
      { id: 'api-gateway', text: 'API Gateway + REST API', category: 'aws', description: 'Tworzenie REST API do pobierania danych' },
      { id: 'secrets-manager', text: 'Secrets Manager dla bezpiecznego przechowywania kluczy', category: 'aws', description: 'Zarządzanie kluczami API i hasłami do baz danych' },
      { id: 'api-data-merging', text: 'Łączenie danych API + PostgreSQL Volt + S3', category: 'python', description: 'Integracja wielu źródeł danych' },
      { id: 'error-handling', text: 'Error handling: retry, timeout, logging', category: 'python', description: 'Obsługa błędów w integracjach API' },
    ],
    output: 'Python API endpoints komunikujące się z aplikacją Volt',
    quiz: {
      id: 'week7-quiz',
      questions: [
        {
          id: 'q1-secrets-manager',
          question: 'Dlaczego warto używać AWS Secrets Manager zamiast hardkodowanych haseł?',
          options: [
        {
          id: 'secrets-security',
          text: 'Automatyczna rotacja sekretów, szyfrowanie, audyt dostępu',
          explanation: 'Poprawnie! Secrets Manager zapewnia automatyczną rotację haseł, szyfrowanie, szczegółowy audyt dostępu i centralne zarządzanie wszystkimi sekretami.',
          isCorrect: true
        },
        {
          id: 'secrets-cheaper',
          text: 'Jest tańszy niż trzymanie haseł w kodzie',
          explanation: 'Chociaż Secrets Manager ma koszty, to nie jest główny powód jego używania. Główną wartością jest bezpieczeństwo i możliwość automatycznej rotacji sekretów.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week8',
    week: 'Tydzień 8',
    title: 'Airflow + S3 + Volt',
    description: 'Cel: orkiestracja pipeline\'ów danych dla aplikacji Volt',
    startDate: '2025-02-22',
    endDate: '2025-02-28',
    isBreak: false,
    tasks: [
      { id: 'airflow-setup', text: 'Instalacja Airflow', category: 'airflow', description: 'pip install apache-airflow, konfiguracja bazy danych' },
      { id: 'dag-basics', text: 'Podstawy DAG: Directed Acyclic Graphs', category: 'airflow', description: 'Zrozumienie koncepcji DAG i zależności między zadaniami' },
      { id: 'airflow-operators', text: 'Operatorzy: S3Hook, PythonOperator, PostgresOperator', category: 'airflow', description: 'Korzystanie z gotowych operatorów Airflow' },
      { id: 'volt-dag', text: 'DAG dla pipeline\'u Volt → S3', category: 'airflow', description: 'Praktyczny DAG przetwarzający dane z aplikacji Volt' },
      { id: 'airflow-monitoring', text: 'Monitoring: logi, alerty, status zadań', category: 'airflow', description: 'Śledzenie wykonania i debugowanie pipeline\'ów' },
    ],
    output: 'Działaący DAG Airflow przetwarzający dane z Volt',
    quiz: {
      id: 'week8-quiz',
      questions: [
        {
          id: 'q1-airflow-dag',
          question: 'Co oznacza DAG w kontekście Apache Airflow?',
          options: [
        {
          id: 'dag-airflow',
          text: 'Directed Acyclic Graph - skierowany graf acykliczny reprezentujący workflow',
          explanation: 'Poprawnie! DAG to matematyczna struktura danych - skierowany graf bez cykli. W Airflow reprezentuje przepływ zadań z zależnościami między nimi.',
          isCorrect: true
        },
        {
          id: 'dag-database',
          text: 'Database Access Gateway - bramka dostępu do bazy danych',
          explanation: 'Nieprawda. DAG w Airflow to Directed Acyclic Graph, nie ma nic wspólnego z dostępem do bazy danych.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week9',
    week: 'Tydzień 9',
    title: 'Redshift/Athena + Volt',
    description: 'Cel: analiza danych z S3 używając różnych narzędzi',
    startDate: '2025-03-01',
    endDate: '2025-03-07',
    isBreak: false,
    tasks: [
      { id: 'postgres-analytics', text: 'Schematy analityczne w Postgres dla danych Volt', category: 'sql', description: 'Tworzenie tabel analitycznych z danymi komponentów' },
      { id: 's3-data-loading', text: 'COPY z S3 i ładowanie danych Parquet', category: 'sql', description: 'Efektywne ładowanie danych z S3 do bazy analitycznej' },
      { id: 'analytics-queries', text: 'Zapytania agregujące i analiza danych', category: 'sql', description: 'Analiza biznesowa danych z aplikacji Volt' },
      { id: 'athena-queries', text: 'Athena: query bezpośrednio na S3', category: 'aws', description: 'Analiza danych bez kopiowania do bazy' },
    ],
    output: 'Analityczna baza danych z danymi z aplikacji Volt',
    quiz: {
      id: 'week9-quiz',
      questions: [
        {
          id: 'q1-athena-vs-redshift',
          question: 'Kiedy wybrać Athena zamiast Redshift?',
          options: [
        {
          id: 'athena-cheap',
          text: 'Dla rzadkich zapytań na dużych danych bez potrzeby stałej bazy',
          explanation: 'Poprawnie! Athena jest idealna dla sporadycznych zapytań na danych w S3 - płacisz tylko za przetworzone dane. Redshift lepiej nadaje się do częstych zapytań wymagających stałej dostępności.',
          isCorrect: true
        },
        {
          id: 'athena-always',
          text: 'Athena jest zawsze lepsza od Redshift',
          explanation: 'Nieprawda. Athena jest świetna dla ad-hoc zapytań, ale Redshift lepiej nadaje się do złożonych, częstych zapytań wymagających optymalizacji i stałej dostępności.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week10',
    week: 'Tydzień 10',
    title: 'Transformacje i automatyzacja + Volt',
    description: 'Cel: zaawansowane transformacje danych z aplikacji Volt',
    startDate: '2025-03-08',
    endDate: '2025-03-14',
    isBreak: false,
    tasks: [
      { id: 'advanced-pandas', text: 'Zaawansowane transformacje Pandas dla danych Volt', category: 'python', description: 'Złożone operacje na danych komponentów' },
      { id: 'data-validation-rules', text: 'Walidacja i testowanie danych komponentów', category: 'python', description: 'Sprawdzenie poprawności danych: cena > 0, prawidłowe typy' },
      { id: 'business-logic', text: 'Logika biznesowa: kategorie, obliczone metryki', category: 'python', description: 'Dodanie obliczeń biznesowych do danych' },
      { id: 'unit-tests', text: 'Unit tests dla funkcji transformacji', category: 'python', description: 'Testowanie funkcji przetwarzania danych' },
    ],
    output: 'Czysty, przetworzony dataset z aplikacji Volt z logiką biznesową',
    quiz: {
      id: 'week10-quiz',
      questions: [
        {
          id: 'q1-data-validation',
          question: 'Dlaczego walidacja danych jest ważna w pipeline\'ach?',
          options: [
        {
          id: 'validation-optional',
          text: 'Walidacja jest opcjonalna - dane zawsze są poprawne',
          explanation: 'Nieprawda. Źródła danych często zawierają błędy, niespójności, brakujące wartości. Walidacja wychwytuje te problemy przed przekazaniem do użytkowników biznesowych.',
          isCorrect: false
        },
        {
          id: 'validation-critical',
          text: 'Wychwytuje błędy danych przed przekazaniem do analityków i zapobiega błędnym decyzjom',
          explanation: 'Poprawnie! Walidacja danych to krytyczny element - błędy w danych prowadzą do błędnych decyzji biznesowych. Lepiej wykryć problem w pipeline\'ie niż w dashboardzie.',
          isCorrect: true
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week11',
    week: 'Tydzień 11',
    title: 'Monitoring i logowanie + Volt',
    description: 'Cel: monitoring pipeline\'ów przetwarzających dane z aplikacji Volt',
    startDate: '2025-03-15',
    endDate: '2025-03-21',
    isBreak: false,
    tasks: [
      { id: 'logging-setup', text: 'Szczegółowe logowanie operacji na danych komponentów', category: 'python', description: 'Logowanie każdej transformacji i transferu danych' },
      { id: 'error-monitoring', text: 'Monitorowanie błędów i anomalii', category: 'monitoring', description: 'Śledzenie błędów w pipeline\'ach Volt' },
      { id: 'performance-metrics', text: 'Metryki wydajności: czas wykonania, liczba rekordów', category: 'monitoring', description: 'Pomiar efektywności przetwarzania' },
      { id: 'alert-system', text: 'System alertów przy błędach w pipeline\'ach', category: 'monitoring', description: 'Powiadomienia o problemach z danymi Volt' },
    ],
    output: 'Kompletny monitoring pipeline\'ów z aplikacji Volt',
    quiz: {
      id: 'week11-quiz',
      questions: [
        {
          id: 'q1-logging-levels',
          question: 'Które poziomy logowania są najważniejsze w data engineering?',
          options: [
        {
          id: 'logging-info-debug',
          text: 'INFO i DEBUG dla szczegółowego śledzenia',
          explanation: 'Poprawnie! INFO pokazuje postęp operacji, DEBUG pozwala na szczegółowe śledzenie problemów. ERROR i WARNING są krytyczne dla wykrywania awarii.',
          isCorrect: true
        },
        {
          id: 'logging-only-errors',
          text: 'Tylko ERROR - inne poziomy nie są potrzebne',
          explanation: 'Nieprawda. Bez INFO i DEBUG trudno zrozumieć co się dzieje w pipeline\'ie. Monitoring to nie tylko błędy, ale też śledzenie postępów i wydajności.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  },
  {
    id: 'week12',
    week: 'Tydzień 12',
    title: 'Mini-projekt końcowy - Pełny Pipeline Volt',
    description: 'Cel: zintegrowanie wszystkiego w działający end-to-end pipeline',
    startDate: '2025-03-22',
    endDate: '2025-03-28',
    isBreak: false,
    tasks: [
      { id: 'full-pipeline-design', text: 'Projekt pełnego pipeline\'u Volt end-to-end', category: 'other', description: 'Zaprojektowanie kompletnego przepływu danych' },
      { id: 'pipeline-implementation', text: 'Implementacja: Postgres Volt + API → Pandas → Parquet → S3', category: 'python', description: 'Zbudowanie działającego pipeline\'u' },
      { id: 'lambda-integration', text: 'Lambda trigger: automatyczna obróbka uploadów', category: 'aws', description: 'Event-driven processing dla nowych danych' },
      { id: 'airflow-orchestration', text: 'Airflow orchestration: DAG zarządzający całym procesem', category: 'airflow', description: 'Centralne zarządzanie pipeline\'em' },
      { id: 'monitoring-dashboard', text: 'Monitoring i alerty dla całego pipeline\'u', category: 'monitoring', description: 'Kompletny monitoring i alerting' },
      { id: 'documentation', text: 'Dokumentacja i prezentacja projektu', category: 'other', description: 'Opis architektury, decyzji, przyszłych ulepszeń' },
    ],
    output: 'Produkcyjny pipeline dla aplikacji Volt z pełnym monitoringiem!',
    quiz: {
      id: 'week12-quiz',
      questions: [
        {
          id: 'q1-production-readiness',
          question: 'Co jest najważniejsze dla produkcyjnej gotowości data pipeline?',
          options: [
        {
          id: 'production-monitoring',
          text: 'Monitoring, alerting, error handling i dokumentacja',
          explanation: 'Poprawnie! Produkcyjny pipeline potrzebuje: monitoringu (aby wiedzieć o problemach), alertingu (aby reagować), obsługi błędów (aby być odpornym) i dokumentacji (aby móc utrzymywać).',
          isCorrect: true
        },
        {
          id: 'production-speed',
          text: 'Jak najszybsze przetwarzanie danych',
          explanation: 'Szybkość jest ważna, ale nie najważniejsza. Produkcyjny pipeline musi być przede wszystkim niezawodny, monitorowany i łatwy w utrzymaniu.',
          isCorrect: false
        }
          ]
        }
      ]
    }
  }
];


export const dataEngineerQuestions = [
  {
    id: 1,
    category: 'ARCHITEKTURA & DATA PLATFORM',
    question: 'Opowiedz o architekturze swojej platformy danych',
    answer: 'Platforma opiera się na AWS. Dane z zewnętrznych API są pobierane przez pipeline\'y w Pythonie orkiestracyjne przez Airflow. Surowe dane lądują w S3 jako warstwa raw, następnie są ładowane do hurtowni danych, gdzie dbt odpowiada za transformacje, testy jakości i modele analityczne. Całość jest monitorowana pod kątem błędów, świeżości danych i kosztów.',
    note: '💡 Dlaczego to działa: zwięzłe, kompletne, bez lania wody.',
  },
  {
    id: 2,
    category: 'ARCHITEKTURA & DATA PLATFORM',
    question: 'Jakie technologie używasz do ETL?',
    answer: 'Python z Pandas do lekkich transformacji, dbt do SQL transformacji w hurtowni, Airflow do orkiestracji. Dla dużych wolumenów danych używam Spark. Wszystko hostowane na AWS (EMR, Glue, Lambda).',
    note: '💡 Pokaż, że potrafisz dobrać narzędzia do skali problemu.',
  },
  {
    id: 3,
    category: 'ARCHITEKTURA & DATA PLATFORM',
    question: 'Opisz flow danych w Twojej platformie',
    answer: 'Dane → API/Lambda → S3 (raw) → Glue/Athena (staging) → Redshift (production) → BI tools. Każda warstwa ma swoje przeznaczenie: raw do backupu, staging do eksperymentów, prod do raportów.',
    note: '💡 Opisz dlaczego każda warstwa jest potrzebna.',
  },
  {
    id: 4,
    category: 'ARCHITEKTURA & DATA PLATFORM',
    question: 'Jak dbasz o jakość danych?',
    answer: 'Testy w dbt (unique, not_null), monitoring w Airflow, alerty na anomalie, regularne audyty. Dbam o to, żeby błędy były wykrywane jak najwcześniej w pipeline.',
    note: '💡 Jakości danych nie da się dodać na końcu - trzeba projektować od początku.',
  },
  {
    id: 5,
    category: 'ETL & PIPELINE\'Y',
    question: 'Jak obsłużysz duplikaty w danych streamingowych?',
    answer: 'Używam deduplikacji przez watermarking (event-time) lub przez idempotent writes. W Kafka utrzymuję offsety, w S3 używam partycjonowania z timestamp. Kluczowe jest zaprojektowanie kluczy biznesowych.',
    note: '💡 Pokaż zrozumienie exactly-once semantics.',
  },
  {
    id: 6,
    category: 'ETL & PIPELINE\'Y',
    question: 'Opisz sytuację, kiedy pipeline się zepsuł',
    answer: 'Pipeline przestał działać przez zmianę schematu API. Nie miał testów na zmiany schematu. Dodałem kontrakt testy (schema validation) i monitoring na zmiany. Od tego czasu pipeline jest odporny na takie zmiany.',
    note: '💡 Opowiadaj o konkretnych problemach i rozwiązaniach.',
  },
  {
    id: 7,
    category: 'ETL & PIPELINE\'Y',
    question: 'Jakie masz strategie backfillowania danych?',
    answer: 'Dla małych wolumenów: rerun całego DAG z nową datą. Dla dużych: incremental backfill z oknami czasowymi, paralelizacja po partycjach. Zawsze testuję na próbce danych najpierw.',
    note: '💡 Backfill to częsta operacja w data engineering.',
  },
  {
    id: 8,
    category: 'BAZY DANYCH & SQL',
    question: 'Jak zoptymalizujesz wolne zapytanie?',
    answer: 'Sprawdzam execution plan, dodaję indeksy, repartycjonuję tabele, używam odpowiednich formatów (Parquet/ORC). Jeśli to distributed system - sprawdzam data skew i salting.',
    note: '💡 Pokaż systematyczne podejście do optymalizacji.',
  },
  {
    id: 9,
    category: 'BAZY DANYCH & SQL',
    question: 'Kiedy użyjesz indeks, a kiedy partycjonowanie?',
    answer: 'Indeks dla selektywnych zapytań (gdzie < 5% danych). Partycjonowanie dla dużych tabel i zapytań zakresowych (data filters). Indeks przyspiesza lookups, partycjonowanie zmniejsza I/O.',
    note: '💡 Zrozumienie trade-offów między indeksami a partycjonowaniem.',
  },
  {
    id: 10,
    category: 'BAZY DANYCH & SQL',
    question: 'Jak obsłużysz slowly changing dimensions?',
    answer: 'Type 1 dla błędów (overwrite), Type 2 dla historii (nowy rekord z datami ważności). Implementuję przez merge statements lub SCD transformation w dbt.',
    note: '💡 SCD to klasyka data warehousing.',
  },
  {
    id: 11,
    category: 'PYTHON & PROGRAMOWANIE',
    question: 'Jakie są Twoje ulubione biblioteki Python do data engineering?',
    answer: 'Pandas do małych transformacji, PySpark do dużych danych, SQLAlchemy do baz danych, Pydantic do walidacji schematów. Do testów: pytest z fixtures.',
    note: '💡 Pokaż, że masz doświadczenie z różnymi narzędziami.',
  },
  {
    id: 12,
    category: 'PYTHON & PROGRAMOWANIE',
    question: 'Jak debugujesz problemy z pamięcią w Pythonie?',
    answer: 'Używam memory_profiler, tracemalloc do znalezienia leaków, sprawdzam czy obiekty są prawidłowo usuwane. Dla dużych danych używam chunking lub dask zamiast pandas.',
    note: '💡 Pamięć to częsty bottleneck w data processing.',
  },
  {
    id: 13,
    category: 'PYTHON & PROGRAMOWANIE',
    question: 'Jak robisz code review dla kodu data engineering?',
    answer: 'Sprawdzam: testy (czy edge cases są pokryte), error handling (czy błędy są logowane), performance (czy nie ma N+1 queries), security (czy wrażliwe dane są chronione).',
    note: '💡 Code review to część codziennej pracy.',
  },
  {
    id: 14,
    category: 'AWS & CLOUD',
    question: 'Jak dobierasz między EC2, Lambda, Glue?',
    answer: 'Lambda dla event-driven i małych zadań (do 15min). Glue dla ETL na danych w S3. EC2 dla długotrwałych procesów lub kiedy potrzebuję pełną kontrolę nad środowiskiem.',
    note: '💡 Pokaż zrozumienie cost-performance trade-offów.',
  },
  {
    id: 15,
    category: 'AWS & CLOUD',
    question: 'Jak monitorujesz koszty AWS?',
    answer: 'Używam Cost Explorer, ustawiam billing alerts, taguję zasoby, używam reserved instances dla przewidywalnego workload. Regularnie przeglądam unused resources.',
    note: '💡 Koszty to ważna część odpowiedzialności data engineer.',
  },
  {
    id: 16,
    category: 'AWS & CLOUD',
    question: 'Jak zapewniasz bezpieczeństwo danych w chmurze?',
    answer: 'Encryption at rest (KMS) i in transit (TLS), least privilege IAM, VPC isolation, regular audits. Dla wrażliwych danych używam additional encryption layers.',
    note: '💡 Security by design - nie dodatek.',
  },
  {
    id: 17,
    category: 'AIRFLOW & ORKIESTRACJA',
    question: 'Jakie są wady Airflow?',
    answer: 'Nie skaluje dobrze z tysiącami DAGów (scheduler bottleneck), ciężki do development (Python + SQL), brak natywnego support dla streaming. Dla dużych organizacji lepszy coś jak Prefect czy Dagster.',
    note: '💡 Pokaż krytyczne myślenie o narzędziach.',
  },
  {
    id: 18,
    category: 'AIRFLOW & ORKIESTRACJA',
    question: 'Jak organizujesz DAGi w większym projekcie?',
    answer: 'Grupuję po domenach biznesowych (customers, products, finance), używam subDAGs dla powtarzalnych patternów, standaryzuję nazewnictwo i strukturę. Dbam o dependencies między DAGami.',
    note: '💡 Organizacje to klucz do maintainability.',
  },
  {
    id: 19,
    category: 'AIRFLOW & ORKIESTRACJA',
    question: 'Jak testujesz DAGi?',
    answer: 'Unit testy dla Python functions, integration testy dla całego DAG (test DAG), mocki dla external dependencies. Używam pytest z Airflow testing utilities.',
    note: '💡 Testowanie orkiestracji to podstawa reliability.',
  },
  {
    id: 20,
    category: 'WSPÓŁPRACA & KOMUNIKACJA',
    question: 'Jak tłumaczysz wymagania biznesowe na rozwiązania techniczne?',
    answer: 'Zaczynam od zrozumienia, jaka decyzja ma być podjęta na podstawie danych. Dopiero potem projektuję model danych i pipeline\'y, które dostarczą potrzebne informacje.',
  },
  {
    id: 21,
    category: 'WSPÓŁPRACA & KOMUNIKACJA',
    question: 'Jak pracujesz z analitykami danych?',
    answer: 'Pomagam im zrozumieć możliwości i ograniczenia platformy, recenzuję ich SQL, doradzam w optymalizacji zapytań. Uczę ich self-service przez dbt.',
    note: '💡 Data engineer to facilitator dla data analystów.',
  },
  {
    id: 22,
    category: 'WSPÓŁPRACA & KOMUNIKACJA',
    question: 'Jak przekazujesz wiedzę w zespole?',
    answer: 'Prowadzę tech talks, piszę dokumentację (README, runbooks), robię code reviews, mentoruję juniorów. Dbam o to, żeby wiedza była rozproszona.',
    note: '💡 Knowledge sharing zapobiega bottleneckom.',
  },
  {
    id: 23,
    category: 'PROJEKTY & DOŚWIADCZENIE',
    question: 'Jaki był Twój największy sukces w data engineering?',
    answer: 'Zoptymalizowałem pipeline, który działał 8 godzin - skróciłem do 2 godzin przez zmianę architektury (S3 + Athena zamiast Redshift) i lepsze partycjonowanie. To zaoszczędziło firmie $50k rocznie.',
    note: '💡 Mierzalne wyniki robią wrażenie.',
  },
  {
    id: 24,
    category: 'PROJEKTY & DOŚWIADCZENIE',
    question: 'Jakie wyzwania napotkałeś przy migracji do chmury?',
    answer: 'Największe to latency między regions i koszty transferu danych. Rozwiązałem przez multi-region architecture i data compression. Uczymy się na błędach.',
    note: '💡 Migracje to okazja do nauki.',
  },
  {
    id: 25,
    category: 'PROJEKTY & DOŚWIADCZENIE',
    question: 'Jak dobierasz technologie do projektu?',
    answer: 'Patrzę na skalę danych, budget, team skills, timeline. Dla MVP - najprostsze rozwiązanie. Dla production - niezawodność i maintainability przede wszystkim.',
    note: '💡 Technology choice to business decision.',
  },
  {
    id: 26,
    category: 'ZARZĄDZANIE & LEADERSHIP',
    question: 'Jak budujesz zaufanie do danych w organizacji?',
    answer: 'Regularne audyty jakości, transparentne metryki (data quality score), szybkie reakcje na problemy, edukacja użytkowników. Dane muszą być predictable.',
    note: '💡 Trust to podstawa data-driven culture.',
  },
  {
    id: 27,
    category: 'ZARZĄDZANIE & LEADERSHIP',
    question: 'Jak planujesz capacity dla data platform?',
    answer: 'Monitoruję usage trends, planuję headroom (20-30%), automatycznie skaluję zasoby, mam disaster recovery plans. Capacity planning to continuous process.',
    note: '💡 Prevention is better than cure.',
  },
  {
    id: 28,
    category: 'ZARZĄDZANIE & LEADERSHIP',
    question: 'Jak radzisz sobie ze zmianami wymagań w trakcie projektu?',
    answer: 'Używam agile podejścia, regularne demo, early feedback. Jeśli zmiana duża - renegocjuję scope. Ważne jest zarządzanie oczekiwaniami stakeholderów.',
    note: '💡 Zmiany to norma, nie wyjątek.',
  }
];

export interface ConceptCategory {
  id: string;
  name: string;
  icon: string;
  concepts: {
    term: string;
    description: string;
  }[];
}

export const dataEngineerConcepts: ConceptCategory[] = [
  {
    id: 'architecture',
    name: 'ARCHITEKTURA & PROCESY',
    icon: '🏗️',
    concepts: [
      { term: 'Semantic Layer', description: 'Warstwa pojęć biznesowych.' },
      { term: 'Self-service BI', description: 'Analitycy bez pomocy IT.' },
      { term: 'Dashboard Drift', description: 'Raport przestaje odpowiadać rzeczywistości.' },
      { term: 'Metric Definition', description: 'Jedno źródło prawdy dla metryk.' },
      { term: 'Ad-hoc Analysis', description: 'Analiza jednorazowa.' },
    ],
  },
  {
    id: 'engineering',
    name: 'INŻYNIERSKIE DNA',
    icon: '🧑‍💻',
    concepts: [
      { term: 'Technical Debt', description: 'Skróty techniczne do spłacenia.' },
      { term: 'Trade-off', description: 'Świadomy kompromis.' },
      { term: 'Single Source of Truth', description: 'Jedno wiarygodne źródło danych.' },
      { term: 'Data Ownership', description: 'Kto odpowiada za dane end-to-end.' },
    ],
  },
];
