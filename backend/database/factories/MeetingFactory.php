<?php

namespace Database\Factories;

use App\Models\Meeting;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeetingFactory extends Factory
{
    protected $model = Meeting::class;

    public function definition(): array
    {
        $startTime = fake()->dateTimeBetween('-1 month', '+1 month');
        $endTime = (clone $startTime)->modify('+' . fake()->randomElement([30, 45, 60]) . ' minutes');

        $type = fake()->randomElement(['google_meet', 'zoom', 'in_person']);
        $meetingLink = null;
        if ($type === 'google_meet') {
            $meetingLink = 'https://meet.google.com/' . fake()->bothify('???-????-???');
        } elseif ($type === 'zoom') {
            $meetingLink = 'https://zoom.us/j/' . fake()->numericVal(9); // wait, let's use standard string helper
        }

        return [
            'lead_id' => Lead::factory(),
            'user_id' => User::factory(),
            'title' => fake()->randomElement(['Introduction Call', 'Sales Pitch & Demo', 'Requirements Alignment', 'Negotiation Round', 'Kickoff Meeting']),
            'description' => fake()->paragraph(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'type' => $type,
            'meeting_link' => $meetingLink ?? 'https://zoom.us/j/' . fake()->numerify('#########'),
            'external_event_id' => fake()->uuid(),
        ];
    }
}
