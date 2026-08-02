<?php

namespace Database\Factories;

use App\Models\Deal;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

class DealFactory extends Factory
{
    protected $model = Deal::class;

    public function definition(): array
    {
        return [
            'lead_id' => Lead::factory(),
            'name' => fake()->randomElement(['Software Licensing', 'Cloud Migration Service', 'CRM Implementation SLA', 'Security Audit', 'Premium Custom Dev Upgrade']),
            'value' => fake()->randomFloat(2, 1000, 50000),
            'stage' => fake()->randomElement(['new_lead', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost']),
        ];
    }
}
