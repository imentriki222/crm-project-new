<?php

namespace Database\Factories;

use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['email', 'whatsapp', 'sms']);
        $name = ucfirst($type) . ' Template: ' . fake()->word();

        $body = '';
        $subject = null;

        if ($type === 'email') {
            $subject = fake()->sentence();
            $body = "Dear {{first_name}},\n\n" . fake()->paragraph(3) . "\n\nBest Regards,\n{{company_name}} Team";
        } elseif ($type === 'whatsapp') {
            $body = "Hi *{{first_name}}*! 👋\n\nWe noticed you are interested in {{company_name}}. Let's schedule a short meeting: {{meeting_link}}\n\nReply 'STOP' to opt-out.";
        } else {
            $body = "Hello {{first_name}}, check out our new update on {{website}}! Reply HELP for info.";
        }

        return [
            'name' => $name,
            'type' => $type,
            'subject' => $subject,
            'body' => $body,
        ];
    }
}
