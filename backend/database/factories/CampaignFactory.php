<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        $template = Template::inRandomOrder()->first() ?? Template::factory()->create();
        $status = fake()->randomElement(['draft', 'scheduled', 'sending', 'completed', 'failed']);

        $sent = $status === 'completed' ? fake()->numberBetween(100, 1000) : 0;
        $delivered = $sent > 0 ? (int)($sent * fake()->randomFloat(2, 0.85, 0.99)) : 0;
        $opened = $template->type === 'email' && $delivered > 0 ? (int)($delivered * fake()->randomFloat(2, 0.15, 0.45)) : 0;
        $clicked = $opened > 0 ? (int)($opened * fake()->randomFloat(2, 0.05, 0.25)) : 0;

        return [
            'name' => fake()->catchPhrase() . ' Campaign',
            'type' => $template->type,
            'status' => $status,
            'template_id' => $template->id,
            'scheduled_at' => $status === 'scheduled' ? fake()->dateTimeBetween('now', '+1 month') : null,
            'sent_count' => $sent,
            'delivered_count' => $delivered,
            'opened_count' => $opened,
            'clicked_count' => $clicked,
        ];
    }
}
