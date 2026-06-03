const productoRepo   = require('../repositories/producto.repository');
const categoriaRepo  = require('../repositories/categoria.repository');
const inventarioRepo = require('../repositories/inventario.repository');
const { AppError }   = require('../utils/errors');

async function listar(empresa_id, filtros) {
  return productoRepo.findAll(empresa_id, filtros);
}

async function obtener(id, empresa_id) {
  const producto = await productoRepo.findById(id, empresa_id);
  if (!producto) throw new AppError('Producto no encontrado', 404);
  return producto;
}

async function crear(empresa_id, data) {
  // Validar que la categoria pertenece al tenant
  const cat = await categoriaRepo.findById(data.categoria_id, empresa_id);
  if (!cat) throw new AppError('Categoria no encontrada', 404);

  const producto = await productoRepo.create({ empresa_id, ...data });

  // Auto-inicializar inventario en todas las sucursales del tenant (no bloquea)
  productoRepo.getSucursalesIds(empresa_id).then(async (ids) => {
    for (const sucursal_id of ids) {
      await inventarioRepo.initRegistro(empresa_id, producto.id, sucursal_id);
    }
  }).catch(err => console.error('[INVENTARIO] Error inicializando stock:', err.message));

  return producto;
}

async function editar(id, empresa_id, data) {
  const producto = await productoRepo.findById(id, empresa_id);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  if (data.categoria_id && data.categoria_id !== producto.categoria_id) {
    const cat = await categoriaRepo.findById(data.categoria_id, empresa_id);
    if (!cat) throw new AppError('Categoria no encontrada', 404);
  }

  return productoRepo.update(id, empresa_id, { ...producto, ...data });
}

async function eliminar(id, empresa_id) {
  const producto = await productoRepo.findById(id, empresa_id);
  if (!producto) throw new AppError('Producto no encontrado', 404);
  await productoRepo.softDelete(id, empresa_id);
}

module.exports = { listar, obtener, crear, editar, eliminar };
