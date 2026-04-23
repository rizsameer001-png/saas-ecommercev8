const Attribute = require('../models/Attribute');
const Product   = require('../models/Product');
const Store     = require('../models/Store');

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const PRESETS = {
  size_uk: {
    name: 'Size (UK)', type: 'dropdown', usedForVariants: true, filterable: true, preset: 'size_uk',
    values: ['UK 3','UK 4','UK 5','UK 6','UK 7','UK 8','UK 9','UK 10','UK 11','UK 12'].map((l,i) => ({ label:l, value:l.replace(' ','_').toLowerCase(), sortOrder:i })),
    sizeChart: {
      name: 'Footwear Size Chart',
      headers: ['UK','EU','US','CM'],
      rows: [['3','35.5','4','22'],['4','37','5','23'],['5','38','6','24'],['6','39','7','24.5'],['7','40','8','25.5'],['8','41','9','26'],['9','42','10','27'],['10','43','11','27.5'],['11','44','12','28.5'],['12','45','13','29.5']],
    },
  },
  size_clothing: {
    name: 'Size', type: 'dropdown', usedForVariants: true, filterable: true, preset: 'size_clothing',
    values: ['XS','S','M','L','XL','XXL','XXXL'].map((l,i) => ({ label:l, value:l.toLowerCase(), sortOrder:i })),
    sizeChart: {
      name: 'Clothing Size Guide',
      headers: ['Size','Chest (cm)','Waist (cm)','Hips (cm)'],
      rows: [['XS','80-84','62-66','86-90'],['S','84-88','66-70','90-94'],['M','88-92','70-74','94-98'],['L','92-96','74-78','98-102'],['XL','96-100','78-82','102-106'],['XXL','100-104','82-86','106-110']],
    },
  },
  color: {
    name: 'Color', type: 'color_swatch', usedForVariants: true, filterable: true, preset: 'color',
    values: [
      { label:'Black',   value:'black',   colorHex:'#111827' },
      { label:'White',   value:'white',   colorHex:'#F9FAFB' },
      { label:'Red',     value:'red',     colorHex:'#EF4444' },
      { label:'Blue',    value:'blue',    colorHex:'#3B82F6' },
      { label:'Green',   value:'green',   colorHex:'#22C55E' },
      { label:'Yellow',  value:'yellow',  colorHex:'#EAB308' },
      { label:'Pink',    value:'pink',    colorHex:'#EC4899' },
      { label:'Purple',  value:'purple',  colorHex:'#A855F7' },
      { label:'Orange',  value:'orange',  colorHex:'#F97316' },
      { label:'Gray',    value:'gray',    colorHex:'#9CA3AF' },
      { label:'Brown',   value:'brown',   colorHex:'#92400E' },
      { label:'Navy',    value:'navy',    colorHex:'#1E3A5F' },
      { label:'Beige',   value:'beige',   colorHex:'#D4B483' },
      { label:'Olive',   value:'olive',   colorHex:'#6B7280' },
    ].map((v,i) => ({ ...v, sortOrder:i })),
  },
  material: {
    name: 'Material', type: 'checkbox', usedForVariants: false, filterable: true, preset: 'material',
    values: ['Cotton','Polyester','Wool','Silk','Denim','Leather','Linen','Nylon','Spandex','Rayon','Velvet','Bamboo'].map((l,i) => ({ label:l, value:l.toLowerCase(), sortOrder:i })),
  },
  storage: {
    name: 'Storage', type: 'dropdown', usedForVariants: true, filterable: true, preset: 'storage',
    values: ['16GB','32GB','64GB','128GB','256GB','512GB','1TB','2TB'].map((l,i) => ({ label:l, value:l.toLowerCase().replace(/\s/g,''), sortOrder:i })),
  },
  ram: {
    name: 'RAM', type: 'dropdown', usedForVariants: true, filterable: true, preset: 'ram',
    values: ['2GB','4GB','6GB','8GB','12GB','16GB','32GB','64GB'].map((l,i) => ({ label:l, value:l.toLowerCase(), sortOrder:i })),
  },
  book_format: {
    name: 'Format', type: 'dropdown', usedForVariants: true, filterable: true, preset: 'book_format',
    values: [
      { label:'Paperback', value:'paperback' },
      { label:'Hardcover', value:'hardcover' },
      { label:'eBook',     value:'ebook'     },
      { label:'Audiobook', value:'audiobook' },
    ].map((v,i) => ({ ...v, sortOrder:i })),
  },
  package: {
    name: 'Package', type: 'dropdown', usedForVariants: false, filterable: false, preset: 'package',
    values: [
      { label:'Standard', value:'standard' },
      { label:'Gift Box', value:'gift_box'  },
      { label:'Bulk Pack', value:'bulk_pack'},
      { label:'Eco Pack', value:'eco_pack'  },
    ].map((v,i) => ({ ...v, sortOrder:i })),
  },
  weight: {
    name: 'Weight', type: 'dropdown', usedForVariants: false, filterable: true, preset: 'weight',
    values: ['100g','250g','500g','1kg','2kg','5kg','10kg'].map((l,i) => ({ label:l, value:l.replace(/\s/g,'').toLowerCase(), sortOrder:i })),
  },
};

