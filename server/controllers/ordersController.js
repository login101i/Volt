// Orders controller functions - returns offers as orders

const fs = require('fs').promises;
const path = require('path');

const offersFile = path.join(__dirname, '../data/offers.json');

const getOrders = async (req, res) => {
  try {
    // Read offers from file
    try {
      const fileContent = await fs.readFile(offersFile, 'utf8');
      const offers = JSON.parse(fileContent);
      
      // Transform offers to orders format
      const orders = offers.map(offer => ({
        id: offer.id,
        orderNumber: `OFERTA-${offer.id.toString().padStart(3, '0')}`,
        customerName: offer.clientData?.investmentName || offer.clientData?.email || 'Brak nazwy',
        product: `Rozdzielnica ${offer.components?.distributionBoardSize || 0} mod`,
        quantity: offer.components?.totalCircuits || 0,
        total: offer.pricing?.totalWithVat || offer.pricing?.total || 0,
        status: 'completed',
        createdAt: offer.createdAt || new Date().toISOString(),
        updatedAt: offer.updatedAt || offer.createdAt || new Date().toISOString(),
      }));

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (fileError) {
      // If file doesn't exist, return empty array
      if (fileError.code === 'ENOENT') {
        res.json({
          success: true,
          data: [],
          count: 0
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock single order - replace with actual database query later
    const order = {
      id: parseInt(id),
      orderNumber: `ORD-${id.toString().padStart(3, '0')}`,
      customerName: 'John Doe',
      product: 'Product A',
      quantity: 2,
      total: 99.98,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z'
    };

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = {
  getOrders,
  getOrderById
};

