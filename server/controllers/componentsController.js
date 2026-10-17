import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MariaDB / MySQL (Cyber Folks) — pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  database: process.env.MYSQL_DATABASE || 'lxsxnvawhg_volt',
  user: process.env.MYSQL_USER || 'lxsxnvawhg_volt',
  password: process.env.MYSQL_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

pool.getConnection()
  .then((conn) => {
    console.log('[COMPONENTS] Connected to MariaDB/MySQL database');
    conn.release();
  })
  .catch((err) => {
    console.error('[COMPONENTS] DB connection failed:', err.message);
  });

const mapComponent = (comp) => ({
  id: comp.id,
  name: comp.name,
  fields: parseInt(comp.fields, 10) || 0,
  description: comp.description || '',
  price: parseFloat(comp.price) || 0,
  image: comp.image || '',
  category: comp.category || '',
  subcategory: comp.subcategory || '',
});

// Get all components from database
const getAllComponents = async (req, res) => {
  try {
    const components = await query(`
      SELECT
        id, name, fields, description, price, image, category, subcategory
      FROM electric_components
      ORDER BY name
    `);

    const transformedComponents = components.map(mapComponent);
    console.log(`[COMPONENTS] Retrieved ${components.length} components from database`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error fetching components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components from database',
      details: error.message,
    });
  }
};

// Get components by category
const getComponentsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const components = await query(
      `
      SELECT
        id, name, fields, description, price, image, category, subcategory
      FROM electric_components
      WHERE category = ?
      ORDER BY name
    `,
      [category]
    );

    const transformedComponents = components.map(mapComponent);
    console.log(`[COMPONENTS] Retrieved ${components.length} components for category: ${category}`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length,
      category,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error fetching components by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components by category',
      details: error.message,
    });
  }
};

// Get component categories and their counts
const getCategories = async (req, res) => {
  try {
    const categoryData = await query(`
      SELECT
        category,
        subcategory,
        COUNT(*) as count
      FROM electric_components
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category, subcategory
      ORDER BY category, subcategory
    `);

    const categories = {};
    categoryData.forEach((row) => {
      if (!categories[row.category]) {
        categories[row.category] = {
          name: row.category,
          subcategories: {},
          totalCount: 0,
        };
      }

      if (row.subcategory && row.subcategory !== '') {
        categories[row.category].subcategories[row.subcategory] = row.count;
      }

      categories[row.category].totalCount += parseInt(row.count, 10);
    });

    console.log(`[COMPONENTS] Retrieved ${Object.keys(categories).length} categories`);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message,
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
    const components = await query(
      `
      SELECT
        id, name, fields, description, price, image, category, subcategory
      FROM electric_components
      WHERE
        LOWER(name) LIKE LOWER(?) OR
        LOWER(description) LIKE LOWER(?) OR
        LOWER(category) LIKE LOWER(?)
      ORDER BY name
    `,
      [searchTerm, searchTerm, searchTerm]
    );

    const transformedComponents = components.map(mapComponent);
    console.log(`[COMPONENTS] Search for "${q}" returned ${components.length} results`);

    res.json({
      success: true,
      data: transformedComponents,
      count: transformedComponents.length,
      searchTerm: q,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error searching components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search components',
      details: error.message,
    });
  }
};

// Get fuse types by phase type
const getFuseTypes = async (req, res) => {
  try {
    const { phase } = req.query; // '1φ' or '3φ'

    let sql = `
      SELECT fuse_type, phase_type
      FROM fuse_types
    `;
    const params = [];

    if (phase) {
      sql += ` WHERE phase_type = ?`;
      params.push(phase);
    }

    sql += ` ORDER BY phase_type, CAST(REPLACE(fuse_type, 'A', '') AS UNSIGNED)`;

    const fuseTypes = await query(sql, params);
    console.log(`[COMPONENTS] Retrieved ${fuseTypes.length} fuse types${phase ? ` for ${phase}` : ''}`);

    res.json({
      success: true,
      data: fuseTypes,
      count: fuseTypes.length,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error fetching fuse types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuse types from database',
      details: error.message,
    });
  }
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(
      `
      SELECT
        id, name, fields, description, price, image, category, subcategory
      FROM electric_components
      WHERE id = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    const transformedComponent = mapComponent(rows[0]);
    console.log(`[COMPONENTS] Retrieved component: ${transformedComponent.name}`);

    res.json({
      success: true,
      data: transformedComponent,
    });
  } catch (error) {
    console.error('[COMPONENTS] Error fetching component by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch component',
      details: error.message,
    });
  }
};

export default {
  getAllComponents,
  getComponentsByCategory,
  getCategories,
  searchComponents,
  getComponentById,
  getFuseTypes,
};
