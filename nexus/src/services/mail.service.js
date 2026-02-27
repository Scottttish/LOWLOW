const nodemailer = require('nodemailer');
const crypto = require('crypto');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'lowlowsite@gmail.com',
                pass: 'whubfzhiahettjsk'
            }
        });
    }

    async sendResetCode(email, code) {
        try {
            const mailOptions = {
                from: '"LowLow Support" <lowlowsite@gmail.com>',
                to: email,
                subject: '🔐 Код восстановления пароля',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <div style="background: #000000; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">LOWLOW</h1>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <h2 style="color: #333; margin-bottom: 20px;">Восстановление пароля</h2>
                            <p style="color: #666; margin-bottom: 20px;">Вы запросили восстановление пароля для вашего аккаунта.</p>
                            
                            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; border: 2px dashed #ddd;">
                                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Ваш код подтверждения:</div>
                                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; margin: 10px 0;">${code}</div>
                                <div style="font-size: 12px; color: #999;">Код действителен 15 минут</div>
                            </div>
                            
                            <p style="color: #666; margin-bottom: 10px;">Введите этот код на странице восстановления пароля.</p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
                            </p>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
                            © ${new Date().getFullYear()} LowLow. Все права защищены.
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка отправки письма:', error);
            return { success: false, error: error.message };
        }
    }

    async sendPartnershipSubmit(email) {
        try {
            const mailOptions = {
                from: '"LowLow Partnership" <lowlowsite@gmail.com>',
                to: email,
                subject: '🤝 Запрос на партнерство принят',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <div style="background: #000; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">LOWLOW</h1>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <h2 style="color: #333;">Спасибо за ваш запрос!</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Мы получили вашу заявку на партнерство. Наши администраторы рассмотрят её в ближайшее время.
                            </p>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Мы свяжемся с вами по этому адресу электронной почты, как только будет принято решение.
                            </p>
                            <div style="margin-top: 30px; padding: 20px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #007bff;">
                                <p style="margin: 0; color: #0056b3; font-weight: bold;">Статус заявки: Ожидает рассмотрения</p>
                            </div>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                            © ${new Date().getFullYear()} LowLow. Все права защищены.
                        </div>
                    </div>
                `
            };
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка отправки письма о партнерстве:', error);
            return { success: false, error: error.message };
        }
    }

    async sendPartnershipApproval(email) {
        try {
            const mailOptions = {
                from: '"LowLow Partnership" <lowlowsite@gmail.com>',
                to: email,
                subject: '✅ Ваша заявка на партнерство одобрена!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <div style="background: #000; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">LOWLOW</h1>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <h2 style="color: #28a745;">Поздравляем!</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Мы рады сообщить, что ваша заявка на партнерство с LowLow была одобрена.
                            </p>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Теперь вы можете войти в свой аккаунт (или создать его, если еще не сделали этого) и получить доступ к функциям бизнес-партнера.
                            </p>
                            <a href="http://localhost:3000/login" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Войти в кабинет</a>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                            © ${new Date().getFullYear()} LowLow. Все права защищены.
                        </div>
                    </div>
                `
            };
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка отправки письма об одобрении:', error);
            return { success: false, error: error.message };
        }
    }

    async sendPartnershipRejection(email) {
        try {
            const mailOptions = {
                from: '"LowLow Partnership" <lowlowsite@gmail.com>',
                to: email,
                subject: '📋 Информация по вашей заявке на партнерство',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <div style="background: #000; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">LOWLOW</h1>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <h2 style="color: #333;">Уважаемый кандидат,</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Мы рассмотрели вашу заявку на партнерство. К сожалению, на данный момент мы не можем одобрить ваш запрос.
                            </p>
                            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                                Благодарим за интерес к нашей платформе. Вы можете подать повторную заявку позже, уточнив детали вашего заведения.
                            </p>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                            © ${new Date().getFullYear()} LowLow. Все права защищены.
                        </div>
                    </div>
                `
            };
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка отправки письма об отказе:', error);
            return { success: false, error: error.message };
        }
    }

    generateCode() {
        return crypto.randomInt(100000, 999999).toString();
    }
}

module.exports = MailService;