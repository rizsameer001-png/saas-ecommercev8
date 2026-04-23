const Category = require('../models/Category');
const Product  = require('../models/Product');

// ─── Helper: Build nested tree from flat list ─────────────────────────────────
function buildTree(categories, parentId = null) {
  return categories
    .filter(c => {
      const cParent = c.parent?._id?.toString() || c.parent?.toString() || null;
      const target  = parentId ? parentId.toString() : null;
      return cParent === target;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(c => ({
      ...c.toObject ? c.toObject() : c,
      children: buildTree(categories, c._id),
    }));
}

// ─── GET all categories (flat list + nested tree) ─────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const store = req.store;
    const { tree, activeOnly = 'true' } = req.query;

    const query = { store: store._id };
    if (activeOnly === 'true') query.isActive = true;

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ depth: 1, sortOrder: 1, name: 1 });

    // Update product counts
    await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, status: 'active' });
        if (cat.productCount !== count) {
          await Category.findByIdAndUpdate(cat._id, { productCount: count });
          cat.productCount = count;
        }
      })
    );

    if (tree === 'true') {
      // Return as nested tree
      const treeData = buildTree(categories);
      return res.json({ success: true, data: treeData });
    }

    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

// ─── GET single category with breadcrumb ─────────────────────────────────────
exports.getCategory = async (req, res, next) => {
  try {
    const store = req.store;
    const { idOrSlug } = req.params;

    const query = { store: store._id };
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) query._id = idOrSlug;
    else query.slug = idOrSlug;

    const category = await Category.findOne(query)
      .populate('parent', 'name slug depth')
      .populate('children');

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Build breadcrumb chain
    const breadcrumb = [];
    let current = category;
    while (current) {
      breadcrumb.unshift({ _id: current._id, name: current.name, slug: current.slug });
      current = current.parent && current.parent._id ? current.parent : null;
      if (current) current = await Category.findById(current._id);
    }

    res.json({ success: true, data: category, breadcrumb });
  } catch (err) { next(err); }
};

// ─── CREATE category ──────────────────────────────────────────────────────────
exports.createCategory = async (req, res, next) => {
  try {
    const store = req.store;
    const { name, description, image, parent, sortOrder, seo } = req.body;

    // Validate parent belongs to same store
    if (parent) {
      const parentCat = await Category.findOne({ _id: parent, store: store._id });
      if (!parentCat) return res.status(400).json({ success: false, message: 'Parent category not found in this store' });

      // Limit depth to 3 levels (root > sub > sub-sub)
      if (parentCat.depth >= 2) {
        return res.status(400).json({ success: false, message: 'Maximum category depth is 3 levels' });
      }
    }

    const category = await Category.create({
      store: store._id, name, description, image,
      parent: parent || null, sortOrder: sortOrder || 0, seo,
    });

    await category.populate('parent', 'name slug');
    res.status(201).json({ success: true, data: category, message: 'Category created' });
  } catch (err) { next(err); }
};

// ─── UPDATE category ──────────────────────────────────────────────────────────
exports.updateCategory = async (req, res, next) => {
  try {
    const store = req.store;
    const { name, description, image, parent, sortOrder, isActive, seo } = req.body;

    const category = await Category.findOne({ _id: req.params.id, store: store._id });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Prevent circular parent
    if (parent && parent.toString() === category._id.toString()) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
    }

    // Validate new parent
    if (parent && parent !== (category.parent?.toString() || null)) {
      const parentCat = await Category.findOne({ _id: parent, store: store._id });
      if (!parentCat) return res.status(400).json({ success: false, message: 'Parent category not found' });

      // Make sure the new parent is not a descendant of this category
      const descendants = await getDescendantIds(category._id);
      if (descendants.includes(parent.toString())) {
        return res.status(400).json({ success: false, message: 'Cannot set a descendant as parent' });
      }

      if (parentCat.depth >= 2) {
        return res.status(400).json({ success: false, message: 'Maximum category depth is 3 levels' });
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parent !== undefined) category.parent = parent || null;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;
    if (seo !== undefined) category.seo = seo;

    await category.save();
    await category.populate('parent', 'name slug');

    res.json({ success: true, data: category, message: 'Category updated' });
  } catch (err) { next(err); }
};

// ─── DELETE category ──────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res, next) => {
  try {
    const store = req.store;
    const category = await Category.findOne({ _id: req.params.id, store: store._id });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Check if it has products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${productCount} product(s) are in this category. Reassign them first.`,
        productCount,
      });
    }

    // Check if it has child categories
    const childCount = await Category.countDocuments({ parent: category._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${childCount} sub-categor${childCount !== 1 ? 'ies' : 'y'} exist. Delete or move them first.`,
        childCount,
      });
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ─── BULK reorder categories ──────────────────────────────────────────────────
exports.reorderCategories = async (req, res, next) => {
  try {
    const store = req.store;
    const { orders } = req.body; // [{ id, sortOrder }]

    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        Category.findOneAndUpdate({ _id: id, store: store._id }, { sortOrder })
      )
    );

    res.json({ success: true, message: 'Categories reordered' });
  } catch (err) { next(err); }
};

// ─── Helper: get all descendant IDs ──────────────────────────────────────────
async function getDescendantIds(categoryId) {
  const children = await Category.find({ parent: categoryId }).select('_id');
  const ids = children.map(c => c._id.toString());
  for (const child of children) {
    const nested = await getDescendantIds(child._id);
    ids.push(...nested);
  }
  return ids;
}
