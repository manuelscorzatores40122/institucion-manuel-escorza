CREATE DATABASE IF NOT EXISTS mannuel_scorza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mannuel_scorza;

CREATE TABLE IF NOT EXISTS usuarios (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(50)  UNIQUE NOT NULL,
  contrasena     VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS niveles (
  id     INT         AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  CONSTRAINT uq_nivel_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grados (
  id       INT         AUTO_INCREMENT PRIMARY KEY,
  nivel_id INT         NOT NULL,
  nombre   VARCHAR(20) NOT NULL,
  CONSTRAINT fk_grados_nivel    FOREIGN KEY (nivel_id) REFERENCES niveles(id),
  CONSTRAINT uq_grado_por_nivel UNIQUE (nivel_id, nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS secciones (
  id       INT        AUTO_INCREMENT PRIMARY KEY,
  grado_id INT        NOT NULL,
  nombre   VARCHAR(5) NOT NULL,
  CONSTRAINT fk_secciones_grado   FOREIGN KEY (grado_id) REFERENCES grados(id),
  CONSTRAINT uq_seccion_por_grado UNIQUE (grado_id, nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estudiantes (
  id                      INT          AUTO_INCREMENT PRIMARY KEY,
  apellido_paterno        VARCHAR(100),
  apellido_materno        VARCHAR(100),
  nombres                 VARCHAR(150),
  dni                     VARCHAR(15)  UNIQUE,
  celular                 VARCHAR(15),
  email                   VARCHAR(150),
  fecha_nacimiento        DATE,
  departamento_nacimiento VARCHAR(100),
  provincia_nacimiento    VARCHAR(100),
  distrito_nacimiento     VARCHAR(100),
  domicilio               TEXT,
  reporte                 TEXT,
  egresado                BOOLEAN      DEFAULT FALSE,
  padre_dni               VARCHAR(15),
  padre_nombres           VARCHAR(150),
  padre_apellidos         VARCHAR(150),
  padre_celular           VARCHAR(15),
  madre_dni               VARCHAR(15),
  madre_nombres           VARCHAR(150),
  madre_apellidos         VARCHAR(150),
  madre_celular           VARCHAR(15)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS anios_escolares (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  anio INT UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matriculas (
  id              INT  AUTO_INCREMENT PRIMARY KEY,
  estudiante_id   INT  NOT NULL,
  grado_id        INT  NOT NULL,
  seccion_id      INT  NOT NULL,
  anio_id         INT  NOT NULL,
  fecha_matricula DATE,
  CONSTRAINT fk_matriculas_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_matriculas_grado      FOREIGN KEY (grado_id)      REFERENCES grados(id),
  CONSTRAINT fk_matriculas_seccion    FOREIGN KEY (seccion_id)    REFERENCES secciones(id),
  CONSTRAINT fk_matriculas_anio       FOREIGN KEY (anio_id)       REFERENCES anios_escolares(id),
  CONSTRAINT uq_matricula_anual       UNIQUE (estudiante_id, anio_id)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_matricula_seccion_insert
BEFORE INSERT ON matriculas
FOR EACH ROW
BEGIN
  DECLARE v_grado INT;
  SELECT grado_id INTO v_grado FROM secciones WHERE id = NEW.seccion_id;
  IF v_grado != NEW.grado_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La seccion no corresponde al grado indicado.';
  END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_matricula_seccion_update
BEFORE UPDATE ON matriculas
FOR EACH ROW
BEGIN
  DECLARE v_grado INT;
  SELECT grado_id INTO v_grado FROM secciones WHERE id = NEW.seccion_id;
  IF v_grado != NEW.grado_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La seccion no corresponde al grado indicado.';
  END IF;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS apoderados (
  id                  INT          AUTO_INCREMENT PRIMARY KEY,
  apellido_paterno    VARCHAR(100),
  apellido_materno    VARCHAR(100),
  nombres             VARCHAR(150),
  dni                 VARCHAR(15)  UNIQUE,
  celular             VARCHAR(15),
  correo              VARCHAR(150),
  domicilio           TEXT,
  parentesco          ENUM('padre','madre','abuelo','abuela','tio','tia','hermano','hermana','tutor_legal','otro') NOT NULL DEFAULT 'otro',
  vive_con_estudiante BOOLEAN
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estudiante_apoderado (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  apoderado_id  INT NOT NULL,
  CONSTRAINT fk_ea_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_apoderado  FOREIGN KEY (apoderado_id)  REFERENCES apoderados(id)  ON DELETE CASCADE,
  CONSTRAINT uq_est_apoderado UNIQUE (estudiante_id, apoderado_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contacto_emergencia (
  id             INT         AUTO_INCREMENT PRIMARY KEY,
  estudiante_id  INT,
  telefono       VARCHAR(15),
  con_quien_vive TEXT,
  CONSTRAINT fk_ce_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO usuarios (nombre_usuario, contrasena)
VALUES ('admin', '$2y$12$6Nl8XlO.X2hVfRQmF.MtxOmf7D7zIn05WvQ3VzC54vPq8fL5aT3s6');


