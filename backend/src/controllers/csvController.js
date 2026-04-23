const { parse }     = require('csv-parse/sync');
const { stringify }  = require('csv-stringify/sync');
const Product  = require('../models/Product');
const Category = require('../models/Category');
const Store    = require('../models/Store');

// CSV column headers (what we export / what we expect on import)
const HEADERS = [
  'name','sku','status','price','comparePrice','costPrice',
  'inventory','trackInventory','isFeatured','isNewArrival','isOnSale',
  'category','tags','description','shortDescription',
  'size','color','material','storage','ram','weight','bookFormat','packageContents',
  'imageUrl1','imageUrl2','imageUrl3','imageUrl4','imageUrl5',
  'youtubeUrl','freeShipping','requiresShipping','barcode','lowStockAlert',
  'metaTitle','metaDescription',
];

// ─── EXPORT products to CSV ───────────────────────────────────────────────────
exports.exportProducts = async (req, res, next) => {
  try {
    const store = req.store;
    const { status } = req.query;
    const query = { store: store._id };
    if (status) query.status = status;

    const products = await Product.find(query)
      .populate('category', 'name')
      .lean();

    const rows = products.map(p => ({
      name:              p.name || '',
      sku:               p.sku || '',
      status:            p.status || 'active',
      price:             p.price || 0,
      comparePrice:      p.comparePrice || '',
      costPrice:         p.costPrice || '',
      inventory:         p.inventory || 0,
      trackInventory:    p.trackInventory ? 'true' : 'false',
      isFeatured:        p.labels?.isFeatured  ? 'true' : 'false',
      isNewArrival:      p.labels?.isNewArrival ? 'true' : 'false',
      isOnSale:          p.labels?.isOnSale     ? 'true' : 'false',
      category:          p.category?.name || '',
      tags:              (p.tags || []).join('|'),
      description:       (p.description || '').replace(/\n/g, '\\n'),
      shortDescription:  (p.shortDescription || '').replace(/\n/g, '\\n'),
      size:              (p.attributes?.size || []).join('|'),
      color:             (p.attributes?.color || []).join('|'),
      material:          (p.attributes?.material || []).join('|'),
      storage:           (p.attributes?.storage || []).join('|'),
      ram:               (p.attributes?.ram || []).join('|'),
      weight:            p.attributes?.weight || '',
      bookFormat:        p.attributes?.bookFormat || '',
      packageContents:   p.attributes?.packageContents || '',
      imageUrl1:         p.images?.[0]?.url || '',
      imageUrl2:         p.images?.[1]?.url || '',
      imageUrl3:         p.images?.[2]?.url || '',
      imageUrl4:         p.images?.[3]?.url || '',
      imageUrl5:         p.images?.[4]?.url || '',
      youtubeUrl:        p.videos?.find(v => v.type === 'youtube')?.url || '',
      freeShipping:      p.freeShipping ? 'true' : 'false',
      requiresShipping:  p.requiresShipping ? 'true' : 'false',
      barcode:           p.barcode || '',
      lowStockAlert:     p.lowStockAlert || 10,
      metaTitle:         p.seo?.metaTitle || '',
      metaDescription:   p.seo?.metaDescription || '',
    }));

    const csv = stringify(rows, { header: true, columns: HEADERS });

    const filename = `${store.slug}-products-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
};

// ─── GET CSV template ─────────────────────────────────────────────────────────
exports.getTemplate = (req, res) => {
  const sample = [{
    name: 'Sample Product', sku: 'PROD-001', status: 'active',
    price: 29.99, comparePrice: 39.99, costPrice: 15.00,
    inventory: 100, trackInventory: 'true',
    isFeatured: 'false', isNewArrival: 'true', isOnSale: 'true',
    category: 'Electronics', tags: 'tech|gadget|sale',
    description: 'Full product description here',
    shortDescription: 'Short summary for listings',
    size: 'S|M|L', color: 'Red|Blue|Black', material: '', storage: '', ram: '',
    weight: '250g', bookFormat: '', packageContents: 'Device, Charger, Manual',
    imageUrl1: 'https://example.com/image1.jpg', imageUrl2: '', imageUrl3: '',
    imageUrl4: '', imageUrl5: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=example',
    freeShipping: 'false', requiresShipping: 'true',
    barcode: '', lowStockAlert: 10, metaTitle: '', metaDescription: '',
  }];

  const csv = stringify(sample, { header: true, columns: HEADERS });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.send(csv);
};

// ─── IMPORT products from CSV ─────────────────────────────────────────────────
exports.importProducts = async (req, res, next) => {
  try {
    const store = req.store;

    if (!req.file) return res.status(400).json({ success: false, message: 'No CSV file uploaded' });

    const csvText = req.file.buffer.toString('utf-8');
    let records;
    try {
      records = parse(csvText, {
        columns: true, skip_empty_lines: true, trim: true, bom: true,
      });
    } catch (e) {
      return res.status(400).json({ success: false, message: `CSV parse error: ${e.message}` });
    }

    if (!records.length) return res.status(400).json({ success: false, message: 'CSV file is empty' });

    // Pre-load categories
    const cats = await Category.find({ store: store._id }).lean();
    const catMap = {};
    cats.forEach(c => { catMap[c.name.toLowerCase()] = c._id; });

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    const extractYtId = (url) => url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] || null;
    const toArr  = (s) => s ? s.split('|').map(x => x.trim()).filter(Boolean) : [];
    const toBool = (s) => s?.toLowerCase() === 'true';

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // account for header row

      if (!row.name?.trim()) { results.errors.push(`Row ${rowNum}: name is required`); results.skipped++; continue; }
      if (!row.price || isNaN(parseFloat(row.price))) { results.errors.push(`Row ${rowNum}: invalid price`); results.skipped++; continue; }

      // Resolve category
      const catId = catMap[row.category?.toLowerCase()] || null;

      // Build images array
      const images = ['imageUrl1','imageUrl2','imageUrl3','imageUrl4','imageUrl5']
        .map((k, idx) => row[k]?.trim())
        .filter(Boolean)
        .map((url, idx) => ({ url, isPrimary: idx === 0, alt: '' }));

      // Build videos array
      const videos = [];
      if (row.youtubeUrl?.trim()) {
        const ytId = extractYtId(row.youtubeUrl);
        if (ytId) videos.push({ type: 'youtube', url: row.youtubeUrl, youtubeId: ytId, thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` });
      }

      const productData = {
        store:  store._id,
        name:   row.name.trim(),
        sku:    row.sku?.trim() || undefined,
        status: ['active','draft','inactive','archived'].includes(row.status) ? row.status : 'active',
        price:  parseFloat(row.price),
        comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : undefined,
        costPrice:    row.costPrice    ? parseFloat(row.costPrice)    : undefined,
        inventory:    parseInt(row.inventory) || 0,
        trackInventory: row.trackInventory !== undefined ? toBool(row.trackInventory) : true,
        lowStockAlert:  parseInt(row.lowStockAlert) || 10,
        barcode:       row.barcode?.trim() || undefined,
        category:      catId || undefined,
        tags:          toArr(row.tags),
        description:   row.description?.replace(/\\n/g, '\n') || '',
        shortDescription: row.shortDescription?.replace(/\\n/g, '\n') || '',
        labels: {
          isFeatured:   toBool(row.isFeatured),
          isNewArrival: toBool(row.isNewArrival),
          isOnSale:     toBool(row.isOnSale) || (parseFloat(row.comparePrice) > parseFloat(row.price)),
        },
        attributes: {
          size:     toArr(row.size),
          color:    toArr(row.color),
          material: toArr(row.material),
          storage:  toArr(row.storage),
          ram:      toArr(row.ram),
          weight:   row.weight?.trim() || '',
          bookFormat: row.bookFormat?.trim() || '',
          packageContents: row.packageContents?.trim() || '',
        },
        images,
        videos,
        freeShipping:     toBool(row.freeShipping),
        requiresShipping: row.requiresShipping !== undefined ? toBool(row.requiresShipping) : true,
        seo: { metaTitle: row.metaTitle || '', metaDescription: row.metaDescription || '' },
      };

      try {
        // Upsert by SKU (if SKU present) or by name+store
        const filter = row.sku?.trim()
          ? { store: store._id, sku: row.sku.trim() }
          : { store: store._id, name: row.name.trim() };

        const existing = await Product.findOne(filter);
        if (existing) {
          await Product.findByIdAndUpdate(existing._id, productData);
          results.updated++;
        } else {
          await Product.create(productData);
          results.created++;
        }
      } catch (err) {
        results.errors.push(`Row ${rowNum} ("${row.name}"): ${err.message}`);
        results.skipped++;
      }
    }

    // Update store product count
    const count = await Product.countDocuments({ store: store._id, status: { $ne: 'archived' } });
    await Store.findByIdAndUpdate(store._id, { 'stats.totalProducts': count });

    res.json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      data: results,
    });
  } catch (err) { next(err); }
};
