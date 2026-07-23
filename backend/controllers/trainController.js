const pool = require('../config/db');

/**
 * GET /api/trains
 * Returns all trains.
 */
const getAllTrains = async (req, res, next) => {
  try {
    const [trains] = await pool.query(
      'SELECT * FROM trains ORDER BY train_name ASC'
    );
    return res.status(200).json({ success: true, data: trains });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/trains/search?source=&destination=
 * Returns trains matching source and destination (case-insensitive).
 */
const searchTrains = async (req, res, next) => {
  try {
    const { source, destination } = req.query;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both source and destination.',
      });
    }

    const [trains] = await pool.query(
      `SELECT * FROM trains
       WHERE LOWER(source) = LOWER(?)
         AND LOWER(destination) = LOWER(?)
       ORDER BY departure_time ASC`,
      [source.trim(), destination.trim()]
    );

    const platforms = ['IRCTC', 'MakeMyTrip', 'ConfirmTkt', 'PayTM'];
    
    // Inject mock competitors for demo
    const enhancedTrains = trains.map(train => {
      const basePrice = parseFloat(train.price);
      
      let competitors = [
        {
          platform: 'RailWayPro (Official)',
          price: basePrice,
          isNative: true,
          link: '#'
        }
      ];

      platforms.forEach(platform => {
        // Generate a random variation between -5% to +15%
        const variation = (Math.random() * 0.20) - 0.05; 
        const mockPrice = Math.round((basePrice + (basePrice * variation)) * 100) / 100;
        
        competitors.push({
          platform: platform,
          price: mockPrice,
          isNative: false,
          link: `https://www.google.com/search?q=book+train+on+${platform.toLowerCase()}` // Mock external link
        });
      });

      // Sort competitors by price ascending
      competitors.sort((a, b) => a.price - b.price);

      // Flag the cheapest option
      competitors[0].isCheapest = true;

      return {
        ...train,
        competitors
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedTrains.length,
      data: enhancedTrains,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTrains, searchTrains };
