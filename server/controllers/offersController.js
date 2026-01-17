import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateRequiredComponents, calculatePricing } from '../utils/offerCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
const offersFile = path.join(dataDir, 'offers.json');

// Initialize data directory and file if they don't exist
async function ensureDataFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(offersFile);
    } catch {
      // File doesn't exist, create it with empty array
      await fs.writeFile(offersFile, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
    throw error;
  }
}

// Create a new offer
const createOffer = async (req, res) => {
  try {
    await ensureDataFile();
    
    // Read existing offers
    const fileContent = await fs.readFile(offersFile, 'utf8');
    const offers = JSON.parse(fileContent);
    
    // Calculate required components
    const componentData = calculateRequiredComponents(req.body);
    
    // Calculate pricing
    const pricing = calculatePricing(req.body, componentData, req.body.customItems || []);
    
    // Create new offer with ID and timestamp
    const finalOffer = {
      id: offers.length > 0 ? Math.max(...offers.map(o => o.id)) + 1 : 1,
      ...req.body,
      components: componentData,
      pricing: {
        ...pricing,
        pricePerPoint: req.body.pricing?.pricePerPoint || pricing.pricePerPoint,
        wireValue: req.body.pricing?.wireValue || pricing.wireValue,
        connectionCost: req.body.pricing?.connectionCost || pricing.connectionCost,
        vatRate: req.body.pricing?.vatRate || pricing.vatRate,
      },
      customItems: req.body.customItems || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to array
    offers.push(finalOffer);
    
    // Write back to file
    await fs.writeFile(offersFile, JSON.stringify(offers, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Offer created successfully',
      data: finalOffer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all offers
const getOffers = async (req, res) => {
  try {
    await ensureDataFile();
    
    const fileContent = await fs.readFile(offersFile, 'utf8');
    const offers = JSON.parse(fileContent);
    
    res.json({
      success: true,
      data: offers,
      count: offers.length
    });
  } catch (error) {
    console.error('Error getting offers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get offer by ID
const getOfferById = async (req, res) => {
  try {
    await ensureDataFile();
    
    const fileContent = await fs.readFile(offersFile, 'utf8');
    const offers = JSON.parse(fileContent);
    
    const offer = offers.find(o => o.id === parseInt(req.params.id));
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error getting offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update offer
const updateOffer = async (req, res) => {
  try {
    await ensureDataFile();
    
    const fileContent = await fs.readFile(offersFile, 'utf8');
    const offers = JSON.parse(fileContent);
    
    const index = offers.findIndex(o => o.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    // Update offer
    offers[index] = {
      ...offers[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    // Write back to file
    await fs.writeFile(offersFile, JSON.stringify(offers, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Offer updated successfully',
      data: offers[index]
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete offer
const deleteOffer = async (req, res) => {
  try {
    await ensureDataFile();
    
    const fileContent = await fs.readFile(offersFile, 'utf8');
    const offers = JSON.parse(fileContent);
    
    const index = offers.findIndex(o => o.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }
    
    // Remove offer from array
    offers.splice(index, 1);
    
    // Write back to file
    await fs.writeFile(offersFile, JSON.stringify(offers, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer
};

