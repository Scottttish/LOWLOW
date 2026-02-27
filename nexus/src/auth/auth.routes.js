const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

module.exports = function(authController) {
    const registerValidation = [
        body('name')
            .trim()
            .notEmpty().withMessage('Имя обязательно')
            .isLength({ min: 2 }).withMessage('Имя должно содержать минимум 2 символа')
            .isLength({ max: 50 }).withMessage('Имя не должно превышать 50 символов'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('Email обязателен')
            .isEmail().withMessage('Введите корректный email')
            .normalizeEmail(),
        
        body('password')
            .notEmpty().withMessage('Пароль обязателен')
            .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
        
        body('confirmPassword')
            .notEmpty().withMessage('Подтверждение пароля обязательно')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Пароли не совпадают');
                }
                return true;
            })
    ];

    const loginValidation = [
        body('email')
            .trim()
            .notEmpty().withMessage('Email обязателен')
            .isEmail().withMessage('Введите корректный email'),
        
        body('password')
            .notEmpty().withMessage('Пароль обязателен')
    ];

    const changePasswordValidation = [
        body('currentPassword')
            .notEmpty().withMessage('Текущий пароль обязателен'),
        
        body('newPassword')
            .notEmpty().withMessage('Новый пароль обязателен')
            .isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
            .custom((value, { req }) => {
                if (value === req.body.currentPassword) {
                    throw new Error('Новый пароль должен отличаться от текущего');
                }
                return true;
            }),
        
        body('confirmPassword')
            .notEmpty().withMessage('Подтверждение пароля обязательно')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Пароли не совпадают');
                }
                return true;
            })
    ];

    const resetPasswordValidation = [
        body('email')
            .trim()
            .notEmpty().withMessage('Email обязателен')
            .isEmail().withMessage('Введите корректный email')
    ];

    const verifyCodeValidation = [
        body('email')
            .trim()
            .notEmpty().withMessage('Email обязателен')
            .isEmail().withMessage('Введите корректный email'),
        
        body('code')
            .trim()
            .notEmpty().withMessage('Код обязателен')
            .isLength({ min: 6, max: 6 }).withMessage('Код должен содержать 6 цифр')
            .matches(/^\d+$/).withMessage('Код должен содержать только цифры')
    ];

    const newPasswordValidation = [
        body('email')
            .trim()
            .notEmpty().withMessage('Email обязателен')
            .isEmail().withMessage('Введите корректный email'),
        
        body('token')
            .notEmpty().withMessage('Токен обязателен'),
        
        body('newPassword')
            .notEmpty().withMessage('Новый пароль обязателен')
            .isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
    ];

    // Добавляем отладочный роут для проверки
    router.get('/test', (req, res) => {
        console.log('✅ Маршрут /api/auth/test работает');
        res.json({
            success: true,
            message: 'Маршрут аутентификации работает!',
            availableEndpoints: [
                'POST /register',
                'POST /login',
                'POST /forgot-password',
                'POST /verify-reset-code',
                'POST /reset-password',
                'GET /me',
                'GET /verify',
                'POST /change-password'
            ]
        });
    });

    router.post('/register', registerValidation, (req, res) => {
        authController.register(req, res);
    });

    router.post('/login', loginValidation, (req, res) => {
        authController.login(req, res);
    });

    router.get('/verify', (req, res) => {
        authController.verify(req, res);
    });

    router.get('/me', authMiddleware, (req, res) => {
        authController.getMe(req, res);
    });

    router.post('/change-password', authMiddleware, changePasswordValidation, (req, res) => {
        authController.changePassword(req, res);
    });

    router.post('/forgot-password', resetPasswordValidation, (req, res) => {
        console.log('📧 Запрос на восстановление пароля получен:', req.body.email);
        authController.requestPasswordReset(req, res);
    });

    router.post('/verify-reset-code', verifyCodeValidation, (req, res) => {
        authController.verifyResetCode(req, res);
    });

    router.post('/reset-password', newPasswordValidation, (req, res) => {
        authController.resetPassword(req, res);
    });

    return router;
};