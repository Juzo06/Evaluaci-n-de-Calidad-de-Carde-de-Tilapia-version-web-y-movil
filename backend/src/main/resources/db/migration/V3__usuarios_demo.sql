-- =====================================================================
-- V3 - Piscicultores de DEMOSTRACIÓN (solo desarrollo)
-- Mientras la HU3 se identifica al usuario con el header X-Usuario-Id,
-- estos dos usuarios permiten probar que cada uno ve solo sus lotes.
-- contrasena_hash es un marcador: estos usuarios no pueden iniciar sesión.
-- Se eliminan con una migración posterior cuando exista el login real.
-- =====================================================================
INSERT INTO usuario (nombres, apellidos, correo, nombre_usuario, contrasena_hash, rol_id)
SELECT v.nombres, v.apellidos, v.correo, v.usuario, 'SIN_LOGIN_DEMO', r.id
FROM (VALUES
        ('Piscicultor', 'Demo Uno',  'demo1@secct.local', 'piscicultor.demo1'),
        ('Piscicultor', 'Demo Dos',  'demo2@secct.local', 'piscicultor.demo2')
     ) AS v(nombres, apellidos, correo, usuario)
JOIN rol r ON r.codigo = 'PISCICULTOR'
ON CONFLICT (nombre_usuario) DO NOTHING;