// ─── GET all attributes for a store ──────────────────────────────────────────
exports.getAttributes = async (req, res, next) => {
  try {
    const store = req.store;
    const { variantsOnly, filterable } = req.query;
    const query = { store: store._id, isActive: true };
    if (variantsOnly === 'true') query.usedForVariants = true;
    if (filterable   === 'true') query.filterable = true;

    const attrs = await Attribute.find(query).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: attrs });
  } catch (err) { next(err); }
};

// ─── GET single attribute ─────────────────────────────────────────────────────
exports.getAttribute = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });
    res.json({ success: true, data: attr });
  } catch (err) { next(err); }
};

// ─── CREATE attribute ─────────────────────────────────────────────────────────
exports.createAttribute = async (req, res, next) => {
  try {
    const store = req.store;
    const attr = await Attribute.create({ ...req.body, store: store._id });
    res.status(201).json({ success: true, data: attr, message: 'Attribute created' });
  } catch (err) { next(err); }
};

// ─── UPDATE attribute ─────────────────────────────────────────────────────────
exports.updateAttribute = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });
    Object.assign(attr, req.body);
    await attr.save();
    res.json({ success: true, data: attr, message: 'Attribute updated' });
  } catch (err) { next(err); }
};

// ─── DELETE attribute ─────────────────────────────────────────────────────────
exports.deleteAttribute = async (req, res, next) => {
  try {
    // Check if used in any product
    const usageCount = await Product.countDocuments({
      store: req.store._id,
      'productAttributes.attributeId': req.params.id,
    });
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: used by ${usageCount} product(s). Remove it from those products first.`,
      });
    }
    await Attribute.findOneAndDelete({ _id: req.params.id, store: req.store._id });
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (err) { next(err); }
};

// ─── ADD value to attribute ───────────────────────────────────────────────────
exports.addValue = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });

    const { label, value, colorHex, imageUrl } = req.body;
    const existing = attr.values.find(v => v.value === value);
    if (existing) return res.status(400).json({ success: false, message: 'Value already exists' });

    attr.values.push({ label, value, colorHex, imageUrl, sortOrder: attr.values.length });
    await attr.save();
    res.json({ success: true, data: attr });
  } catch (err) { next(err); }
};

// ─── UPDATE value ─────────────────────────────────────────────────────────────
exports.updateValue = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });

    const val = attr.values.id(req.params.valueId);
    if (!val) return res.status(404).json({ success: false, message: 'Value not found' });

    Object.assign(val, req.body);
    await attr.save();
    res.json({ success: true, data: attr });
  } catch (err) { next(err); }
};

// ─── DELETE value ─────────────────────────────────────────────────────────────
exports.deleteValue = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });

    attr.values.pull(req.params.valueId);
    await attr.save();
    res.json({ success: true, data: attr });
  } catch (err) { next(err); }
};

// ─── REORDER values ───────────────────────────────────────────────────────────
exports.reorderValues = async (req, res, next) => {
  try {
    const attr = await Attribute.findOne({ _id: req.params.id, store: req.store._id });
    if (!attr) return res.status(404).json({ success: false, message: 'Attribute not found' });

    const { order } = req.body; // [{ id, sortOrder }]
    order.forEach(({ id, sortOrder }) => {
      const v = attr.values.id(id);
      if (v) v.sortOrder = sortOrder;
    });
    await attr.save();
    res.json({ success: true, data: attr });
  } catch (err) { next(err); }
};

// ─── GET available presets ────────────────────────────────────────────────────
exports.getPresets = async (req, res) => {
  const storeAttrs = await Attribute.find({ store: req.store._id }).select('preset');
  const usedPresets = storeAttrs.map(a => a.preset).filter(Boolean);

  const presets = Object.entries(PRESETS).map(([key, data]) => ({
    key,
    name:     data.name,
    type:     data.type,
    values:   data.values.length,
    hasSizeChart: !!data.sizeChart,
    alreadyAdded: usedPresets.includes(key),
  }));

  res.json({ success: true, data: presets });
};

// ─── APPLY a preset ───────────────────────────────────────────────────────────
exports.applyPreset = async (req, res, next) => {
  try {
    const { key } = req.body;
    const preset = PRESETS[key];
    if (!preset) return res.status(400).json({ success: false, message: `Unknown preset: ${key}` });

    // Check not already added
    const existing = await Attribute.findOne({ store: req.store._id, preset: key });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This preset is already added to your store' });
    }

    const attr = await Attribute.create({ ...preset, store: req.store._id });
    res.status(201).json({ success: true, data: attr, message: `"${preset.name}" preset added` });
  } catch (err) { next(err); }
};

// ─── GENERATE variant combinations from selected attributes ───────────────────
exports.generateVariants = async (req, res, next) => {
  try {
    const { attributeIds, existingVariants = [], priceBase = 0 } = req.body;

    if (!attributeIds?.length) {
      return res.status(400).json({ success: false, message: 'No attributes selected' });
    }

    const attrs = await Attribute.find({
      _id: { $in: attributeIds },
      store: req.store._id,
      usedForVariants: true,
    }).sort({ sortOrder: 1 });

    if (!attrs.length) {
      return res.status(400).json({ success: false, message: 'No variant-capable attributes found' });
    }

    // Cartesian product of selected values from each attribute
    const valueGroups = attrs.map(a =>
      a.values.filter(v => {
        // ONLY include values that were explicitly selected
        // If no selectedValues sent for this attribute, use all values as fallback
        const sel = req.body.selectedValues?.[a._id.toString()];
        if (!sel || sel.length === 0) return true; // no selection = all values
        return sel.includes(v._id.toString());
      })
        .map(v => ({ attrId: a._id, attrName: a.name, attrType: a.type, valueId: v._id, label: v.label, value: v.value, colorHex: v.colorHex, imageUrl: v.imageUrl }))
    );

    const cartesian = valueGroups.reduce((acc, group) => {
      if (!acc.length) return group.map(v => [v]);
      return acc.flatMap(combo => group.map(v => [...combo, v]));
    }, []);

    const generated = cartesian.map(combo => {
      const name = combo.map(c => c.label).join(' / ');
      const existing = existingVariants.find(e => e.name === name);
      return {
        name,
        options: combo.map(c => ({ attribute: c.attrName, value: c.label, attrId: c.attrId, valueId: c.valueId, colorHex: c.colorHex, imageUrl: c.imageUrl })),
        sku:        existing?.sku     || '',
        price:      existing?.price   || priceBase,
        comparePrice: existing?.comparePrice || null,
        inventory:  existing?.inventory ?? 0,
        image:      existing?.image   || (combo.find(c => c.imageUrl)?.imageUrl || ''),
        isActive:   existing?.isActive ?? true,
        _temp:      !existing, // flag for new vs preserved
      };
    });

    res.json({
      success: true,
      data:    generated,
      count:   generated.length,
      attributes: attrs.map(a => ({ _id: a._id, name: a.name, type: a.type })),
    });
  } catch (err) { next(err); }
};

module.exports = exports;
