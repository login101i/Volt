// Example controller functions

const getExample = async (req, res) => {
  try {
    res.json({
      message: 'Example GET endpoint',
      data: { id: 1, name: 'Example' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createExample = async (req, res) => {
  try {
    const { name, data } = req.body;
    
    res.status(201).json({
      message: 'Example created successfully',
      data: { name, data, id: Date.now() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getExample,
  createExample
};














































