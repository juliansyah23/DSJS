<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $code,
        private readonly string $purpose,
        private readonly int $expiryMinutes,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $action = $this->purpose === 'register' ? 'verifikasi akun' : 'reset password';

        return (new MailMessage)
            ->subject('Kode OTP Digital Service Journey')
            ->greeting('Halo!')
            ->line("Gunakan kode berikut untuk {$action}:")
            ->line("**{$this->code}**")
            ->line("Kode berlaku selama {$this->expiryMinutes} menit dan hanya dapat digunakan satu kali.")
            ->line('Jika Anda tidak meminta kode ini, abaikan email ini dan jangan bagikan kode kepada siapa pun.');
    }
}