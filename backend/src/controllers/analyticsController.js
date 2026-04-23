const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');

// ─── Vendor Dashboard Analytics ───────────────────────────────────────────────
exports.getVendorAnalytics = async (req, res, next) => {
  try {
    const store = req.store || await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    let prevStartDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        prevStartDate.setDate(prevStartDate.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        prevStartDate.setDate(prevStartDate.getDate() - 60);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        prevStartDate.setDate(prevStartDate.getDate() - 180);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 2);
        break;
    }

    const prevEndDate = new Date(startDate);

    // Current period stats
    const [currentStats] = await Order.aggregate([
      { $match: { store: store._id, createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
      { $group: {
        _id: null,
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        customers: { $addToSet: '$customer' }
      }}
    ]);

    // Previous period stats
    const [prevStats] = await Order.aggregate([
      { $match: { store: store._id, createdAt: { $gte: prevStartDate, $lte: prevEndDate }, status: { $nin: ['cancelled'] } } },
      { $group: {
        _id: null,
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }}
    ]);

    // Revenue chart (daily)
    const revenueChart = await Order.aggregate([
      { $match: { store: store._id, createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $match: { store: store._id, createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: { store: store._id, createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        unitsSold: { $sum: '$items.quantity' }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Recent orders
    const recentOrders = await Order.find({ store: store._id })
      .populate('customer', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Low stock products
    const lowStockProducts = await Product.find({
      store: store._id,
      status: 'active',
      trackInventory: true,
      $expr: { $lte: ['$inventory', '$lowStockAlert'] }
    }).select('name inventory lowStockAlert images').limit(10).lean();

    const calcGrowth = (current, prev) => {
      if (!prev || prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    res.json({
      success: true,
      data: {
        summary: {
          revenue: currentStats?.revenue || 0,
          orders: currentStats?.orders || 0,
          customers: currentStats?.customers?.length || 0,
          avgOrderValue: currentStats?.orders ? (currentStats.revenue / currentStats.orders) : 0,
          revenueGrowth: calcGrowth(currentStats?.revenue || 0, prevStats?.revenue || 0),
          ordersGrowth: calcGrowth(currentStats?.orders || 0, prevStats?.orders || 0)
        },
        revenueChart: revenueChart.map(d => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
        ordersByStatus: ordersByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        topProducts,
        recentOrders,
        lowStockProducts,
        storeStats: store.stats
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Super Admin Platform Analytics ───────────────────────────────────────────
exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

    const [totalStores, activeStores, totalUsers, totalOrders, totalRevenue] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ])
    ]);

    // New stores over time
    const newStores = await Store.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Top stores by revenue
    const topStores = await Store.find()
      .sort({ 'stats.totalRevenue': -1 })
      .limit(10)
      .populate('owner', 'name email')
      .lean();

    // Plan distribution
    const planDist = await Store.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalStores,
          activeStores,
          totalUsers,
          totalOrders,
          platformRevenue: totalRevenue[0]?.total || 0
        },
        newStores: newStores.map(d => ({ date: d._id, count: d.count })),
        topStores,
        planDistribution: planDist.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {})
      }
    });
  } catch (err) {
    next(err);
  }
};
