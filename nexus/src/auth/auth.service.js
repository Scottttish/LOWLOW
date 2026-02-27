const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
    constructor(userModel, passwordResetModel, mailService) {
        this.userModel = userModel;
        this.passwordResetModel = passwordResetModel;
        this.mailService = mailService;
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        this.jwtExpiresIn = '7d';
    }

    async register(userData) {
        const { name, email, password, phone, city, address } = userData;

        const emailExists = await this.userModel.emailExists(email);
        if (emailExists) {
            const error = new Error('Пользователь с таким email уже существует');
            error.code = 'DUPLICATE_EMAIL';
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await this.userModel.create({
            name,
            email,
            password: hashedPassword,
            phone: phone || null,
            city: city || null,
            address: address || null,
            role: 'user',
            company_name: null
        });

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                city: user.city,
                address: user.address,
                avatar_url: user.avatar_url,
                company_name: user.company_name,
                is_active: user.is_active,
                created_at: user.created_at
            },
            token
        };
    }

    async login(email, password) {
        console.log(`🔍 Попытка входа для: ${email}`);
        
        const user = await this.userModel.getUserWithPassword(email);
        
        if (!user) {
            console.log(`❌ Пользователь не найден: ${email}`);
            const error = new Error('Неверный email или пароль');
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        console.log(`✅ Пользователь найден: ${user.email}, ID: ${user.id}`);
        console.log(`🔐 Активен ли аккаунт: ${user.is_active}`);
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        console.log(`🔐 Проверка пароля: ${isPasswordValid ? '✅ Верный' : '❌ Неверный'}`);
        
        if (!isPasswordValid) {
            console.log(`❌ Неверный пароль для: ${email}`);
            const error = new Error('Неверный email или пароль');
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        if (!user.is_active) {
            console.log(`🔓 Активируем деактивированный аккаунт: ${email}`);
            
            await this.userModel.activateUser(user.id);
            user.is_active = true;
            
            console.log(`✅ Аккаунт активирован: ${email}`);
        }

        const token = this.generateToken(user);

        console.log(`🎉 Вход успешен для: ${user.email}`);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'user',
                city: user.city,
                address: user.address,
                avatar_url: user.avatar_url,
                company_name: user.company_name,
                is_active: user.is_active,
                created_at: user.created_at
            },
            token
        };
    }

    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role || 'user',
            name: user.name
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn
        });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                const expiredError = new Error('Токен истек');
                expiredError.code = 'TOKEN_EXPIRED';
                throw expiredError;
            }
            
            const invalidError = new Error('Неверный токен');
            invalidError.code = 'INVALID_TOKEN';
            throw invalidError;
        }
    }

    async getUserFromToken(token) {
        const decoded = this.verifyToken(token);
        const user = await this.userModel.findById(decoded.id);
        
        if (!user) {
            const error = new Error('Пользователь не найден');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        return user;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const passwordHash = await this.userModel.getPasswordHash(userId);
        
        if (!passwordHash) {
            throw new Error('Пользователь не найден');
        }

        const isValid = await bcrypt.compare(currentPassword, passwordHash);
        if (!isValid) {
            throw new Error('Неверный текущий пароль');
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await this.userModel.updatePassword(userId, newPasswordHash);
    }

    async requestPasswordReset(email) {
        const emailExists = await this.userModel.checkEmailExists(email);
        
        if (!emailExists) {
            const error = new Error('Пользователь с таким email не найден');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const code = this.mailService.generateCode();
        await this.passwordResetModel.create(email, code);
        
        const mailResult = await this.mailService.sendResetCode(email, code);
        
        if (!mailResult.success) {
            throw new Error('Не удалось отправить код. Попробуйте позже.');
        }

        return { success: true, message: 'Код отправлен на email' };
    }

    async verifyResetCode(email, code) {
        const resetRecord = await this.passwordResetModel.findValidCode(email, code);
        
        if (!resetRecord) {
            const error = new Error('Неверный или просроченный код');
            error.code = 'INVALID_CODE';
            throw error;
        }

        await this.passwordResetModel.markAsUsed(resetRecord.id);
        
        const token = jwt.sign(
            { email, action: 'password_reset' },
            this.jwtSecret,
            { expiresIn: '15m' }
        );

        return { success: true, token };
    }

    async resetPassword(email, token, newPassword) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            
            if (decoded.email !== email || decoded.action !== 'password_reset') {
                throw new Error('Неверный токен');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await this.userModel.updatePasswordByEmail(email, hashedPassword);

            await this.passwordResetModel.deleteOldCodes();

            return { success: true, message: 'Пароль успешно изменен' };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Срок действия токена истек. Запросите новый код.');
            }
            throw error;
        }
    }
}

module.exports = AuthService;