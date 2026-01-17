import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'voltapp',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL configuration for AWS RDS
  ssl: process.env.POSTGRES_HOST !== 'localhost' ? {
    rejectUnauthorized: false, // For self-signed certificates
  } : false,
});

// Test database connection
pool.on('connect', () => {
  console.log('[COMPONENTS] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[COMPONENTS] Unexpected error on idle client', err);
  process.exit(-1);
});

// Get all components from database
const getAllComponents = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        name,
        fields,
        description,
        price,
        image,
        category,
        subcategory
      FROM electric_components
      ORDER BY name
    `;

    const result = await pool.query(query);
    const components = result.rows;

    // Transform to match frontend expectations
    const transformedComponents = components.map(comp => ({
      id: comp.id,
      name: comp.name,
      fields: parseInt(comp.fields) || 0,
      description: comp.description || '',
      price: parseFloat(comp.price) || 0,
      image: comp.image || '',
      category: comp.category || '',
      subcategory: comp.subcategory || ''
    }));

    console.log(`[COMPONENTS] Retrieved ${components.length} components from database`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length
    });

  } catch (error) {
    console.error('[COMPONENTS] Error fetching components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components from database',
      details: error.message
    });
  }
};

// Get components by category
const getComponentsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const query = `
      SELECT
        id,
        name,
        fields,
        description,
        price,
        image,
        category,
        subcategory
      FROM electric_components
      WHERE category = $1
      ORDER BY name
    `;

    const result = await pool.query(query, [category]);
    const components = result.rows;

    const transformedComponents = components.map(comp => ({
      id: comp.id,
      name: comp.name,
      fields: parseInt(comp.fields) || 0,
      description: comp.description || '',
      price: parseFloat(comp.price) || 0,
      image: comp.image || '',
      category: comp.category || '',
      subcategory: comp.subcategory || ''
    }));

    console.log(`[COMPONENTS] Retrieved ${components.length} components for category: ${category}`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length,
      category: category
    });

  } catch (error) {
    console.error('[COMPONENTS] Error fetching components by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components by category',
      details: error.message
    });
  }
};

// Get component categories and their counts
const getCategories = async (req, res) => {
  try {
    const query = `
      SELECT
        category,
        subcategory,
        COUNT(*) as count
      FROM electric_components
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category, subcategory
      ORDER BY category, subcategory
    `;

    const result = await pool.query(query);
    const categoryData = result.rows;

    // Group by category
    const categories = {};
    categoryData.forEach(row => {
      if (!categories[row.category]) {
        categories[row.category] = {
          name: row.category,
          subcategories: {},
          totalCount: 0
        };
      }

      if (row.subcategory && row.subcategory !== '') {
        categories[row.category].subcategories[row.subcategory] = row.count;
      }

      categories[row.category].totalCount += parseInt(row.count);
    });

    console.log(`[COMPONENTS] Retrieved ${Object.keys(categories).length} categories`);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('[COMPONENTS] Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
};

// Search components
const searchComponents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return getAllComponents(req, res);
    }

    const searchTerm = `%${q.trim()}%`;
    const query = `
      SELECT
        id,
        name,
        fields,
        description,
        price,
        image,
        category,
        subcategory
      FROM electric_components
      WHERE
        LOWER(name) LIKE LOWER($1) OR
        LOWER(description) LIKE LOWER($1) OR
        LOWER(category) LIKE LOWER($1)
      ORDER BY name
    `;

    const result = await pool.query(query, [searchTerm]);
    const components = result.rows;

    const transformedComponents = components.map(comp => ({
      id: comp.id,
      name: comp.name,
      fields: parseInt(comp.fields) || 0,
      description: comp.description || '',
      price: parseFloat(comp.price) || 0,
      image: comp.image || '',
      category: comp.category || '',
      subcategory: comp.subcategory || ''
    }));

    console.log(`[COMPONENTS] Search for "${q}" returned ${components.length} results`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length,
      searchTerm: q
    });

  } catch (error) {
    console.error('[COMPONENTS] Error searching components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search components',
      details: error.message
    });
  }
};

// Get fuse types by phase type
const getFuseTypes = async (req, res) => {
  try {
    const { phase } = req.query; // '1φ' or '3φ'

    let query = `
      SELECT fuse_type, phase_type
      FROM fuse_types
    `;
    const params = [];

    if (phase) {
      query += ` WHERE phase_type = $1`;
      params.push(phase);
    }

    query += ` ORDER BY phase_type, CAST(REPLACE(fuse_type, 'A', '') AS INTEGER)`;

    const result = await pool.query(query, params);
    const fuseTypes = result.rows;

    console.log(`[COMPONENTS] Retrieved ${fuseTypes.length} fuse types${phase ? ` for ${phase}` : ''}`);

    res.json({
      success: true,
      data: fuseTypes,
      count: fuseTypes.length
    });

  } catch (error) {
    console.error('[COMPONENTS] Error fetching fuse types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuse types from database',
      details: error.message
    });
  }
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        name,
        fields,
        description,
        price,
        image,
        category,
        subcategory
      FROM electric_components
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found'
      });
    }

    const component = result.rows[0];
    const transformedComponent = {
      id: component.id,
      name: component.name,
      fields: parseInt(component.fields) || 0,
      description: component.description || '',
      price: parseFloat(component.price) || 0,
      image: component.image || '',
      category: component.category || '',
      subcategory: component.subcategory || ''
    };

    console.log(`[COMPONENTS] Retrieved component: ${component.name}`);

    res.json({
      success: true,
      data: transformedComponent
    });

  } catch (error) {
    console.error('[COMPONENTS] Error fetching component by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch component',
      details: error.message
    });
  }
};

export default {
  getAllComponents,
  getComponentsByCategory,
  getCategories,
  searchComponents,
  getComponentById,
  getFuseTypes
};