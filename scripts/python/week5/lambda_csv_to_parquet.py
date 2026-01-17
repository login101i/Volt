#!/usr/bin/env python3
"""
AWS Lambda function do automatycznej konwersji CSV → Parquet
Data Engineering Roadmap - Week 5: Zaawansowane S3 + Pipeline'y
"""
import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from io import BytesIO
from urllib.parse import unquote_plus
import os

def lambda_handler(event, context):
    """
    Lambda handler dla eventów S3 - konwertuje CSV na Parquet

    Args:
        event: S3 event data
        context: Lambda context

    Returns:
        dict: Status operacji
    """
    s3 = boto3.client('s3')

    # Pobierz informacje o pliku z eventu
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])  # Decode URL encoding

        print(f"🎯 Processing file: s3://{bucket}/{key}")

        # Sprawdź czy to CSV w folderze raw
        if not (key.startswith('raw/') and key.endswith('.csv')):
            print(f"⏭️  Skipping non-CSV file or file not in raw/ folder: {key}")
            continue

        try:
            # Pobierz plik CSV
            response = s3.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read()

            # Sprawdź rozmiar pliku (Lambda ma limit 512MB)
            file_size_mb = len(csv_content) / (1024 * 1024)
            if file_size_mb > 500:
                raise ValueError(f"File too large: {file_size_mb:.1f}MB (Lambda limit: 500MB)")

            print(f"📊 Processing CSV file ({file_size_mb:.1f}MB)")

            # Odczytaj CSV jako DataFrame
            df = pd.read_csv(BytesIO(csv_content))

            # Walidacja danych
            if df.empty:
                raise ValueError("CSV file is empty")

            print(f"📈 Loaded {len(df)} rows, {len(df.columns)} columns")

            # Konwertuj do Parquet
            buffer = BytesIO()
            table = pa.Table.from_pandas(df)
            pq.write_table(table, buffer)

            # Ustal ścieżkę docelową w S3
            # raw/components/dt=2024-01-01/data.csv → staging/components/dt=2024-01-01/data.parquet
            parquet_key = key.replace('raw/', 'staging/').replace('.csv', '.parquet')

            # Metadane dla pliku Parquet
            metadata = {
                'source': 'lambda_csv_converter',
                'original_csv_key': key,
                'conversion_timestamp': pd.Timestamp.now().isoformat(),
                'row_count': str(len(df)),
                'column_count': str(len(df.columns)),
                'file_size_mb': f"{file_size_mb:.2f}"
            }

            # Zapisz Parquet do S3
            s3.put_object(
                Bucket=bucket,
                Key=parquet_key,
                Body=buffer.getvalue(),
                ContentType='application/octet-stream',
                Metadata=metadata
            )

            print(f"✅ Successfully converted and saved: s3://{bucket}/{parquet_key}")

            # Opcjonalnie: usuń oryginalny plik CSV po konwersji
            # s3.delete_object(Bucket=bucket, Key=key)

            return {
                'statusCode': 200,
                'body': {
                    'message': 'CSV to Parquet conversion completed',
                    'original_file': f"s3://{bucket}/{key}",
                    'converted_file': f"s3://{bucket}/{parquet_key}",
                    'rows_processed': len(df),
                    'columns_processed': len(df.columns)
                }
            }

        except Exception as e:
            error_message = f"Error processing {key}: {str(e)}"
            print(f"❌ {error_message}")

            # Tutaj można dodać logowanie do CloudWatch lub SNS notification
            return {
                'statusCode': 500,
                'body': {
                    'error': error_message,
                    'file': f"s3://{bucket}/{key}"
                }
            }

def test_conversion_local(csv_file_path, output_parquet_path=None):
    """
    Test konwersji CSV→Parquet lokalnie (bez Lambda)

    Args:
        csv_file_path (str): Ścieżka do pliku CSV
        output_parquet_path (str, optional): Ścieżka wyjściowa dla Parquet
    """
    try:
        # Odczytaj CSV
        df = pd.read_csv(csv_file_path)
        print(f"📊 Loaded CSV: {len(df)} rows, {len(df.columns)} columns")

        # Konwertuj do Parquet
        if output_parquet_path is None:
            output_parquet_path = csv_file_path.replace('.csv', '.parquet')

        df.to_parquet(output_parquet_path, index=False)
        print(f"✅ Converted to Parquet: {output_parquet_path}")

        # Weryfikacja
        df_verify = pd.read_parquet(output_parquet_path)
        print(f"🔍 Verification: {len(df_verify)} rows, {len(df_verify.columns)} columns")

        return True

    except Exception as e:
        print(f"❌ Error in local conversion: {e}")
        return False

if __name__ == "__main__":
    # Test lokalny konwersji
    import sys

    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
        if os.path.exists(csv_file):
            print(f"🧪 Testing CSV to Parquet conversion with: {csv_file}")
            test_conversion_local(csv_file)
        else:
            print(f"❌ File not found: {csv_file}")
    else:
        print("🔧 Usage: python lambda_csv_to_parquet.py <path_to_csv_file>")
        print("\n📝 This script can be deployed as AWS Lambda function")
        print("   Set trigger: S3 bucket notification for *.csv files in raw/ folder")
        print("   Runtime: Python 3.9+")
        print("   Memory: 1024 MB (for larger files)")
        print("   Timeout: 5 minutes")