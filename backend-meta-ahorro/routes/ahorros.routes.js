const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. REPORTE PRIMERO
router.get('/reporte/resumen/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_registros,
        COALESCE(SUM(ahorro_total), 0) AS total_ahorrado,
        COALESCE(SUM(CASE WHEN cumplio_meta = 1 THEN 1 ELSE 0 END), 0) AS metas_cumplidas,
        COALESCE(SUM(CASE WHEN cumplio_meta = 0 THEN 1 ELSE 0 END), 0) AS metas_pendientes,
        MAX(created_at) AS ultimo_registro
      FROM ahorros
      WHERE uid = ?
      `,
      [uid]
    );

    const [detalle] = await pool.query(
      `
      SELECT
        id,
        uid,
        nombre,
        descripcion,
        ahorro_mensual,
        meses,
        meta,
        ahorro_total,
        cumplio_meta,
        diferencia_meta,
        created_at
      FROM ahorros
      WHERE uid = ?
      ORDER BY created_at ASC
      `,
      [uid]
    );

    res.json({
      resumen: rows[0],
      detalle
    });
  } catch (error) {
    console.error('Error al obtener reporte del dashboard:', error);
    res.status(500).json({ message: 'Error al obtener reporte del dashboard' });
  }
});

// 2. LUEGO LA RUTA GENERAL POR UID
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM ahorros WHERE uid = ? ORDER BY created_at DESC',
      [uid]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ahorros:', error);
    res.status(500).json({ message: 'Error al obtener ahorros' });
  }
});

// 3. CREAR
router.post('/', async (req, res) => {
  try {
    const { uid, nombre, descripcion, ahorro_mensual, meses, meta } = req.body;

    if (!uid || !nombre || !ahorro_mensual || !meses || !meta) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const ahorro_total = Number(ahorro_mensual) * Number(meses);
    const cumplio_meta = ahorro_total >= Number(meta);
    const diferencia_meta = ahorro_total - Number(meta);

    const [result] = await pool.query(
      `INSERT INTO ahorros
      (uid, nombre, descripcion, ahorro_mensual, meses, meta, ahorro_total, cumplio_meta, diferencia_meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid,
        nombre,
        descripcion || '',
        ahorro_mensual,
        meses,
        meta,
        ahorro_total,
        cumplio_meta,
        diferencia_meta
      ]
    );

    res.status(201).json({
      message: 'Ahorro creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear ahorro:', error);
    res.status(500).json({ message: 'Error al crear ahorro' });
  }
});

// 4. ACTUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, ahorro_mensual, meses, meta } = req.body;

    const ahorro_total = Number(ahorro_mensual) * Number(meses);
    const cumplio_meta = ahorro_total >= Number(meta);
    const diferencia_meta = ahorro_total - Number(meta);

    const [result] = await pool.query(
      `UPDATE ahorros
       SET nombre = ?, descripcion = ?, ahorro_mensual = ?, meses = ?, meta = ?,
           ahorro_total = ?, cumplio_meta = ?, diferencia_meta = ?
       WHERE id = ?`,
      [
        nombre,
        descripcion || '',
        ahorro_mensual,
        meses,
        meta,
        ahorro_total,
        cumplio_meta,
        diferencia_meta,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ahorro no encontrado' });
    }

    res.json({ message: 'Ahorro actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar ahorro:', error);
    res.status(500).json({ message: 'Error al actualizar ahorro' });
  }
});

// 5. ELIMINAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM ahorros WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ahorro no encontrado' });
    }

    res.json({ message: 'Ahorro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar ahorro:', error);
    res.status(500).json({ message: 'Error al eliminar ahorro' });
  }
});

module.exports = router;