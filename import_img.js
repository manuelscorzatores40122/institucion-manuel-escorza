const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_EGYnKkqx8mN2@ep-autumn-truth-aml6qmo6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require'
});

const students = [
  ['91263829', '91263829', 'APAZA', 'HUACO', 'EMILY ROMINA', 'M', '2019-04-01'],
  ['91410015', null, 'CALLA', 'HUANCA', 'ARELY RUTH', 'M', '2019-07-12'],
  ['91538470', null, 'CARDOSO', 'ARNICA', 'CHRISTOPHER ALAN', 'H', '2019-10-09'],
  ['91748426', null, 'CASTRO', 'APAZA', 'ALEJANDRA ESTHER ANGELA', 'M', '2020-02-27'],
  ['91476018', '23175298900010', 'CCANRE', 'CONDORI', 'ANYELIS MELANY', 'M', '2019-08-29'],
  ['91692770', '23022508600250', 'CHAIÑA', 'SILVA', 'GERALD SMITH', 'H', '2020-01-22'],
  ['92947110', '23175483700040', 'CORNEJO', 'HUILLCA', 'JHOE SAMUEL', 'H', '2019-09-08'],
  ['91305222', '23089286900180', 'HEREDIA', 'MONTESINOS', 'EZEQUIEL ALFREDO', 'H', '2019-04-24'],
  ['91571364', '23022551600180', 'JIMENEZ', 'QUISPE', 'YOHANNYZ ALESSIA', 'M', '2019-11-01'],
  ['91458350', '23022575500160', 'LOPE', 'QUISPE', 'THAISA MASHIELL', 'M', '2019-08-14'],
  ['91353360', '23075400200030', 'LOPE', 'VERA', 'KAROLAYND', 'M', '2019-06-02'],
  ['91309723', '20242019133905', 'MALLCOHUACCHA', 'CUTIRE', 'XIOMARA ARLET', 'M', '2019-05-05'],
  ['91717567', '23145554200070', 'MENDOZA', 'DIAZ', 'JENKO RAFAEL', 'H', '2020-02-07'],
  ['91744485', '23022551600070', 'PANCCA', 'QUISPE', 'CÉSAR AUGUSTO', 'H', '2020-02-24'],
  ['91806486', '23161432000010', 'PARIAPAZA', 'MAMANI', 'YEIKO THAYLOR', 'H', '2020-03-21'],
  ['91693404', '23022575500080', 'RODRIGUEZ', 'QUISPE', 'LUIS SANTIAGO GIUSSEPE', 'H', '2020-01-22'],
  ['91532743', '23022508600290', 'ROSAS', 'LIZANA', 'MELODY IVANNA', 'M', '2019-10-03'],
  ['91342870', '23022575500090', 'SOTO', 'MOSCOSO', 'THAIZA ASTRID', 'M', '2019-05-27']
];

async function main() {
  try {
    // Get Grado and Seccion IDs
    // Nivel 1 (Primaria)
    const gRes = await pool.query("SELECT id FROM grados WHERE nivel_id=1 AND nombre='PRIMERO'");
    const grado_id = gRes.rows[0].id; // Should be 2

    const sRes = await pool.query("SELECT id FROM secciones WHERE grado_id=$1 AND nombre='A'", [grado_id]);
    const seccion_id = sRes.rows[0].id; // Should be 22

    const anio_id = 1; // 2026

    console.log(`Inserting into Primaria -> Primero -> A (Grado: ${grado_id}, Seccion: ${seccion_id})`);

    let count = 0;
    for (const st of students) {
      const [dni, codigo, paterno, materno, nombres, sexo, fnac] = st;

      const res = await pool.query(`
        INSERT INTO estudiantes (dni, codigo_estudiante, apellido_paterno, apellido_materno, nombres, sexo, fecha_nacimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (dni) DO UPDATE SET 
          apellido_paterno = EXCLUDED.apellido_paterno,
          apellido_materno = EXCLUDED.apellido_materno,
          nombres = EXCLUDED.nombres
        RETURNING id
      `, [dni, codigo, paterno, materno, nombres, sexo, fnac]);

      const estudianteId = res.rows[0].id;

      // Upsert matriculas
      const mRes = await pool.query(`SELECT id FROM matriculas WHERE estudiante_id=$1 AND anio_id=$2`, [estudianteId, anio_id]);
      if (mRes.rows.length === 0) {
        await pool.query(`INSERT INTO matriculas (estudiante_id, anio_id, grado_id, seccion_id, fecha_matricula) VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
          [estudianteId, anio_id, grado_id, seccion_id]);
      } else {
        await pool.query(`UPDATE matriculas SET grado_id=$1, seccion_id=$2 WHERE id=$3`, [grado_id, seccion_id, mRes.rows[0].id]);
      }
      count++;
    }

    console.log(`Successfully processed ${count} students`);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
