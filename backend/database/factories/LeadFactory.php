<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        $firstName = fake()->firstName();
        $lastName = fake()->lastName();
        $companyName = fake()->company();
        $domain = strtolower(str_replace([' ', ',', '.'], '', $companyName));

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => strtolower($firstName . '.' . $lastName) . '@' . $domain . '.com',
            'phone' => fake()->phoneNumber(),
            'whatsapp' => fake()->phoneNumber(),
            'company_name' => $companyName,
            'job_title' => fake()->jobTitle(),
            'website' => 'www.' . $domain . '.com',
            'industry' => fake()->randomElement(['Software', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Logistics', 'Retail']),
            'company_size' => fake()->randomElement(['1-10', '11-50', '51-200', '201-500', '500+']),
            'city' => fake()->city(),
            'country' => fake()->country(),
            'lead_source' => fake()->randomElement(['organic', 'google_ads', 'social_media', 'referral', 'cold_call', 'other']),
            'status' => fake()->randomElement(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'lead_score' => fake()->numberBetween(10, 95),
            'assigned_to' => User::inRandomOrder()->first()?->id ?? null,
        ];
    }
}
