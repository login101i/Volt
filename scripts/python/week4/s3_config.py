"""
Konfiguracja S3 dla aplikacji Volt - Data Engineering Roadmap Week 4
"""
import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError, PartialCredentialsError

# Załaduj zmienne środowiskowe
load_dotenv()

class S3Config:
    """Konfiguracja połączenia z AWS S3"""

    def __init__(self):
        self.access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.region = os.getenv('AWS_DEFAULT_REGION', 'eu-central-1')
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'volt-data-lake')

        # Walidacja konfiguracji
        if not all([self.access_key, self.secret_key, self.bucket_name]):
            raise ValueError("Brakuje wymaganych zmiennych środowiskowych dla AWS S3")

    def get_s3_client(self):
        """Zwraca skonfigurowanego klienta S3"""
        try:
            return boto3.client(
                's3',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region
            )
        except (NoCredentialsError, PartialCredentialsError) as e:
            raise ValueError(f"Błąd konfiguracji AWS credentials: {e}")

    def get_s3_resource(self):
        """Zwraca skonfigurowany resource S3"""
        try:
            return boto3.resource(
                's3',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region
            )
        except (NoCredentialsError, PartialCredentialsError) as e:
            raise ValueError(f"Błąd konfiguracji AWS credentials: {e}")

    def test_connection(self):
        """Testuje połączenie z S3"""
        try:
            s3 = self.get_s3_client()
            # Próba listowania bucketów
            response = s3.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            print(f"✅ Połączenie z S3 udane. Dostępne buckety: {buckets}")

            # Sprawdź czy nasz bucket istnieje
            if self.bucket_name in buckets:
                print(f"✅ Bucket '{self.bucket_name}' istnieje")
            else:
                print(f"⚠️  Bucket '{self.bucket_name}' nie istnieje - należy go utworzyć")

            return True

        except Exception as e:
            print(f"❌ Błąd połączenia z S3: {e}")
            return False

# Singleton instance
s3_config = S3Config()

def get_s3_client():
    """Helper function do szybkiego dostępu do klienta S3"""
    return s3_config.get_s3_client()

def get_s3_resource():
    """Helper function do szybkiego dostępu do resource S3"""
    return s3_config.get_s3_resource()

if __name__ == "__main__":
    # Test konfiguracji
    print("Testowanie konfiguracji S3...")
    s3_config.test_connection()