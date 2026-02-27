const { validationResult } = require('express-validator');

class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации',
                    errors: errors.array()
                });
            }

            const { name, email, password, phone, city, address, confirmPassword } = req.body;

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Пароли не совпадают'
                });
            }

            console.log(`📝 Регистрация: ${email}`);

            const result = await this.authService.register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone || null,
                city: city || null,
                address: address || null
            });

            console.log(`✅ Регистрация успешна: ${email}, ID: ${result.user.id}`);

            res.status(201).json({
                success: true,
                message: 'Регистрация прошла успешно',
                data: result
            });

        } catch (error) {
            console.error('❌ Ошибка регистрации:', error.message);

            if (error.code === 'DUPLICATE_EMAIL') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при регистрации'
            });
        }
    }

    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            console.log(`🔑 Вход: ${email}`);

            const result = await this.authService.login(
                email.trim().toLowerCase(), 
                password
            );

            console.log(`✅ Вход успешен: ${email}, ID: ${result.user.id}`);

            res.json({
                success: true,
                message: 'Вход выполнен успешно',
                data: result
            });

        } catch (error) {
            console.error('❌ Ошибка входа:', error.message);

            if (error.code === 'INVALID_CREDENTIALS') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при входе'
            });
        }
    }

    async verify(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Токен не предоставлен'
                });
            }

            const user = await this.authService.getUserFromToken(token);

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('❌ Ошибка верификации токена:', error.message);

            if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при верификации токена'
            });
        }
    }

    async getMe(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Пользователь не авторизован'
                });
            }

            const user = await this.authService.userModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('❌ Ошибка получения информации о пользователе:', error);
            
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера'
            });
        }
    }

    async changePassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Пользователь не авторизован'
                });
            }

            await this.authService.changePassword(userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Пароль успешно изменен'
            });

        } catch (error) {
            console.error('❌ Ошибка смены пароля:', error);
            
            if (error.message === 'Неверный текущий пароль') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка сервера при смене пароля'
            });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации',
                    errors: errors.array()
                });
            }

            const { email } = req.body;
            
            console.log(`📧 Запрос восстановления пароля для: ${email}`);

            const result = await this.authService.requestPasswordReset(email);

            console.log(`✅ Код отправлен на: ${email}`);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Ошибка запроса восстановления пароля:', error.message);

            if (error.code === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Ошибка при отправке кода'
            });
        }
    }

    async verifyResetCode(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации',
                    errors: errors.array()
                });
            }

            const { email, code } = req.body;
            
            console.log(`🔐 Проверка кода для: ${email}`);

            const result = await this.authService.verifyResetCode(email, code);

            console.log(`✅ Код подтвержден для: ${email}`);

            res.json({
                success: true,
                message: 'Код подтвержден',
                token: result.token
            });

        } catch (error) {
            console.error('❌ Ошибка проверки кода:', error.message);

            if (error.code === 'INVALID_CODE') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка при проверке кода'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации',
                    errors: errors.array()
                });
            }

            const { email, token, newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Пароль должен содержать минимум 6 символов'
                });
            }

            console.log(`🔄 Сброс пароля для: ${email}`);

            const result = await this.authService.resetPassword(email, token, newPassword);

            console.log(`✅ Пароль изменен для: ${email}`);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Ошибка сброса пароля:', error.message);

            if (error.message.includes('истек') || error.message.includes('Неверный токен')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ошибка при сбросе пароля'
            });
        }
    }
}

module.exports = AuthController;