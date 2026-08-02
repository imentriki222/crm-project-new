<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    /**
     * AI Sales Assistant Chat.
     */
    public function salesAssistant(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
            'lead_id' => 'nullable|integer|exists:leads,id'
        ]);

        $prompt = $request->prompt;
        $leadId = $request->lead_id;
        $leadContext = "";

        if ($leadId) {
            $lead = Lead::find($leadId);
            $leadContext = "Context: You are analyzing Lead: {$lead->first_name} {$lead->last_name}. " .
                           "Company: {$lead->company_name}. Job Title: {$lead->job_title}. " .
                           "Industry: {$lead->industry}. Status: {$lead->status}. Priority: {$lead->priority}. " .
                           "AI Score: {$lead->lead_score}/100. Lead Source: {$lead->lead_source}.\n\n";
        }

        $systemPrompt = "You are a Senior Sales Assistant and CRM Advisor. Analyze leads, suggest sales pitches, email replies, and negotiation strategies based on the context provided.";
        $response = $this->callOpenAI($systemPrompt, $leadContext . "User Question: " . $prompt);

        return response()->json(['reply' => $response]);
    }

    /**
     * AI Email Generator.
     */
    public function generateEmail(Request $request)
    {
        $request->validate([
            'lead_id' => 'required|integer|exists:leads,id',
            'tone' => 'sometimes|string|in:professional,friendly,urgent,formal',
            'objective' => 'required|string' // e.g. Book a demo, Follow up on proposal
        ]);

        $lead = Lead::find($request->lead_id);
        $tone = $request->tone ?? 'professional';
        $objective = $request->objective;

        $systemPrompt = "You are an expert sales copywriter. Generate a personalized email targeting a lead.";
        $prompt = "Write a personalized email to: {$lead->first_name} {$lead->last_name}, working as: {$lead->job_title} at: {$lead->company_name}. " .
                 "Objective: {$objective}. Tone: {$tone}. Website: {$lead->website}. Industry: {$lead->industry}.\n" .
                 "Output only the Email Subject and the Email Body formatted cleanly in plain text.";

        $response = $this->callOpenAI($systemPrompt, $prompt);

        // Parse subject and body
        $lines = explode("\n", $response);
        $subject = "Follow up regarding " . ($lead->company_name ?? 'your business');
        $body = $response;

        foreach ($lines as $line) {
            if (stripos($line, 'Subject:') === 0) {
                $subject = trim(substr($line, 8));
                $body = trim(str_replace($line, '', $response));
                break;
            }
        }

        return response()->json([
            'subject' => $subject,
            'body' => trim($body)
        ]);
    }

    /**
     * Suggest replies to customer messages.
     */
    public function suggestReply(Request $request)
    {
        $request->validate([
            'message_history' => 'required|string',
            'lead_id' => 'nullable|integer|exists:leads,id'
        ]);

        $history = $request->message_history;
        $systemPrompt = "You are an elite customer support representative. Suggest 3 short, professional, and closing-oriented reply options for the customer message history provided.";
        $prompt = "Message History:\n{$history}\n\nProvide 3 numbered suggestions.";

        $response = $this->callOpenAI($systemPrompt, $prompt);

        return response()->json(['suggestions' => $response]);
    }

    /**
     * Qualify Lead Assistant.
     */
    public function qualifyLead(Request $request, int $id)
    {
        $lead = Lead::with('activityLogs')->find($id);
        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        $systemPrompt = "You are a Lead Qualification Analyst. Analyze the lead properties and decide if they are qualified, what their pain points might be, and suggest the top 3 next steps.";
        $prompt = "Lead Data:\n" .
                 "Name: {$lead->first_name} {$lead->last_name}\n" .
                 "Job Title: {$lead->job_title}\n" .
                 "Company: {$lead->company_name}\n" .
                 "Size: {$lead->company_size}\n" .
                 "Industry: {$lead->industry}\n" .
                 "Score: {$lead->lead_score}\n" .
                 "Priority: {$lead->priority}\n" .
                 "Recent activities: " . json_encode($lead->activityLogs->pluck('action')->toArray()) . "\n\n" .
                 "Format the output with sections: 1. Qualification Status (Qualified/Unqualified & Why), 2. Likely Pain Points, 3. Recommended Next Steps.";

        $response = $this->callOpenAI($systemPrompt, $prompt);

        return response()->json(['analysis' => $response]);
    }

    /**
     * Helper to call OpenAI API or fallback to mock responses.
     */
    protected function callOpenAI(string $system, string $user): string
    {
        $apiKey = env('OPENAI_API_KEY');

        if ($apiKey && $apiKey !== 'mock-api-key-for-development') {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini', // Lightweight, fast model
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user]
                    ],
                    'temperature' => 0.7
                ]);

                if ($response->successful()) {
                    return $response->json('choices.0.message.content');
                }
                
                Log::error("OpenAI API call failed: " . $response->body());
            } catch (\Exception $e) {
                Log::error("OpenAI exception: " . $e->getMessage());
            }
        }

        // Fallback to high quality simulated mock responses
        return $this->getMockResponse($system, $user);
    }

    /**
     * Mock response generator.
     */
    protected function getMockResponse(string $system, string $user): string
    {
        if (stripos($user, 'Write a personalized email') !== false) {
            preg_match('/to: ([^,]+)/', $user, $matchesName);
            preg_match('/at: ([^\.]+)/', $user, $matchesCompany);
            preg_match('/Objective: ([^\.]+)/', $user, $matchesObj);
            
            $name = $matchesName[1] ?? 'Client';
            $company = $matchesCompany[1] ?? 'your company';
            $obj = $matchesObj[1] ?? 'discuss partnership';

            return "Subject: Enhancing operations at {$company} - Partnership Proposal\n\n" .
                   "Dear {$name},\n\n" .
                   "I hope this email finds you well. I am reaching out because I noticed your impressive work at {$company}.\n\n" .
                   "Based on our experience in your industry, we've helped companies scale by automating their marketing workflows and lead management processes.\n\n" .
                   "I would love to connect for a brief 10-minute chat to {$obj}.\n\n" .
                   "Are you available next Tuesday at 10 AM?\n\n" .
                   "Best regards,\nCRM Sales Team";
        }

        if (stripos($user, 'suggest 3 short') !== false) {
            return "1. \"Hi! Thanks for reaching out. We would be happy to schedule a demo. Does tomorrow at 2 PM work for you?\"\n\n" .
                   "2. \"Hello! Yes, our platform supports full n8n integrations. I can send you our integration guide or set up a quick Zoom call.\"\n\n" .
                   "3. \"Hi there. Regarding pricing, our Enterprise package is fully customizable. Let's Hop on a call to tailor a plan for you.\"";
        }

        if (stripos($user, 'Lead Data:') !== false) {
            preg_match('/Name: ([^\n]+)/', $user, $mName);
            preg_match('/Company: ([^\n]+)/', $user, $mCompany);
            preg_match('/Score: ([^\n]+)/', $user, $mScore);
            
            $name = $mName[1] ?? 'Client';
            $company = $mCompany[1] ?? 'Client Company';
            $score = (int)($mScore[1] ?? 50);

            $status = $score >= 70 ? "HOT QUALIFIED LEAD" : "WARM LEAD";
            $painPoints = $score >= 70 
                ? "- Lead management scaling bottlenecks\n- Lack of unified marketing automation\n- Missed sales pipeline deals due to response delays" 
                : "- Manual customer tracking inefficiencies\n- Basic campaign performance reporting needs";

            return "### 1. Qualification Status\n" .
                   "**Status:** **{$status}** (Score: {$score}/100)\n" .
                   "**Rationale:** The lead holds a high-value job title at {$company} and has completed detailed CRM information. " .
                   "This represents a strong buyer persona matching our ideal customer profile.\n\n" .
                   "### 2. Likely Pain Points\n" .
                   "{$painPoints}\n\n" .
                   "### 3. Recommended Next Steps\n" .
                   "1. **Trigger Automated WhatsApp Demo Invite**: Invite {$name} to schedule a product walkthrough.\n" .
                   "2. **Prepare Enterprise Pitch Deck**: Customize a presentation highlighting integration with their specific industry tools.\n" .
                   "3. **Assign Dedicated Sales Specialist**: Follow up with a direct phone call within 24 hours.";
        }

        return "Hello! I am your AI Sales Assistant. I have analyzed your query and context.\n\n" .
               "Based on the lead's current CRM data, they represent a strong candidate for our custom workflows. " .
               "I suggest scheduling a call to qualify their needs and sending a follow-up email focusing on automation benefits.";
    }
}
