class PasswordReset {
    constructor(pool) {
        this.pool = pool;
    }

    async create(email, code) {
        try {
            await this.pool.query(
                'DELETE FROM password_resets WHERE email = $1',
                [email]
            );

            const result = await this.pool.query(
                `INSERT INTO password_resets (email, code, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
                 RETURNING id, email, code, expires_at`,
                [email, code]
            );

            return result.rows[0];
        } catch (error) {
            console.error('❌ Ошибка создания записи сброса пароля:', error);
            throw error;
        }
    }

    async findValidCode(email, code) {
        try {
            const result = await this.pool.query(
                `SELECT id, email, code, expires_at
                 FROM password_resets
                 WHERE email = $1 
                   AND code = $2
                   AND expires_at > NOW()
                   AND used = false`,
                [email, code]
            );

            return result.rows[0];
        } catch (error) {
            console.error('❌ Ошибка поиска кода:', error);
            throw error;
        }
    }

    async markAsUsed(id) {
        try {
            await this.pool.query(
                'UPDATE password_resets SET used = true WHERE id = $1',
                [id]
            );
        } catch (error) {
            console.error('❌ Ошибка отметки кода как использованного:', error);
            throw error;
        }
    }

    async deleteOldCodes() {
        try {
            await this.pool.query(
                'DELETE FROM password_resets WHERE expires_at <= NOW()'
            );
        } catch (error) {
            console.error('❌ Ошибка удаления старых кодов:', error);
        }
    }
}

module.exports = PasswordReset;