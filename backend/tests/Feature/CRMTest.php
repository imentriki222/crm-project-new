<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use App\Models\Deal;
use App\Models\Template;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CRMTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user registration and login.
     */
    public function test_user_can_register_and_login(): void
    {
        // 1. Test Register
        $registerResponse = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => 'password123',
            'role' => 'commercial'
        ]);

        $registerResponse->assertStatus(201)
            ->assertJsonStructure(['token', 'user', 'message']);

        $token = $registerResponse->json('token');
        $this->assertNotEmpty($token);

        // 2. Test Login
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'john.doe@example.com',
            'password' => 'password123'
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'message']);
    }

    /**
     * Test protected routes with and without token.
     */
    public function test_protected_routes_require_authentication(): void
    {
        // Accessing leads without token
        $response = $this->getJson('/api/leads');
        $response->assertStatus(401);

        // Accessing leads with token
        $user = User::factory()->create(['role' => 'commercial']);
        $token = app(\App\Services\JWTService::class)->generateToken($user);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/leads');

        $response->assertStatus(200);
    }

    /**
     * Test Lead CRUD and automatic AI scoring.
     */
    public function test_lead_crud_and_scoring(): void
    {
        $user = User::factory()->create(['role' => 'commercial']);
        $token = app(\App\Services\JWTService::class)->generateToken($user);

        $headers = ['Authorization' => 'Bearer ' . $token];

        // 1. Create Lead (with CEO title and large company to verify scoring)
        $createResponse = $this->withHeaders($headers)
            ->postJson('/api/leads', [
                'first_name' => 'Jane',
                'last_name' => 'CEO',
                'email' => 'jane.ceo@enterprise.com',
                'phone' => '+15551234',
                'company_name' => 'Enterprise Corp',
                'job_title' => 'CEO & Founder',
                'company_size' => '500+',
                'priority' => 'high',
                'lead_source' => 'referral'
            ]);

        $createResponse->assertStatus(201);
        $leadId = $createResponse->json('data.id');
        $score = $createResponse->json('data.lead_score');

        // Score should be high based on CEO title, 500+ size, high priority
        $this->assertGreaterThan(50, $score);

        // 2. Read Lead
        $readResponse = $this->withHeaders($headers)
            ->getJson('/api/leads/' . $leadId);

        $readResponse->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Jane')
            ->assertJsonPath('data.company_name', 'Enterprise Corp');

        // 3. Update Lead
        $updateResponse = $this->withHeaders($headers)
            ->putJson('/api/leads/' . $leadId, [
                'first_name' => 'Janet',
                'status' => 'contacted'
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Janet')
            ->assertJsonPath('data.status', 'contacted');

        // 4. Delete Lead
        $deleteResponse = $this->withHeaders($headers)
            ->deleteJson('/api/leads/' . $leadId);

        $deleteResponse->assertStatus(200);

        // Verify deleted
        $this->assertDatabaseMissing('leads', ['id' => $leadId]);
    }

    /**
     * Test Deals stage transitions and lead status syncing.
     */
    public function test_deal_stage_syncs_with_lead_status(): void
    {
        $user = User::factory()->create(['role' => 'commercial']);
        $token = app(\App\Services\JWTService::class)->generateToken($user);
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Create a lead
        $lead = Lead::factory()->create([
            'status' => 'new',
            'assigned_to' => $user->id
        ]);

        // Create a deal
        $dealResponse = $this->withHeaders($headers)
            ->postJson('/api/deals', [
                'lead_id' => $lead->id,
                'name' => 'Integration Deal',
                'value' => 15000,
                'stage' => 'new_lead'
            ]);

        $dealResponse->assertStatus(201);
        $dealId = $dealResponse->json('data.id');

        // Move stage to proposal_sent (lead status should sync to 'negotiation')
        $transitionResponse = $this->withHeaders($headers)
            ->putJson("/api/deals/{$dealId}/stage", [
                'stage' => 'proposal_sent'
            ]);

        $transitionResponse->assertStatus(200);

        // Verify lead status is updated to 'negotiation'
        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'status' => 'negotiation'
        ]);

        // Verify deal moved activity log is created
        $this->assertDatabaseHas('activity_logs', [
            'lead_id' => $lead->id,
            'action' => 'deal_moved'
        ]);
    }

    /**
     * Test Meeting Link generation.
     */
    public function test_meeting_link_generation(): void
    {
        $user = User::factory()->create(['role' => 'commercial']);
        $token = app(\App\Services\JWTService::class)->generateToken($user);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $lead = Lead::factory()->create(['assigned_to' => $user->id]);

        // Schedule Google Meet
        $response = $this->withHeaders($headers)
            ->postJson('/api/meetings', [
                'lead_id' => $lead->id,
                'title' => 'Product Demo Meeting',
                'start_time' => now()->addDay()->toDateTimeString(),
                'end_time' => now()->addDay()->addHour()->toDateTimeString(),
                'type' => 'google_meet'
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'google_meet');

        $link = $response->json('data.meeting_link');
        $this->assertStringContainsString('meet.google.com', $link);
    }

    /**
     * Test AI endpoints.
     */
    public function test_ai_helper_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'commercial']);
        $token = app(\App\Services\JWTService::class)->generateToken($user);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $lead = Lead::factory()->create();

        // 1. Email drafting
        $emailResponse = $this->withHeaders($headers)
            ->postJson('/api/ai/generate-email', [
                'lead_id' => $lead->id,
                'tone' => 'friendly',
                'objective' => 'Demo invite'
            ]);

        $emailResponse->assertStatus(200)
            ->assertJsonStructure(['subject', 'body']);

        // 2. Chat Assistant context query
        $chatResponse = $this->withHeaders($headers)
            ->postJson('/api/ai/assistant', [
                'prompt' => 'Suggest a sales strategy for this lead',
                'lead_id' => $lead->id
            ]);

        $chatResponse->assertStatus(200)
            ->assertJsonStructure(['reply']);
    }
}
