<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lead;
use App\Models\Deal;
use App\Models\Template;
use App\Models\Campaign;
use App\Models\Meeting;
use App\Models\AutomationRule;
use App\Models\ActivityLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Users for Roles
        $admin = User::create([
            'first_name' => 'Alice',
            'last_name' => 'Admin',
            'email' => 'admin@crm.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $manager = User::create([
            'first_name' => 'Bob',
            'last_name' => 'Manager',
            'email' => 'manager@crm.com',
            'password' => Hash::make('password123'),
            'role' => 'manager',
        ]);

        $commercial = User::create([
            'first_name' => 'Charlie',
            'last_name' => 'Commercial',
            'email' => 'commercial@crm.com',
            'password' => Hash::make('password123'),
            'role' => 'commercial',
        ]);

        $marketing = User::create([
            'first_name' => 'Daisy',
            'last_name' => 'Marketing',
            'email' => 'marketing@crm.com',
            'password' => Hash::make('password123'),
            'role' => 'marketing',
        ]);

        // Create some extra users
        User::factory()->count(4)->create();

        // 2. Create Default Templates
        $t1 = Template::create([
            'name' => 'Email Welcome Pack',
            'type' => 'email',
            'subject' => 'Welcome to our platform, {{first_name}}!',
            'body' => "Hi {{first_name}},\n\nThank you for reaching out to us. We have received your inquiry regarding our services.\n\nOur team is reviewing your profile and will get back to you shortly.\n\nBest Regards,\nThe CRM Team"
        ]);

        $t2 = Template::create([
            'name' => 'WhatsApp Demo Invite',
            'type' => 'whatsapp',
            'body' => "Hi *{{first_name}}*! 👋\n\nThanks for connecting. Let's schedule a short 15-minute product walkthrough demo. Please select a time slot here: {{meeting_link}}\n\nCheers!"
        ]);

        $t3 = Template::create([
            'name' => 'SMS Follow-up Reminder',
            'type' => 'sms',
            'body' => "Hi {{first_name}}, this is {{assigned_user}} from Sales. Just following up on our proposal. Let me know if you have any questions!"
        ]);

        Template::factory()->count(5)->create();

        // 3. Create Leads (30 assigned to commercial, 10 unassigned)
        $users = User::all();
        
        $leads = Lead::factory()->count(35)->create([
            'assigned_to' => $commercial->id
        ]);

        $unassignedLeads = Lead::factory()->count(10)->create([
            'assigned_to' => null
        ]);

        // Combine all leads
        $allLeads = $leads->merge($unassignedLeads);

        // 4. Create Deals (Pipeline) for some of the leads
        foreach ($allLeads->random(18) as $lead) {
            $dealValue = fake()->randomFloat(2, 2000, 45000);
            $dealStage = fake()->randomElement(['new_lead', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost']);
            
            // Sync lead status with deal stage
            $leadStatus = 'new';
            if (in_array($dealStage, ['contacted', 'meeting_scheduled'])) {
                $leadStatus = 'contacted';
            } elseif (in_array($dealStage, ['proposal_sent', 'negotiation'])) {
                $leadStatus = 'negotiation';
            } elseif ($dealStage === 'won') {
                $leadStatus = 'won';
            } elseif ($dealStage === 'lost') {
                $leadStatus = 'lost';
            }
            $lead->update(['status' => $leadStatus]);

            Deal::create([
                'lead_id' => $lead->id,
                'name' => $lead->company_name . ' Deal',
                'value' => $dealValue,
                'stage' => $dealStage,
            ]);

            // Add activity logs
            ActivityLog::create([
                'lead_id' => $lead->id,
                'user_id' => $commercial->id,
                'action' => 'deal_created',
                'details' => ['deal_name' => $lead->company_name . ' Deal', 'value' => $dealValue, 'stage' => $dealStage]
            ]);
        }

        // 5. Create Campaigns
        Campaign::create([
            'name' => 'Summer Newsletter 2026',
            'type' => 'email',
            'status' => 'completed',
            'template_id' => $t1->id,
            'sent_count' => 150,
            'delivered_count' => 148,
            'opened_count' => 85,
            'clicked_count' => 34,
        ]);

        Campaign::create([
            'name' => 'WhatsApp Re-engagement Campaign',
            'type' => 'whatsapp',
            'status' => 'completed',
            'template_id' => $t2->id,
            'sent_count' => 90,
            'delivered_count' => 89,
            'opened_count' => 0, // whatsapp doesn't track opened standardly in this mock
            'clicked_count' => 52,
        ]);

        Campaign::factory()->count(4)->create();

        // 6. Create Meetings
        foreach ($allLeads->random(12) as $lead) {
            $startTime = fake()->dateTimeBetween('-2 weeks', '+2 weeks');
            $endTime = (clone $startTime)->modify('+30 minutes');
            $type = fake()->randomElement(['google_meet', 'zoom', 'in_person']);
            
            Meeting::create([
                'lead_id' => $lead->id,
                'user_id' => $commercial->id,
                'title' => 'Meeting with ' . $lead->first_name . ' ' . $lead->last_name,
                'description' => 'Discuss business integration possibilities.',
                'start_time' => $startTime,
                'end_time' => $endTime,
                'type' => $type,
                'meeting_link' => $type === 'google_meet' ? 'https://meet.google.com/abc-defg-hij' : 'https://zoom.us/j/123456789',
                'external_event_id' => fake()->uuid(),
            ]);
        }

        // 7. Create Automation Rules
        AutomationRule::create([
            'name' => 'Auto-Assign New Leads to Sales',
            'trigger_event' => 'lead.created',
            'conditions' => [
                'field' => 'assigned_to',
                'operator' => 'empty'
            ],
            'actions' => [
                'action_type' => 'assign_user',
                'parameters' => ['user_role' => 'commercial']
            ],
            'is_active' => true,
        ]);

        AutomationRule::create([
            'name' => 'Send WhatsApp Demo Invite on Contact',
            'trigger_event' => 'lead.status_updated',
            'conditions' => [
                'field' => 'status',
                'operator' => 'equals',
                'value' => 'contacted'
            ],
            'actions' => [
                'action_type' => 'send_message',
                'parameters' => [
                    'type' => 'whatsapp',
                    'template_id' => $t2->id
                ]
            ],
            'is_active' => true,
        ]);

        AutomationRule::create([
            'name' => 'High Value Score Alert',
            'trigger_event' => 'lead.score_updated',
            'conditions' => [
                'field' => 'lead_score',
                'operator' => 'greater_than',
                'value' => 80
            ],
            'actions' => [
                'action_type' => 'trigger_webhook',
                'parameters' => [
                    'url' => 'https://n8n.workflow.mycompany.com/webhook/lead-alert'
                ]
            ],
            'is_active' => true,
        ]);
    }
}
