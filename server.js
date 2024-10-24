const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
    host: 'servicioalochoro-prueba1631.l.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_XIL6StsPZSOwo0ZxNfr',
    database: 'RECICLOTHES',
    port: '15140',
    charset: "utf8mb4"
};

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Ruta para la página de registro
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Ruta para el registro de usuarios
app.post('/signup', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { name, email, phone, address, password } = req.body;
        
        // Generar salt y hash de la contraseña
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const [result] = await connection.execute(
            'INSERT INTO clientes (name, email, phone, address, password_hash, salt) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, address, passwordHash, salt]
        );
        
        await connection.end();
        
        if (result.affectedRows === 1) {
            res.json({ success: true, message: 'Cliente registrado correctamente' });
        } else {
            res.status(500).json({ success: false, message: 'Error al registrar cliente' });
        }
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Ruta para la página de inicio de sesión
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LogIn.html'));
});

// Ruta para el proceso de inicio de sesión
app.post('/login', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { email, password } = req.body;
        
        // Buscar el usuario por email
        const [rows] = await connection.execute(
            'SELECT * FROM clientes WHERE email = ?',
            [email]
        );
        
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const user = rows[0];
        
        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (isMatch) {
            // Aquí puedes generar un token de sesión si lo deseas
            res.json({ success: true, message: 'Inicio de sesión exitoso' });
        } else {
            res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

async function testDatabaseConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Conexión a la base de datos exitosa');
        await connection.end();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

testDatabaseConnection();

async function checkTableStructure() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('DESCRIBE clientes');
        console.log('Estructura de la tabla clientes:', rows);
        await connection.end();
    } catch (error) {
        console.error('Error al verificar la estructura de la tabla:', error);
    }
}

checkTableStructure();

// Importar el módulo de base de datos (asegúrate de tenerlo configurado)
const db = require('./db');

// Ruta para obtener todos los productos
app.get('/api/Productos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT Id_Producto, name, description, price, category, stock, imagen FROM Productos');
        await connection.end();

        // Convertir BLOB a base64
        const productosConImagenes = rows.map(producto => ({
            ...producto,
            imagen: producto.imagen ? producto.imagen.toString('base64') : null
        }));

        res.json(productosConImagenes);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/Productos', async (req, res) => {
    console.log('Solicitud recibida en /api/productos');
    // ... resto del código ...
});


app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
