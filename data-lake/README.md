# Data Lake Structure

This directory simulates a basic data lake structure for users and orders data.

## Directory Structure

```
data-lake/
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
```

## Layer Descriptions

### Raw Layer
- Contains original, unmodified data
- Data is partitioned by source and date
- Files are in JSON format with original structure

### Staging Layer
- Contains cleaned and processed data
- Data is transformed and standardized
- Files are in parquet format for better performance

### Mart Layer
- Contains aggregated data ready for business analysis
- Optimized for reporting and dashboard consumption
- Files are in parquet format with pre-computed metrics

## Usage

Run this script to create the complete data lake structure:
```bash
python create_data_lake.py
```
